using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a binding that disables the target element (or its enclosing
    /// <c>fieldset.wx-form-group</c>) whenever a source element's value satisfies
    /// the configured <see cref="Condition"/>. The binding reacts both on
    /// initialization and on every subsequent <c>change</c> / <c>input</c> event
    /// of the source.
    /// </summary>
    public class BindDisable : IBindDisable
    {
        /// <summary>
        /// Returns the binding name.
        /// </summary>
        public string Name => "disable";

        /// <summary>
        /// Gets or sets the ID of the source element whose value is observed.
        /// A leading <c>#</c> is added automatically if omitted.
        /// </summary>
        public string Source { get; set; }

        /// <summary>
        /// Gets or sets the condition expression evaluated against the source value.
        /// When the condition is satisfied the target element is disabled; otherwise it is enabled.
        /// <para>Supported formats:</para>
        /// <list type="bullet">
        ///   <item><description><c>value</c> — equality (boolean-normalised; "true", "1", "yes", "on" are equivalent)</description></item>
        ///   <item><description><c>=value</c> — explicit equality prefix</description></item>
        ///   <item><description><c>!=value</c> — not-equal</description></item>
        ///   <item><description><c>&gt;number</c>, <c>&gt;=number</c>, <c>&lt;number</c>, <c>&lt;=number</c> — numeric comparison</description></item>
        ///   <item><description><c>/pattern/flags</c> — regular-expression match, e.g. <c>/^foo/i</c></description></item>
        /// </list>
        /// </summary>
        public string Condition { get; set; }

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
            htmlNode?.AddUserAttribute("data-wx-source-disable", sourceSelector);
            htmlNode?.AddUserAttribute("data-wx-bind-condition-disable", Condition);

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

            if (!string.IsNullOrWhiteSpace(Condition))
            {
                dict["condition"] = Condition;
            }

            return dict;
        }
    }
}
