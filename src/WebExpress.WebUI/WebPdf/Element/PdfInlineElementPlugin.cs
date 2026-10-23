using System;
using System.Collections.Generic;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents an inline element whose appearance is defined outside of the framework. It
    /// is the PDF counterpart of a markdown inline plugin (<c>{{name param="value"}}</c>): the
    /// <see cref="IPdfPlugin"/> registered under the name in <see cref="PdfPluginRegistry"/>
    /// turns it into text when the document is written. Without a registered plugin it is
    /// left out.
    /// </summary>
    public class PdfInlineElementPlugin : PdfInlineElement
    {
        /// <summary>
        /// Returns the name the plugin is registered under.
        /// </summary>
        public string Name { get; }

        /// <summary>
        /// Returns the parameters, as written by the author.
        /// </summary>
        public IReadOnlyDictionary<string, string> Parameters { get; }

        /// <summary>
        /// Returns the style of the surrounding text, so that what the plugin writes blends
        /// into the line it stands in - bold within bold text, linked within a link.
        /// </summary>
        public PdfTextStyle Style { get; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="name">The name the plugin is registered under.</param>
        /// <param name="parameters">The parameters.</param>
        /// <param name="style">The style of the surrounding text.</param>
        public PdfInlineElementPlugin(string name, IReadOnlyDictionary<string, string> parameters = null, PdfTextStyle style = null)
        {
            Name = name;
            Parameters = new Dictionary<string, string>(parameters ?? new Dictionary<string, string>(), StringComparer.OrdinalIgnoreCase);
            Style = style ?? PdfTextStyle.Default;
        }
    }
}
