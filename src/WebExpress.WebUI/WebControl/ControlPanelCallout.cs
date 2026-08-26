using System;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a callout panel control that can contain multiple child controls.
    /// </summary>
    public class ControlPanelCallout : ControlPanel
    {
        /// <summary>
        /// Gets or sets the title. Accepts a resource key, which is resolved against the
        /// culture of the request like every other caption.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the color.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorCallout> Color
        {
            get => (Func<IRenderControlContext, PropertyColorCallout>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The content of the html element.</param>
        public ControlPanelCallout(string id = null, params IControl[] content)
            : base(id, content)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var role = Role?.Invoke(renderContext);
            var theme = Theme?.Invoke(renderContext) ?? TypeTheme.None;
            // the caption is resolved here rather than left to the caller: every other control
            // takes a resource key, and a caption that renders its key verbatim is a fault
            // nothing reports - the page simply shows the key
            var title = I18N.Translate(renderContext, Title?.Invoke(renderContext));

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-callout", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role,
                DataTheme = theme.ToValue()
            };

            if (title is not null)
            {
                html.Add(new HtmlElementTextSemanticsSpan(new HtmlText(title))
                {
                    Class = "wx-callout-title"
                });
            }

            html.Add(new HtmlElementTextContentDiv(Content.Select(x => x.Render(renderContext, visualTree)).ToArray())
            {
                Class = "wx-callout-body"
            });

            return html;
        }
    }
}
