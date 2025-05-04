using WebExpress.WebUI.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a submit button form item control.
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
            Text = "webexpress.webui:form.submit.label";
            Icon = new IconSave();
            Color = new PropertyColorButton(TypeColorButton.Success);
            Type = TypeButton.Submit;
            Margin = new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.Two, PropertySpacing.Space.None, PropertySpacing.Space.None);
        }
    }
}
