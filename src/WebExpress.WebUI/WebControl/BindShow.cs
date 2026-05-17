using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Implements the <c>show</c> binding: whenever the configured source
    /// element raises the configured event (default: SELECT_ITEM_EVENT), the
    /// bound control's <c>show()</c> method is invoked - which makes this the
    /// counterpart to the user-driven dismiss button on
    /// <see cref="ControlPanelDismissible"/>. Pairs naturally with
    /// <see cref="ControlList"/>, <see cref="ControlTile"/> or
    /// <see cref="ControlTree"/>.
    /// </summary>
    public class BindShow : IBindShow
    {
        /// <summary>
        /// Returns the binding name.
        /// </summary>
        public string Name => "show";

        /// <summary>
        /// Gets or sets the ID of the source element whose events are observed.
        /// A leading <c>#</c> is added automatically if omitted.
        /// </summary>
        public string Source { get; set; }

        /// <summary>
        /// Gets or sets the event name to listen for. Leave empty to use the
        /// JavaScript default <c>SELECT_ITEM_EVENT</c>.
        /// </summary>
        public string Event { get; set; }

        /// <summary>
        /// Gets or sets the optional condition expression evaluated against
        /// the event detail. See <see cref="BindHide.Condition"/> for the
        /// supported formats.
        /// </summary>
        public string Condition { get; set; }

        /// <summary>
        /// Gets or sets the optional key in the event detail used to evaluate
        /// the <see cref="Condition"/>. Leave empty to use the JavaScript
        /// default (<c>itemId</c>).
        /// </summary>
        public string DetailKey { get; set; }

        /// <summary>
        /// Applies user-defined attributes to the specified HTML node.
        /// </summary>
        /// <param name="htmlNode">The HTML node to which user attributes will be applied.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IBind ApplyUserAttributes(IHtmlNode htmlNode)
        {
            if (string.IsNullOrWhiteSpace(Source))
            {
                return this;
            }

            var sourceSelector = Source.StartsWith('#') ? Source : $"#{Source}";

            htmlNode?.AddUserAttribute("data-wx-bind", Name);
            htmlNode?.AddUserAttribute("data-wx-source-show", sourceSelector);

            if (!string.IsNullOrWhiteSpace(Event))
            {
                htmlNode?.AddUserAttribute("data-wx-bind-event-show", Event);
            }

            if (!string.IsNullOrWhiteSpace(Condition))
            {
                htmlNode?.AddUserAttribute("data-wx-bind-condition-show", Condition);
            }

            if (!string.IsNullOrWhiteSpace(DetailKey))
            {
                htmlNode?.AddUserAttribute("data-wx-bind-detail-show", DetailKey);
            }

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

            if (!string.IsNullOrWhiteSpace(Event))
            {
                dict["event"] = Event;
            }

            if (!string.IsNullOrWhiteSpace(Condition))
            {
                dict["condition"] = Condition;
            }

            if (!string.IsNullOrWhiteSpace(DetailKey))
            {
                dict["detail"] = DetailKey;
            }

            return dict;
        }
    }
}
