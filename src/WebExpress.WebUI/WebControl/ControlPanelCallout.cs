using System.Linq;
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
        /// Returns or sets the title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Returns or sets the color.
        /// </summary>
        public PropertyColorCallout Color
        {
            get => (PropertyColorCallout)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
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
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-callout", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                DataTheme = Theme.ToValue()
            };

            if (Title != null)
            {
                html.Add(new HtmlElementTextSemanticsSpan(new HtmlText(Title))
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
