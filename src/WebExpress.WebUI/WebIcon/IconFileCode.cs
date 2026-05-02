using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a file-code.
    /// </summary>
    public class IconFileCode : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconFileCode"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconFileCode()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconFileCode"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconFileCode(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-file-code"
            : "fas fa-file-code";
    }
}