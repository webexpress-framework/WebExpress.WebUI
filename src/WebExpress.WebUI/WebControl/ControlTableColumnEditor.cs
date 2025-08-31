using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table cell in a control, including its attributes and content.
    /// </summary>
    /// <remarks>This class provides properties to define the cell's identifier, CSS class, inline styles, 
    /// and the content displayed within the cell. It is typically used to represent and manipulate  individual cells in
    /// a table-like control.</remarks>
    public class ControlTableColumnEditor : ControlTableColumn, IControlTableColumnEditor
    {
        private readonly ControlForm _form;

        /// <summary>
        /// Event is raised when the form's data needs to be determined.
        /// </summary>
        public event Action<ControlFormEventFormInitialize> InitializeForm;

        /// <summary>
        /// Event to validate the input values.
        /// </summary>
        public event Action<ControlFormEventFormValidate> ValidateForm;

        /// <summary>
        /// Event is raised when the form is about to be processed.
        /// </summary>
        public event Action<ControlFormEventFormProcess> ProcessForm;

        /// <summary>
        /// Returns or sets the name of the item.
        /// </summary>
        public string Name { get => _form.Name; set => _form.Name = value; }

        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public virtual IUri Uri { get => _form.Uri; set => _form.Uri = value; }

        /// <summary>
        /// Returns or sets the request method.
        /// </summary>
        public virtual RequestMethod Method { get => _form.Method; set => _form.Method = value; }

        /// <summary>
        /// Returns the collection of smart edit items.
        /// </summary>
        public IEnumerable<IControlFormItemInput> Items => _form.Items
            .Where(x => x is IControlFormItemInput)
            .Select(x => x as IControlFormItemInput);

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned Id.
        /// </summary>
        /// <param name="instance">
        /// The name of the calling member. This is automatically provided by the compiler.
        /// </param>
        /// <param name="file">
        /// The file path of the source file where this instance is created. This is 
        /// automatically provided by the compiler.
        /// </param>
        /// <param name="line">
        /// The line number in the source file where this instance is created. This is 
        /// automatically provided by the compiler.
        /// </param>
        /// <param name="items">
        /// The form items to add to the form.
        /// </param>
        public ControlTableColumnEditor([CallerMemberName] string instance = null, [CallerFilePath] string file = null, [CallerLineNumber] int? line = null, params IControlFormItemInput[] items)
            : this($"columnedit_{instance}_{file}_{line}".GetHashCode().ToString("X"), items)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">The unique identifier for the table cell. Cannot be null or empty.</param>
        public ControlTableColumnEditor(string id, params IControlFormItemInput[] formInputs)
            : base(id)
        {
            _form = new ControlForm($"columnform_{id}".GetHashCode().ToString("X"));
            _form.Add(formInputs);

            _form.InitializeForm += OnInitialize;
            _form.ValidateForm += OnValidate;
            _form.ProcessForm += OnProcess;
        }

        /// <summary>
        /// Adds one or more smart edit items to the control.
        /// </summary>
        /// <param name="formInputs">The smart edit input fields to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableColumnEditor Add(params IControlFormItemInput[] formInputs)
        {
            _form.Add(formInputs);

            return this;
        }

        /// <summary>
        /// Adds one or more smart edit items to the control.
        /// </summary>
        /// <param name="formInputs">The smart edit input fields to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlTableColumnEditor Add(IEnumerable<IControlFormItemInput> formInputs)
        {
            _form.Add(formInputs);

            return this;
        }

        /// <summary>
        /// Initialize the form with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTableColumnEditor Initialize(Action<ControlFormEventFormInitialize> handler)
        {
            InitializeForm += handler;

            return this;
        }

        /// <summary>
        /// Checks the form for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validation the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTableColumnEditor Validate(Action<ControlFormEventFormValidate> handler)
        {
            ValidateForm += handler;

            return this;
        }

        /// <summary>
        /// Processes the form with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTableColumnEditor Process(Action<ControlFormEventFormProcess> handler)
        {
            ProcessForm += handler;

            return this;
        }

        /// <summary>
        /// Converts the cell to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var formRenderContext = new RenderControlFormContext(renderContext, _form);
            var name = _form.Name ?? _form.Id;
            var uri = _form.Uri?.ToString() ?? formRenderContext.Uri?.ToString();
            var form = _form.Render(formRenderContext, visualTree, _form.Items);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id
            }
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Title))
                .AddUserAttribute("data-icon", (Icon as Icon)?.Class)
                .AddUserAttribute("data-image", (Icon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color", Color.ToClass())
                .AddUserAttribute("data-render", RenderScript)
                .AddUserAttribute("data-editable", "true")
                .AddUserAttribute("data-object-name", name)
                .AddUserAttribute("data-form-action", uri)
                .AddUserAttribute("data-form-method", _form.Method.ToString())
                .Add(Items.Select(x => x.Render(formRenderContext, visualTree)));

            return html;
        }

        /// <summary>
        /// Raises the data delivery event.
        /// </summary>
        /// <param name="eventArgument">The context in which the control is rendered.</param>
        protected virtual void OnInitialize(ControlFormEventFormInitialize eventArgument)
        {
            InitializeForm?.Invoke(eventArgument);
        }

        /// <summary>
        /// Raises the validation event.
        /// </summary>
        /// <param name="eventArgument">The event argument.</param>
        protected virtual void OnValidate(ControlFormEventFormValidate eventArgument)
        {
            ValidateForm?.Invoke(eventArgument);
        }

        /// <summary>
        /// Raises the process event.
        /// </summary>
        /// <param name="eventArgument">The context in which the control is rendered.</param>
        protected virtual void OnProcess(ControlFormEventFormProcess eventArgument)
        {
            ProcessForm?.Invoke(eventArgument);
        }
    }
}
