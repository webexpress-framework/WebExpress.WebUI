using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a target element for modal dialogs, providing identification and 
    /// user attribute application
    /// functionality.
    public class ModalTarget : IModalTarget
    {
        /// <summary>
        /// Returns the unique identifier for this modal.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Returns the size configuration for the modal dialog.
        /// </summary>
        public TypeModalSize Size { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">
        /// The unique identifier for the modal target. Cannot be null.
        /// </param>
        /// <param name="size">The size configuration for the modal dialog.</param>
        public ModalTarget(string id, TypeModalSize size = TypeModalSize.Default)
        {
            Id = !string.IsNullOrWhiteSpace(id) ? $"#{id}" : null;
            Size = size;
        }

        /// <summary>
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">
        /// The HTML node to which user attributes will be applied. Cannot be null.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        public IModalTarget ApplyUserAttributes(IHtmlNode htmlNode)
        {
            if (string.IsNullOrWhiteSpace(Id))
            {
                return this;
            }

            htmlNode?.AddUserAttribute("data-wx-toggle", "modal");
            htmlNode?.AddUserAttribute("data-wx-target", Id);

            if (Size != TypeModalSize.Default)
            {
                htmlNode?.AddUserAttribute("data-wx-modalsize", Size.ToClass());
            }

            return this;
        }
    }
}
