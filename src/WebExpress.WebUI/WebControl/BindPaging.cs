using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Provides a binding implementation for paging functionality in HTML rendering.
    /// </summary>
    public class BindPaging : IBind
    {
        /// <summary>
        /// Gets the binding name.
        /// </summary>
        public string Name => "paging";

        /// <summary>
        /// Gets or sets the source of the data.
        /// </summary>
        public string Source { get; set; }

        /// <summary>
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">
        /// The HTML node to which user attributes will be applied. Cannot be null.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        public IBind ApplyUserAttributes(IHtmlNode htmlNode)
        {
            htmlNode?.AddUserAttribute("data-wx-bind", Name);
            htmlNode?.AddUserAttribute($"data-wx-source-{Name}", !string.IsNullOrWhiteSpace(Source) ? (Source.StartsWith('#') ? Source : $"#{Source}") : null);

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
