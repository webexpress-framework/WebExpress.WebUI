using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a target element for modal dialogs, providing identification and 
    /// user attribute application functionality.
    /// </summary>
    public class ActionModal : IAction
    {
        private readonly TypeModalSize? _size;

        /// <summary>
        /// Returns the unique identifier for this modal.
        /// </summary>
        public string Target { get; private set; }

        /// <summary>
        /// Returns the size configuration for the modal dialog.
        /// </summary>
        public string Size => _size?.ToClass();

        /// <summary>
        /// Gets or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">
        /// The unique identifier for the modal target. Cannot be null.
        /// </param>
        public ActionModal(string id)
        {
            Target = !string.IsNullOrWhiteSpace(id) ? $"#{id}" : null;
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">
        /// The unique identifier for the modal target. Cannot be null.
        /// </param>
        /// <param name="size">
        /// The size configuration for the modal dialog.
        /// </param>
        public ActionModal(string id, TypeModalSize size = TypeModalSize.Default)
            : this(id)
        {
            _size = size;
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified identifier.
        /// </summary>
        /// <param name="id">
        /// The unique identifier for the modal target. Cannot be null.
        /// </param>
        /// <param name="uri">
        /// The target URI to be associated with the modal action.
        /// </param>
        /// <param name="size">
        /// The size configuration for the modal dialog.
        /// </param>
        public ActionModal(string id, IUri uri, TypeModalSize size = TypeModalSize.Default)
            : this(id, size)
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
        public IAction ApplyUserAttributes(IHtmlNode htmlNode, TypeAction typeAction)
        {
            if (string.IsNullOrWhiteSpace(Target))
            {
                return this;
            }

            switch (typeAction)
            {
                case TypeAction.Secondary:
                    htmlNode?.AddUserAttribute("data-wx-secondary-action", "modal");
                    htmlNode?.AddUserAttribute("data-wx-secondary-target", Target);
                    htmlNode?.AddUserAttribute("data-wx-secondary-uri", Uri?.ToString());
                    if (_size.HasValue)
                    {
                        htmlNode?.AddUserAttribute("data-wx-secondary-size", Size);
                    }

                    break;
                default:
                    htmlNode?.AddUserAttribute("data-wx-primary-action", "modal");
                    htmlNode?.AddUserAttribute("data-wx-primary-target", Target);
                    htmlNode?.AddUserAttribute("data-wx-primary-uri", Uri?.ToString());
                    if (_size.HasValue)
                    {
                        htmlNode?.AddUserAttribute("data-wx-primary-size", Size);
                    }

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
                ["action"] = "modal",
                ["target"] = Target
            };

            if (Uri is not null)
            {
                dict["uri"] = Uri.ToString();
            }

            if (_size.HasValue)
            {
                dict["size"] = Size;
            }

            return dict;
        }
    }
}
