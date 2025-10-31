using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tag input control.
    /// </summary>
    public class ControlFormItemInputTag : ControlFormItemInput<ControlFormInputValueStringList>
    {
        /// <summary>
        /// Returns or sets a placeholder text.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Returns or sets the color of the tags.
        /// </summary>
        public PropertyColorTag Color { get; set; } = new PropertyColorTag(TypeColorTag.Default);

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        public ControlFormItemInputTag([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null)
            : this($"tag_{instance}_{file}_{line}".GetHashCode().ToString("X"))
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputTag(string id)
            : base(id)
        {
            Margin = new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.Two, PropertySpacing.Space.None, PropertySpacing.Space.None);
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
            base.Initialize(renderContext);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var id = Id;
            var classes = new List<string>(Classes);
            var value = renderContext.GetValue<ControlFormInputValueStringList>(this)?.ToString
            (
                null,
                renderContext?.Request?.Culture
            );

            if (Disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-tag", classes),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = Role
            }
                .AddUserAttribute("name", Name)
                .AddUserAttribute("placeholder", I18N.Translate(renderContext.Request?.Culture, Placeholder))
                .AddUserAttribute("data-value", value)
                .AddUserAttribute("data-color-css", Color.ToClass())
                .AddUserAttribute("data-color-style", Color.ToStyle());

            return html;
        }

        /// <summary>
        /// Validates the input elements within a form for correctness of the data.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated, containing form data and state.</param>
        /// <returns>A collection of <see cref="ValidationResult"/> objects representing the validation 
        /// results for each input element. Each result indicates whether the input is valid or contains errors.
        /// </returns>
        public override IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            var validationResults = new List<ValidationResult>(base.Validate(renderContext));
            //var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text;

            if (Disabled)
            {
                return [];
            }

            return validationResults;
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
        protected override ControlFormInputValueStringList CreateValue(string value, IRenderControlFormContext renderContext)
        {
            // create a new instance using the semicolon separated string
            return new ControlFormInputValueStringList(value);
        }
    }
}
