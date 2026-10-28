using System;
using System.Collections.Generic;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that renders a country in a table using a template: its flag and
    /// name read-only, and a searchable country picker in edit mode. A cell holds the ISO 3166-1
    /// alpha-2 code, several separated by a semicolon. An editable template carries the countries
    /// named in the language of the request, so the picker offers the same list as a
    /// <see cref="ControlFormItemInputCountry"/>; a read-only cell is named by the browser in the
    /// language of the page.
    /// </summary>
    public class ControlTableTemplateCountry : IControlTableTemplateEditable
    {
        /// <summary>
        /// Gets or sets the unique identifier for the object.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the current template is editable or read-only.
        /// </summary>
        public Func<IRenderControlContext, bool> Editable { get; set; }

        /// <summary>
        /// Gets or sets the codes of the countries offered when a cell is edited. Left unset,
        /// every country of the <see cref="CountryCatalog"/> is offered.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<string>> Countries { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether a cell can hold several countries.
        /// </summary>
        public Func<IRenderControlContext, bool> MultiSelect { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the name is shown beside the flag. Hidden,
        /// the name is still announced to assistive technology and shown as a tooltip, which
        /// keeps a narrow column readable.
        /// </summary>
        public Func<IRenderControlContext, bool> ShowName { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets the placeholder text displayed while an edited cell holds no country.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableTemplateCountry(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var editable = Editable?.Invoke(renderContext) == true;

            var html = new HtmlElement("template")
            {
                Id = Id
            }
                .AddUserAttribute("data-type", "country")
                .AddUserAttribute("data-multiselection", MultiSelect?.Invoke(renderContext) == true ? "true" : null)
                .AddUserAttribute("data-show-name", ShowName?.Invoke(renderContext) == false ? "false" : null)
                .AddUserAttribute("data-placeholder", I18N.Translate(renderContext, Placeholder?.Invoke(renderContext)))
                .AddUserAttribute("data-editable", editable ? "true" : null);

            // only the picker needs the list; a read-only column would carry every country in
            // its markup, so its cells leave the naming to the browser
            if (editable)
            {
                html.Add(CountryCatalog.RenderOptions(renderContext, CountryCatalog.Restrict(Countries?.Invoke(renderContext))));
            }

            return html;
        }
    }
}
