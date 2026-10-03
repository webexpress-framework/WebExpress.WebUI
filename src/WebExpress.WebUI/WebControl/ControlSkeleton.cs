using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a loading skeleton: a shimmering placeholder shown in place of
    /// content that has not loaded yet. It comes as one or more text lines, a
    /// circle (for an avatar) or a rectangle (for an image or a card).
    /// </summary>
    public class ControlSkeleton : Control
    {
        /// <summary>
        /// Gets or sets the shape of the placeholder.
        /// </summary>
        public Func<IRenderControlContext, TypeSkeleton> Type { get; set; } = _ => TypeSkeleton.Text;

        /// <summary>
        /// Gets or sets the number of lines rendered for the text shape.
        /// </summary>
        public Func<IRenderControlContext, int> Lines { get; set; } = _ => 3;

        /// <summary>
        /// Gets or sets a value indicating whether the shimmer animation runs.
        /// </summary>
        public Func<IRenderControlContext, bool> Animated { get; set; } = _ => true;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSkeleton(string id = null)
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
            var type = Type?.Invoke(renderContext) ?? TypeSkeleton.Text;
            var lines = Math.Max(1, Lines?.Invoke(renderContext) ?? 3);
            var animated = Animated?.Invoke(renderContext) ?? true;

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-skeleton", type.ToClass(), animated ? "wx-skeleton-animated" : "", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("aria-hidden", "true");

            // the text shape stacks individual shimmer lines; the circle and the
            // rectangle are the shimmer surface themselves
            if (type == TypeSkeleton.Text)
            {
                for (var i = 0; i < lines; i++)
                {
                    html.Add(new HtmlElementTextSemanticsSpan() { Class = "wx-skeleton-line" });
                }
            }

            return html;
        }
    }
}
