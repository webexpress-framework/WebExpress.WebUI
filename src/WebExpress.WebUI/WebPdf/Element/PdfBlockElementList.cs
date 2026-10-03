using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a bulleted or numbered list. A nested list is a block inside an item, as in
    /// HTML; its depth decides the shape of the bullet.
    /// </summary>
    public class PdfBlockElementList : PdfBlockElement
    {
        private readonly List<PdfBlockElementListItem> _items = [];

        /// <summary>
        /// Gets or sets the marker of the items.
        /// </summary>
        public PdfListType Type { get; set; } = PdfListType.Bullet;

        /// <summary>
        /// Gets or sets the number of the first item of a numbered list.
        /// </summary>
        public int Start { get; set; } = 1;

        /// <summary>
        /// Returns the items.
        /// </summary>
        public IEnumerable<PdfBlockElementListItem> Items => _items;

        /// <summary>
        /// Returns the text of the element without any formatting.
        /// </summary>
        public override string PlainText => string.Join("\n", _items.Select(x => x.PlainText));

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="type">The marker of the items.</param>
        public PdfBlockElementList(PdfListType type = PdfListType.Bullet)
        {
            Type = type;
        }

        /// <summary>
        /// Adds one or more items.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementList Add(params PdfBlockElementListItem[] items)
        {
            _items.AddRange(items.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Adds one or more items.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementList Add(IEnumerable<PdfBlockElementListItem> items)
        {
            _items.AddRange(items.Where(x => x is not null));

            return this;
        }
    }
}
