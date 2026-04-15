using System;
using System.Collections.Generic;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a password input form item control with a show/hide toggle.
    /// </summary>
    public class ControlFormItemInputPassword : ControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Gets or sets a placeholder text.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the minimum length.
        /// </summary>
        public uint? MinLength { get; set; }

        /// <summary>
        /// Gets or sets the maximum length.
        /// </summary>
        public uint? MaxLength { get; set; }

        /// <summary>
        /// Gets or sets a search pattern that checks the content.
        /// </summary>
        public string Pattern { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormItemInputPassword()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputPassword(string id)
            : base(id)
        {
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
            var value = renderContext.GetValue<ControlFormInputValueString>(this);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-password", GetClasses()),
                Style = GetStyles(),
                Role = Role,
            }
                .AddUserAttribute("name", Name)
                .AddUserAttribute("data-value", value?.Text)
                .AddUserAttribute("data-placeholder", I18N.Translate(renderContext.Request?.Culture, Placeholder))
                .AddUserAttribute("data-disabled", Disabled ? "true" : null)
                .AddUserAttribute("data-minlength", MinLength?.ToString())
                .AddUserAttribute("data-maxlength", MaxLength?.ToString());

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
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text;

            if (Disabled)
            {
                return [];
            }

            if (Required && string.IsNullOrWhiteSpace(value))
            {
                validationResults.AddRange(new ValidationResult(TypeInputValidity.Error, "webexpress.webui:form.inputpassword.validation.required"));

                return validationResults;
            }

            if (!string.IsNullOrWhiteSpace(MinLength?.ToString()) && Convert.ToInt32(MinLength) > value?.Length)
            {
                validationResults.AddRange(new ValidationResult(TypeInputValidity.Error, string.Format(I18N.Translate(renderContext.Request?.Culture, "webexpress.webui:form.inputpassword.validation.min"), MinLength)));
            }

            if (!string.IsNullOrWhiteSpace(MaxLength?.ToString()) && Convert.ToInt32(MaxLength) < value?.Length)
            {
                validationResults.AddRange(new ValidationResult(TypeInputValidity.Error, string.Format(I18N.Translate(renderContext.Request?.Culture, "webexpress.webui:form.inputpassword.validation.max"), MaxLength)));
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
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(value);
        }
    }
}
