using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a single term/description pair of a
    /// <see cref="ControlDescriptionList"/>. The pair is wrapped in a div, which
    /// HTML allows inside a definition list and which keeps the term and its
    /// description aligned in the horizontal layout.
    /// </summary>
    public class ControlDescriptionListItem : Control
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Gets the controls shown as the description, used when no
        /// <see cref="Description"/> text is set.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Gets or sets the term.
        /// </summary>
        public Func<IRenderControlContext, string> Term { get; set; }

        /// <summary>
        /// Gets or sets the description text, used when no content is set.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The controls shown as the description.</param>
        public ControlDescriptionListItem(string id = null, params IControl[] content)
            : base(id)
        {
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more controls to the description.
        /// </summary>
        /// <param name="content">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlDescriptionListItem Add(params IControl[] content)
        {
            _content.AddRange(content);

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
            var term = Term?.Invoke(renderContext);
            var description = Description?.Invoke(renderContext);

            var dt = new HtmlElementTextContentDt(new HtmlText(term))
            {
                Class = "wx-description-list-term"
            };

            var dd = new HtmlElementTextContentDd()
            {
                Class = "wx-description-list-description"
            };

            // the controls take precedence over the plain description text
            if (_content.Count > 0)
            {
                dd.Add([.. Content.Select(x => x.Render(renderContext, visualTree))]);
            }
            else
            {
                dd.Add(new HtmlText(description));
            }

            return new HtmlElementTextContentDiv(dt, dd)
            {
                Id = Id,
                Class = Css.Concatenate("wx-description-list-item", GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            };
        }
    }
}
