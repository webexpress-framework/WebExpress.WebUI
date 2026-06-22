using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebParameter;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A form input that lets the user select one or more files to upload.
    /// </summary>
    public class ControlFormItemInputFile : ControlFormItemInput<ControlFormInputValueFile>
    {
        private readonly List<string> _acceptFile = [];

        /// <summary>
        /// Gets or sets the description.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets a placeholder text.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the accepted files.
        /// </summary>
        public IEnumerable<string> AcceptFile => _acceptFile;

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputFile()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputFile(string id)
            : base(!string.IsNullOrWhiteSpace(id) ? id : "file")
        {
            Margin = _ => new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.Two, PropertySpacing.Space.None, PropertySpacing.Space.None);
        }

        /// <summary>
        /// Adds one or more accepted file types to the control.
        /// </summary>
        public void AddAcceptFile(params string[] controls)
        {
            _acceptFile.AddRange(controls);
        }

        /// <summary>
        /// Removes an accepted file type from the control.
        /// </summary>
        public void RemoveAcceptFile(string control)
        {
            _acceptFile.Remove(control);
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
            var role = Role?.Invoke(renderContext);
            var placeholder = Placeholder?.Invoke(renderContext);

            var html = new HtmlElementFieldInput()
            {
                Id = Id,
                Value = value,
                Name = name,
                Type = "file",
                Class = Css.Concatenate("form-control-file", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role,
                Placeholder = placeholder
            };

            html.AddUserAttribute("accept", string.Join(",", AcceptFile));

            return html;
        }

        /// <summary>
        /// Validates the input elements within a form for correctness of the data.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>A collection of validation results indicating any issues found.</returns>
        public override IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            var validationResults = new List<ValidationResult>();
            var value = renderContext.GetValue<ControlFormInputValueFile>(this)?.Name;
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var required = Required?.Invoke(renderContext) ?? false;

            if (disabled)
            {
                return [];
            }

            if (required && string.IsNullOrWhiteSpace(value))
            {
                validationResults.Add(new ValidationResult
                (
                    TypeInputValidity.Error,
                    "webexpress.webui:form.inputfile.validation.required"
                ));
            }

            validationResults.AddRange(base.Validate(renderContext));

            return validationResults;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be parsed and stored.
        /// </param>
        /// <param name="renderContext">
        /// The context in which the control is rendered.
        /// </param>
        /// <returns>
        /// A instance representing the parsed value, or an instance with a default 
        /// value if parsing fails.
        /// </returns>
        protected override ControlFormInputValueFile CreateValue(string value, IRenderControlFormContext renderContext)
        {
            var name = Name?.Invoke(renderContext);
            var file = renderContext?.Request?.GetParameter(name) as ParameterFile;

            return new ControlFormInputValueFile(value)
            {
                ContentType = ContentTypeExtensions.ToContentTypeFromMime(file?.ContentType),
                Data = file?.Data
            };
        }
    }
}
