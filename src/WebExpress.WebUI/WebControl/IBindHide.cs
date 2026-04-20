namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a contract for a binding that hides the target element (or its
    /// enclosing form group) when a source element reaches a specific value.
    /// </summary>
    public interface IBindHide : IBind
    {
        /// <summary>
        /// Gets the ID of the source element whose value is observed.
        /// </summary>
        string Source { get; }

        /// <summary>
        /// Gets the trigger value that causes the target element to be hidden.
        /// </summary>
        string Value { get; }
    }
}
