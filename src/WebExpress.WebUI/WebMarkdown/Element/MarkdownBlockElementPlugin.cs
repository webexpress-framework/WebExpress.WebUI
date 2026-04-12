using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents a block plugin element in a Markdown document.
    /// Block plugins use the syntax: {{% plugin_name param1="val1" %}}content{{% /plugin_name %}}
    /// </summary>
    public class MarkdownBlockElementPlugin : MarkdownBlockElement
    {
        private readonly List<IMarkdownElement> _content = [];

        /// <summary>
        /// Returns the name of the plugin.
        /// </summary>
        public string Name { get; }

        /// <summary>
        /// Returns the parameters of the plugin as key-value pairs.
        /// </summary>
        public IReadOnlyDictionary<string, string> Parameters { get; }

        /// <summary>
        /// Returns the content elements contained within the plugin block.
        /// </summary>
        public IEnumerable<IMarkdownElement> Content => _content;

        /// <summary>
        /// Returns the plain text representation of this element and its children.
        /// </summary>
        public override string PlainText => string.Join(" ", _content.Select(e => e.PlainText.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s)));

        /// <summary>
        /// Initializes a new instance of the class with the specified name and parameters.
        /// </summary>
        /// <param name="name">The name of the plugin.</param>
        /// <param name="parameters">The parameters for the plugin.</param>
        public MarkdownBlockElementPlugin(string name, IDictionary<string, string> parameters)
        {
            Name = name;
            Parameters = new Dictionary<string, string>(parameters ?? new Dictionary<string, string>());
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified name, parameters, and content.
        /// </summary>
        /// <param name="name">The name of the plugin.</param>
        /// <param name="parameters">The parameters for the plugin.</param>
        /// <param name="content">The content elements within the plugin block.</param>
        public MarkdownBlockElementPlugin(string name, IDictionary<string, string> parameters, IEnumerable<IMarkdownElement> content)
            : this(name, parameters)
        {
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more elements to the plugin content.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementPlugin Add(params IMarkdownElement[] content)
        {
            _content.AddRange(content);

            return this;
        }

        /// <summary>
        /// Adds one or more elements to the plugin content.
        /// </summary>
        /// <param name="content">The elements to add.</param>
        /// <returns>The current instance.</returns>
        public MarkdownBlockElementPlugin Add(IEnumerable<IMarkdownElement> content)
        {
            _content.AddRange(content);

            return this;
        }
    }
}
