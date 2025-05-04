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
    public class ControlFormItemInputTextBox : ControlFormItemInput
    {
        /// <summary>
        /// Determines whether the control is automatically initialized.
        /// </summary>
        public bool AutoInitialize { get; set; } = true;

        /// <summary>
        /// Determines whether it is a multi-line text box.
        /// </summary>
        public TypesEditTextFormat Format { get; set; }

        /// <summary>
        /// Returns or sets the description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Returns or sets a placeholder text.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Returns or sets the minimum length.
        /// </summary>
        public uint? MinLength { get; set; }

        /// <summary>
        /// Returns or sets the maximum length.
        /// </summary>
        public uint? MaxLength { get; set; }

        /// <summary>
        /// Returns or sets whether inputs are enforced.
        /// </summary>
        public bool Required { get; set; }

        /// <summary>
        /// Returns or sets a search pattern that checks the content.
        /// </summary>
        public string Pattern { get; set; }

        /// <summary>
        /// Returns or sets the height of the text field (for Multiline and WYSIWYG).
        /// </summary>
        public uint? Rows { get; set; } = 8;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputTextBox(string id = null)
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

            if (Format == TypesEditTextFormat.Wysiwyg)
            {
                var contextPath = renderContext?.PageContext?.ApplicationContext?.Route;
                //renderContext.AddCssLinks(UriResource.Combine(contextPath, "/assets/css/summernote-bs5.min.css"));
                //renderContext.AddHeaderScriptLinks(UriResource.Combine(contextPath, "/assets/js/summernote-bs5.min.js"));
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
            var id = Id ?? Guid.NewGuid().ToString();
            var value = renderContext.GetValue(this);
            var classes = new List<string>(Classes)
            {
                "form-control"
            };

            if (Disabled)
            {
                classes.Add("disabled");
            }

            if (AutoInitialize && Format == TypesEditTextFormat.Wysiwyg && !string.IsNullOrWhiteSpace(Id))
            {
                var initializeCode = $"$(document).ready(function() {{ $('#{id}').summernote({{ tabsize: 2, height: '{Rows}rem', lang: 'de-DE' }}); }});";

                visualTree.AddScript(id, initializeCode);

                AutoInitialize = false;
            }

            return Format switch
            {
                TypesEditTextFormat.Multiline => new HtmlElementFormTextarea()
                {
                    Id = Id,
                    Value = value,
                    Name = Name,
                    Class = string.Join(" ", classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Role = Role,
                    Placeholder = I18N.Translate(renderContext.Request?.Culture, Placeholder),
                    Rows = Rows.ToString()
                },
                TypesEditTextFormat.Wysiwyg => new HtmlElementFormTextarea()
                {
                    Id = id,
                    Value = value,
                    Name = Name,
                    Class = string.Join(" ", classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Role = Role,
                    Placeholder = I18N.Translate(renderContext.Request?.Culture, Placeholder),
                    Rows = Rows.ToString()
                },
                _ => new HtmlElementFieldInput()
                {
                    Id = Id,
                    Value = value,
                    Name = Name,
                    MinLength = MinLength?.ToString(),
                    MaxLength = MaxLength?.ToString(),
                    Required = Required,
                    Pattern = Pattern,
                    Type = "text",
                    Disabled = Disabled,
                    Class = string.Join(" ", classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                    Role = Role,
                    Placeholder = I18N.Translate(renderContext.Request?.Culture, Placeholder)
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
            var value = renderContext.GetValue(this);

            if (Disabled)
            {
                return [];
            }

            if (Required && string.IsNullOrWhiteSpace(value))
            {
                validationResults.AddRange(new ValidationResult(TypesInputValidity.Error, "webexpress.webui:form.inputtextbox.validation.required"));

                return validationResults;
            }

            if (!string.IsNullOrWhiteSpace(MinLength?.ToString()) && Convert.ToInt32(MinLength) > value?.Length)
            {
                validationResults.AddRange(new ValidationResult(TypesInputValidity.Error, string.Format(I18N.Translate(renderContext.Request?.Culture, "webexpress.webui:form.inputtextbox.validation.min"), MinLength)));
            }

            if (!string.IsNullOrWhiteSpace(MaxLength?.ToString()) && Convert.ToInt32(MaxLength) < value?.Length)
            {
                validationResults.AddRange(new ValidationResult(TypesInputValidity.Error, string.Format(I18N.Translate(renderContext.Request?.Culture, "webexpress.webui:form.inputtextbox.validation.max"), MaxLength)));
            }

            return validationResults;
        }
    }
}
