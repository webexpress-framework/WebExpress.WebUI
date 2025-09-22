using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a toast notification control panel that can contain 
    /// multiple child controls.
    /// </summary>
    public class ControlPanelToast : ControlPanel
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
        public TypeDismissibleAlert Dismissible
        {
            get => (TypeDismissibleAlert)GetProperty(TypeDismissibleAlert.Dismissible);
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
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="controls">The child controls to be added to the panel.</param>
        public ControlPanelToast(string id = null, params ControlAlert[] controls)
            : base(id, controls)
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

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("alert", GetClasses()),
                Style = GetStyles(),
                Role = "alert",
                DataTheme = Theme.ToValue()
            }
                .Add(!string.IsNullOrWhiteSpace(Head) ? head : null)
                .Add(new ControlPanel().Add(Content).Render(renderContext, visualTree))
                .Add(Dismissible != TypeDismissibleAlert.None ? button : null);
        }
    }
}
