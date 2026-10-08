using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a binding that ties a data control to an upload control, so a
    /// file that finished uploading shows up in the control that lists the files
    /// without the user having to reload the page.
    /// </summary>
    /// <remarks>
    /// The bind is declared on the reader - the control that shows the files -
    /// rather than on the upload control, which is why it carries a selector
    /// instead of a target: an upload control stays reusable and knows nothing
    /// about who listens to it.
    /// </remarks>
    public class BindUpload : IBindUpload
    {
        /// <summary>
        /// Returns the binding name.
        /// </summary>
        public string Name => "upload";

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
            htmlNode?.AddUserAttribute($"data-wx-source-{Name}", Source.StartsWith('#') ? Source : $"#{Source}");

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
