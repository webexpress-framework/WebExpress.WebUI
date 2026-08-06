using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a sack-xmark.
    /// </summary>
    public class IconSackXmark : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconSackXmark"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconSackXmark()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconSackXmark"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconSackXmark(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-sack-xmark"
            : "fas fa-sack-xmark";
    }
}
