namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Interface for rendering control form group context.
    /// </summary>
    public interface IRenderControlFormGroupContext : IRenderControlFormContext
    {
        /// <summary>
        /// Gets the group of form items associated with the control.
        /// </summary>
        public ControlFormItemGroup Group { get; }
    }
}
