using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a table-cells-row-unlock.
    /// </summary>
    public class IconTableCellsRowUnlock : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconTableCellsRowUnlock"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconTableCellsRowUnlock()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconTableCellsRowUnlock"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconTableCellsRowUnlock(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. In the
        /// <see cref="TypeIconTheme.Light"/> theme the lightweight SVG variant is rendered;
        /// otherwise the FontAwesome glyph is used.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-table-cells-row-unlock"
            : "fas fa-table-cells-row-unlock";
    }
}
