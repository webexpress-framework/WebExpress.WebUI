using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a binding that hides the target element (or its enclosing
    /// <c>fieldset.wx-form-group</c>) whenever a source element's value matches
    /// the configured <see cref="Value"/>. The binding reacts both on
    /// initialization and on every subsequent <c>change</c> / <c>input</c> event
    /// of the source.
    /// </summary>
    public class BindHide : IBindHide
    {
        /// <summary>
        /// Returns the binding name.
        /// </summary>
        public string Name => "hide";

        /// <summary>
        /// Gets or sets the ID of the source element whose value is observed.
        /// A leading <c>#</c> is added automatically if omitted.
        /// </summary>
        public string Source { get; set; }

        /// <summary>
        /// Gets or sets the trigger value that causes the target element to be hidden.
        /// When the source element's current value equals this string the target is
        /// hidden; otherwise it is shown.
        /// </summary>
        public string Value { get; set; }

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

            var sourceSelector = Source.StartsWith('#') ? Source : $"#{Source}";

            htmlNode?.AddUserAttribute("data-wx-bind", Name);
            htmlNode?.AddUserAttribute("data-wx-source-hide", sourceSelector);
            htmlNode?.AddUserAttribute("data-wx-bind-value-hide", Value);

            return this;
        }

        /// <summary>
        /// Returns a JSON representation of the binding.
        /// </summary>
        /// <returns>A dictionary containing the binding properties.</returns>
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

            if (!string.IsNullOrWhiteSpace(Value))
            {
                dict["value"] = Value;
            }

            return dict;
        }
    }
}
