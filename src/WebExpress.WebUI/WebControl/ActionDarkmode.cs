using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dark mode toggle action that is wired to the client-side
    /// "darkmode" action registered in <c>action/default.js</c>.
    /// </summary>
    /// <remarks>
    /// The action emits <c>data-wx-primary-action="darkmode"</c> (or the
    /// secondary variant) together with optional <c>icon-light</c> and
    /// <c>icon-dark</c> data attributes that the client uses to swap the
    /// <c>&lt;i&gt;</c> icon child of the hosting element.
    /// </remarks>
    public class ActionDarkmode : IAction
    {
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
        /// The client will swap this text when the mode changes.
        /// </summary>
        public string TextLight { get; set; }

        /// <summary>
        /// Gets or sets the display text shown when the dark mode is active.
        /// The client will swap this text when the mode changes.
        /// </summary>
        public string TextDark { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ActionDarkmode()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with the specified icons.
        /// </summary>
        /// <param name="iconLight">The icon shown when the light mode is active.</param>
        /// <param name="iconDark">The icon shown when the dark mode is active.</param>
        public ActionDarkmode(IIcon iconLight, IIcon iconDark)
        {
            IconLight = iconLight;
            IconDark = iconDark;
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
                    htmlNode?.AddUserAttribute("data-wx-secondary-action", "darkmode");
                    htmlNode?.AddUserAttribute("data-wx-secondary-icon-light", (IconLight as Icon)?.Class);
                    htmlNode?.AddUserAttribute("data-wx-secondary-icon-dark", (IconDark as Icon)?.Class);
                    htmlNode?.AddUserAttribute("data-wx-secondary-text-light", TextLight);
                    htmlNode?.AddUserAttribute("data-wx-secondary-text-dark", TextDark);
                    break;
                default:
                    htmlNode?.AddUserAttribute("data-wx-primary-action", "darkmode");
                    htmlNode?.AddUserAttribute("data-wx-primary-icon-light", (IconLight as Icon)?.Class);
                    htmlNode?.AddUserAttribute("data-wx-primary-icon-dark", (IconDark as Icon)?.Class);
                    htmlNode?.AddUserAttribute("data-wx-primary-text-light", TextLight);
                    htmlNode?.AddUserAttribute("data-wx-primary-text-dark", TextDark);
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
                ["action"] = "darkmode"
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
