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
    }
}
