using System;
using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a heading. Besides being set larger and bold, a heading becomes an entry
    /// of the bookmarks of the file, so the reader can navigate a long document the way the
    /// outline of a page does in the browser. A heading is kept on the same page as the
    /// beginning of the text that follows it.
    /// </summary>
    public class PdfBlockElementHeading : PdfBlockElement
    {
        private readonly List<PdfInlineElement> _content = [];

        /// <summary>
        /// Returns the level, from 1 (the title) to 6.
        /// </summary>
        public int Level { get; }

        /// <summary>
        /// Returns the inline content.
        /// </summary>
        public IEnumerable<PdfInlineElement> Content => _content;

        /// <summary>
        /// Gets or sets the alignment, or null to take the one of the container.
        /// </summary>
        public PdfTextAlign? Align { get; set; }

        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public override string PlainText => string.Concat(_content.Select(x => x.PlainText));

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="level">The level, clamped to the range 1 to 6.</param>
        /// <param name="content">The inline content.</param>
        public PdfBlockElementHeading(int level, IEnumerable<PdfInlineElement> content)
        {
            Level = Math.Clamp(level, 1, 6);
            _content.AddRange(content ?? []);
        }

        /// <summary>
        /// Initializes a new instance of the class with a plain text.
        /// </summary>
        /// <param name="level">The level, clamped to the range 1 to 6.</param>
        /// <param name="text">The text.</param>
        public PdfBlockElementHeading(int level, string text)
            : this(level, [new PdfInlineElementText(text)])
        {
        }
    }
}
