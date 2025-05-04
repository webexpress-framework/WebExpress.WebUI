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
        /// Returns the form in which the control is rendered.
        /// </summary>
        IControlForm Form { get; }

        /// <summary>
        /// Returns the dictionary of input controls and their associated values.
        /// </summary>
        IReadOnlyDictionary<IControlFormItemInput, string> Values { get; }

        /// <summary>
        /// Retrieves the value associated with the specified input control.
        /// </summary>
        /// <param name="input">The input control whose value is to be retrieved.</param>
        /// <returns>The value associated with the input control, or the default value of <typeparamref name="T"/> if not found.</returns>
        string GetValue(IControlFormItemInput input);

        /// <summary>
        /// Sets the value for the specified input control.
        /// </summary>
        /// <param name="input">The input control for which the value is to be set.</param>
        /// <param name="value">The value to set for the input control.</param>
        /// <returns>The current instance for method chaining.</returns>
        IRenderControlFormContext SetValue(IControlFormItemInput input, string value);
    }
}
