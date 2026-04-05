using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebNotification;

namespace WebExpress.WebUI.Test.WebNotification
{
    /// <summary>
    /// Test the fragment manager.
    /// </summary>
    [Collection("NonParallelTests")]
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
    }
}
