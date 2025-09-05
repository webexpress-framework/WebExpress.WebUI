using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table row control.
    /// </summary>
    public class ControlTableRow : IControlTableRow
    {
        private readonly List<IControlTableCell> _cells = [];
        private readonly List<IControlDropdownItem> _options = [];
        private readonly List<IControlTableRow> _children = [];

        /// <summary>
        /// Returns or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Returns or sets the color scheme used for the row.
        /// </summary>
        public TypeTableColor Color { get; set; } = TypeTableColor.Default;

        /// <summary>
        /// Returns or sets the expand state of the type, indicating whether it is expanded or collapsed.
        /// </summary>
        public TypeExpandState ExpandState { get; set; } = TypeExpandState.None;

        /// <summary>
        /// Returns the cells.
        /// </summary>
        public IEnumerable<IControlTableCell> Cells => _cells;

        /// <summary>
        /// Returns the options.
        /// </summary>
        public IEnumerable<IControlDropdownItem> Options => _options;

        /// <summary>
        /// Returns the collection of child rows associated with the current control table row.
        /// </summary>
        public IEnumerable<IControlTableRow> Children => _children;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="cells">The cells to be added to the row.</param>
        public ControlTableRow(string id = null, params IControlTableCell[] cells)
        {
            _cells.AddRange(cells);
            Id = id;
        }

        /// <summary>
        /// Adds the specified cells to the row.
        /// </summary>
        /// <param name="cells">The cells to be added to the row.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableRow Add(params IControlTableCell[] cells)
        {
            _cells.AddRange(cells);

            return this;
        }

        /// <summary>
        /// Adds the specified cells to the row.
        /// </summary>
        /// <param name="cells">The cells to be added to the row.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableRow Add(IEnumerable<IControlTableCell> cells)
        {
            _cells.AddRange(cells);

            return this;
        }

        /// <summary>
        /// Adds the specified child rows to the current control table row.
        /// </summary>
        /// <param name="childen">A collection of child rows to add. Cannot be null.</param>
        /// <returns>The current control table row, allowing for method chaining.</returns>
        public IControlTableRow Add(params IControlTableRow[] childen)
        {
            _children.AddRange(childen);

            return this;
        }

        /// <summary>
        /// Adds the specified child rows to the current control table row.
        /// </summary>
        /// <param name="childen">A collection of child rows to add. Cannot be null.</param>
        /// <returns>The current control table row, allowing for method chaining.</returns>
        public IControlTableRow Add(IEnumerable<IControlTableRow> childen)
        {
            _children.AddRange(childen);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableRow Add(params IControlDropdownItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableRow Add(IEnumerable<IControlDropdownItem> items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds a new separator.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableRow AddSeperator()
        {
            _options.Add(null);

            return this;
        }

        /// <summary>
        /// Adds a new head.
        /// </summary>
        /// <param name="text">The headline text.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableRow AddHeader(string text)
        {
            _options.Add(new ControlDropdownItemHeader() { Text = text });

            return this;
        }

        /// <summary>
        /// Removes the specified cell from the row.
        /// </summary>
        /// <param name="cell">The cell to be removed from the row.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableRow Remove(IControlTableCell cell)
        {
            _cells.Remove(cell);

            return this;
        }

        /// <summary>
        /// Removes the specified child row from the control table.
        /// </summary>
        /// <param name="child">The child row to remove.</param>
        /// <returns>The current instance of the control table row, allowing for method chaining.</returns>
        public IControlTableRow Remove(IControlTableRow child)
        {
            _children.Remove(child);

            return this;
        }

        /// <summary>
        /// Removes the specified item from the options.
        /// </summary>
        /// <param name="item">The item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableRow Remove(IControlDropdownItem item)
        {
            _options.Remove(item);

            return this;
        }

        /// <summary>
        /// Converts the row to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-table-row"
            }
                .AddUserAttribute("data-color", Color.ToClass())
                .AddUserAttribute("data-collapsed", ExpandState == TypeExpandState.Collapsed ? "true" : null)
                .Add
                (
                    Cells.Select
                    (
                        cell => cell.Render(renderContext, visualTree)
                    )
                )
                .Add
                (
                    Options.Any() ? new HtmlElementTextContentDiv()
                    {
                        Class = "wx-table-options"
                    }
                        .Add
                        (
                            Options.Select
                            (
                                option => option.Render(renderContext, visualTree)
                            )
                        )
                        : null
                )
                .Add
                (
                    Children.Select
                    (
                        child => child.Render(renderContext, visualTree)
                    )
                );

            return html;
        }
    }
}
