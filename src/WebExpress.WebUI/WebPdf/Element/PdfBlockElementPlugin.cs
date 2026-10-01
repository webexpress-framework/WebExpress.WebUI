using System;
using System.Collections.Generic;

namespace WebExpress.WebUI.WebPdf.Element
{
    /// <summary>
    /// Represents a block whose appearance is defined outside of the framework. It is the
    /// PDF counterpart of a markdown block plugin (<c>{{% name %}}…{{% /name %}}</c>): the
    /// model only keeps the name, the parameters and the content, and the
    /// <see cref="IPdfPlugin"/> registered under the name in <see cref="PdfPluginRegistry"/>
    /// decides when the document is written what it becomes. Without a registered plugin the
    /// block shows its content, so a document stays readable on a server that lacks the
    /// plugin.
    /// </summary>
    public class PdfBlockElementPlugin : PdfBlockElementContainer
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
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="name">The name the plugin is registered under.</param>
        /// <param name="parameters">The parameters.</param>
        /// <param name="content">The blocks the plugin encloses.</param>
        public PdfBlockElementPlugin(string name, IReadOnlyDictionary<string, string> parameters = null, IEnumerable<PdfBlockElement> content = null)
            : base(content)
        {
            Name = name;
            Parameters = new Dictionary<string, string>(parameters ?? new Dictionary<string, string>(), StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Adds one or more blocks.
        /// </summary>
        /// <param name="content">The blocks to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public PdfBlockElementPlugin Add(params PdfBlockElement[] content)
        {
            AddContent(content);

            return this;
        }
    }
}
