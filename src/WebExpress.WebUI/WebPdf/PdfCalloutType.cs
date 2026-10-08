namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Names the kind of a callout, which decides its colors. The names follow
    /// <see cref="WebMarkdown.MarkdownCalloutType"/>, so a markdown callout keeps its meaning.
    /// </summary>
    public enum PdfCalloutType
    {
        /// <summary>
        /// A neutral note.
        /// </summary>
        Hint,

        /// <summary>
        /// Something the reader should be careful about.
        /// </summary>
        Warning,

        /// <summary>
        /// Something that causes harm when ignored.
        /// </summary>
        Danger,

        /// <summary>
        /// A confirmation.
        /// </summary>
        Success
    }
}
