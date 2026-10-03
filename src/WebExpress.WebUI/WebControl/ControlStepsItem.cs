using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a single step of a <see cref="ControlSteps"/>: a numbered marker
    /// and a label, styled according to its progress state.
    /// </summary>
    public class ControlStepsItem : Control
    {
        /// <summary>
        /// Gets or sets the label of the step.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Gets or sets the optional secondary text shown below the label.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets the progress state of the step.
        /// </summary>
        public Func<IRenderControlContext, TypeStepState> State { get; set; } = _ => TypeStepState.Pending;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlStepsItem(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation, numbered as the first step.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return Render(renderContext, visualTree, 1);
        }

        /// <summary>
        /// Converts the control to an HTML representation with the given step number.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="number">The one-based position of the step.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, int number)
        {
            var label = Label?.Invoke(renderContext);
            var description = Description?.Invoke(renderContext);
            var state = State?.Invoke(renderContext) ?? TypeStepState.Pending;

            // a completed step shows a check, all others their position
            var marker = new HtmlElementTextSemanticsSpan(new HtmlText(state == TypeStepState.Completed ? "✓" : number.ToString()))
            {
                Class = "wx-steps-marker"
            };

            var text = new HtmlElementTextContentDiv(new HtmlElementTextSemanticsSpan(new HtmlText(label)) { Class = "wx-steps-label" })
            {
                Class = "wx-steps-text"
            };

            if (!string.IsNullOrWhiteSpace(description))
            {
                text.Add(new HtmlElementTextSemanticsSpan(new HtmlText(description)) { Class = "wx-steps-description" });
            }

            return new HtmlElementTextContentDiv(marker, text)
            {
                Id = Id,
                Class = Css.Concatenate("wx-steps-item", state.ToClass(), GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            };
        }
    }
}
