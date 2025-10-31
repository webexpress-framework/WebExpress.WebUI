namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item control that is part of a web UI.
    /// </summary>
    public interface IControlFormItem : IControl
    {
        /// <summary>
        /// Returns or sets the name of the input field.
        /// This name is used to identify the form item in the context of form submissions.
        /// </summary>
        string Name { get; set; }

        /// <summary>
        /// Initializes the form element with the specified render context and form state.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        void Initialize(IRenderControlFormContext renderContext);
    }
}
