using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebIcon;
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

        /// <summary>
        /// Returns or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Returns or sets the color scheme used for the row.
        /// </summary>
        public TypeTableColor Color { get; set; } = TypeTableColor.Default;

        /// <summary>
        /// Returns the cells.
        /// </summary>
        public IEnumerable<IControlTableCell> Cells => _cells;

        /// <summary>
        /// Returns the options.
        /// </summary>
        public IEnumerable<IControlDropdownItem> Options => _options;

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
        public IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-table-row"
            }
                .AddUserAttribute("data-color", Color.ToClass())
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
                                option => ConvertOption(renderContext, option)
                            )
                        )
                        : null
                );

            return html;
        }

        /// <summary>
        /// Converts a dropdown item into an HTML element representation for rendering.
        /// </summary>
        /// <param name="renderContext">The rendering context used for localization and other rendering-related operations.</param>
        /// <param name="option">The dropdown item to be converted.</param>
        /// <returns>An representing the rendered HTML element for the dropdown item.</returns>
        private HtmlElement ConvertOption(IRenderControlContext renderContext, IControlDropdownItem option)
        {
            if (option is ControlDropdownItemHeader header)
            {
                return new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext, header.Text)))
                {
                    Class = "wx-dropdownbutton-header"
                };
            }
            else if (option is ControlDropdownItemDivider divider)
            {
                return new HtmlElementTextContentDiv()
                {
                    Class = "wx-dropdownbutton-divider"
                };
            }
            else if (option is ControlDropdownItemLink link)
            {
                return new HtmlElementTextContentDiv(new HtmlText(link.Text))
                {
                    Class = "wx-dropdownbutton-item"
                }
                    .AddUserAttribute("id", link.Id)
                    .AddUserAttribute("data-icon", (link.Icon as Icon)?.Class)
                    .AddUserAttribute("data-image", (link.Icon as ImageIcon)?.Uri?.ToString())
                    .AddUserAttribute("data-uri", link.Uri?.ToString())
                    .AddUserAttribute("data-target", link.Target.ToStringValue())
                    .AddUserAttribute("data-modal", link.Modal)
                    .AddUserAttribute("data-textcolor", link.TextColor?.ToClass());
            }

            return null;
        }
    }
}
