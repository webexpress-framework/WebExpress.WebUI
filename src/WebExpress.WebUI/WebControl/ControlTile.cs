using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders a tile, a rectangular content block used in tile and grid layouts.
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
        public Func<IRenderControlContext, bool> Movable { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether items can be removed.
        /// </summary>
        public Func<IRenderControlContext, bool> AllowRemove { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether a large icon is displayed 
        /// for the item.
        /// </summary>
        public Func<IRenderControlContext, bool> LargeIcon { get; set; }

        /// <summary>
        /// Gets or sets whether the tiles take the height their host offers
        /// instead of growing with their number.
        /// </summary>
        /// <remarks>
        /// Growing is the right shape for a set of tiles among other blocks on a
        /// page. Where the tiles *are* the view, it is the wrong one: the page
        /// scrolls around them, and anything the control keeps below them - the
        /// pager, the info line - sits at the end of that scroll rather than in
        /// reach. Filling bounds the control, and the tiles scroll above chrome
        /// that stays.
        ///
        /// A host that is a flex column - which the WebApp content panel becomes
        /// on its own for a filling control - drives the height. A host that hands
        /// nothing down falls back to the self-imposed default of the
        /// <c>--wx-tile-height</c> custom property, never to the content: the
        /// tiles only scroll while the control is bounded.
        /// </remarks>
        public Func<IRenderControlContext, bool> Fill { get; set; } = _ => false;

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
            var movable = Movable?.Invoke(renderContext) ?? false;
            var allowRemove = AllowRemove?.Invoke(renderContext) ?? false;
            var largeIcon = LargeIcon?.Invoke(renderContext) ?? false;
            var role = Role?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-tile", [(Fill?.Invoke(renderContext) ?? false) ? "wx-fill" : null, .. classes]),
                Style = GetStyles(renderContext),
                Role = role
            }
                .AddUserAttribute("data-movable", movable ? "true" : null)
                .AddUserAttribute("data-allow-remove", allowRemove ? "true" : null)
                .AddUserAttribute("data-large-icon", largeIcon ? "true" : null)
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
