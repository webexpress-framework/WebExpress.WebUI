namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents a birthday icon.
    /// Use this icon for birthdays, anniversaries, or special dates.
    /// </summary>
    public class IconBirthday : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the light theme.
        /// </summary>
        public IconBirthday()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Gets the CSS class for the birthday icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-birthday";
    }
}