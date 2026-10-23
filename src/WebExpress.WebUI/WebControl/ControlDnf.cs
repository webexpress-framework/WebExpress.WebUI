using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a read only control for a disjunctive normal form expression.
    /// </summary>
    /// <remarks>
    /// The control shows the terms of a conjunction joined by the AND word and
    /// separates the conjunctions with the OR word, so both levels of the
    /// expression stay readable without the reader knowing the notation.
    ///
    /// It carries the same options the editable control does, because it is also
    /// the read view the smart edit turns into an editor: the term ids of the
    /// expression only become labels through those options.
    /// </remarks>
    public class ControlDnf : Control, IControlDnf
    {
        private readonly List<IControlFormItemInputSelectionItem> _options = [];

        /// <summary>
        /// Returns the terms the labels of the expression are resolved against.
        /// </summary>
        public IEnumerable<IControlFormItemInputSelectionItem> Options => _options;

        /// <summary>
        /// Gets or sets the expression to display.
        /// </summary>
        public Func<IRenderControlContext, ControlFormInputValueDnf> Value { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the expression is rendered in the
        /// space saving single line form. A clipped expression keeps its full text
        /// in the title, so nothing becomes unreachable by compacting it.
        /// </summary>
        public Func<IRenderControlContext, bool> Compact { get; set; }

        /// <summary>
        /// Gets or sets the text shown in place of an empty expression.
        /// </summary>
        public Func<IRenderControlContext, string> EmptyText { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlDnf(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Adds one or more terms to the options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlDnf Add(params IControlFormItemInputSelectionItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more terms to the options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlDnf Add(IEnumerable<IControlFormItemInputSelectionItem> items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a term from the options.
        /// </summary>
        /// <param name="item">The item to remove from the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlDnf Remove(IControlFormItemInputSelectionItem item)
        {
            _options.Remove(item);

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
            var value = Value?.Invoke(renderContext)?.ToString();
            var compact = Compact?.Invoke(renderContext) ?? false;
            var emptyText = I18N.Translate(renderContext, EmptyText?.Invoke(renderContext));

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-dnf", GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("data-compact", compact ? "true" : null)
                .AddUserAttribute("data-placeholder", emptyText)
                .AddUserAttribute("data-value", string.IsNullOrEmpty(value) ? null : value)
                .Add(_options.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
