using WebExpress.WebCore.WebCluster;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebNotification;

namespace WebExpress.WebUI.Test.WebNotification
{
    /// <summary>
    /// Tests that notifications reach the user whichever instance of a cluster renders the page.
    /// </summary>
    [Collection("NonParallelTests")]
    public sealed class UnitTestNotificationManagerCluster : IDisposable
    {
        private readonly string _directory = Path.Combine(Path.GetTempPath(), "wx-cluster-" + Guid.NewGuid().ToString("N"));

        /// <summary>
        /// Removes the shared state directory.
        /// </summary>
        public void Dispose()
        {
            if (Directory.Exists(_directory))
            {
                Directory.Delete(_directory, true);
            }
        }

        /// <summary>
        /// Creates a hub sharing the test directory, standing in for one instance.
        /// </summary>
        /// <returns>The hub.</returns>
        private WebCore.WebComponent.ComponentHub CreateInstance()
        {
            var hub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();

            hub.ClusterManager.UseStore(new FileClusterStore(_directory));

            return hub;
        }

        /// <summary>
        /// Tests that a global notification raised on one instance shows on another and that
        /// removing it there removes it everywhere.
        /// </summary>
        [Fact]
        public void GlobalNotificationIsClusterWide()
        {
            var a = CreateInstance();
            var applicationA = a.ApplicationManager.GetApplications(typeof(TestApplication)).First();
            var created = a.GetComponentManager<NotificationManager>().AddNotification(applicationA, "maintenance", -1, "heads up");

            var b = CreateInstance();
            var applicationB = b.ApplicationManager.GetApplications(typeof(TestApplication)).First();
            var managerB = b.GetComponentManager<NotificationManager>();
            var request = (Request)UnitTestControlFixture.CreateRequestMock();

            var seen = Assert.Single(managerB.GetNotifications(applicationB, request));
            Assert.Equal(created.Id, seen.Id);
            Assert.Equal("maintenance", seen.Message);
            Assert.Equal(created.Created, seen.Created);

            managerB.RemoveNotifications(created.Id);

            Assert.Empty(a.GetComponentManager<NotificationManager>().GetNotifications(applicationA, request));
        }

        /// <summary>
        /// Tests that a notification for one user travels with the session to the instance that
        /// serves the user's next request.
        /// </summary>
        [Fact]
        public void SessionNotificationFollowsTheSession()
        {
            var a = CreateInstance();
            var applicationA = a.ApplicationManager.GetApplications(typeof(TestApplication)).First();
            var requestA = (Request)UnitTestControlFixture.CreateRequestMock("GET / HTTP/1.1\r\nCookie: session=\r\n\r\n");
            var created = a.GetComponentManager<NotificationManager>().AddNotification(applicationA, requestA, "saved", 5000, type: TypeNotification.Success);
            a.SessionManager.Commit(requestA.Session);

            var b = CreateInstance();
            var applicationB = b.ApplicationManager.GetApplications(typeof(TestApplication)).First();
            var requestB = (Request)UnitTestControlFixture.CreateRequestMock($"GET / HTTP/1.1\r\nCookie: session={requestA.Session.Id}\r\n\r\n");

            var seen = Assert.Single(b.GetComponentManager<NotificationManager>().GetNotifications(applicationB, requestB));
            Assert.Equal(created.Id, seen.Id);
            Assert.Equal("saved", seen.Message);
            Assert.Equal(TypeNotification.Success, seen.Type);
            Assert.Equal(5000, seen.Durability);
        }

        /// <summary>
        /// Tests that a notification of the session dismissed on one instance stays dismissed
        /// on the others. The dismissal arrives over the message queue socket, which no end of
        /// a request writes back, so the removal has to reach the store by itself.
        /// </summary>
        [Fact]
        public void DismissedSessionNotificationStaysDismissed()
        {
            var a = CreateInstance();
            var applicationA = a.ApplicationManager.GetApplications(typeof(TestApplication)).First();
            var requestA = (Request)UnitTestControlFixture.CreateRequestMock("GET / HTTP/1.1\r\nCookie: session=\r\n\r\n");
            var created = a.GetComponentManager<NotificationManager>().AddNotification(applicationA, requestA, "saved");
            a.SessionManager.Commit(requestA.Session);

            var b = CreateInstance();
            var requestB = (Request)UnitTestControlFixture.CreateRequestMock($"GET / HTTP/1.1\r\nCookie: session={requestA.Session.Id}\r\n\r\n");
            b.GetComponentManager<NotificationManager>().RemoveNotifications(created.Id, requestB.Session);

            var c = CreateInstance();
            var applicationC = c.ApplicationManager.GetApplications(typeof(TestApplication)).First();
            var requestC = (Request)UnitTestControlFixture.CreateRequestMock($"GET / HTTP/1.1\r\nCookie: session={requestA.Session.Id}\r\n\r\n");

            Assert.Empty(c.GetComponentManager<NotificationManager>().GetNotifications(applicationC, requestC));
        }

        /// <summary>
        /// A socket opened before an HTTP request creates a notification removes its stored
        /// copy without dropping a second notification created by that request.
        /// </summary>
        [Fact]
        public void DismissUsesCurrentSessionAfterSocketHandshake()
        {
            // arrange
            var hub = CreateInstance();
            var application = hub.ApplicationManager.GetApplications(typeof(TestApplication)).First();
            var manager = hub.GetComponentManager<NotificationManager>();
            var handshake = (Request)UnitTestControlFixture.CreateRequestMock("GET / HTTP/1.1\r\nCookie: session=\r\n\r\n");
            var socketSession = handshake.Session;
            hub.SessionManager.Commit(socketSession);
            var cookie = $"GET / HTTP/1.1\r\nCookie: session={socketSession.Id}\r\n\r\n";
            var request = (Request)UnitTestControlFixture.CreateRequestMock(cookie);
            var dismissed = manager.AddNotification(application, request, "dismiss");
            var retained = manager.AddNotification(application, request, "keep");
            hub.SessionManager.Commit(request.Session);

            // act
            manager.RemoveNotifications(dismissed.Id, socketSession);

            // validation
            var next = (Request)UnitTestControlFixture.CreateRequestMock(cookie);
            Assert.Equal(retained.Id, Assert.Single(manager.GetNotifications(application, next)).Id);
        }

        /// <summary>
        /// Tests that a global notification dismissed on two instances is reported destroyed
        /// only by the one that removed it.
        /// </summary>
        [Fact]
        public void GlobalDismissalIsReportedOnce()
        {
            var a = CreateInstance();
            var applicationA = a.ApplicationManager.GetApplications(typeof(TestApplication)).First();
            var managerA = a.GetComponentManager<NotificationManager>();
            var created = managerA.AddNotification(applicationA, "maintenance");
            var destroyedA = new List<INotification>();
            managerA.DestroyNotification += (_, x) => destroyedA.Add(x);

            var b = CreateInstance();
            var managerB = b.GetComponentManager<NotificationManager>();
            var destroyedB = new List<INotification>();
            managerB.DestroyNotification += (_, x) => destroyedB.Add(x);

            managerB.RemoveNotifications(created.Id);
            managerA.RemoveNotifications(created.Id);

            Assert.Equal(created.Id, Assert.Single(destroyedB).Id);
            Assert.Equal("maintenance", destroyedB[0].Message);
            Assert.Empty(destroyedA);
        }
    }
}
