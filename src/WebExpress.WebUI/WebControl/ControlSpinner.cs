using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a loading spinner that signals an in-progress operation. The
    /// color is taken from the inherited <see cref="Control.TextColor"/>, exactly
    /// like a Bootstrap spinner.
    /// </summary>
    public class ControlSpinner : Control
    {
        /// <summary>
        /// Gets or sets the spinner style (rotating border or growing).
        /// </summary>
        public Func<IRenderControlContext, TypeSpinner> Type { get; set; } = _ => TypeSpinner.Border;

        /// <summary>
        /// Gets or sets a value indicating whether the small spinner variant is used.
        /// </summary>
        public Func<IRenderControlContext, bool> Small { get; set; } = _ => false;

        /// <summary>
        /// Gets or sets the screen-reader label announced while the spinner is
        /// visible. Defaults to "Loading..." when not provided.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSpinner(string id = null)
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
            var type = Type?.Invoke(renderContext) ?? TypeSpinner.Border;
            var small = Small?.Invoke(renderContext) ?? false;
            var label = Label?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext) ?? "status";

            return new HtmlElementTextContentDiv
            (
                new HtmlElementTextSemanticsSpan(new HtmlText(string.IsNullOrWhiteSpace(label) ? "Loading..." : label))
                {
                    Class = "visually-hidden"
                }
            )
            {
                Id = Id,
                Class = Css.Concatenate(type.ToClass(), small ? type.ToSmallClass() : "", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role
            };
        }
    }
}
