using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a bezier-curve.
    /// </summary>
    public class IconBezierCurve : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconBezierCurve"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconBezierCurve()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconBezierCurve"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconBezierCurve(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-bezier-curve"
            : "fas fa-bezier-curve";
    }
}
