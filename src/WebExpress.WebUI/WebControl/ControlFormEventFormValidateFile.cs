namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument for validating form inputs.
    /// </summary>
    public class ControlFormEventFormValidateFile : ControlFormEventFormValidate
    {
        /// <summary>
        /// Returns the name of the file, including its extension.
        /// </summary>
        public string FileName { get; }

        /// <summary>
        /// Returns the content of the file as a byte array.
        /// </summary>
        public byte[] FileContent { get; }

        /// <summary>
        /// Returns the MIME type of the content associated with the current instance.
        /// </summary>
        public string ContentType { get; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="name">The name of the file. Cannot be null or empty.</param>
        /// <param name="content">The binary content of the file. Cannot be null.</param>
        /// <param name="contentType">The MIME type of the file content. Cannot be null or empty.</param>
        /// <param name="context">The rendering context associated with the control. Cannot be null.</param>
        public ControlFormEventFormValidateFile
        (
            string name,
            byte[] content,
            string contentType,
            IRenderControlFormContext context
        )
        {
            FileName = name;
            FileContent = content;
            ContentType = contentType;
            Context = context;
        }
    }
}
