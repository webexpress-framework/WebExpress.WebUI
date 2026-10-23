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
    }
}
