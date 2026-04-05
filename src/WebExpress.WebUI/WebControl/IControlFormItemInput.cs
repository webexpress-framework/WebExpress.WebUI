using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an interface for form item input controls, providing methods and properties
    /// for initialization, validation, processing, and customization of form inputs.
    /// </summary>
    public interface IControlFormItemInput : IControlFormItem, IControlFormLabel, IControlFormInitialize, IControlFormValidation, IControlFormProcess
    {
        /// <summary>
        /// Returns the icon associated with the input control.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Returns an optional help text for the input control.
        /// </summary>
        string Help { get; }

        /// <summary>
        /// Returns a value indicating whether the input element is disabled.
        /// </summary>
        bool Disabled { get; }

        /// <summary>
        /// Returns or sets whether inputs are enforced.
        /// </summary>
        bool Required { get; }

        /// <summary>
        /// Returns the elements that are displayed in front of the control.
        /// </summary>
        IEnumerable<IControl> Prepend { get; }

        /// <summary>
        /// Returns the elements that are displayed after the control.
        /// </summary>
        IEnumerable<IControl> Append { get; }

        /// <summary>
        /// Returns an object that is linked to the control.
        /// </summary>
        object Tag { get; }
    }

    /// <summary>
    /// Represents an interface for form item input controls, providing methods and properties
    /// for initialization, validation, processing, and customization of form inputs.
    /// </summary>
    /// <typeparam name="TValue">The type of the value to be assigned to the input control.</typeparam>
    public interface IControlFormItemInput<TValue> : IControlFormItemInput
        where TValue : class, IControlFormInputValue, new()
    {
        /// <summary>
        /// Event is raised when the form's data needs to be determined.
        /// </summary>
        event Action<ControlFormEventItemInitialize<TValue>> InitializeItem;

        /// <summary>
        /// Event to validate the input values.
        /// </summary>
        event Action<ControlFormEventItemValidate<TValue>> ValidateItem;

        /// <summary>
        /// Event is raised when the item's data needs to be processed.
        /// </summary>
        event Action<ControlFormEventItemProcess<TValue>> ProcessItem;

        /// <summary>
        /// Initializes the form item with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput<TValue> Initialize(Action<ControlFormEventItemInitialize<TValue>> handler);

        /// <summary>
        /// Validates the form item for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validating the form item.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput<TValue> Validate(Action<ControlFormEventItemValidate<TValue>> handler);

        /// <summary>
        /// Processes the form item with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form item.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput<TValue> Process(Action<ControlFormEventItemProcess<TValue>> handler);

        /// <summary>
        /// Adds one or more controls to the prepend list.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput<TValue> AddPrepend(params IControl[] controls);

        /// <summary>
        /// Removes a control from the prepend list.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput<TValue> RemovePrepend(IControl control);

        /// <summary>
        /// Adds one or more controls to the append list.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput<TValue> AddAppend(params IControl[] controls);

        /// <summary>
        /// Removes a control from the append list.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput<TValue> RemoveAppend(IControl control);
    }
}
