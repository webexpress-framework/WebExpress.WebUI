using System;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that displays a user's avatar, which can include an image or initials, and optionally a modal dialog.
    /// </summary>
    public class ControlAvatar : Control
    {
        /// <summary>
        /// Gets or sets the avatar image.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the name of the user.
        /// </summary>
        public Func<IRenderControlContext, string> Username { get; set; }

        /// <summary>
        /// Gets or sets a link.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeAvatar> Size
        {
            get => (Func<IRenderControlContext, TypeSizeAvatar>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        public Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlAvatar(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var role = Role?.Invoke(renderContext);
            var image = Image?.Invoke(renderContext);
            var username = Username?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext);
            var primaryAction = PrimaryAction?.Invoke(renderContext);
            var secondaryAction = SecondaryAction?.Invoke(renderContext);

            var img = default(HtmlElement);

            if (image is not null)
            {
                img = new HtmlElementMultimediaImg() { Src = image.ToString(), Class = "" };
            }
            else if (!string.IsNullOrWhiteSpace(username))
            {
                var split = username.Split(' ');
                var i = split[0].FirstOrDefault().ToString();
                i += split.Length > 1 ? split[1].FirstOrDefault().ToString() : "";

                img = new HtmlElementTextSemanticsB(new HtmlText(i))
                {
                    Class = Css.Concatenate("bg-info text-light")
                };
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-profile", GetClasses()),
                Style = GetStyles(),
                Role = role
            }
                .Add(img)
                .Add
                (
                    uri is not null
                        ? new HtmlElementTextSemanticsA(username)
                        {
                            Href = uri.ToString(),
                            Class = "wx-link"
                        }
                        : new HtmlText(username)
                );

            primaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            secondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
