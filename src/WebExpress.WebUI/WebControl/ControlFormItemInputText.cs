using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a text box input form item control.
    /// </summary>
    public class ControlFormItemInputText : ControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Determines whether it is a multi-line text box.
        /// </summary>
        public Func<IRenderControlContext, TypeEditTextFormat> Format { get; set; }

        /// <summary>
        /// Gets or sets the description.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets a placeholder text.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the minimum length.
        /// </summary>
        public Func<IRenderControlContext, uint?> MinLength { get; set; }

        /// <summary>
        /// Gets or sets the maximum length.
        /// </summary>
        public Func<IRenderControlContext, uint?> MaxLength { get; set; }

        /// <summary>
        /// Gets or sets a search pattern that checks the content.
        /// </summary>
        public Func<IRenderControlContext, string> Pattern { get; set; }

        /// <summary>
        /// Gets or sets the height of the text field (for Multiline and WYSIWYG).
        /// </summary>
        public Func<IRenderControlContext, uint?> Rows { get; set; } = _ => 8;

        /// <summary>
        /// Gets or sets whether the rich-text surface takes the height its dialog or page has
        /// left over instead of the fixed box a field among many fields gets.
        /// </summary>
        /// <remarks>
        /// This is for the form whose text <i>is</i> the work - an article, a page, a post -
        /// where everything that is not the writing area is overhead. It applies to
        /// <see cref="TypeEditTextFormat.Wysiwyg"/> only; the other formats size themselves
        /// from <see cref="Rows"/>.
        /// <para>
        /// The height is a viewport calculation rather than a share of the parent, because a
        /// form has no height to share: inside a modal the form element is laid out as
        /// <c>display: contents</c>, so a percentage resolves to auto the whole way down. How
        /// much stands above and below the surface is the caller's to know, so the amount is
        /// subtracted through the <c>--wx-editor-fill-offset</c> custom property, which
        /// defaults to the chrome of a full-screen dialog.
        /// </para>
        /// </remarks>
        public Func<IRenderControlContext, bool> Fill { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormItemInputText()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputText(string id)
            : base(id)
        {
            Margin = _ => new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.Two, PropertySpacing.Space.None, PropertySpacing.Space.None);
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
            var value = renderContext.GetValue<ControlFormInputValueString>(this);
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var required = Required?.Invoke(renderContext) ?? false;
            var format = Format?.Invoke(renderContext) ?? TypeEditTextFormat.Default;
            var placeholder = Placeholder?.Invoke(renderContext);
            var pattern = Pattern?.Invoke(renderContext);
            var rows = Rows?.Invoke(renderContext);
            var fill = Fill?.Invoke(renderContext) ?? false;
            var minLength = MinLength?.Invoke(renderContext);
            var maxLength = MaxLength?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);

            var classes = new List<string>(Classes)
            {
                "form-control"
            };

            if (disabled)
            {
                classes.Add("disabled");
            }

            return format switch
            {
                TypeEditTextFormat.Multiline => new HtmlElementFormTextarea()
                {
                    Id = Id,
                    Value = value?.Text,
                    Name = name,
                    Class = string.Join(" ", classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Role = role,
                    Placeholder = I18N.Translate(renderContext, placeholder),
                    Rows = rows?.ToString()
                },
                TypeEditTextFormat.Wysiwyg => new HtmlElementTextContentDiv(new HtmlText(value?.Text))
                {
                    Id = id,
                    Class = Css.Concatenate("wx-webui-editor", classes),
                    Style = GetStyles(renderContext),
                    Role = role,
                }
                    .AddUserAttribute("name", name)
                    .AddUserAttribute("data-fill", fill ? "true" : null),
                _ => new HtmlElementFieldInput()
                {
                    Id = Id,
                    Value = value?.Text,
                    Name = name,
                    MinLength = minLength?.ToString(),
                    MaxLength = maxLength?.ToString(),
                    Required = required,
                    Pattern = pattern,
                    Type = "text",
                    Disabled = disabled,
                    Class = string.Join(" ", classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Role = role,
                    Placeholder = I18N.Translate(renderContext.Request?.Culture, placeholder)
                },
            };
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
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var required = Required?.Invoke(renderContext) ?? false;
            var minLength = MinLength?.Invoke(renderContext);
            var maxLength = MaxLength?.Invoke(renderContext);

            if (disabled)
            {
                return [];
            }

            if (required && string.IsNullOrWhiteSpace(value))
            {
                validationResults.AddRange(new ValidationResult(TypeInputValidity.Error, "webexpress.webui:form.inputtextbox.validation.required"));

                return validationResults;
            }

            if (value is not null && minLength > value.Length)
            {
                validationResults.AddRange(new ValidationResult(TypeInputValidity.Error, string.Format(I18N.Translate(renderContext.Request?.Culture, "webexpress.webui:form.inputtextbox.validation.min"), minLength)));
            }

            if (value is not null && maxLength < value.Length)
            {
                validationResults.AddRange(new ValidationResult(TypeInputValidity.Error, string.Format(I18N.Translate(renderContext.Request?.Culture, "webexpress.webui:form.inputtextbox.validation.max"), maxLength)));
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
