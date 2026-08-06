using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a money-bill-1-wave.
    /// </summary>
    public class IconMoneyBill1Wave : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconMoneyBill1Wave"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconMoneyBill1Wave()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconMoneyBill1Wave"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconMoneyBill1Wave(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-money-bill-1-wave"
            : "fas fa-money-bill-1-wave";
    }
}
