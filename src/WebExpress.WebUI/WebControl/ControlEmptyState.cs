using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an empty-state placeholder: a centered icon, title and message
    /// shown when there is nothing to display, with optional call-to-action
    /// controls below.
    /// </summary>
    public class ControlEmptyState : Control
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Gets the call-to-action controls shown below the message.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Gets or sets the optional illustration icon.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the headline. The value may be an internationalization key, which
        /// is resolved against the culture of the request.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the explanatory message. The value may be an internationalization
        /// key, which is resolved against the culture of the request.
        /// </summary>
        public Func<IRenderControlContext, string> Message { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The call-to-action controls.</param>
        public ControlEmptyState(string id = null, params IControl[] content)
            : base(id)
        {
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more call-to-action controls.
        /// </summary>
        /// <param name="content">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlEmptyState Add(params IControl[] content)
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
            var icon = Icon?.Invoke(renderContext);
            var title = I18N.Translate(renderContext, Title?.Invoke(renderContext));
            var message = I18N.Translate(renderContext, Message?.Invoke(renderContext));

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-empty-state", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            };

            if (icon is not null)
            {
                html.Add(new HtmlElementTextContentDiv(new ControlIcon() { Icon = _ => icon }.Render(renderContext, visualTree))
                {
                    Class = "wx-empty-state-icon"
                });
            }

            if (!string.IsNullOrWhiteSpace(title))
            {
                html.Add(new HtmlElementTextSemanticsSpan(new HtmlText(title)) { Class = "wx-empty-state-title" });
            }

            if (!string.IsNullOrWhiteSpace(message))
            {
                html.Add(new HtmlElementTextSemanticsSpan(new HtmlText(message)) { Class = "wx-empty-state-message" });
            }

            if (_content.Count > 0)
            {
                html.Add(new HtmlElementTextContentDiv([.. Content.Select(x => x.Render(renderContext, visualTree))])
                {
                    Class = "wx-empty-state-actions"
                });
            }

            return html;
        }
    }
}
