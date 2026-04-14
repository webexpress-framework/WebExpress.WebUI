using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tile control.
    /// </summary>
    public class ControlTile : Control, IControlTile
    {
        private readonly List<IControlTileCard> _items = [];

        /// <summary>
        /// Returns the items of the tile control.
        /// </summary>
        public IEnumerable<IControlTileCard> Items => _items;

        /// <summary>
        /// Gets or sets a value indicating whether cards in the tile can be moved.
        /// </summary>
        public bool Movable { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether items can be removed.
        /// </summary>
        public bool AllowRemove { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether a large icon is displayed 
        /// for the item.
        /// </summary>
        public bool LargeIcon { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The items to add.</param>
        public ControlTile(string id = null, params IControlTileCard[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the tile control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTile Add(params IControlTileCard[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the tile control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTile Add(IEnumerable<IControlTileCard> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the tile control.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTile Remove(IControlTileCard item)
        {
            _items.Remove(item);

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
            var classes = Classes.ToList();

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-tile", classes),
                Style = GetStyles(),
                Role = Role
            }
                .AddUserAttribute("data-movable", Movable ? "true" : null)
                .AddUserAttribute("data-allow-remove", AllowRemove ? "true" : null)
                .AddUserAttribute("data-large-icon", LargeIcon ? "true" : null)
                .Add
                (
                    _items.Select
                    (
                        x =>
                        x.Render(renderContext, visualTree)
                    )
                );

            return html;
        }
    }
}
