using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a contract for managing a collection of binding objects and applying 
    /// user-defined attributes to HTML nodes.
    /// </summary>
    public interface IBinding
    {
        /// <summary>
        /// Gets the collection of binds associated with this instance.
        /// </summary>
        IEnumerable<IBind> Binds { get; }

        /// <summary>
        /// Adds one or more binding objects to the current binding collection.
        /// </summary>
        /// <param name="binds">
        /// An array of binding objects to add to the collection. Each element 
        /// represents a binding to include.
        /// </param>
        /// <returns>
        /// The current binding instance with the added bindings.
        /// </returns>
        IBinding Add(params IBind[] binds);

        /// <summary>
        /// Adds one or more binding objects to the current binding collection.
        /// </summary>
        /// <param name="binds">
        /// An array of binding objects to add to the collection. Each element 
        /// represents a binding to include.
        /// </param>
        /// <returns>
        /// The current binding instance with the added bindings.
        /// </returns>
        IBinding Add(IEnumerable<IBind> binds);

        /// <summary>
        /// Removes the specified binding from the collection.
        /// </summary>
        /// <param name="bind">
        /// The binding to remove from the collection. 
        /// </param>
        /// <returns>
        /// The current instance of the Binding class, enabling method chaining.
        /// </returns>
        IBinding Remove(IBind bind);

        /// <summary>
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">
        /// The HTML node to which user attributes will be applied. Cannot be null.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        IBinding ApplyUserAttributes(IHtmlNode htmlNode);
    }
}
