using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input control for selection.
    /// </summary>
    /// <remarks>
    /// This control allows users to select one or more options from a predefined list.
    /// </remarks>
    public class ControlFormItemInputSelection : ControlFormItemInput, IControlFormItemInputSelection
    {
        private readonly List<ControlFormItemInputSelectionItem> _options = [];

        /// <summary>
        /// Returns the entries.
        /// </summary>
        public IEnumerable<ControlFormItemInputSelectionItem> Options => _options;

        /// <summary>
        /// Returns or sets the label of the selected options.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Allows you to select multiple items.
        /// </summary>
        public bool MultiSelect { get; set; }

        /// <summary>
        /// Returns or sets the OnChange attribute.
        /// </summary>
        public PropertyOnChange OnChange { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="items">The entries.</param>
        public ControlFormItemInputSelection([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null, params ControlFormItemInputSelectionItem[] items)
            : this($"selection_{instance}_{file}_{line}".GetHashCode().ToString("X"))
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The entries.</param>
        public ControlFormItemInputSelection(string id, params ControlFormItemInputSelectionItem[] items)
            : base(id)
        {
            _options.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputSelection Add(params ControlFormItemInputSelectionItem[] items)
        {
            _options.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes an item from the selection options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputSelection Remove(ControlFormItemInputSelectionItem item)
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
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext.GetValue(this);
            var classes = new List<string>(["wx-webui-selection"]);
            classes.AddRange(Classes);

            if (Disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv([.._options.Select(x => {
                var option = new HtmlElementTextContentDiv(x.Content?.Render(renderContext, visualTree))
                {
                    Id = x.Id,
                    Class = "wx-selection-item"
                };

                option.AddUserAttribute("data-label", I18N.Translate(x.Label));

                if (x.Icon is Icon icon)
                {
                    option.AddUserAttribute("data-icon", icon.Class);
                }

                if (x.Icon is ImageIcon image)
                {
                    option.AddUserAttribute("data-image", image.Uri?.ToString());
                }

                if (x.LabelColor != TypeColorSelection.Default)
                {
                    option.AddUserAttribute("data-label-color", x.LabelColor.ToClass());
                }

                if (x.Selected)
                {
                    option.AddUserAttribute("selected");
                }

                if (x.Disabled)
                {
                    option.AddUserAttribute("disabled");
                }

                return option;

            })])
            {
                Id = Id,
                Class = string.Join(" ", classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                Style = GetStyles()
            };

            if (!string.IsNullOrWhiteSpace(Name))
            {
                html.AddUserAttribute("name", Name);
            }

            if (!string.IsNullOrWhiteSpace(Placeholder))
            {
                html.AddUserAttribute("placeholder", I18N.Translate(Placeholder));
            }

            if (MultiSelect)
            {
                html.AddUserAttribute("data-multiselection", "true");
            }

            if (!string.IsNullOrWhiteSpace(value))
            {
                html.AddUserAttribute("data-value", value);
            }

            return html;
        }
    }
}

