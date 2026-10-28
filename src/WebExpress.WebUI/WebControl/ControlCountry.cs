using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders a country as its flag and its name, read-only. The name is translated on the
    /// server into the language of the request, and the client keeps that text and only adds
    /// the flag. The country also travels as its ISO 3166-1 alpha-2 code, because the client
    /// needs the code to pick the flag and to name a country that is set from script. It is a
    /// display only - a country the user chooses belongs in a
    /// <see cref="ControlFormItemInputCountry"/>.
    /// </summary>
    public class ControlCountry : Control, IControlTableTemplate
    {
        /// <summary>
        /// Gets or sets the ISO 3166-1 alpha-2 code of the country, in any letter case. An
        /// unknown code renders an empty display rather than a name without a flag.
        /// </summary>
        public Func<IRenderControlContext, string> Country { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the name is shown beside the flag. Hidden,
        /// the name is still announced to assistive technology and shown as a tooltip.
        /// </summary>
        public Func<IRenderControlContext, bool> ShowName { get; set; } = _ => true;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlCountry(string id = null)
            : base(id)
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
            var code = CountryCatalog.Normalize(Country?.Invoke(renderContext));
            var showName = ShowName?.Invoke(renderContext) ?? true;

            var html = new HtmlElementTextContentDiv(new HtmlText(CountryCatalog.GetName(renderContext, code) ?? ""))
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-country", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("data-value", code)
                .AddUserAttribute("data-show-name", showName ? null : "false");

            return html;
        }
    }
}
