using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for table-row-edit.
    /// </summary>
    public class IconTableRowEdit : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconTableRowEdit()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-table-row-edit";
    }
}
