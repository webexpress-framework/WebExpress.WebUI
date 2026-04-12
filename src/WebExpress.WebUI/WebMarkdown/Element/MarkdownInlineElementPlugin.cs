using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace WebExpress.WebUI.WebMarkdown.Element
{
    /// <summary>
    /// Represents an inline plugin element in a Markdown document.
    /// Inline plugins use the syntax: {{plugin_name param1="val1" param2="val2"}}
    /// </summary>
    public class MarkdownInlineElementPlugin : MarkdownInlineElement
    {
        /// <summary>
        /// Returns the name of the plugin.
        /// </summary>
        public string Name { get; }

        /// <summary>
        /// Returns the parameters of the plugin as key-value pairs.
        /// </summary>
        public IReadOnlyDictionary<string, string> Parameters { get; }

        /// <summary>
        /// Returns the plain text representation of this element.
        /// </summary>
        public override string PlainText
        {
            get
            {
                var sb = new StringBuilder();
                sb.Append("{{");
                sb.Append(Name);

                foreach (var param in Parameters)
                {
                    sb.Append($" {param.Key}=\"{param.Value}\"");
                }

                sb.Append("}}");

                return sb.ToString();
            }
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified name and parameters.
        /// </summary>
        /// <param name="name">The name of the plugin.</param>
        /// <param name="parameters">The parameters for the plugin.</param>
        public MarkdownInlineElementPlugin(string name, IDictionary<string, string> parameters)
        {
            Name = name;
            Parameters = new Dictionary<string, string>(parameters ?? new Dictionary<string, string>());
        }
    }
}
