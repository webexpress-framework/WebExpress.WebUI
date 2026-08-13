using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a segmented choice: a small, fixed set of mutually exclusive options
    /// shown side by side as buttons rather than folded into a drop-down. It suits a
    /// field whose options are few and worth reading at a glance, such as a priority.
    /// </summary>
    public class ControlFormItemInputChoice : ControlFormItemInput<ControlFormInputValueString>, IControlFormItemInputChoice
    {
        private readonly List<ControlFormItemInputChoiceItem> _items = [];

        /// <summary>
        /// Returns the options of the control.
        /// </summary>
        public IEnumerable<ControlFormItemInputChoiceItem> Items => _items;

        /// <summary>
        /// Gets or sets the name of the input the visible options are filtered by. Only
        /// the options whose <see cref="ControlFormItemInputChoiceItem.FilterValue"/>
        /// equals the current value of that input remain visible; an option carrying no
        /// filter value always does. This lets one control offer the options of every
        /// context and narrow them to the context the user has chosen.
        /// </summary>
        public Func<IRenderControlContext, string> FilterSource { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormItemInputChoice()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputChoice(string id)
            : base(id)
        {
        }

        /// <summary>
        /// Adds one or more options to the control.
        /// </summary>
        /// <param name="items">The options to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputChoice Add(params ControlFormItemInputChoiceItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more options to the control.
        /// </summary>
        /// <param name="items">The options to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputChoice Add(IEnumerable<ControlFormItemInputChoiceItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified option from the control.
        /// </summary>
        /// <param name="item">The option to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputChoice Remove(ControlFormItemInputChoiceItem item)
        {
            _items.Remove(item);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text;
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var required = Required?.Invoke(renderContext) ?? false;
            var classes = new List<string>(Classes);

            if (disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-choice", classes),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("name", name)
                .AddUserAttribute("data-value", value)
                .AddUserAttribute("data-required", required ? "true" : null)
                .AddUserAttribute("data-disabled", disabled ? "true" : null)
                .AddUserAttribute("data-filter-source", FilterSource?.Invoke(renderContext));

            foreach (var item in _items)
            {
                var color = item.Color?.Invoke(renderContext);

                html.Add(new HtmlElementTextContentDiv(new HtmlText(I18N.Translate(renderContext, item.Text?.Invoke(renderContext))))
                {
                    Class = "wx-choice-option"
                }
                    .AddUserAttribute("data-value", item.Value?.Invoke(renderContext))
                    .AddUserAttribute("data-description", I18N.Translate(renderContext, item.Description?.Invoke(renderContext)))
                    .AddUserAttribute("data-color-css", color?.ToClass())
                    .AddUserAttribute("data-color-style", color?.ToStyle())
                    .AddUserAttribute("data-filter-value", item.FilterValue?.Invoke(renderContext)));
            }

            return html;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">The string representation of the value.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The value created from the specified string representation.</returns>
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(value);
        }
    }
}
