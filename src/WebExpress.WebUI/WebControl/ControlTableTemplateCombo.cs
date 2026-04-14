using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that renders a combo in a table using a template.
    /// </summary>
    public class ControlTableTemplateCombo : IControlTableTemplateEditable
    {
        private readonly List<IControlFormItemInputComboItem> _options = [];

        /// <summary>
        /// Returns the entries.
        /// </summary>
        public IEnumerable<IControlFormItemInputComboItem> Options => _options;

        /// <summary>
        /// Gets or sets the unique identifier for the object.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the current template is editable or read-only.
        /// </summary>
        public bool Editable { get; set; }

        /// <summary>
        /// Allows you to select multiple items.
        /// </summary>
        public bool MultiSelect { get; set; }

        /// <summary>
        /// Adds one or more items to the combo options.
        /// </summary>
        /// <param name="items">The items to add to the combo options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTableTemplateCombo Add(params IControlFormItemInputComboItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes an item from the combo options.
        /// </summary>
        /// <param name="item">The item to remove from the combo options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlTableTemplateCombo Remove(IControlFormItemInputComboItem item)
        {
            _options.Remove(item);

            return this;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableTemplateCombo(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElement("template")
            {
                Id = Id
            }
                .AddUserAttribute("data-type", "combo")
                .AddUserAttribute("data-multiselection", MultiSelect ? "true" : null)
                .AddUserAttribute("data-editable", Editable ? "true" : null);

            foreach (var v in _options)
            {
                if (v.SubItems.Any())
                {
                    html.Add(new HtmlElementFormOptgroup() { Label = v.Text });
                    foreach (var s in v.SubItems)
                    {
                        html.Add(new HtmlElementFormOption()
                        {
                            Value = s.Value,
                            Text = I18N.Translate(renderContext.Request?.Culture, s.Text)
                        });
                    }
                }
                else
                {
                    html.Add(new HtmlElementFormOption()
                    {
                        Value = v.Value,
                        Text = I18N.Translate(renderContext.Request?.Culture, v.Text)
                    });
                }
            }

            return html;
        }
    }
}
