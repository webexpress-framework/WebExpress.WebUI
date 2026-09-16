using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a binding search that applies user-defined attributes to HTML nodes 
    /// for data binding purposes.
    /// </summary>
    public class BindSearch : IBindSearch
    {
        /// <summary>
        /// Returns the binding name.
        /// </summary>
        public string Name => "search";

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
            if (string.IsNullOrWhiteSpace(Source))
            {
                return this;
            }

            htmlNode?.AddUserAttribute("data-wx-bind", Name);
            htmlNode?.AddUserAttribute($"data-wx-source-{Name}", !string.IsNullOrWhiteSpace(Source) ? (Source.StartsWith('#') ? Source : $"#{Source}") : null);

            return this;
        }

        /// <summary>
        /// Returns the binding as the client reads it from a JSON island - the same
        /// facts the attributes carry, keyed by the names the attributes use.
        /// </summary>
        /// <returns>The JSON representation of the binding.</returns>
        public virtual Dictionary<string, object> ToJson()
        {
            var dict = new Dictionary<string, object>
            {
                ["bind"] = Name
            };

            if (!string.IsNullOrWhiteSpace(Source))
            {
                dict["source"] = Source.StartsWith('#') ? Source : $"#{Source}";
            }

            return dict;
        }
    }
}
