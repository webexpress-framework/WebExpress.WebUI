using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Creates a box that should grab the user's attention.
    /// </summary>
    public class ControlAlert : Control
    {
        /// <summary>
        /// Returns or set the background color.
        /// </summary>
        public new Func<IRenderControlContext, PropertyColorBackgroundAlert> BackgroundColor
        {
            get => (Func<IRenderControlContext, PropertyColorBackgroundAlert>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets whether the control can be closed.
        /// </summary>
        public Func<IRenderControlContext, TypeDismissibilityAlert> Dismissibility
        {
            get => (Func<IRenderControlContext, TypeDismissibilityAlert>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets whether the fader effect should be used.
        /// </summary>
        public Func<IRenderControlContext, TypeFade> Fade
        {
            get => (Func<IRenderControlContext, TypeFade>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the headline.
        /// </summary>
        public Func<IRenderControlContext, string> Head { get; set; }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlAlert(string id = null)
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
            var h = Head?.Invoke(renderContext);
            var text = Text?.Invoke(renderContext);
            var dismissibility = Dismissibility?.Invoke(renderContext);
            var iconTheme = visualTree?.IconTheme ?? WebCore.WebIcon.TypeIconTheme.Default;

            var head = new HtmlElementTextSemanticsStrong
            (
                new HtmlText(h),
                new HtmlNbsp()
            );

            var button = new HtmlElementFieldButton()
            {
                Class = "btn wx-button-close"
            }
                .Add(new HtmlElementTextSemanticsI() { Class = new IconXmark(iconTheme).Class })
                .AddUserAttribute("data-bs-dismiss", "alert")
                .AddUserAttribute("aria-label", "close");

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("alert", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = "alert"
            }
                .Add(!string.IsNullOrWhiteSpace(h) ? head : null)
                .Add(new HtmlText(text))
                .Add(dismissibility != TypeDismissibilityAlert.None ? button : null);
        }
    }
}
