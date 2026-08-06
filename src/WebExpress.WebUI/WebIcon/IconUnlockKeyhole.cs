using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a unlock-keyhole.
    /// </summary>
    public class IconUnlockKeyhole : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconUnlockKeyhole"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconUnlockKeyhole()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconUnlockKeyhole"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconUnlockKeyhole(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-unlock"
            : "fas fa-unlock-keyhole";
    }
}
