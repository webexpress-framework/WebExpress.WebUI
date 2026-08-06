using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a dice-d6.
    /// </summary>
    public class IconDiceD6 : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconDiceD6"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconDiceD6()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconDiceD6"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconDiceD6(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-dice-d6"
            : "fas fa-dice-d6";
    }
}
