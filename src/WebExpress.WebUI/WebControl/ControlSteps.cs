using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Shows the progress through a sequence of steps as a numbered, connected
    /// indicator. It pairs naturally with a multi-page form or wizard.
    /// </summary>
    public class ControlSteps : Control
    {
        private readonly List<ControlStepsItem> _items = [];

        /// <summary>
        /// Gets the steps of the indicator.
        /// </summary>
        public IEnumerable<ControlStepsItem> Items => _items;

        /// <summary>
        /// Gets or sets a value indicating whether the steps are stacked vertically.
        /// </summary>
        public Func<IRenderControlContext, bool> Vertical { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets a value indicating whether the steps are laid out in a single row
        /// with the marker beside its label instead of above it, the connectors stretching
        /// between the steps. This is the shape a dialog header needs. Ignored when
        /// <see cref="Vertical"/> is set.
        /// </summary>
        public Func<IRenderControlContext, bool> Inline { get; set; } = _ => false;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The steps of the indicator.</param>
        public ControlSteps(string id = null, params ControlStepsItem[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more steps to the indicator.
        /// </summary>
        /// <param name="items">The steps to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlSteps Add(params ControlStepsItem[] items)
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
            var vertical = Vertical?.Invoke(renderContext) ?? false;
            var inline = !vertical && (Inline?.Invoke(renderContext) ?? false);

            return new HtmlElementTextContentDiv([.. Items.Select((x, i) => x.Render(renderContext, visualTree, i + 1))])
            {
                Id = Id,
                Class = Css.Concatenate("wx-steps", vertical ? "wx-steps-vertical" : "", inline ? "wx-steps-inline" : "", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            };
        }
    }
}
