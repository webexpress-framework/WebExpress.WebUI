using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a contract for initializing form elements with data and configuration.
    /// </summary>
    public interface IControlFormInitialize
    {
        /// <summary>
        /// Performs initialization logic for the form element.
        /// This may include setting default values, applying metadata, or configuring input behavior.
        /// </summary>
        /// <param name="renderContext">
        /// The rendering context that provides access to form data, input values, and state information.
        /// </param>
        void Initialize(IRenderControlFormContext renderContext);
    }
}
