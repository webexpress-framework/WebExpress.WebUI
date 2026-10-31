using WebExpress.WebCore.WebMessage;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebNotification;
using WebExpress.WebUI.WebNotification.Model;
using WebExpress.WebUI.WebSession;

namespace WebExpress.WebUI.Test.WebNotification
{
    /// <summary>
    /// Test the notification manager.
    /// </summary>
    public class UnitTestNotificationManager
    {
        /// <summary>
        /// Test the add notification function of the notification manager.
        /// </summary>
        [Theory]
        [InlineData(typeof(TestApplication), "message", 10, "header", "/icon.png", TypeNotification.Success)]
        public void AddNotification(Type applicationType, string message, int durability, string heading = null, string icon = null, TypeNotification type = TypeNotification.Light)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var applicationContext = componentHub.ApplicationManager.GetApplications(applicationType).FirstOrDefault();
            var notificationManager = componentHub.GetComponentManager<NotificationManager>();
            Assert.NotNull(notificationManager);

            // act
            var notification = notificationManager.AddNotification(applicationContext, message, durability, heading, icon, type);
            Assert.NotNull(notification);
        }

        /// <summary>
        /// Tests that dismissing a notification of the session removes it from the session, so
        /// the next page or reconnect does not show it again.
        /// </summary>
        [Fact]
        public void DismissRemovesSessionNotification()
        {
            // arrange
            var (manager, application, request) = Arrange();
            var created = manager.AddNotification(application, request, "saved");
            var destroyed = new List<INotification>();
            manager.DestroyNotification += (_, x) => destroyed.Add(x);

            // act
            manager.RemoveNotifications(created.Id, request.Session);

            // validation
            Assert.Empty(manager.GetNotifications(application, request));
            Assert.Equal(created.Id, Assert.Single(destroyed).Id);
        }

        /// <summary>
        /// Tests that dismissing a global notification removes it and reports it destroyed.
        /// </summary>
        [Fact]
        public void DismissRemovesGlobalNotification()
        {
            // arrange
            var (manager, application, request) = Arrange();
            var created = manager.AddNotification(application, "maintenance");
            var destroyed = new List<INotification>();
            manager.DestroyNotification += (_, x) => destroyed.Add(x);

            // act
            manager.RemoveNotifications(created.Id, request.Session);

            // validation
            Assert.Empty(manager.GetNotifications(application, request));
            Assert.Equal(created.Id, Assert.Single(destroyed).Id);
        }

        /// <summary>
        /// Tests that dismissing an id nobody holds changes nothing and reports nothing.
        /// </summary>
        [Fact]
        public void DismissOfUnknownIdIsIgnored()
        {
            // arrange
            var (manager, application, request) = Arrange();
            manager.AddNotification(application, "maintenance");
            manager.AddNotification(application, request, "saved");
            var destroyed = new List<INotification>();
            manager.DestroyNotification += (_, x) => destroyed.Add(x);

            // act
            manager.RemoveNotifications(Guid.NewGuid(), request.Session);

            // validation
            Assert.Equal(2, manager.GetNotifications(application, request).Count());
            Assert.Empty(destroyed);
        }

        /// <summary>
        /// Tests that clearing the notifications of a session leaves the global ones, which
        /// belong to every user of the application.
        /// </summary>
        [Fact]
        public void RemoveSessionNotificationsKeepsGlobalOnes()
        {
            // arrange
            var (manager, application, request) = Arrange();
            var global = manager.AddNotification(application, "maintenance");
            var session = manager.AddNotification(application, request, "saved");
            var destroyed = new List<INotification>();
            manager.DestroyNotification += (_, x) => destroyed.Add(x);

            // act
            manager.RemoveNotifications(request);

            // validation
            Assert.Equal(global.Id, Assert.Single(manager.GetNotifications(application, request)).Id);
            Assert.Equal(session.Id, Assert.Single(destroyed).Id);
        }

        /// <summary>
        /// Tests that a notification of the session past its durability is dropped.
        /// </summary>
        [Fact]
        public void ExpiredSessionNotificationIsDropped()
        {
            // arrange
            var (manager, application, request) = Arrange();
            var expired = (Notification)manager.AddNotification(application, request, "old", 1000);
            var live = manager.AddNotification(application, request, "new", 60000);
            expired.Created = DateTime.UtcNow.AddSeconds(-2);

            // act
            var notifications = manager.GetNotifications(application, request);

            // validation
            Assert.Equal(live.Id, Assert.Single(notifications).Id);
            Assert.False(request.Session.GetProperty<SessionPropertyNotification>().ContainsKey(expired.Id));
        }

        /// <summary>
        /// Tests that parallel requests of one session can add and read notifications at the
        /// same time without corrupting the session or losing a notification.
        /// </summary>
        [Fact]
        public void ConcurrentSessionAccessKeepsEveryNotification()
        {
            // arrange
            var (manager, application, request) = Arrange();
            const int count = 2000;

            // act
            Parallel.For(0, count * 2, i =>
            {
                if (i % 2 == 0)
                {
                    manager.AddNotification(application, request, "parallel");
                }
                else
                {
                    _ = manager.GetNotifications(application, request).ToList();
                }
            });

            // validation
            Assert.Equal(count, manager.GetNotifications(application, request).Count());
        }

        /// <summary>
        /// Tests that the expiry is decided in utc, including for a creation time stored in
        /// local time by an earlier version.
        /// </summary>
        [Fact]
        public void ExpiryIsDecidedInUtc()
        {
            INotification fresh = new Notification { Durability = 60000, Created = DateTime.Now };
            INotification stale = new Notification { Durability = 60000, Created = DateTime.Now.AddMinutes(-2) };
            INotification indefinite = new Notification { Durability = -1, Created = DateTime.UtcNow.AddYears(-1) };

            Assert.False(fresh.IsExpired(DateTime.UtcNow));
            Assert.True(stale.IsExpired(DateTime.UtcNow));
            Assert.False(indefinite.IsExpired(DateTime.UtcNow));
            Assert.Equal(DateTimeKind.Utc, new Notification().Created.Kind);
        }

        /// <summary>
        /// Creates a hub with its notification manager, the test application and a request
        /// carrying a fresh session.
        /// </summary>
        /// <returns>The manager, the application and the request.</returns>
        private static (NotificationManager, WebCore.WebApplication.IApplicationContext, Request) Arrange()
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var application = componentHub.ApplicationManager.GetApplications(typeof(TestApplication)).First();
            var request = (Request)UnitTestControlFixture.CreateRequestMock();

            return (componentHub.GetComponentManager<NotificationManager>(), application, request);
        }
    }
}
