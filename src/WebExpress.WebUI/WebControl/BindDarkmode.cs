using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dark mode binding that updates the icon and text of the
    /// bound element whenever the dark mode state changes.
    /// </summary>
    public class BindDarkmode : IBind
    {
        /// <summary>
        /// Returns the binding name.
        /// </summary>
        public string Name => "darkmode";

        /// <summary>
        /// Gets or sets the icon shown when the light mode is active.
        /// </summary>
        public IIcon IconLight { get; set; } = new IconMoon();

        /// <summary>
        /// Gets or sets the icon shown when the dark mode is active.
        /// </summary>
        public IIcon IconDark { get; set; } = new IconSun();

        /// <summary>
        /// Gets or sets the display text shown when the light mode is active.
        /// </summary>
        public string TextLight { get; set; }

        /// <summary>
        /// Gets or sets the display text shown when the dark mode is active.
        /// </summary>
        public string TextDark { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public BindDarkmode()
        {
        }

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
            htmlNode?.AddUserAttribute("data-wx-bind-icon-light", (IconLight as Icon)?.Class);
            htmlNode?.AddUserAttribute("data-wx-bind-icon-dark", (IconDark as Icon)?.Class);
            htmlNode?.AddUserAttribute("data-wx-bind-text-light", TextLight);
            htmlNode?.AddUserAttribute("data-wx-bind-text-dark", TextDark);

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
                ["bind"] = Name
            };

            var iconLightClass = (IconLight as Icon)?.Class;
            if (!string.IsNullOrWhiteSpace(iconLightClass))
            {
                dict["iconLight"] = iconLightClass;
            }

            var iconDarkClass = (IconDark as Icon)?.Class;
            if (!string.IsNullOrWhiteSpace(iconDarkClass))
            {
                dict["iconDark"] = iconDarkClass;
            }

            if (!string.IsNullOrWhiteSpace(TextLight))
            {
                dict["textLight"] = TextLight;
            }

            if (!string.IsNullOrWhiteSpace(TextDark))
            {
                dict["textDark"] = TextDark;
            }

            return dict;
        }
    }
}
