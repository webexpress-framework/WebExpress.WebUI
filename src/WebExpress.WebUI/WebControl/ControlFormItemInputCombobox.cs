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
    public class ControlFormItemInputCombobox : ControlFormItemInput
    {
        private readonly List<ControlFormItemInputComboboxItem> _items = [];

        /// <summary>
        /// Returns the combobox items.
        /// </summary>
        public IEnumerable<ControlFormItemInputComboboxItem> Items => _items;

        ///// <summary>
        ///// Returns or sets the selected item.
        ///// </summary>
        //public string Selected { get; set; }

        /// <summary>
        /// Returns or sets the OnChange attribute.
        /// </summary>
        public PropertyOnChange OnChange { get; set; }

        ///// <summary>
        ///// Returns or sets the selected item.
        ///// </summary>
        //public string SelectedValue { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The ComboBox entries.</param>
        public ControlFormItemInputCombobox(string id = null, params ControlFormItemInputComboboxItem[] items)
            : base(id)
        {
            _items.AddRange(items);
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

            foreach (var v in Items)
            {
                if (v.SubItems.Any())
                {
                    html.Add(new HtmlElementFormOptgroup() { Label = v.Text });
                    foreach (var s in v.SubItems)
                    {
                        html.Add(new HtmlElementFormOption() { Value = s.Value, Text = I18N.Translate(renderContext.Request?.Culture, s.Text), Selected = (s.Value == value) });
                    }
                }
                else
                {
                    html.Add(new HtmlElementFormOption() { Value = v.Value, Text = I18N.Translate(renderContext.Request?.Culture, v.Text), Selected = (v.Value == value) });
                }
            }

            return html;
        }
    }
}
