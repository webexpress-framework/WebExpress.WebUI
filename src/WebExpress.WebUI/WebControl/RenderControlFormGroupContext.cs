namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Provides the context for rendering a form control within a group on a web page.
    /// </summary>
    public class RenderControlFormGroupContext : RenderControlFormContext, IRenderControlFormGroupContext
    {
        /// <summary>
        /// Gets the group in which the control is rendered.
        /// </summary>
        public ControlFormItemGroup Group { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="context">The context in which the control is rendered.</param>
        /// <param name="group">The group in which the control is rendered.</param>
        public RenderControlFormGroupContext(IRenderControlFormContext context, ControlFormItemGroup group)
            : base(context)
        {
            Group = group;
        }
    }
}
