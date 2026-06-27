using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Stacks a set of <see cref="ControlAccordionItem"/> sections into a single
    /// accordion. By default only one section is open at a time; the whole
    /// behavior is driven by the Bootstrap collapse data API.
    /// </summary>
    public class ControlAccordion : Control
    {
        private readonly List<ControlAccordionItem> _items = [];

        /// <summary>
        /// Gets the sections of the accordion.
        /// </summary>
        public IEnumerable<ControlAccordionItem> Items => _items;

        /// <summary>
        /// Gets or sets a value indicating whether the bordered "flush" style is used.
        /// </summary>
        public Func<IRenderControlContext, bool> Flush { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets a value indicating whether more than one section may be
        /// open at the same time. When <see langword="true"/> the sections are no
        /// longer linked to the accordion, so they collapse independently.
        /// </summary>
        public Func<IRenderControlContext, bool> AlwaysOpen { get; set; } = _ => false;

        /// <summary>
        /// Initializes a new instance of the class. A stable id is generated when
        /// none is supplied, because the sections link to it to collapse exclusively.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The sections of the accordion.</param>
        public ControlAccordion(string id = null, params ControlAccordionItem[] items)
            : base(id ?? RandomId.Create())
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more sections to the accordion.
        /// </summary>
        /// <param name="items">The sections to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlAccordion Add(params ControlAccordionItem[] items)
        {
            _items.AddRange(items);

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
            var flush = Flush?.Invoke(renderContext) ?? false;
            var alwaysOpen = AlwaysOpen?.Invoke(renderContext) ?? false;

            // when sections may stay open together the parent link is dropped
            var parentId = alwaysOpen ? null : Id;

            return new HtmlElementTextContentDiv([.. Items.Select(x => x.Render(renderContext, visualTree, parentId))])
            {
                Id = Id,
                Class = Css.Concatenate("accordion", flush ? "accordion-flush" : "", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            };
        }
    }
}
