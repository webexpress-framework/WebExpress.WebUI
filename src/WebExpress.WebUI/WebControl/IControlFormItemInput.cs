using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an interface for form item input controls, providing methods and properties
    /// for initialization, validation, processing, and customization of form inputs.
    /// </summary>
    public interface IControlFormItemInput : IControlFormItem, IControlFormLabel, IControlFormValidation, IControlFormProcess
    {
        /// <summary>
        /// Event is raised when the form's data needs to be determined.
        /// </summary>
        event Action<ControlFormEventItemInitialize> InitializeItem;

        /// <summary>
        /// Event to validate the input values.
        /// </summary>
        event Action<ControlFormEventItemValidate> ValidateItem;

        /// <summary>
        /// Event is raised when the item's data needs to be processed.
        /// </summary>
        event Action<ControlFormEventItemProcess> ProcessItem;

        /// <summary>
        /// Gets or sets the icon associated with the input control.
        /// </summary>
        IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets an optional help text for the input control.
        /// </summary>
        string Help { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the input element is disabled.
        /// </summary>
        bool Disabled { get; set; }

        /// <summary>
        /// Gets the elements that are displayed in front of the control.
        /// </summary>
        IEnumerable<IControl> Prepend { get; }

        /// <summary>
        /// Gets the elements that are displayed after the control.
        /// </summary>
        IEnumerable<IControl> Append { get; }

        /// <summary>
        /// Gets or sets an object that is linked to the control.
        /// </summary>
        object Tag { get; set; }

        /// <summary>
        /// Initializes the form item with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput Initialize(Action<ControlFormEventItemInitialize> handler);

        /// <summary>
        /// Validates the form item for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validating the form item.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput Validate(Action<ControlFormEventItemValidate> handler);

        /// <summary>
        /// Processes the form item with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form item.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput Process(Action<ControlFormEventItemProcess> handler);

        /// <summary>
        /// Adds one or more controls to the prepend list.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput AddPrepend(params IControl[] controls);

        /// <summary>
        /// Removes a control from the prepend list.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput RemovePrepend(IControl control);

        /// <summary>
        /// Adds one or more controls to the append list.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput AddAppend(params IControl[] controls);

        /// <summary>
        /// Removes a control from the append list.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInput RemoveAppend(IControl control);
    }
}
