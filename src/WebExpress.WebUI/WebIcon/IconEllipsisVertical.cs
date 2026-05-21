using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents a vertical ellipsis icon.
    /// </summary>
    public class IconEllipsisVertical : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconEllipsisVertical"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconEllipsisVertical()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconEllipsisVertical"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconEllipsisVertical(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-dots"
            : "fas fa-ellipsis-v";
    }
}
