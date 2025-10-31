using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a modal control that extends the base control functionality.
    /// </summary>
    public interface IControlModalFormFileUpload : IControlModal
    {
        /// <summary>
        /// Event is raised when the form is about to be processed.
        /// </summary>
        event Action<ControlFormEventFormUpload> UploadForm;
    }
}
