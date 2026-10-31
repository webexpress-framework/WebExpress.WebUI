namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents the marker of a task item. It is drawn, not a form field: the file shows
    /// the state the task had when it was written, the same way the reading view shows a
    /// disabled checkbox.
    /// </summary>
    public class PdfInlineElementCheckbox : PdfInlineElement
    {
        /// <summary>
        /// Returns a value indicating whether the task is done.
        /// </summary>
        public bool Checked { get; }

        /// <summary>
        /// Returns the style that decides the size and color of the box.
        /// </summary>
        public PdfTextStyle Style { get; }

        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public override string PlainText => Checked ? "[x]" : "[ ]";

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="isChecked">Whether the task is done.</param>
        /// <param name="style">The style, or null for plain body text.</param>
        public PdfInlineElementCheckbox(bool isChecked, PdfTextStyle style = null)
        {
            Checked = isChecked;
            Style = style ?? PdfTextStyle.Default;
        }
    }
}
