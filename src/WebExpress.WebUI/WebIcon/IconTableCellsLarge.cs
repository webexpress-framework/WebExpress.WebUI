using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a table-cells-large.
    /// </summary>
    public class IconTableCellsLarge : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconTableCellsLarge()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconTableCellsLarge(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-table-cells-large"
            : "fas fa-table-cells-large";
    }
}