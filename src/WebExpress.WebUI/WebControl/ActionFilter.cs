using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a action element for a filter.
    /// </summary>
    public class ActionFilter : IAction
    {
        /// <summary>
        /// Returns or sets the group name associated with the current instance.
        /// </summary>
        public string Group { get; set; }

        /// <summary>
        /// Returns or sets a value indicating whether the operation should be performed exclusively.
        /// </summary>
        public bool Exclusive { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        public ActionFilter()
        {
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
            switch (typeAction)
            {
                case TypeAction.Secondary:
                    htmlNode?.AddUserAttribute("data-wx-secondary-action", "filter");
                    htmlNode?.AddUserAttribute("data-wx-secondary-group", Group);
                    htmlNode?.AddUserAttribute("data-wx-secondary-exclusive", Exclusive ? "true" : null);
                    break;
                default:
                    htmlNode?.AddUserAttribute("data-wx-primary-action", "filter");
                    htmlNode?.AddUserAttribute("data-wx-primary-group", Group);
                    htmlNode?.AddUserAttribute("data-wx-primary-exclusive", Exclusive ? "true" : null);
                    break;
            }

            return this;
        }

        /// <summary>
        /// Returns a string that represents the value of the property.
        /// </summary>
        /// <returns>A string that contains the value of the property.</returns>
        public virtual Dictionary<string, object> ToJson()
        {
            var dict = new Dictionary<string, object>
            {
                ["action"] = "filter",
                ["group"] = Group
            };

            if (Exclusive)
            {
                dict["exclusive"] = true;
            }

            return dict;
        }
    }
}
