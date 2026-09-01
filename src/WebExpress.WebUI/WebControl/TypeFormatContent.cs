namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Specifies what a <see cref="ControlContent"/> shows of the value it was given. Both
    /// start from the same stored value - the working surface of the editor - and differ only
    /// in what the reader gets to see.
    /// </summary>
    public enum TypeFormatContent
    {
        /// <summary>
        /// The document itself, with the scaffolding that makes the value editable removed.
        /// </summary>
        RichText,

        /// <summary>
        /// The Markdown source of that document, presented the way any other source is. For
        /// handing the value on in a portable form.
        /// </summary>
        Markdown
    }
}
