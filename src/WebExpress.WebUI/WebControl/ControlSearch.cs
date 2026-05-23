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
    /// Represents a search control.
    /// </summary>
    public class ControlSearch : Control
    {
        private readonly List<ControlSearchItemSuggestion> _suggestion = [];

        /// <summary>
        /// Returns the collection of suggestion items contained in the control.
        /// </summary>
        public IEnumerable<ControlSearchItemSuggestion> Suggestions => _suggestion;

        /// <summary>
        /// Gets or sets the value of the search input.
        /// </summary>
        public Func<IRenderControlContext, string> Value { get; set; }

        /// <summary>
        /// Gets or sets the placeholder text displayed in the search input.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the icon displayed in the search control.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the footer control displayed below the search suggestions.
        /// </summary>
        public IControl Footer { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether favorited suggestions are enabled.
        /// </summary>
        public Func<IRenderControlContext, bool> EnableFavorited { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="ControlSearch"/> class.
        /// </summary>
        /// <param name="id">The ID of the control.</param>
        /// <param name="suggestions">The suggestion items to initialize the control with.</param>
        public ControlSearch(string id = null, params ControlSearchItemSuggestion[] suggestions)
            : base(id)
        {
            _suggestion.AddRange(suggestions);
        }

        /// <summary>
        /// Adds the specified suggestion items to the control.
        /// </summary>
        /// <param name="items">The suggestion items to add.</param>
        public void Add(params ControlSearchItemSuggestion[] items)
        {
            _suggestion.AddRange(items);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var classes = new List<string>(["wx-webui-search"]);
            classes.AddRange(Classes);
            var placeholder = Placeholder?.Invoke(renderContext);
            var enableFavorited = EnableFavorited?.Invoke(renderContext) ?? false;
            var value = Value?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv
            (
                [.. _suggestion.Select(x =>
                {
                    var label = x.Label?.Invoke(renderContext);
                    var xIcon = x.Icon?.Invoke(renderContext);
                    var xImage = x.Image?.Invoke(renderContext);
                    var xCss = x.Css?.Invoke(renderContext);
                    var xFavorited = x.Favorited?.Invoke(renderContext) ?? false;

                    var div = new HtmlElementTextContentDiv(new HtmlText(label))
                    {
                        Id = x.Id,
                        Class = Css.Concatenate("wx-search-suggestion", xCss),
                    };

                    if (xIcon is Icon iconCss)
                    {
                        div.AddUserAttribute("data-icon", iconCss.Class);
                    }

                    if (xImage != null || xIcon is ImageIcon)
                    {
                        div.AddUserAttribute("data-image", xImage?.ToString() ?? (xIcon as ImageIcon)?.Uri?.ToString());
                    }

                    if (xFavorited)
                    {
                        div.AddUserAttribute("data-favorited", "true");
                    }

                    if (!string.IsNullOrWhiteSpace(xCss))
                    {
                        div.AddUserAttribute("css", xCss);
                    }

                    return div;
                })]
            )
            {
                Id = Id,
                Class = string.Join(" ", classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, placeholder))
                .AddUserAttribute("data-favorited", enableFavorited ? "true" : null)
                .AddUserAttribute("data-value", value)
                .AddUserAttribute("data-icon", icon is Icon iconClass ? iconClass.Class : null)
                .AddUserAttribute("data-image", image?.ToString() ?? (icon is ImageIcon imageIcon ? imageIcon.Uri?.ToString() : null));

            return html;
        }
    }
}
