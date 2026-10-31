using WebExpress.WebCore.Internationalization;
using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a carousel control that can contain multiple carousel items.
    /// </summary>
    public class ControlCarousel : Control, IControlCarousel
    {
        private readonly List<IControlCarouselItem> _items = [];

        /// <summary>
        /// Returns the collection of carousel items.
        /// </summary>
        /// <value>
        /// An <see cref="IEnumerable{ControlCarouselItem}"/> representing the carousel items.
        /// </value>
        public IEnumerable<IControlCarouselItem> Items => _items;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The carousel items to be added.</param>
        public ControlCarousel(string id = null, params IControlCarouselItem[] items)
            : base(string.IsNullOrWhiteSpace(id) ? "carousel" : id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more carousel items to the carousel.
        /// </summary>
        /// <param name="items">The carousel items to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlCarousel Add(params IControlCarouselItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more carousel items to the carousel.
        /// </summary>
        /// <param name="items">The carousel items to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlCarousel Add(IEnumerable<IControlCarouselItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Clears all carousel items from the carousel.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        public IControlCarousel Clear()
        {
            _items.Clear();

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
            return Render(renderContext, visualTree, _items);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="items">The collection of carousel items to be rendered.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlCarouselItem> items)
        {
            // indicators
            var indicators = new HtmlElementTextContentDiv() { Class = "carousel-indicators" };
            var index = 0;

            foreach (var v in items)
            {
                var i = new HtmlElementFieldButton() { Type = "button", Class = index == 0 ? "active" : string.Empty };
                i.AddUserAttribute("aria-label", (index + 1).ToString());
                i.AddUserAttribute("data-wx-target", "#" + Id);
                i.AddUserAttribute("data-wx-slide-to", index.ToString());

                indicators.Add(i);

                index++;
            }

            index = 0;

            // items
            var inner = new HtmlElementTextContentDiv() { Class = "carousel-inner" };
            foreach (var v in items)
            {
                var control = v?.Control?.Invoke(renderContext);
                var headline = v?.Headline?.Invoke(renderContext);
                var text = v?.Text?.Invoke(renderContext);

                var i = new HtmlElementTextContentDiv(control?.Render(renderContext, visualTree))
                {
                    Class = index == 0 ? "carousel-item active" : "carousel-item"
                };

                if (!string.IsNullOrWhiteSpace(headline) || !string.IsNullOrWhiteSpace(text))
                {
                    var caption = new HtmlElementTextContentDiv
                    (
                        new HtmlElementSectionH3() { Text = headline },
                        new HtmlElementTextContentP() { Text = text }
                    )
                    {
                        Class = "carousel-caption"
                    };

                    i.Add(caption);
                }

                inner.Add(i);

                index++;
            }

            // navigation
            var navLeft = new HtmlElementFieldButton(new HtmlElementTextSemanticsSpan() { Class = "carousel-control-prev-icon" })
            {
                Class = "carousel-control-prev",
                Type = "button"
            };
            navLeft.AddUserAttribute("data-wx-slide", "prev");
            navLeft.AddUserAttribute("aria-label", I18N.Translate(renderContext, "webexpress.webui:carousel.previous"));

            var navRight = new HtmlElementFieldButton(new HtmlElementTextSemanticsSpan() { Class = "carousel-control-next-icon" })
            {
                Class = "carousel-control-next",
                Type = "button"
            };
            navRight.AddUserAttribute("data-wx-slide", "next");
            navRight.AddUserAttribute("aria-label", I18N.Translate(renderContext, "webexpress.webui:carousel.next"));

            var html = new HtmlElementTextContentDiv
            (
                indicators, inner, navLeft, navRight
            )
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-carousel carousel", GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            };


            return html;
        }
    }
}
