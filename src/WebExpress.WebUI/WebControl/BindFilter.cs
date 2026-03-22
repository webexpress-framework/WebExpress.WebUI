using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a binding filter that applies user-defined attributes to HTML nodes 
    /// for data binding purposes.
    /// </summary>
    public class BindFilter : IBind
    {
        /// <summary>
        /// Returns the binding name.
        /// </summary>
        public string Name => "filter";

        /// <summary>
        /// Returns or sets the source of the data.
        /// </summary>
        public string Source { get; set; }

        /// <summary>
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">
        /// The HTML node to which user attributes will be applied. Cannot be null.
        /// </param>
        /// <param name="target">
        /// The identifier specifying the target to apply
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        public IBind ApplyUserAttributes(IHtmlNode htmlNode, string target = null)
        {
            htmlNode?.AddUserAttribute("data-wx-bind", Name);

            return this;
        }

        /// <summary>
        /// Returns a string that represents the value of the property.
        /// </summary>
        /// <returns>A string that contains the value of the property.</returns>
        public virtual Dictionary<string, object> ToJson()
        {
            // todo

            return null;
        }
    }
}
