namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for archive-box.
    /// </summary>
    public class IconArchiveBox : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconArchiveBox"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconArchiveBox()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconArchiveBox"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconArchiveBox(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-archive-box"
            : "fas fa-archive";
    }
}