using System.Collections.Generic;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a highlighted box - a hint, a warning - drawn on a tinted background with
    /// an accent bar in the color of its type.
    /// </summary>
    public class PdfBlockElementCallout : PdfBlockElementContainer
    {
        /// <summary>
        /// Returns the kind of the callout.
        /// </summary>
        public PdfCalloutType CalloutType { get; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="calloutType">The kind of the callout.</param>
        /// <param name="content">The blocks.</param>
        public PdfBlockElementCallout(PdfCalloutType calloutType, IEnumerable<PdfBlockElement> content = null)
            : base(content)
        {
            CalloutType = calloutType;
        }

        /// <summary>
        /// Adds one or more blocks.
        /// </summary>
        /// <param name="content">The blocks to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementCallout Add(params PdfBlockElement[] content)
        {
            AddContent(content);

            return this;
        }
    }
}
