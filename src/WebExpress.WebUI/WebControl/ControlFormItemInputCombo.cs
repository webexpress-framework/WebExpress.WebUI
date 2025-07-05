using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
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
    public class ControlFormItemInputCombo : ControlFormItemInput, IControlFormItemInputComboBox
    {
        private readonly List<ControlFormItemInputComboItem> _items = [];

        /// <summary>
        /// Returns the combobox items.
        /// </summary>
        public IEnumerable<ControlFormItemInputComboItem> Items => _items;

        ///// <summary>
        ///// Returns or sets the selected item.
        ///// </summary>
        //public string Selected { get; set; }

        /// <summary>
        /// Returns or sets a placeholder text.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Returns or sets the OnChange attribute.
        /// </summary>
        public PropertyOnChange OnChange { get; set; }

        ///// <summary>
        ///// Returns or sets the selected item.
        ///// </summary>
        //public string SelectedValue { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="items">The ComboBox entries.</param>
        public ControlFormItemInputCombo([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null, params ControlFormItemInputComboItem[] items)
            : this($"checkbox_{instance}_{file}_{line}".GetHashCode().ToString("X"), items)
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
            var value = renderContext.GetValue(this);
            var html = new HtmlElementFieldSelect()
            {
                Id = Id,
                Name = Name,
                Class = Css.Concatenate("form-select", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                Disabled = Disabled,
                OnChange = OnChange?.ToString()
            };

            if (!string.IsNullOrWhiteSpace(Placeholder))
            {
                html.Add(new HtmlElementFormOption()
                {
                    Text = I18N.Translate(renderContext.Request, Placeholder),
                    Disabled = true,
                    Selected = string.IsNullOrWhiteSpace(value)
                });
            }

            foreach (var v in Items)
            {
                if (v.SubItems.Any())
                {
                    html.Add(new HtmlElementFormOptgroup() { Label = v.Text });
                    foreach (var s in v.SubItems)
                    {
                        html.Add(new HtmlElementFormOption()
                        {
                            Value = s.Value,
                            Text = I18N.Translate(renderContext.Request?.Culture, s.Text),
                            Selected = (s.Value == value)
                        });
                    }
                }
                else
                {
                    html.Add(new HtmlElementFormOption()
                    {
                        Value = v.Value,
                        Text = I18N.Translate(renderContext.Request?.Culture, v.Text),
                        Selected = (v.Value == value)
                    });
                }
            }

            return html;
        }
    }
}
