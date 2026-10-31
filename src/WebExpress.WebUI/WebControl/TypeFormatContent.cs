namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies how the stored value of a <see cref="ControlContent"/> is written, and
    /// therefore what has to happen before it can be read.
    /// </summary>
    public enum TypeFormatContent
    {
        /// <summary>
        /// The value is the working surface the editor stores: markup interleaved with the
        /// scaffolding that makes it editable.
        /// </summary>
        RichText,

        /// <summary>
        /// The value is Markdown, as a plain text field or an external document delivers it.
        /// </summary>
        Markdown
    }
}
