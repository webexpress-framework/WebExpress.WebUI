using System.Collections.Generic;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input control for file uploads.
    /// </summary>
    /// <remarks>
    /// This control allows users to select files to upload. It supports setting descriptions, placeholders, 
    /// required fields, and accepted file types. It also provides validation and rendering functionalities.
    /// </remarks>
    public class ControlFormItemInputFile : ControlFormItemInput<ControlFormInputValueFile>
    {
        private readonly List<string> _acceptFile = [];

        /// <summary>
        /// Returns or sets the description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Returns or sets a placeholder text.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Returns or sets whether inputs are enforced.
        /// </summary>
        public bool Required { get; set; }

        /// <summary>
        /// Returns or sets the accepted files.
        /// </summary>
        public IEnumerable<string> AcceptFile => _acceptFile;

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">The name of the calling member. This is automatically provided by the compiler.</param>
        /// <param name="file">The file path of the source file where this instance is created. This is automatically provided by the compiler.</param>
        /// <param name="line">The line number in the source file where this instance is created. This is automatically provided by the compiler.</param>
        public ControlFormItemInputFile([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null)
            : this($"file_{instance}_{file}_{line}".GetHashCode().ToString("X"))
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputFile(string id)
            : base(!string.IsNullOrWhiteSpace(id) ? id : "file")
        {
            Margin = new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.Two, PropertySpacing.Space.None, PropertySpacing.Space.None);
        }

        /// <summary>
        /// Adds one or more accepted file types to the control.
        /// </summary>
        /// <param name="controls">The file types to add.</param>
        public void AddAcceptFile(params string[] controls)
        {
            _acceptFile.AddRange(controls);
        }

        /// <summary>
        /// Removes an accepted file type from the control.
        /// </summary>
        /// <param name="control">The file type to remove.</param>
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

            var html = new HtmlElementFieldInput()
            {
                Id = Id,
                Value = value,
                Name = Name,
                Type = "file",
                Class = Css.Concatenate("form-control-file", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                Placeholder = Placeholder
            };

            html.AddUserAttribute("accept", string.Join(",", AcceptFile));

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
            var validationResults = new List<ValidationResult>();
            var value = renderContext.GetValue<ControlFormInputValueFile>(this)?.Name;

            if (Disabled)
            {
                return [];
            }

            if (Required && string.IsNullOrWhiteSpace(value))
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
        /// The string representation of the value to be converted. Cannot be null.
        /// </param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>
        /// The value created from the specified string representation.
        /// </returns>
        protected override ControlFormInputValueFile CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueFile(value);
        }
    }
}
