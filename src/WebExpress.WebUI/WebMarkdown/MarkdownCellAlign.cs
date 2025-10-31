namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Defines text alignment options for Markdown table cells.
    /// Used to control the horizontal alignment of cell content.
    /// </summary>
    public enum MarkdownCellAlign
    {
        /// <summary>
        /// Aligns cell content to the left.
        /// Commonly used for text-heavy columns or default behavior.
        /// </summary>
        Left,

        /// <summary>
        /// Centers the cell content horizontally.
        /// Typically used for numeric values, icons, or balanced layouts.
        /// </summary>
        Center,

        /// <summary>
        /// Aligns cell content to the right.
        /// Often used for numeric data, totals, or timestamp columns.
        /// </summary>
        Right
    }
}