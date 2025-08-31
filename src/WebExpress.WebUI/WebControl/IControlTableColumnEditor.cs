using System;
using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines methods for configuring and managing edit functionality for a table column.
    /// </summary>
    public interface IControlTableColumnEditor : IControlTableColumn
    {
        /// <summary>
        /// Adds one or more edit items.
        /// </summary>
        /// <param name="formInputs">The edit input fields to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableColumnEditor Add(params IControlFormItemInput[] formInputs);

        /// <summary>
        /// Adds a collection of edit items.
        /// </summary>
        /// <param name="formInputs">The sma edit input fields to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableColumnEditor Add(IEnumerable<IControlFormItemInput> formInputs);

        /// <summary>
        /// Initialize the form with data using the specified action.
        /// </summary>
        /// <param name="handler">The action to execute for filling the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableColumnEditor Initialize(Action<ControlFormEventFormInitialize> handler);

        /// <summary>
        /// Checks the form for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validation the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableColumnEditor Validate(Action<ControlFormEventFormValidate> handler);

        /// <summary>
        /// Processes the form with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableColumnEditor Process(Action<ControlFormEventFormProcess> handler);
    }
}
