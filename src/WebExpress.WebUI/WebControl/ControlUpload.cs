using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that facilitates file uploads.
    /// </summary>
    public class ControlUpload : Control, IControlUpload
    {
        private readonly ControlForm _form;
        private readonly ControlFormItemInputFile _inputFile;

        /// <summary>
        /// Event to validate the input values.
        /// </summary>
        public event Action<ControlFormEventItemValidate<ControlFormInputValueFile>> ValidateItem;

        /// <summary>
        /// Event is raised when the form is about to be processed.
        /// </summary>
        public event Action<ControlFormEventItemProcess<ControlFormInputValueFile>> ProcessItem;

        /// <summary>
        /// Returns or sets the placeholder text displayed in the file upload area.
        /// </summary>
        public string Placeholder { get; set; }

        /// <summary>
        /// Returns or sets the URI associated with the form.
        /// </summary>
        public IUri Uri { get => _form.Uri; set => _form.Uri = value; }

        /// <summary>
        /// Returns or sets a value indicating whether multiple selections are allowed.
        /// </summary>
        public bool Multiple { get; set; } = true;

        /// <summary>
        /// Returns or sets the accept file types for the upload control.
        /// </summary> 
        public string Accept { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether automatic uploads are enabled.
        /// </summary>
        public bool AutoUpload { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether the dropzone is displayed in full-screen mode.
        /// </summary>
        public bool FullScreenDropzone { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlUpload()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlUpload(string id)
            : base(id)
        {
            _form = new ControlForm($"upload_{id}".GetHashCode().ToString("X"));
            _inputFile = new ControlFormItemInputFile("file");

            _inputFile.ValidateItem += OnValidate;
            _inputFile.ProcessItem += OnProcess;
            _form.Add(_inputFile);
        }

        /// <summary>
        /// Checks the form for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validation the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlUpload Validate(Action<ControlFormEventItemValidate<ControlFormInputValueFile>> handler)
        {
            ValidateItem += handler;

            return this;
        }

        /// <summary>
        /// Processes the form with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlUpload Process(Action<ControlFormEventItemProcess<ControlFormInputValueFile>> handler)
        {
            ProcessItem += handler;

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var formRenderContext = new RenderControlFormContext(renderContext, _form);
            var name = _form.Name ?? _form.Id;
            var uri = _form.Uri?.ToString() ?? formRenderContext.Uri?.ToString();
            _form.Render(formRenderContext, visualTree, _form.Items);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-upload", GetClasses()),
                Style = GetStyles()
            }
                .AddUserAttribute("data-uri", uri)
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, Placeholder))
                .AddUserAttribute("data-multiple", !Multiple ? "false" : null)
                .AddUserAttribute("data-accept", Accept)
                .AddUserAttribute("data-autoupload", AutoUpload ? "true" : null)
                .AddUserAttribute("data-fullscreen-dropzone", FullScreenDropzone ? "true" : null)
                .AddUserAttribute("name", name);

            return html;
        }

        /// <summary>
        /// Raises the validation event.
        /// </summary>
        /// <param name="eventArgument">The event argument.</param>
        protected virtual void OnValidate(ControlFormEventItemValidate<ControlFormInputValueFile> eventArgument)
        {
            ValidateItem?.Invoke(eventArgument);
        }

        /// <summary>
        /// Raises the process event.
        /// </summary>
        /// <param name="eventArgument">The context in which the control is rendered.</param>
        protected virtual void OnProcess(ControlFormEventItemProcess<ControlFormInputValueFile> eventArgument)
        {
            ProcessItem?.Invoke(eventArgument);
        }
    }
}
