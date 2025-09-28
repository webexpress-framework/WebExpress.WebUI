using WebExpress.WebCore.WebHtml;
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
        public new PropertyColorBackgroundAlert BackgroundColor
        {
            get => (PropertyColorBackgroundAlert)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Returns or sets whether the control can be closed.
        /// </summary>
        public TypeDismissibilityAlert Dismissibility
        {
            get => (TypeDismissibilityAlert)GetProperty(TypeDismissibilityAlert.Dismissible);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets whether the fader effect should be used.
        /// </summary>
        public TypeFade Fade
        {
            get => (TypeFade)GetProperty(TypeFade.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the headline.
        /// </summary>
        public string Head { get; set; }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        public string Text { get; set; }

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
            var head = new HtmlElementTextSemanticsStrong
            (
                new HtmlText(Head),
                new HtmlNbsp()
            );

            var button = new HtmlElementFieldButton()
            {
                Class = "btn-close"
            };
            button.AddUserAttribute("data-bs-dismiss", "alert");
            button.AddUserAttribute("aria-label", "close");

            return new HtmlElementTextContentDiv
            (
                !string.IsNullOrWhiteSpace(Head) ? head : null,
                new HtmlText(Text),
                Dismissibility != TypeDismissibilityAlert.None ? button : null
            )
            {
                Id = Id,
                Class = Css.Concatenate("alert", GetClasses()),
                Style = GetStyles(),
                Role = "alert"
            };
        }
    }
}
