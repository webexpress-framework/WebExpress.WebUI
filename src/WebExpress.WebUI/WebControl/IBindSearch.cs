namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a contract for objects that support data binding to a specified source.
    /// </summary>
    public interface IBindSearch : IBind
    {
        /// <summary>
        /// Returns the source of the data.
        /// </summary>
        string Source { get; }
    }
}
