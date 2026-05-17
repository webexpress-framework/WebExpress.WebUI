using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a moon.
    /// </summary>
    public class IconMoon : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconMoon"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconMoon()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconMoon"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconMoon(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-moon"
            : "fas fa-moon";
    }
}