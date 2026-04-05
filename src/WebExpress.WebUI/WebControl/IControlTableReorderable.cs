namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table control that is part of the web UI.
    /// </summary>
    public interface IControlTableReorderable : IControlTable
    {
        /// <summary>
        /// Returns a value indicating whether columns can be removed.
        /// </summary>
        bool AllowColumnRemove { get; }

        /// <summary>
        /// Returns a value indicating whether rows in the table can be moved.
        /// </summary>
        bool MovableRow { get; }

        /// <summary>
        /// Returns the key used to persist data (column order, visibility, 
        /// widths, active sort) across sessions.
        /// </summary>
        string PersistKey { get; }
    }
}
