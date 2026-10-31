using WebExpress.WebUI.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A submit button inside a form that sends the form's data to the server.
    /// </summary>
    public class ControlFormItemButtonSubmit : ControlFormItemButton
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The control id.</param>
        /// <param name="content">The child controls to be added to the button.</param>
        public ControlFormItemButtonSubmit(string id = null, params IControl[] content)
            : base(id, content)
        {
            Text = _ => "webexpress.webui:form.submit.label";
            Icon = _ => new IconSave();
            Color = _ => new PropertyColorButton(TypeColorButton.Success);
            Type = _ => TypeButton.Submit;
            Margin = _ => new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.Two, PropertySpacing.Space.None, PropertySpacing.Space.None);
        }
    }
}
