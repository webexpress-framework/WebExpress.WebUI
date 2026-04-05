using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table control.
    /// </summary>
    public class ControlTableReorderable : ControlTable, IControlTableReorderable
    {


        /// <summary>
        /// Returns or sets a value indicating whether columns can be removed.
        /// </summary>
        public bool AllowColumnRemove { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether rows in the table can be moved.
        /// </summary>
        public bool MovableRow { get; set; }

        /// <summary>
        /// Returns or sets the key used to persist data (column order, visibility, 
        /// widths, active sort) across sessions.
        /// </summary>
        public string PersistKey { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="columns">The columns to add to the table.</param>
        /// <param name="rows">The rows to add to the table.</param>
        public ControlTableReorderable(string id = null, IControlTableColumn[] columns = null, params IControlTableRow[] rows)
            : base(id, columns, rows)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var classes = Classes.ToList();

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-table-reorderable", classes),
                Style = GetStyles(),
                Role = Role
            }
                .AddUserAttribute("data-color", Color.ToClass())
                .AddUserAttribute("data-striped", Striped.ToClass())
                .AddUserAttribute("data-border", TableBorder.ToClass())
                .AddUserAttribute("data-movable-row", MovableRow ? "true" : null)
                .AddUserAttribute("data-allow-column-remove", AllowColumnRemove ? "true" : null)
                .AddUserAttribute("data-persist-key", PersistKey)
                .Add
                (
                    new HtmlElementTextContentDiv()
                    {
                        Class = Css.Concatenate("wx-table-columns", HeaderColor.ToClass())
                    }
                        .AddUserAttribute("data-color", HeaderColor.ToClass())
                        .AddUserAttribute("data-suppress-headers", SuppressHeaders ? "true" : null)
                        .Add
                        (
                            Columns.Select
                            (
                                column => column.Render(renderContext, visualTree)
                            )
                        )
                )
                .Add
                (
                    Rows.Select
                    (
                        row => row.Render(renderContext, visualTree)
                    )
                );

            return html;
        }
    }
}
