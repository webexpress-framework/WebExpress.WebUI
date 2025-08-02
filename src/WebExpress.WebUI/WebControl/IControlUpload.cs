using System;
using WebExpress.WebCore.WebUri;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that supports upload functionality.
    /// </summary>
    public interface IControlUpload : IControl
    {
        /// <summary>
        /// Returns the URI associated with the form.
        /// </summary>
        IUri Uri { get; }

        // <summary>
        /// Returns a value indicating whether multiple selections are allowed.
        /// </summary>
        bool Multiple { get; }

        /// <summary>
        /// Returns or sets the accept file types for the upload control.
        /// </summary> 
        string Accept { get; }

        /// <summary>
        /// Returns a value indicating whether automatic uploads are enabled.
        /// </summary>
        bool AutoUpload { get; }

        /// <summary>
        /// Returns or sets a value indicating whether the dropzone is displayed in full-screen mode.
        /// </summary>
        bool FullScreenDropzone { get; }

        /// <summary>
        /// Checks the form for correctness of the data.
        /// </summary>
        /// <param name="handler">The action to execute for validation the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlUpload Validate(Action<ControlFormEventFormValidateFile> handler);

        /// <summary>
        /// Processes the form with the specified handler.
        /// </summary>
        /// <param name="handler">The action to execute for processing the form.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlUpload Process(Action<ControlFormEventFormProcessFile> handler);
    }
}
