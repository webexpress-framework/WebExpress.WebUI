using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an action that ends the fullscreen mode of the target element. The client
    /// handles dismissal through its own <c>data-wx-dismiss</c> marker rather than the primary and
    /// secondary action slots, so the action always fires on a click, whatever slot it is bound to.
    /// </summary>
    public class ActionDismiss : IAction
    {
        /// <summary>
        /// Gets the unique identifier for this modal.
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
        /// Ignored, since the dismiss marker has no slot; the parameter only satisfies <see cref="IAction"/>.
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
        /// Returns the action as the client reads it from a JSON island - the same facts
        /// the attributes carry: what is dismissed, and which element.
        /// </summary>
        /// <returns>The JSON representation of the action.</returns>
        public virtual Dictionary<string, object> ToJson()
        {
            var dict = new Dictionary<string, object>
            {
                ["action"] = "dismiss",
                ["dismiss"] = "fullscreen"
            };

            if (!string.IsNullOrWhiteSpace(Target))
            {
                dict["target"] = Target;
            }

            return dict;
        }
    }
}
