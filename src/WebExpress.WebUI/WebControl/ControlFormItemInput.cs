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
    /// <typeparam name="TValue">The type of the value to be assigned to the input control.</typeparam>
    public abstract class ControlFormItemInput<TValue> : ControlFormItem, IControlFormItemInput<TValue>
         where TValue : class, IControlFormInputValue, new()
    {
        private readonly List<IControl> _prepend = [];
        private readonly List<IControl> _append = [];

        /// <summary>
        /// Event is raised when the form's data needs to be determined.
        /// </summary>
        public event Action<ControlFormEventItemInitialize<TValue>> InitializeItem;

        /// <summary>
        /// Event to validate the input values.
        /// </summary>
        public event Action<ControlFormEventItemValidate<TValue>> ValidateItem;

        /// <summary>
        /// Event is raised when the items's data needs to be determined.
        /// </summary>
        public event Action<ControlFormEventItemProcess<TValue>> ProcessItem;

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
            var value = renderContext.Request.GetParameter(Name)?.Value;

            if (value == null)
            {
                var eventArgument = new ControlFormEventItemInitialize<TValue>()
                {
                    Context = renderContext
                };

                OnInitialize(eventArgument);

                renderContext.SetValue(this, eventArgument.Value);

                return;
            }

            renderContext.SetValue(this, CreateValue(value, renderContext));
        }

        /// <summary>
        /// Initialize the form item with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInput<TValue> Initialize(Action<ControlFormEventItemInitialize<TValue>> handler)
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
                var eventArgument = new ControlFormEventItemValidate<TValue>
                (
                    renderContext.GetValue<TValue>(this)
                )
                {
                    Context = renderContext
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
        public virtual IControlFormItemInput<TValue> Validate(Action<ControlFormEventItemValidate<TValue>> handler)
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
            var eventArgument = new ControlFormEventItemProcess<TValue>
            (
                renderContext.GetValue<TValue>(this)
            )
            {
                Context = renderContext
            };

            OnProcess(eventArgument);
        }

        /// <summary>
        /// Processes the form with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInput<TValue> Process(Action<ControlFormEventItemProcess<TValue>> handler)
        {
            ProcessItem += handler;

            return this;
        }

        /// <summary>
        /// Adds one or more controls to the prepend list.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInput<TValue> AddPrepend(params IControl[] controls)
        {
            _prepend.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the prepend list.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInput<TValue> RemovePrepend(IControl control)
        {
            _prepend.Remove(control);

            return this;
        }

        /// <summary>
        /// Adds one or more controls to the append list.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInput<TValue> AddAppend(params IControl[] controls)
        {
            _append.AddRange(controls);

            return this;
        }

        /// <summary>
        /// Removes a control from the append list.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemInput<TValue> RemoveAppend(IControl control)
        {
            _append.Remove(control);

            return this;
        }

        /// <summary>
        /// Raises the data delivery event.
        /// </summary>
        /// <param name="eventArgument">The event argument.</param>
        protected virtual void OnInitialize(ControlFormEventItemInitialize<TValue> eventArgument)
        {
            InitializeItem?.Invoke(eventArgument);
        }

        /// <summary>
        /// Raises the validation event.
        /// </summary>
        /// <param name="eventArgument">The event argument.</param>
        protected virtual void OnValidate(ControlFormEventItemValidate<TValue> eventArgument)
        {
            ValidateItem?.Invoke(eventArgument);
        }

        /// <summary>
        /// Raises the process event.
        /// </summary>
        /// <param name="eventArgument">The event argument.</param>
        protected virtual void OnProcess(ControlFormEventItemProcess<TValue> eventArgument)
        {
            ProcessItem?.Invoke(eventArgument);
        }

        /// <summary>
        /// Creates an instance of <typeparamref name="TValue"/> from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be converted into an instance of 
        /// <typeparamref name="TValue"/>. Cannot be null.
        /// </param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>
        /// An instance of <typeparamref name="TValue"/> created from the specified string representation.
        /// </returns>
        protected abstract TValue CreateValue(string value, IRenderControlFormContext renderContext);
    }
}
