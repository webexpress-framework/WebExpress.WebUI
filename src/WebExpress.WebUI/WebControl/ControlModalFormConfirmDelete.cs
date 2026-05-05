using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a modal confirmation form specifically for delete actions.
    /// </summary>
    public class ControlModalFormConfirmDelete : ControlModalFormConfirm
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlModalFormConfirmDelete()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The control id.</param>
        /// <param name="content">The form controls.</param>
        public ControlModalFormConfirmDelete(string id, params IControlFormItem[] content)
            : base(id, content)
        {
            SubmitButtonIcon = _ => new IconTrash();
            SubmitButtonColor = _ => new PropertyColorButton(TypeColorButton.Danger);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var header = Header?.Invoke(renderContext);
            var submitButtonLabel = SubmitButtonLabel?.Invoke(renderContext);

            if (string.IsNullOrWhiteSpace(header))
            {
                Header = _ => I18N.Translate(renderContext, "webexpress.webui:delete.header");
            }

            if (string.IsNullOrWhiteSpace(submitButtonLabel))
            {
                SubmitButtonLabel = _ => I18N.Translate(renderContext, "webexpress.webui:delete.label");
            }

            Content ??= new ControlFormItemStaticText()
            {
                Text = _ => I18N.Translate(renderContext, "webexpress.webui:delete.description")
            };

            return base.Render(renderContext, visualTree);
        }
    }
}
