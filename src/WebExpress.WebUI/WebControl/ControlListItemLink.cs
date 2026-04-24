using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebParameter;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a list item link control that can contain other controls as its content.
    /// </summary>
    public class ControlListItemLink : ControlListItem
    {
        /// <summary>
        /// Gets or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Gets or sets the target.
        /// </summary>
        public TypeTarget Target { get; set; }

        /// <summary>
        /// Gets or sets the tooltip.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets a tooltip text.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the parameters that apply to the link.
        /// </summary>
        public List<Parameter> Params { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlListItemLink(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Returns all local and temporary parameters.
        /// </summary>
        /// <returns>The parameters.</returns>
        public string GetParams()
        {
            var dict = new Dictionary<string, Parameter>();

            // copying the parameters of the link
            if (Params is not null)
            {
                foreach (var v in Params)
                {
                    if (v.Scope == ParameterScope.Parameter)
                    {
                        if (!dict.ContainsKey(v.Key.ToLower()))
                        {
                            dict.Add(v.Key.ToLower(), v);
                        }
                        else
                        {
                            dict[v.Key.ToLower()] = v;
                        }
                    }
                }
            }

            return string.Join("&amp;", dict.Where(x => !string.IsNullOrWhiteSpace(x.Value.Value)).Select(x => x.Value.ToString()));
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = base.Render(renderContext, visualTree);
            html.AddClass("wx-list-item-link");
            html.RemoveClass("wx-list-item");

            html.AddUserAttribute("data-title", I18N.Translate(renderContext, Title));
            html.AddUserAttribute("data-tooltip", I18N.Translate(renderContext, Tooltip));
            html.AddUserAttribute("data-uri", Uri?.ToString());
            html.AddUserAttribute("data-target", Target.ToValue());

            return html;
        }
    }
}
