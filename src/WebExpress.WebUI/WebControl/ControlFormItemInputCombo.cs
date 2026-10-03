using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a combobox input control within a form.
    /// </summary>
    /// <remarks>
    /// This control allows users to select an item from a dropdown list.
    /// </remarks>
    public class ControlFormItemInputCombo : ControlFormItemInput<ControlFormInputValueString>, IControlFormItemInputComboBox
    {
        private readonly List<ControlFormItemInputComboItem> _items = [];

        /// <summary>
        /// Returns the combobox items.
        /// </summary>
        public IEnumerable<ControlFormItemInputComboItem> Items => _items;

        /// <summary>
        /// Gets or sets a placeholder text.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputCombo()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The ComboBox entries.</param>
        public ControlFormItemInputCombo(string id, params ControlFormItemInputComboItem[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInputComboBox Add(params ControlFormItemInputComboItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes an item from the options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInputComboBox Remove(ControlFormItemInputComboItem item)
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
            var placeholder = Placeholder?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);

            var html = new HtmlElementFieldSelect()
            {
                Id = Id,
                Name = name,
                Class = Css.Concatenate("form-select", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role,
                Disabled = disabled
            };

            if (!string.IsNullOrWhiteSpace(placeholder))
            {
                html.Add(new HtmlElementFormOption()
                {
                    Text = I18N.Translate(renderContext.Request, placeholder),
                    Disabled = true,
                    Selected = string.IsNullOrWhiteSpace(value)
                });
            }

            foreach (var v in Items)
            {
                var itemText = v.Text?.Invoke(renderContext);

                if (v.SubItems.Any())
                {
                    html.Add(new HtmlElementFormOptgroup() { Label = itemText });
                    foreach (var s in v.SubItems)
                    {
                        var subValue = s.Value?.Invoke(renderContext);

                        html.Add(new HtmlElementFormOption()
                        {
                            Value = subValue,
                            Text = I18N.Translate(renderContext.Request?.Culture, s.Text?.Invoke(renderContext)),
                            Selected = (subValue == value)
                        });
                    }
                }
                else
                {
                    var itemValue = v.Value?.Invoke(renderContext);

                    html.Add(new HtmlElementFormOption()
                    {
                        Value = itemValue,
                        Text = I18N.Translate(renderContext.Request?.Culture, itemText),
                        Selected = (itemValue == value)
                    });
                }
            }

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
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(value);
        }
    }
}
