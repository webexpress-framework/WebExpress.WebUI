using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for table-column-add.
    /// </summary>
    public class IconTableColumnAdd : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public IconTableColumnAdd()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-table-column-add";
    }
}
