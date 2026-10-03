namespace WebExpress.WebUI.WebNotification
{
    /// <summary>
    /// The color scheme of a notification, which tells the reader at a glance what kind of
    /// message it carries (for example success, warning or danger). It does not change the
    /// layout of the notification.
    /// </summary>
    public enum TypeNotification
    {
        /// <summary>
        /// Default notification type.
        /// </summary>
        Default = 0,

        /// <summary>
        /// Primary notification type.
        /// </summary>
        Primary = 1,

        /// <summary>
        /// Secondary notification type.
        /// </summary>
        Secondary = 2,

        /// <summary>
        /// Success notification type.
        /// </summary>
        Success = 3,

        /// <summary>
        /// Info notification type.
        /// </summary>
        Info = 4,

        /// <summary>
        /// Warning notification type.
        /// </summary>
        Warning = 5,

        /// <summary>
        /// Danger notification type.
        /// </summary>
        Danger = 6,

        /// <summary>
        /// Dark notification type.
        /// </summary>
        Dark = 7,

        /// <summary>
        /// Light notification type.
        /// </summary>
        Light = 8,

        /// <summary>
        /// White notification type.
        /// </summary>
        White = 9,

        /// <summary>
        /// Transparent notification type.
        /// </summary>
        Transparent = 10
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeNotification"/> enum.
    /// </summary>
    public static class TypeNotificationExtensions
    {
        /// <summary>
        /// Converts the notification type to the alert class that colors it. The class is also the
        /// wire format of the type, so it must stay unique per value for the json converter to
        /// read it back.
        /// </summary>
        /// <param name="type">The notification type to be converted.</param>
        /// <returns>The css class, or an empty string for the default type.</returns>
        public static string ToClass(this TypeNotification type)
        {
            return type switch
            {
                TypeNotification.Primary => "alert-primary",
                TypeNotification.Secondary => "alert-secondary",
                TypeNotification.Success => "alert-success",
                TypeNotification.Info => "alert-info",
                TypeNotification.Warning => "alert-warning",
                TypeNotification.Danger => "alert-danger",
                TypeNotification.Light => "alert-light",
                TypeNotification.Dark => "alert-dark",
                TypeNotification.White => "alert-white",
                TypeNotification.Transparent => "bg-transparent",
                _ => string.Empty,
            };
        }
    }
}
