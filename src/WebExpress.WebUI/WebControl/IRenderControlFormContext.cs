using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Interface for rendering control form context, extending the base control context interface.
    /// </summary>
    public interface IRenderControlFormContext : IRenderControlContext
    {
        /// <summary>
        /// Gets the form in which the control is rendered.
        /// </summary>
        IControlForm Form { get; }

        /// <summary>
        /// Gets the dictionary of input controls and their associated values.
        /// </summary>
        IReadOnlyDictionary<IControlFormItemInput, IControlFormInputValue> Values { get; }

        /// <summary>
        /// Retrieves the value associated with the specified input control.
        /// </summary>
        /// <param name="input">The input control whose value is to be retrieved.</param>
        /// <returns>
        /// The value associated with the input control, or the default value if not found.
        /// </returns>
        /// <typeparam name="TValue">The type of the value to be assigned to the input control.</typeparam>
        TValue GetValue<TValue>(IControlFormItemInput input)
            where TValue : class, IControlFormInputValue, new();

        /// <summary>
        /// Sets the value for the specified input control.
        /// </summary>
        /// <param name="input">The input control for which the value is to be set.</param>
        /// <param name="value">The value to set for the input control.</param>
        /// <returns>The current instance for method chaining.</returns>
        IRenderControlFormContext SetValue(IControlFormItemInput input, IControlFormInputValue value);
    }
}
