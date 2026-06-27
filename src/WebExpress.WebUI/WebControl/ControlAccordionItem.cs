using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a single collapsible section of a <see cref="ControlAccordion"/>:
    /// a header button that toggles the body via the Bootstrap collapse data API.
    /// </summary>
    public class ControlAccordionItem : Control
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Gets the content shown in the body of the section.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Gets or sets the header text of the section.
        /// </summary>
        public Func<IRenderControlContext, string> Header { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the section is expanded.
        /// </summary>
        public Func<IRenderControlContext, bool> Expanded { get; set; } = _ => false;

        /// <summary>
        /// Initializes a new instance of the class. A stable id is generated when
        /// none is supplied, because the collapse needs an id to be toggled.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The content shown in the body of the section.</param>
        public ControlAccordionItem(string id = null, params IControl[] content)
            : base(id ?? RandomId.Create())
        {
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more controls to the body of the section.
        /// </summary>
        /// <param name="content">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlAccordionItem Add(params IControl[] content)
        {
            _content.AddRange(content);

            return this;
        }

        /// <summary>
        /// Converts the control to a standalone HTML representation (not linked to
        /// a parent accordion, so it collapses independently).
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return Render(renderContext, visualTree, null);
        }

        /// <summary>
        /// Converts the control to an HTML representation, optionally linked to a
        /// parent accordion so that opening this section closes its siblings.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="parentId">The id of the parent accordion, or null for independent collapsing.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, string parentId)
        {
            var header = Header?.Invoke(renderContext);
            var expanded = Expanded?.Invoke(renderContext) ?? false;

            var button = new HtmlElementFieldButton(new HtmlText(header))
            {
                Type = "button",
                Class = Css.Concatenate("accordion-button", expanded ? "" : "collapsed")
            }
                .AddUserAttribute("data-bs-toggle", "collapse")
                .AddUserAttribute("data-bs-target", "#" + Id)
                .AddUserAttribute("aria-expanded", expanded ? "true" : "false")
                .AddUserAttribute("aria-controls", Id);

            var headerDiv = new HtmlElementTextContentDiv(button)
            {
                Class = "accordion-header"
            };

            var bodyDiv = new HtmlElementTextContentDiv([.. Content.Select(x => x.Render(renderContext, visualTree))])
            {
                Class = "accordion-body"
            };

            var collapseDiv = new HtmlElementTextContentDiv(bodyDiv)
            {
                Id = Id,
                Class = Css.Concatenate("accordion-collapse collapse", expanded ? "show" : "")
            };

            if (!string.IsNullOrWhiteSpace(parentId))
            {
                collapseDiv.AddUserAttribute("data-bs-parent", "#" + parentId);
            }

            return new HtmlElementTextContentDiv(headerDiv, collapseDiv)
            {
                Class = Css.Concatenate("accordion-item", GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            };
        }
    }
}
