namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a template control.
    /// </summary>
    public interface IControlTableTemplateEditable : IControlTableTemplate
    {
        /// <summary>
        /// Returns a value indicating whether the current template is editable or read-only.
        /// </summary>
        public bool Editable { get; }
    }
}
