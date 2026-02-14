using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a contract for objects that support data binding to a specified source.
    /// </summary>
    public interface IBind
    {
        /// <summary>
        /// Returns the source of the data.
        /// </summary>
        string Source { get; }

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
        IBind ApplyUserAttributes(IHtmlNode htmlNode, string target = null);
    }
}
