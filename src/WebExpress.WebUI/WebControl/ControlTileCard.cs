using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A card-style tile that presents its content inside a bordered card.
    /// </summary>
    public class ControlTileCard : IControlTileCard
    {
        private readonly List<IControl> _content = [];
        private readonly List<IControl> _footer = [];

        /// <summary>
        /// Gets or sets the unique identifier for the entity.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the header text.
        /// </summary>
        public Func<IRenderControlContext, string> Header { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or set the background color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorTile> Color { get; set; } = _ => new PropertyColorTile(TypeColorTile.Default);

        /// <summary>
        /// Gets or sets the kicker text shown above the header, typically the kind or
        /// category the card belongs to.
        /// </summary>
        public Func<IRenderControlContext, string> Badge { get; set; }

        /// <summary>
        /// Gets or sets the accent colour of the kicker.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorTile> BadgeColor { get; set; }

        /// <summary>
        /// Gets or sets the chip shown at the trailing end of the kicker row, typically
        /// a short qualifier such as "popular".
        /// </summary>
        public Func<IRenderControlContext, string> Chip { get; set; }

        /// <summary>
        /// Gets or sets the value the card is filtered by. A tile control bound to
        /// another input (see <c>ControlFormItemInputTile.FilterSource</c>) shows only
        /// the cards whose value matches the value of that input.
        /// </summary>
        public Func<IRenderControlContext, string> FilterValue { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the card stays visible no matter what
        /// the search box or the bound filter would otherwise hide.
        /// </summary>
        /// <remarks>
        /// This is for the card that must never fall away because it is the way on — an
        /// "add new" or a "none of these" entry. Such a card carries no filter value of
        /// its own and is not what the user types into the search box, yet it has to stay
        /// reachable in every state of the list.
        /// </remarks>
        public Func<IRenderControlContext, bool> AlwaysVisible { get; set; }

        /// <summary>
        /// Gets or sets the values the card projects when it is selected, keyed by the
        /// name of the target. A target is either a form control of that name, whose
        /// value is set, or an element carrying <c>data-wx-bind-text</c> with that name,
        /// whose text is set. This is how a card carries the data behind its label —
        /// the references it stands for, or a note about it — into the rest of a form.
        /// </summary>
        public Func<IRenderControlContext, IDictionary<string, string>> Bindings { get; set; }

        /// <summary>
        /// Returns the content of the tile control.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Returns the content of the footer of the tile control.
        /// </summary>
        public IEnumerable<IControl> Footer => _footer;

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double-click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTileCard(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more items to the tile card.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTileCard Add(params IControl[] items)
        {
            _content.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the tile card.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTileCard Add(IEnumerable<IControl> items)
        {
            _content.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the footer of the tile card.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTileCard AddFooter(params IControl[] items)
        {
            _footer.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the footer of the tile card.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTileCard AddFooter(IEnumerable<IControl> items)
        {
            _footer.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the tile card.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTileCard Remove(IControl item)
        {
            _content.Remove(item);
            _footer.Remove(item);

            return this;
        }

        /// <summary>
        /// Converts the column to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var icon = Icon?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext) ?? new PropertyColorTile(TypeColorTile.Default);
            var header = Header?.Invoke(renderContext);
            var badge = Badge?.Invoke(renderContext);
            var badgeColor = BadgeColor?.Invoke(renderContext);
            var chip = Chip?.Invoke(renderContext);
            var filterValue = FilterValue?.Invoke(renderContext);
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-tile-card"
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, header))
                .AddUserAttribute("data-badge", I18N.Translate(renderContext, badge))
                .AddUserAttribute("data-badge-color-css", badgeColor?.ToClass())
                .AddUserAttribute("data-badge-color-style", badgeColor?.ToStyle())
                .AddUserAttribute("data-chip", I18N.Translate(renderContext, chip))
                .AddUserAttribute("data-filter-value", filterValue)
                .AddUserAttribute("data-always-visible", AlwaysVisible?.Invoke(renderContext) == true ? "true" : null)
                .AddUserAttribute("data-color-css", color.ToClass())
                .AddUserAttribute("data-color-style", color.ToStyle())
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon as ImageIcon)?.Uri?.ToString())
                .Add(_content.Select(x => x.Render(renderContext, visualTree)));

            foreach (var binding in Bindings?.Invoke(renderContext) ?? new Dictionary<string, string>())
            {
                html.AddUserAttribute($"data-wx-bind-{binding.Key.ToLowerInvariant()}", binding.Value);
            }

            if (_footer.Count > 0)
            {
                html.Add(new HtmlElementTextContentDiv([.. _footer.Select(x => x.Render(renderContext, visualTree))])
                {
                    Class = "wx-tile-card-footer"
                });
            }

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
