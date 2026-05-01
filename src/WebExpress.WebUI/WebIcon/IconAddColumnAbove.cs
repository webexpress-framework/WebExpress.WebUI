namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a add-column-above.
    /// </summary>
    public class IconAddColumnAbove : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconAddColumnAbove()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-add-column-above";
    }
}