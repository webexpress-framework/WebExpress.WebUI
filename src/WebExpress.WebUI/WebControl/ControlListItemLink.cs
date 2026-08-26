using System;
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
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the target.
        /// </summary>
        public Func<IRenderControlContext, TypeTarget> Target { get; set; }

        /// <summary>
        /// Gets or sets the hover text of the row. It takes precedence over
        /// <see cref="Tooltip"/>, mirroring <see cref="ControlLink"/>, so a row can carry a
        /// specific label where the shared tooltip would say less. This is not the row's
        /// visible text - that is <see cref="ControlListItem.Text"/>.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets a tooltip text, used as the row's hover text when no
        /// <see cref="Title"/> is set.
        /// </summary>
        public Func<IRenderControlContext, string> Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the parameters that apply to the link.
        /// </summary>
        public Func<IRenderControlContext, List<Parameter>> Params { get; set; }

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
        public string GetParams(IRenderControlContext renderContext)
        {
            var dict = new Dictionary<string, Parameter>();

            // copying the parameters of the link
            if (Params is not null)
            {
                foreach (var v in Params.Invoke(renderContext) ?? [])
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
            var title = Title?.Invoke(renderContext);
            var tooltip = Tooltip?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext);
            var target = Target?.Invoke(renderContext) ?? TypeTarget.None;
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);

            var html = base.Render(renderContext, visualTree);
            html.AddClass("wx-list-item-link");
            html.RemoveClass("wx-list-item");

            html.AddUserAttribute("data-title", I18N.Translate(renderContext, title));
            html.AddUserAttribute("data-tooltip", I18N.Translate(renderContext, tooltip));
            html.AddUserAttribute("data-uri", uri?.ToString());
            html.AddUserAttribute("data-target", target.ToValue());

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
