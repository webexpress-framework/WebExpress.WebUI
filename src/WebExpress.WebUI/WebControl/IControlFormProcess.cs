namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an interface for processing form controls within a rendering context.
    /// </summary>
    public interface IControlFormProcess
    {
        /// <summary>
        /// Processes the form control using the specified rendering context.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        void Process(IRenderControlFormContext renderContext);
    }
}
