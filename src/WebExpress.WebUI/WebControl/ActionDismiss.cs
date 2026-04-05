using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an action that dismisses a modal dialog by applying 
    /// the appropriate attributes to an HTML node.
    /// </summary>
    public class ActionDismiss : IAction
    {
        /// <summary>
        /// Returns the unique identifier for this modal.
        /// </summary>
        public string Target { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">
        /// The unique identifier for the modal target. Cannot be null.
        /// </param>
        public ActionDismiss(string id)
        {
            Target = !string.IsNullOrWhiteSpace(id) ? $"#{id}" : null;
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

            htmlNode?.AddUserAttribute("data-wx-dismiss", "fullscreen");
            htmlNode?.AddUserAttribute("data-wx-target", Target);

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
