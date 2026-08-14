using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an action that shows or hides the detail side of a target
    /// master-detail control. It is the declarative counterpart to the
    /// client-side "master-detail-toggle" action and mirrors
    /// <see cref="ActionSplitFit"/> in shape.
    /// </summary>
    public class ActionMasterDetailToggle : IAction
    {
        /// <summary>
        /// Gets the target selector of the master-detail control.
        /// </summary>
        public string Target { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">The unique identifier of the target master-detail control.</param>
        public ActionMasterDetailToggle(string id)
        {
            Target = !string.IsNullOrWhiteSpace(id) ? $"#{id}" : null;
        }

        /// <summary>
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">The HTML node to which user attributes will be applied.</param>
        /// <param name="typeAction">The type of action being applied.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IAction ApplyUserAttributes(IHtmlNode htmlNode, TypeAction typeAction)
        {
            if (string.IsNullOrWhiteSpace(Target))
            {
                return this;
            }

            switch (typeAction)
            {
                case TypeAction.Secondary:
                    htmlNode?.AddUserAttribute("data-wx-secondary-action", "master-detail-toggle");
                    htmlNode?.AddUserAttribute("data-wx-secondary-target", Target);
                    break;
                default:
                    htmlNode?.AddUserAttribute("data-wx-primary-action", "master-detail-toggle");
                    htmlNode?.AddUserAttribute("data-wx-primary-target", Target);
                    break;
            }

            return this;
        }

        /// <summary>
        /// Returns a dictionary that represents the value of the property.
        /// </summary>
        /// <returns>A dictionary that contains the value of the property.</returns>
        public virtual Dictionary<string, object> ToJson()
        {
            return new Dictionary<string, object>
            {
                ["action"] = "master-detail-toggle",
                ["target"] = Target
            };
        }
    }
}
