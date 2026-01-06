using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a target for modal dialogs that can be identified and customized with 
    /// user-specific attributes.
    /// </summary>
    public interface IModalTarget
    {
        /// <summary>
        /// Returns the unique identifier for this modal.
        /// </summary>
        string Id { get; }

        /// <summary>
        /// Returns the size configuration for the modal dialog.
        /// </summary>
        TypeModalSize Size { get; }

        /// <summary>
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">
        /// The HTML node to which user attributes will be applied. Cannot be null.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        IModalTarget ApplyUserAttributes(IHtmlNode htmlNode);
    }
}
