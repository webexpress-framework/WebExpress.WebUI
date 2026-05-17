using WebExpress.WebCore.WebParameter;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an event that handles the upload of a file in a control form.
    /// </summary>
    /// <remarks>
    /// This class extends <see cref="ControlFormEvent"/> to provide functionality for 
    /// managing file uploads. Use the <see cref="File"/> property to specify or 
    /// retrieve the file associated with the event.
    /// </remarks>
    public class ControlFormEventFormUpload : ControlFormEvent
    {
        /// <summary>
        /// Gets or sets the file.
        /// </summary>
        public ParameterFile File { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormEventFormUpload()
        {
        }
    }
}
