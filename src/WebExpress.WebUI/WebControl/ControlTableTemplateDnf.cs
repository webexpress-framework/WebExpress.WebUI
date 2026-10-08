using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that renders a disjunctive normal form in a table using a template.
    /// </summary>
    /// <remarks>
    /// A cell is far narrower than the expression it may hold, so the read state
    /// renders compactly by default: one line that clips rather than a cell that
    /// grows the row, with the full expression kept in the title. The editable
    /// state hands the cell to the smart edit, which shows the same read view until
    /// the reader asks to change it.
    /// </remarks>
    public class ControlTableTemplateDnf : IControlTableTemplateEditable
    {
        private readonly List<IControlFormItemInputSelectionItem> _options = [];

        /// <summary>
        /// Returns the terms that can be picked into a conjunction.
        /// </summary>
        public IEnumerable<IControlFormItemInputSelectionItem> Options => _options;

        /// <summary>
        /// Gets or sets the unique identifier for the object.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the current template is editable or read-only.
        /// </summary>
        public Func<IRenderControlContext, bool> Editable { get; set; }

        /// <summary>
        /// Gets or sets the placeholder text displayed in a conjunction that holds no term yet.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the maximum number of conjunctions, or a value of zero or
        /// less for an unlimited number.
        /// </summary>
        public Func<IRenderControlContext, int> MaxGroups { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the read state clips the
        /// expression to a single line. Enabled unless told otherwise, because a
        /// wrapping expression makes the row heights of a table depend on the
        /// complexity of one cell.
        /// </summary>
        public Func<IRenderControlContext, bool> Compact { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableTemplateDnf(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Adds one or more terms to the selectable options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTableTemplateDnf Add(params IControlFormItemInputSelectionItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a term from the selectable options.
        /// </summary>
        /// <param name="item">The item to remove from the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTableTemplateDnf Remove(IControlFormItemInputSelectionItem item)
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
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var placeholder = Placeholder?.Invoke(renderContext);
            var editable = Editable?.Invoke(renderContext) ?? false;
            var maxGroups = MaxGroups?.Invoke(renderContext) ?? -1;
            var compact = Compact?.Invoke(renderContext) ?? true;

            var html = new HtmlElement("template")
            {
                Id = Id
            }
                .AddUserAttribute("data-type", "dnf")
                .AddUserAttribute("data-placeholder", I18N.Translate(renderContext, placeholder))
                .AddUserAttribute("data-editable", editable ? "true" : null)
                .AddUserAttribute("data-max-groups", maxGroups > 0 ? maxGroups.ToString() : null)
                .AddUserAttribute("data-compact", compact ? null : "false")
                .Add(_options.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }
    }
}
