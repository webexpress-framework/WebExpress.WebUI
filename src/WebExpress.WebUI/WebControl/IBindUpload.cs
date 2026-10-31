namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a contract for a binding that lets a data control follow the
    /// uploads of an upload control.
    /// </summary>
    public interface IBindUpload : IBind
    {
        /// <summary>
        /// Gets the source of the data.
        /// </summary>
        string Source { get; }
    }
}
