using System.Runtime.CompilerServices;
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
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        /// <param name="instance">
        /// The name of the calling member. This is automatically provided by the compiler.
        /// </param>
        /// <param name="file">
        /// The file path of the source file where this instance is created. This is automatically 
        /// provided by the compiler.
        /// </param>
        /// <param name="line">
        /// The line number in the source file where this instance is created. This is automatically 
        /// provided by the compiler.
        /// </param>
        /// <param name="items">The form controls.</param>
        public ControlModalFormConfirmDelete
        (
            [CallerMemberName] string instance = null,
            [CallerFilePath] string file = null,
            [CallerLineNumber] int? line = null, params IControlFormItem[] items
        )
            : this($"modal_confirm_delete_{instance}_{file}_{line}".GetHashCode().ToString("X"), items)
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
            SubmitButtonIcon = new IconTrash();
            SubmitButtonColor = new PropertyColorButton(TypeColorButton.Danger);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            if (string.IsNullOrWhiteSpace(Header))
            {
                Header = I18N.Translate(renderContext, "webexpress.webui:delete.header");
            }

            SubmitButtonLabel ??= I18N.Translate(renderContext, "webexpress.webui:delete.label");
            Content ??= new ControlFormItemStaticText()
            {
                Text = I18N.Translate(renderContext, "webexpress.webapp:webui.description")
            };

            return base.Render(renderContext, visualTree);
        }
    }
}
