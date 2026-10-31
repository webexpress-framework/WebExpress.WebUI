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
        private readonly List<IControlTableCell> _footer = [];

        /// <summary>
        /// Returns the columns of the table.
        /// </summary>
        public IEnumerable<IControlTableColumn> Columns => _columns;

        /// <summary>
        /// Returns the rows of the table.
        /// </summary>
        public IEnumerable<IControlTableRow> Rows => _rows;

        /// <summary>
        /// Returns the cells of the footer, one per column. The footer is not a row: it is
        /// neither sorted nor selected with the rows, and it stays below them - the place
        /// for totals and summaries of the columns above.
        /// </summary>
        public IEnumerable<IControlTableCell> Footer => _footer;

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
        /// Gets or sets the binding of the table to other controls, for example a
        /// <see cref="BindSearch"/> that narrows the rows to the term of a search box.
        /// </summary>
        public Func<IRenderControlContext, IBinding> Bind { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether columns should be hidden.
        /// </summary>
        public Func<IRenderControlContext, bool> SuppressHeaders { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets whether the table takes the height its host offers
        /// instead of growing with its rows.
        /// </summary>
        /// <remarks>
        /// A table that grows is the right shape for one block among others on a
        /// page. Where the table *is* the view, it is the wrong one: the page
        /// scrolls around it and takes the column header along, so the reader
        /// loses what the columns mean, and a table wider than the pane pushes
        /// the pane sideways instead of scrolling itself. Filling bounds the
        /// table, and the rows then scroll under a header that stays.
        ///
        /// A host that is a flex column - which the WebApp content panel becomes
        /// on its own for a filling control - drives the height. A host that hands
        /// nothing down falls back to the self-imposed default of the
        /// <c>--wx-table-height</c> custom property, never to the content: the
        /// rows only scroll while the table is bounded.
        /// </remarks>
        public Func<IRenderControlContext, bool> Fill { get; set; } = _ => false;

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
        /// Adds one or more cells to the footer, in column order.
        /// </summary>
        /// <param name="cells">The cells to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTable AddFooter(params IControlTableCell[] cells)
        {
            _footer.AddRange(cells);

            return this;
        }

        /// <summary>
        /// Adds one or more cells to the footer, in column order.
        /// </summary>
        /// <param name="cells">The cells to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTable AddFooter(IEnumerable<IControlTableCell> cells)
        {
            _footer.AddRange(cells);

            return this;
        }

        /// <summary>
        /// Renders the footer for the table script, which reads it from a child of the
        /// table element; a table without footer cells has no such child.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>The footer element, or nothing if the table has no footer.</returns>
        protected IEnumerable<IHtmlNode> RenderFooter(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            if (_footer.Count == 0)
            {
                return [];
            }

            return
            [
                new HtmlElementTextContentDiv()
                {
                    Class = "wx-table-footer"
                }
                    .Add(_footer.Select(cell => cell.Render(renderContext, visualTree)))
            ];
        }

        /// <summary>
        /// Creates the root element of the table with the classes and attributes every
        /// table variant shares, so a derived table adds only what is its own and cannot
        /// drop a shared setting - the fill, the selection, the color, the stripes or the
        /// border - by rendering the root itself.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="controlClass">The class that selects the script controller of the variant.</param>
        /// <returns>The root element without children.</returns>
        protected HtmlElementTextContentDiv CreateTableElement(IRenderControlContext renderContext, string controlClass)
        {
            var color = Color?.Invoke(renderContext) ?? TypeColorTable.Default;
            var striped = Striped?.Invoke(renderContext) ?? TypeStripedTable.Default;
            var tableBorder = TableBorder?.Invoke(renderContext) ?? TypeBorderTable.Default;
            var selectable = Selectable?.Invoke(renderContext) ?? false;

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate(controlClass, [(Fill?.Invoke(renderContext) ?? false) ? "wx-fill" : null, .. Classes]),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            };

            html.AddUserAttribute("data-color", color.ToClass());
            html.AddUserAttribute("data-striped", striped.ToClass());
            html.AddUserAttribute("data-border", tableBorder.ToClass());
            html.AddUserAttribute("data-selectable", selectable ? "true" : null);

            Bind?.Invoke(renderContext)?.ApplyUserAttributes(html);

            return html;
        }

        /// <summary>
        /// Renders the children the table script reads its configuration from: the columns,
        /// the rows and the footer.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>The child elements of the table element.</returns>
        protected IEnumerable<IHtmlNode> RenderContent(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var headerColor = HeaderColor?.Invoke(renderContext) ?? TypeColorTable.Default;
            var suppressHeaders = SuppressHeaders?.Invoke(renderContext) ?? false;

            yield return new HtmlElementTextContentDiv()
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
                );

            foreach (var row in _rows)
            {
                yield return row.Render(renderContext, visualTree);
            }

            foreach (var footer in RenderFooter(renderContext, visualTree))
            {
                yield return footer;
            }
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return CreateTableElement(renderContext, "wx-webui-table")
                .Add(RenderContent(renderContext, visualTree));
        }
    }
}
