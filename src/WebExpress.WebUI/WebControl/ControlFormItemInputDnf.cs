using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A form input that lets the user compose a filter as a disjunctive normal form.
    /// </summary>
    /// <remarks>
    /// The control is a stack of selection fields: what a user picks inside one
    /// field is combined with AND, and the fields are combined with OR, which is
    /// exactly the shape of a disjunctive normal form. The picker is not reinvented
    /// for it - every conjunction is an ordinary multi-select selection field, so
    /// filtering, icons, colors and the chip rendering behave as they do everywhere
    /// else, and a single conjunction serializes to the same semicolon list a plain
    /// selection produces.
    /// </remarks>
    public class ControlFormItemInputDnf : ControlFormItemInput<ControlFormInputValueDnf>, IControlFormItemInputDnf
    {
        public new Func<IRenderControlContext, string> Name { get; set; }

        private readonly List<IControlFormItemInputSelectionItem> _options = [];

        /// <summary>
        /// Returns the terms that can be picked into a conjunction.
        /// </summary>
        public IEnumerable<IControlFormItemInputSelectionItem> Options => _options;

        /// <summary>
        /// Gets or sets the placeholder shown in a conjunction that holds no term yet.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the maximum number of conjunctions. A value of zero or less
        /// leaves the number unlimited, which is the default: how many alternatives
        /// a filter needs is a property of the data, not of the control.
        /// </summary>
        public Func<IRenderControlContext, int> MaxGroups { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputDnf()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The selectable terms.</param>
        public ControlFormItemInputDnf(string id, params IControlFormItemInputSelectionItem[] items)
            : base(id)
        {
            Name = _ => id;
            _options.AddRange(items);
        }

        /// <summary>
        /// Adds one or more terms to the selectable options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputDnf Add(params IControlFormItemInputSelectionItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more terms to the selectable options.
        /// </summary>
        /// <param name="items">The items to add to the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputDnf Add(IEnumerable<IControlFormItemInputSelectionItem> items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a term from the selectable options.
        /// </summary>
        /// <param name="item">The item to remove from the options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputDnf Remove(IControlFormItemInputSelectionItem item)
        {
            _options.Remove(item);

            return this;
        }

        /// <summary>
        /// Determines whether a label element may point at the field. The client moves the id onto the
        /// hidden input that posts the value, which is no labelable element, so the caption is a span.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>True if a label element may point at the field.</returns>
        public override bool IsLabelable(IRenderControlFormContext renderContext)
        {
            return false;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext.GetValue<ControlFormInputValueDnf>(this)?.ToString();
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var maxGroups = MaxGroups?.Invoke(renderContext) ?? -1;
            var classes = new List<string>();
            classes.AddRange(Classes);

            if (disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-dnf", classes),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("name", name)
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, Placeholder?.Invoke(renderContext)))
                .AddUserAttribute("data-max-groups", maxGroups > 0 ? maxGroups.ToString() : null)
                .AddUserAttribute("data-value", string.IsNullOrEmpty(value) ? null : value)
                .Add(_options.Select(x => x.Render(renderContext, visualTree)));

            return html;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be converted. Cannot be null.
        /// </param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>
        /// The value created from the specified string representation.
        /// </returns>
        protected override ControlFormInputValueDnf CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueDnf(value);
        }
    }
}
