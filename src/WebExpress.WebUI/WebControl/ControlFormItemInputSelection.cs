using System.Collections.Generic;
using System.Linq;
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
        /// Returns or sets the value.
        /// </summary>
        public virtual IEnumerable<string> Values => base.Value != null
            ? base.Value.Split(';', System.StringSplitOptions.RemoveEmptyEntries)
            : [];

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The entries.</param>
        public ControlFormItemInputSelection(string id = null, params ControlFormItemInputSelectionItem[] items)
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
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
            if (renderContext.Request.HasParameter(Name))
            {
                Value = renderContext?.Request.GetParameter(Name)?.Value;
            }
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var classes = new List<string>(["wx-webui-selection"]);
            classes.AddRange(Classes);

            if (Disabled)
            {
                classes.Add("disabled");
            }

            switch (ValidationResult)
            {
                case TypesInputValidity.Warning:
                    classes.Add("input-warning");
                    break;
                case TypesInputValidity.Error:
                    classes.Add("input-error");
                    break;
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

            if (!string.IsNullOrWhiteSpace(Value))
            {
                html.AddUserAttribute("data-value", Value);
            }

            return html;
        }

        /// <summary>
        /// Checks the input element for correctness of the data.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated.</param>
        public override void Validate(IRenderControlFormContext renderContext)
        {
            base.Validate(renderContext);
        }
    }
}

