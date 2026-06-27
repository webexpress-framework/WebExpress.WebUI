using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a single avatar of a <see cref="ControlAvatarGroup"/>: a small
    /// circle showing an image or the initials derived from the name.
    /// </summary>
    public class ControlAvatarGroupItem : Control
    {
        /// <summary>
        /// Gets or sets the avatar image. When omitted, the initials are shown.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the name, used for the tooltip and the initials.
        /// </summary>
        public Func<IRenderControlContext, string> Name { get; set; }

        /// <summary>
        /// Gets or sets the background color of the initials circle. Accepts a
        /// system color (emitted as a CSS class) or a user-defined color (emitted
        /// as an inline style).
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackground> Color { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlAvatarGroupItem(string id = null)
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
            var image = Image?.Invoke(renderContext);
            var name = Name?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);

            var html = new HtmlElementTextSemanticsSpan()
            {
                Id = Id,
                Class = Css.Concatenate("wx-avatar-group-avatar", color?.ToClass(), GetClasses(renderContext)),
                Style = Css.Concatenate(color?.ToStyle(), GetStyles(renderContext))
            }
                .AddUserAttribute("title", name);

            if (image is not null)
            {
                html.Add(new HtmlElementMultimediaImg() { Src = image.ToString(), Class = "wx-avatar-group-img" });
            }
            else
            {
                html.Add(new HtmlText(Initials(name)));
            }

            return html;
        }

        /// <summary>
        /// Derives the initials from a name, taking the first letter of the first
        /// and last word.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <returns>One or two uppercase letters, or "?" when empty.</returns>
        private static string Initials(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return "?";
            }

            var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var initials = parts[0][..1];

            if (parts.Length > 1)
            {
                initials += parts[^1][..1];
            }

            return initials.ToUpperInvariant();
        }
    }
}
