using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a action that can be performed within the application.
    /// </summary>
    public interface IAction
    {
        /// <summary>
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">
        /// The HTML node to which user attributes will be applied. Cannot be null.
        /// </param>
        /// <param name="typeAction">
        /// The type of action being applied, which may influence how attributes are applied.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        IAction ApplyUserAttributes(IHtmlNode htmlNode, TypeAction typeAction);

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
