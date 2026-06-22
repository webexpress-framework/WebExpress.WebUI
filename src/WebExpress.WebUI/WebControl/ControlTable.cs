using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders a data table with rows and columns.
    /// </summary>
    public class ControlTable : Control, IControlTable
    {
        private readonly List<IControlTableColumn> _columns = [];
        private readonly List<IControlTableRow> _rows = [];

        /// <summary>
        /// Returns the columns of the table.
        /// </summary>
        public IEnumerable<IControlTableColumn> Columns => _columns;

        /// <summary>
        /// Returns the rows of the table.
        /// </summary>
        public IEnumerable<IControlTableRow> Rows => _rows;

        /// <summary>
        /// Gets or sets a value indicating whether the table is striped.
        /// </summary>
        public Func<IRenderControlContext, TypeStripedTable> Striped { get; set; } = _ => TypeStripedTable.Default;

        /// <summary>
        /// Gets or sets the color scheme used for the table.
        /// </summary>
        public Func<IRenderControlContext, TypeColorTable> Color { get; set; } = _ => TypeColorTable.Default;

        /// <summary>
        /// Gets or sets the header color scheme used for the table.
        /// </summary>
        public Func<IRenderControlContext, TypeColorTable> HeaderColor { get; set; } = _ => TypeColorTable.Default;

        /// <summary>
        /// Gets or sets a value indicating whether the table has a visible border.
        /// </summary>
        public Func<IRenderControlContext, TypeBorderTable> TableBorder { get; set; } = _ => TypeBorderTable.Default;

        /// <summary>
        /// Gets or sets a value indicating whether the item can be selected.
        /// </summary>
        public Func<IRenderControlContext, bool> Selectable { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets a value indicating whether columns should be hidden.
        /// </summary>
        public Func<IRenderControlContext, bool> SuppressHeaders { get; set; } = _ => false;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="columns">The columns to add to the table.</param>
        /// <param name="rows">The rows to add to the table.</param>
        public ControlTable(string id = null, IControlTableColumn[] columns = null, params IControlTableRow[] rows)
            : base(id)
        {
            _columns.AddRange(columns ?? []);
            _rows.AddRange(rows);
        }

        /// <summary>
        /// Adds a column to the table.
        /// </summary>
        /// <param name="name">The header of the column.</param>
        /// <param name="icon">The icon of the column.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTable AddColumn(string name, IIcon icon = null)
        {
            _columns.Add(new ControlTableColumn(null)
            {
                Title = _ => name,
                Icon = _ => icon,
            });

            return this;
        }

        /// <summary>
        /// Adds one or more columns to the table.
        /// </summary>
        /// <param name="columns">The columns to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTable AddColumns(params IControlTableColumn[] columns)
        {
            _columns.AddRange(columns);

            return this;
        }

        /// <summary>
        /// Adds one or more columns to the table.
        /// </summary>
        /// <param name="columns">The columns to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTable AddColumns(IEnumerable<IControlTableColumn> columns)
        {
            _columns.AddRange(columns);

            return this;
        }

        /// <summary>
        /// Adds a row to the table.
        /// </summary>
        /// <param name="cells">The cells of the row.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTable AddRow(params IControlTableCell[] cells)
        {
            var r = new ControlTableRow(null, cells);

            _rows.Add(r);

            return this;
        }

        /// <summary>
        /// Adds one or more rows to the table.
        /// </summary>
        /// <param name="rows">The rows to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTable AddRows(params IControlTableRow[] rows)
        {
            _rows.AddRange(rows);

            return this;
        }

        /// <summary>
        /// Adds one or more rows to the table.
        /// </summary>
        /// <param name="rows">The rows to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTable AddRows(IEnumerable<IControlTableRow> rows)
        {
            _rows.AddRange(rows);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var color = Color?.Invoke(renderContext) ?? TypeColorTable.Default;
            var striped = Striped?.Invoke(renderContext) ?? TypeStripedTable.Default;
            var tableBorder = TableBorder?.Invoke(renderContext) ?? TypeBorderTable.Default;
            var selectable = Selectable?.Invoke(renderContext) ?? false;
            var headerColor = HeaderColor?.Invoke(renderContext) ?? TypeColorTable.Default;
            var suppressHeaders = SuppressHeaders?.Invoke(renderContext) ?? false;
            var role = Role?.Invoke(renderContext);

            var classes = Classes.ToList();

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-table", classes),
                Style = GetStyles(renderContext),
                Role = role
            }
                .AddUserAttribute("data-color", color.ToClass())
                .AddUserAttribute("data-striped", striped.ToClass())
                .AddUserAttribute("data-border", tableBorder.ToClass())
                .AddUserAttribute("data-selectable", selectable ? "true" : null)
                .Add
                (
                    new HtmlElementTextContentDiv()
                    {
                        Class = Css.Concatenate("wx-table-columns", headerColor.ToClass())
                    }
                        .AddUserAttribute("data-color", headerColor.ToClass())
                        .AddUserAttribute("data-suppress-headers", suppressHeaders ? "true" : null)
                        .Add
                        (
                            _columns.Select
                            (
                                column => column.Render(renderContext, visualTree)
                            )
                        )
                )
                .Add
                (
                    _rows.Select
                    (
                        row => row.Render(renderContext, visualTree)
                    )
                );

            return html;
        }
    }
}
