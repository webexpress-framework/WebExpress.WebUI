using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a hill-rockslide.
    /// </summary>
    public class IconHillRockslide : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconHillRockslide"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconHillRockslide()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconHillRockslide"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconHillRockslide(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-hill-rockslide"
            : "fas fa-hill-rockslide";
    }
}
