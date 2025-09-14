using System;
using System.Collections.Generic;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUi.WebControl
{
    /// <summary>
    /// Represents a modal form control for file uploads, providing functionality for 
    /// file validation, processing, and submission.
    /// </summary>
    /// <remarks>This control allows users to upload files through a modal form 
    /// interface. It supports file validation, customizable submit button properties, and 
    /// event handling for file upload confirmation. The control can be configured with 
    /// prologue and epilogue areas, as well as a redirect URI  for post-submission
    /// navigation.
    /// </remarks>
    public class ControlModalFormFileUpload : ControlModalForm, IControlModalFormFileUpload
    {
        /// <summary>
        /// Returns or sets the files that are accepted.
        /// </summary>
        public IEnumerable<string> AcceptFile { get => File.AcceptFile; }

        /// <summary>
        /// Event is raised when the form is about to be processed.
        /// </summary>
        public event Action<ControlFormEventFormUpload> UploadForm;

        /// <summary>
        /// Returns or sets the file.
        /// </summary>
        private ControlFormItemInputFile File { get; } = new ControlFormItemInputFile()
        {
            Name = "file",
            Help = "webexpress.webapp:fileupload.file.description",
            Icon = new IconImage(),
            //AcceptFile = new string[] { "image/*, video/*, audio/*, .pdf, .doc, .docx, .txt" },
            Margin = new PropertySpacingMargin
            (
                PropertySpacing.Space.None,
                PropertySpacing.Space.None,
                PropertySpacing.Space.None,
                PropertySpacing.Space.Three
            )
        };

        /// <summary>
        /// Returns or sets the submit button icon.
        /// </summary>
        public IIcon SubmitButtonIcon
        {
            get { return SubmitButton?.Icon; }
            set { SubmitButton.Icon = value; }
        }

        /// <summary>
        /// Returns or sets the submit button color.
        /// </summary>
        public PropertyColorButton SubmitButtonColor
        {
            get { return SubmitButton?.Color; }
            set { SubmitButton.Color = value; }
        }

        /// <summary>
        /// Returns or sets the submit button label.
        /// </summary>
        public string SubmitButtonLabel
        {
            get { return SubmitButton?.Text; }
            set { SubmitButton.Text = value; }
        }

        /// <summary>
        /// Returns or sets the prologue area.
        /// </summary>
        public ControlFormItem Prologue { get; set; }

        /// <summary>
        /// Returns or sets the epilogue area.
        /// </summary>
        public ControlFormItem Epilogue { get; set; }

        /// <summary>
        /// Returns or sets the submit button.
        /// </summary>
        private ControlFormItemButtonSubmit SubmitButton { get; set; }
            = new ControlFormItemButtonSubmit();

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The control id.</param>
        public ControlModalFormFileUpload(string id)
            : this(id, null)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The control id.</param>
        /// <param name="content">The form controls.</param>
        public ControlModalFormFileUpload(string id, params ControlFormItem[] content)
            : base(id)
        {
            Add(Prologue);
            Add(File);
            Add(Epilogue);
            AddSecondaryButton(SubmitButton);

            Initialize(x =>
            {
                Header = I18N.Translate(x.Context, "webexpress.webapp:fileupload.header");
                SubmitButtonLabel = I18N.Translate(x.Context, "webexpress.webapp:fileupload.label");
            });


            SubmitButtonIcon = new IconUpload();
            SubmitButtonColor = new PropertyColorButton(TypeColorButton.Primary);

            //File.ValidateItem += OnValidation;
            ProcessForm += OnProcessForm;
        }

        /// <summary>
        /// Upload the form with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlModalFormFileUpload Upload(Action<ControlFormEventFormUpload> handler)
        {
            UploadForm += handler;

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
            //Form.RedirectUri = RedirectUri ?? context.Uri;

            //var list = new[] { Epilogue }
            //    .Concat(Form.Items)
            //    .Concat([Prologue]);

            //return base.Render(context, list.Where(x => x != null));

            return base.Render(renderContext, visualTree, Items);
        }

        /// <summary>
        /// Validation of the upload file.
        /// </summary>
        /// <param name="eventArgs">The event argument.</param>
        private void OnValidation(ControlFormEventItemValidate<ControlFormInputValueFile> eventArgs)
        {
            if (eventArgs.Context.Request.GetParameter(File.Name) is not ParameterFile)
            {
                //eventArgs.AddResults(new ValidationResult
                //(
                //    TypesInputValidity.Error,
                //    "webexpress.webapp:fileupload.file.validation.error.nofile"
                //));
            }
        }

        /// <summary>
        /// Processing of the form.
        /// </summary>
        /// <param name="sender">The trigger of the event.</param>
        /// <param name="e">The event argument.</param>
        private void OnProcessForm(ControlFormEventFormProcess eventArgs)
        {
            if (eventArgs.Context.Request.GetParameter(File.Name) is ParameterFile file)
            {
                OnUpload(new ControlFormEventFormUpload()
                {
                    File = file
                });
            }
        }

        /// <summary>
        /// Triggers the upload event
        /// </summary>
        /// <param name="eventArgs">The event argument.</param>
        protected virtual void OnUpload(ControlFormEventFormUpload eventArgs)
        {
            UploadForm?.Invoke(eventArgs);
        }
    }
}
