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
    }
}
