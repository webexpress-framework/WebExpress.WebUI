using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a contract for objects that support data binding to a specified source.
    /// </summary>
    public interface IBind
    {
        /// <summary>
        /// Returns the binding name.
        /// </summary>
        string Name { get; }

        /// <summary>
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">
        /// The HTML node to which user attributes will be applied. Cannot be null.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        IBind ApplyUserAttributes(IHtmlNode htmlNode);

        /// <summary>
        /// Returns a string that represents the current object, formatted 
        /// according to the specified action type.
        /// </summary>
        /// <returns>
        /// A string representation of the current object, formatted based 
        /// on the provided action type.
        /// </returns>
        Dictionary<string, object> ToJson();
    }
}
