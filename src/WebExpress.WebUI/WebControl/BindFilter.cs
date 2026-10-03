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
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">
        /// The HTML node to which user attributes will be applied. Cannot be null.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        public IBind ApplyUserAttributes(IHtmlNode htmlNode)
        {
            htmlNode?.AddUserAttribute("data-wx-bind", Name);

            return this;
        }

        /// <summary>
        /// Returns the binding as the client reads it from a JSON island - the same
        /// facts the attributes carry, keyed by the names the attributes use.
        /// </summary>
        /// <returns>The JSON representation of the binding.</returns>
        public virtual Dictionary<string, object> ToJson()
        {
            return new Dictionary<string, object>
            {
                ["bind"] = Name
            };
        }
    }
}
