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
        private readonly List<ControlCarouselItem> _items = [];

        /// <summary>
        /// Returns the collection of carousel items.
        /// </summary>
        /// <value>
        /// An <see cref="IEnumerable{ControlCarouselItem}"/> representing the carousel items.
        /// </value>
        public IEnumerable<ControlCarouselItem> Items => _items;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The carousel items to be added.</param>
        public ControlCarousel(string id = null, params ControlCarouselItem[] items)
            : base(string.IsNullOrWhiteSpace(id) ? "carousel" : id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more carousel items to the carousel.
        /// </summary>
        /// <param name="items">The carousel items to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlCarousel Add(params ControlCarouselItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more carousel items to the carousel.
        /// </summary>
        /// <param name="items">The carousel items to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlCarousel Add(IEnumerable<ControlCarouselItem> items)
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
            // indicators 
            var indicators = new HtmlElementTextContentUl() { Class = "carousel-indicators" };
            var index = 0;

            foreach (var v in Items)
            {
                var i = new HtmlElementTextContentLi() { Class = index == 0 ? "active" : string.Empty };
                i.AddUserAttribute("data-bs-target", "#" + Id);
                i.AddUserAttribute("data-bs-slide-to", index.ToString());

                indicators.Add(i);

                index++;
            }

            index = 0;

            // items
            var inner = new HtmlElementTextContentDiv() { Class = "carousel-inner" };
            foreach (var v in Items)
            {
                var i = new HtmlElementTextContentDiv(v?.Control.Render(renderContext, visualTree))
                {
                    Class = index == 0 ? "carousel-item active" : "carousel-item"
                };

                if (!string.IsNullOrWhiteSpace(v.Headline) || !string.IsNullOrWhiteSpace(v.Text))
                {
                    var caption = new HtmlElementTextContentDiv
                    (
                        new HtmlElementSectionH3() { Text = v.Headline },
                        new HtmlElementTextContentP() { Text = v.Text }
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
            var navLeft = new HtmlElementTextSemanticsA(new HtmlElementTextSemanticsSpan() { Class = "carousel-control-prev-icon" })
            {
                Class = "carousel-control-prev",
                Href = "#" + Id
            };
            navLeft.AddUserAttribute("data-bs-slide", "prev");

            var navRight = new HtmlElementTextSemanticsA(new HtmlElementTextSemanticsSpan() { Class = "carousel-control-next-icon" })
            {
                Class = "carousel-control-next",
                Href = "#" + Id
            };
            navRight.AddUserAttribute("data-bs-slide", "next");

            var html = new HtmlElementTextContentDiv
            (
                indicators, inner, navLeft, navRight
            )
            {
                Id = Id,
                Class = Css.Concatenate("carousel slide", GetClasses()),
                Style = GetStyles()
            };

            html.AddUserAttribute("data-bs-ride", "carousel");

            return html;
        }
    }
}
