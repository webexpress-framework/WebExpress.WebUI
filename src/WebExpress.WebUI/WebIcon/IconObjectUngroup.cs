using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a object-ungroup.
    /// </summary>
    public class IconObjectUngroup : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconObjectUngroup"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconObjectUngroup()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconObjectUngroup"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconObjectUngroup(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-object-ungroup"
            : "fas fa-object-ungroup";
    }
}
