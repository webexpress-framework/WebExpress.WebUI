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
        public IUri Image { get; set; }

        /// <summary>
        /// Gets or sets the name of the user.
        /// </summary>
        public string Username { get; set; }

        /// <summary>
        /// Gets or sets a link.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public TypeSizeAvatar Size
        {
            get => (TypeSizeAvatar)GetProperty(TypeSizeAvatar.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public IAction PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        public IAction SecondaryAction { get; set; }

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
            return Render(renderContext, visualTree, Username, Image, Uri, PrimaryAction, SecondaryAction);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="username">The display name for the avatar.</param>
        /// <param name="image">The image source for the avatar.</param>
        /// <param name="uri">The link associated with the avatar.</param>
        /// <param name="primaryAction">
        /// The primary action to associate with the button. If specified, this action is 
        /// invoked when the button is  activated. Can be null.
        /// </param>
        /// <param name="secondaryAction">
        /// An optional secondary action to associate with the button. Can be null.
        /// </param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, string username, IUri image, IUri uri, IAction primaryAction, IAction secondaryAction)
        {
            var img = default(HtmlElement);

            if (image is not null)
            {
                img = new HtmlElementMultimediaImg() { Src = image.ToString(), Class = "" };
            }
            else if (!string.IsNullOrWhiteSpace(Username))
            {
                var split = Username.Split(' ');
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
                Role = Role
            }
                .Add(img)
                .Add
                (
                    Uri is not null
                        ? new HtmlElementTextSemanticsA(username)
                        {
                            Href = uri.ToString(),
                            Class = "wx-link"
                        }
                        : new HtmlText(username)
                );

            PrimaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            SecondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
