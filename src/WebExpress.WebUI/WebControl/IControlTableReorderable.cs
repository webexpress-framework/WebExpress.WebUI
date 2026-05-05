using System;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a table control that is part of the web UI.
    /// </summary>
    public interface IControlTableReorderable : IControlTable
    {
        /// <summary>
        /// Gets a value indicating whether columns can be removed.
        /// </summary>
        Func<IRenderControlContext, bool> AllowColumnRemove { get; }

        /// <summary>
        /// Gets a value indicating whether rows in the table can be moved.
        /// </summary>
        Func<IRenderControlContext, bool> MovableRow { get; }

        /// <summary>
        /// Gets the key used to persist data (column order, visibility, 
        /// widths, active sort) across sessions.
        /// </summary>
        Func<IRenderControlContext, string> PersistKey { get; }
    }
}
