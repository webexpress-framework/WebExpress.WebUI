using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an action that fits the side pane of a target split control to
    /// its content. It is the declarative counterpart to the client-side
    /// "split-fit" action and mirrors <see cref="ActionFrame"/> in shape.
    /// </summary>
    public class ActionSplitFit : IAction
    {
        /// <summary>
        /// Gets the target selector of the split control whose side pane is fitted.
        /// </summary>
        public string Target { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">
        /// The unique identifier of the target split control. Cannot be null.
        /// </param>
        public ActionSplitFit(string id)
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
        public IAction ApplyUserAttributes(IHtmlNode htmlNode, TypeAction typeAction)
        {
            if (string.IsNullOrWhiteSpace(Target))
            {
                return this;
            }

            switch (typeAction)
            {
                case TypeAction.Secondary:
                    htmlNode?.AddUserAttribute("data-wx-secondary-action", "split-fit");
                    htmlNode?.AddUserAttribute("data-wx-secondary-target", Target);
                    break;
                default:
                    htmlNode?.AddUserAttribute("data-wx-primary-action", "split-fit");
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
                ["action"] = "split-fit",
                ["target"] = Target
            };
        }
    }
}
