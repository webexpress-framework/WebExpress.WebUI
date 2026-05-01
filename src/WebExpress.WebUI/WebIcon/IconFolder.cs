namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a folder.
    /// </summary>
    public class IconFolder : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconFolder"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconFolder()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconFolder"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconFolder(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-folder"
            : "fas fa-folder";
    }
}