using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an action that selects an item in a target master-detail control
    /// and loads the given uri into its detail side. It is the declarative
    /// counterpart to the client-side "master-detail" action and mirrors
    /// <see cref="ActionFrame"/> in shape.
    /// </summary>
    /// <remarks>
    /// Put on the items of the master control, it hands the selection to the
    /// composite instead of writing to the frame directly, so the composite stays
    /// the single owner of the selection state.
    /// </remarks>
    public class ActionMasterDetail : IAction
    {
        /// <summary>
        /// Gets the target selector of the master-detail control.
        /// </summary>
        public string Target { get; private set; }

        /// <summary>
        /// Gets or sets the uri whose content is loaded into the detail side.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Gets or sets the id of the selected item. It is reported back through
        /// the selection event, so surrounding code can react without having to
        /// parse the uri.
        /// </summary>
        public string Item { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">The unique identifier of the target master-detail control.</param>
        public ActionMasterDetail(string id)
        {
            Target = !string.IsNullOrWhiteSpace(id) ? $"#{id}" : null;
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">The unique identifier of the target master-detail control.</param>
        /// <param name="uri">The uri whose content is loaded into the detail side.</param>
        /// <param name="item">The id of the selected item.</param>
        public ActionMasterDetail(string id, IUri uri, string item = null)
            : this(id)
        {
            Uri = uri;
            Item = item;
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

            // the attribute suffixes stay single-word on purpose: the list control
            // rebuilds them from a camel-cased dataset and lower-cases the result,
            // which would mangle a multi-word suffix
            switch (typeAction)
            {
                case TypeAction.Secondary:
                    htmlNode?.AddUserAttribute("data-wx-secondary-action", "master-detail");
                    htmlNode?.AddUserAttribute("data-wx-secondary-target", Target);
                    htmlNode?.AddUserAttribute("data-wx-secondary-uri", Uri?.ToString());
                    htmlNode?.AddUserAttribute("data-wx-secondary-item", Item);
                    break;
                default:
                    htmlNode?.AddUserAttribute("data-wx-primary-action", "master-detail");
                    htmlNode?.AddUserAttribute("data-wx-primary-target", Target);
                    htmlNode?.AddUserAttribute("data-wx-primary-uri", Uri?.ToString());
                    htmlNode?.AddUserAttribute("data-wx-primary-item", Item);
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
            var dict = new Dictionary<string, object>
            {
                ["action"] = "master-detail",
                ["target"] = Target
            };

            if (Uri is not null)
            {
                dict["uri"] = Uri.ToString();
            }

            if (!string.IsNullOrWhiteSpace(Item))
            {
                dict["item"] = Item;
            }

            return dict;
        }
    }
}
