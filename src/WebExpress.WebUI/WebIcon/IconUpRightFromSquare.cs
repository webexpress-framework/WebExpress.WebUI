using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a up-right-from-square.
    /// </summary>
    public class IconUpRightFromSquare : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconUpRightFromSquare"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconUpRightFromSquare()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconUpRightFromSquare"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconUpRightFromSquare(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-up-right-from-square"
            : "fas fa-up-right-from-square";
    }
}
