using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a table-columns.
    /// </summary>
    public class IconTableColumns : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconTableColumns()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconTableColumns(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-table-columns"
            : "fas fa-table-columns";
    }
}