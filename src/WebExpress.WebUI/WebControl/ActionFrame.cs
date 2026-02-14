using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a target element for a frame, providing identification and 
    /// user attribute application functionality.
    /// </summary>
    public class ActionFrame : IAction
    {
        /// <summary>
        /// Returns the unique identifier for this modal.
        /// </summary>
        public string Target { get; private set; }

        /// <summary>
        /// Returns or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">
        /// The unique identifier for the modal target. Cannot be null.
        /// </param>
        public ActionFrame(string id)
        {
            Target = !string.IsNullOrWhiteSpace(id) ? $"#{id}" : null;
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">
        /// The unique identifier for the modal target. Cannot be null.
        /// </param>
        /// <param name="uri">
        /// The target URI for the frame action.
        /// </param>
        public ActionFrame(string id, IUri uri)
            : this(id)
        {
            Uri = uri;
        }

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
        public IAction ApplyUserAttributes(IHtmlNode htmlNode, TypeAction typeAction = TypeAction.Primary)
        {
            if (string.IsNullOrWhiteSpace(Target))
            {
                return this;
            }

            switch (typeAction)
            {
                case TypeAction.Secondary:
                    htmlNode?.AddUserAttribute("data-wx-secondary-action", "frame");
                    htmlNode?.AddUserAttribute("data-wx-secondary-target", Target);
                    htmlNode?.AddUserAttribute("data-wx-secondary-uri", Uri?.ToString());
                    break;
                default:
                    htmlNode?.AddUserAttribute("data-wx-primary-action", "frame");
                    htmlNode?.AddUserAttribute("data-wx-primary-target", Target);
                    htmlNode?.AddUserAttribute("data-wx-primary-uri", Uri?.ToString());
                    break;
            }

            return this;
        }
    }
}
