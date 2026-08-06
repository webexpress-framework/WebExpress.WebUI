using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a tent-arrow-down-to-line.
    /// </summary>
    public class IconTentArrowDownToLine : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconTentArrowDownToLine"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconTentArrowDownToLine()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconTentArrowDownToLine"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconTentArrowDownToLine(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-tent-arrow-down-to-line"
            : "fas fa-tent-arrow-down-to-line";
    }
}
