using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Identifies a control that is to be filled in by the user.
    /// </summary>
    /// <remarks>
    /// This class provides the base functionality for form input items.
    /// </remarks>
    public abstract class ControlFormItemInput : ControlFormItem, IControlFormItemInput, IControlFormLabel, IControlFormValidation
    {
        private readonly List<IControl> _prepend = [];
        private readonly List<IControl> _append = [];

        /// <summary>
        /// Event is raised when the form's data needs to be determined.
        /// </summary>
        public event Action<ControlFormEventItemInitialize> InitializeItem;

        /// <summary>
        /// Event to validate the input values.
        /// </summary>
        public event Action<ControlFormEventItemValidate> ValidateItem;

        /// <summary>
        /// Event is raised when the items's data needs to be determined.
        /// </summary>
        public event Action<ControlFormEventItemProcess> ProcessItem;

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the label.
        /// </summary>
        public string Label { get; set; }

        /// <summary>
        /// Returns or sets an optional help text.
        /// </summary>
        public string Help { get; set; }

        /// <summary>
        /// Returns or sets whether the input element is disabled.
        /// </summary>
        public bool Disabled { get; set; }

        /// <summary>
        /// Returns the elements that are displayed in front of the control.
        /// </summary>
        public IEnumerable<IControl> Prepend => _prepend;

        /// <summary>
        /// Returns the elements that are displayed after the control.
        /// </summary>
        public IEnumerable<IControl> Append => _append;


        /// <summary>
        /// Returns or sets an object that is linked to the control.
        /// </summary>
        public object Tag { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInput(string id)
            : base(id)
        {
            Name = id;
        }

        /// <summary>
        /// Initializes the form emement.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
            var eventArgument = new ControlFormEventItemInitialize() { Context = renderContext };

            OnInitialize(eventArgument);

            renderContext.SetValue(this, eventArgument.Value);
        }

        /// <summary>
        /// Initialize the form item with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInput Initialize(Action<ControlFormEventItemInitialize> handler)
        {
            InitializeItem += handler;

            return this;
        }

        /// <summary>
        /// Validates the input elements within a form for correctness of the data.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated, containing form data and state.</param>
        /// <returns>A collection of <see cref="ValidationResult"/> objects representing the validation 
        /// results for each input element. Each result indicates whether the input is valid or contains errors.
        /// </returns>
        public virtual IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            var validationResults = new List<ValidationResult>();
            if (!Disabled)
            {
                var eventArgument = new ControlFormEventItemValidate()
                {
                    Context = renderContext,
                    Value = renderContext.GetValue(this),
                };
                OnValidate(eventArgument);

                validationResults.AddRange(eventArgument.Results);
            }

            return validationResults;
        }

        /// <summary>
        /// Checks the form item for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validation the form item.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInput Validate(Action<ControlFormEventItemValidate> handler)
        {
            ValidateItem += handler;

            return this;
        }

        /// <summary>
        /// Processes the form control using the specified rendering context.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public virtual void Process(IRenderControlFormContext renderContext)
        {
            var eventArgument = new ControlFormEventItemProcess()
            {
                Context = renderContext,
                Value = renderContext.GetValue(this)
            };

            OnProcess(eventArgument);
        }

        /// <summary>
        /// Processes the form with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInput Process(Action<ControlFormEventItemProcess> handler)
        {
            ProcessItem += handler;

            return this;
        }

        /// <summary>
        /// Adds one or more controls to the prepend list.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInput AddPrepend(params IControl[] controls)
        {
            _prepend.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the prepend list.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInput RemovePrepend(IControl control)
        {
            _prepend.Remove(control);

            return this;
        }

        /// <summary>
        /// Adds one or more controls to the append list.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInput AddAppend(params IControl[] controls)
        {
            _append.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the append list.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInput RemoveAppend(IControl control)
        {
            _append.Remove(control);

            return this;
        }

        /// <summary>
        /// Raises the data delivery event.
        /// </summary>
        /// <param name="eventArgument">The event argument.</param>
        protected virtual void OnInitialize(ControlFormEventItemInitialize eventArgument)
        {
            InitializeItem?.Invoke(eventArgument);
        }

        /// <summary>
        /// Raises the validation event.
        /// </summary>
        /// <param name="eventArgument">The event argument.</param>
        protected virtual void OnValidate(ControlFormEventItemValidate eventArgument)
        {
            ValidateItem?.Invoke(eventArgument);
        }

        /// <summary>
        /// Raises the process event.
        /// </summary>
        /// <param name="eventArgument">The event argument.</param>
        protected virtual void OnProcess(ControlFormEventItemProcess eventArgument)
        {
            ProcessItem?.Invoke(eventArgument);
        }
    }
}
