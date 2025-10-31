using WebExpress.WebUI.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a reset button form item control.
    /// </summary>
    public class ControlFormItemButtonReset : ControlFormItemButton
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The control id.</param>
        /// <param name="content">The child controls to be added to the button.</param>
        public ControlFormItemButtonReset(string id = null, params IControl[] content)
            : base(id, content)
        {
            Text = "webexpress.webui:form.reset.label";
            Icon = new IconRotateLeft();
            Color = new PropertyColorButton(TypeColorButton.Secondary);
            Type = TypeButton.Reset;
            Margin = new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.Two, PropertySpacing.Space.None, PropertySpacing.Space.None);
        }
    }
}
