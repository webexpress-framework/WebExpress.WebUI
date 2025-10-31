using System;
using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a SmartEdit control for quick and intuitive value editing directly within the view, 
    /// without opening a separate edit form. Ideal for context-sensitive modifications that preserve 
    /// the user's workflow.
    /// </summary>
    public interface IControlSmartEdit : IControl
    {
        /// <summary>
        /// Adds one or more smart edit items.
        /// </summary>
        /// <param name="formInputs">The smart edit input fields to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSmartEdit Add(params IControlFormItemInput[] formInputs);

        /// <summary>
        /// Adds a collection of smart edit items.
        /// </summary>
        /// <param name="formInputs">The smart edit input fields to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSmartEdit Add(IEnumerable<IControlFormItemInput> formInputs);

        /// <summary>
        /// Initialize the form with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSmartEdit Initialize(Action<ControlFormEventFormInitialize> handler);

        /// <summary>
        /// Checks the form for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validation the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSmartEdit Validate(Action<ControlFormEventFormValidate> handler);

        /// <summary>
        /// Processes the form with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSmartEdit Process(Action<ControlFormEventFormProcess> handler);
    }
}
