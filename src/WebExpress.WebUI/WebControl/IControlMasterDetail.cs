using System;
using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a master-detail view: a list-based control on one side and a
    /// detail region on the other, kept in sync by the client.
    /// </summary>
    /// <remarks>
    /// The interface deliberately exposes the two halves as injectable parts
    /// rather than as a fixed structure, so the same layout serves a list, a
    /// tile grid, a table or a backlog without the composite knowing any of them.
    /// </remarks>
    public interface IControlMasterDetail : IControl
    {
        /// <summary>
        /// Gets the controls that make up the master side. Any enumeration control
        /// can be used here; the composite only relies on the item markup it emits.
        /// </summary>
        IEnumerable<IControl> Master { get; }

        /// <summary>
        /// Gets or sets the frame that loads the detail content on demand. It is
        /// the only part of the detail side that talks to the server, which keeps
        /// the master-detail control itself free of any transport concern.
        /// </summary>
        ControlFrame Detail { get; set; }

        /// <summary>
        /// Gets or sets the placeholder shown while no item is selected.
        /// </summary>
        ControlEmptyState EmptyState { get; set; }

        /// <summary>
        /// Gets or sets the uri template used when a master item carries an id but
        /// no uri of its own. The placeholder <c>{id}</c> is replaced by the id of
        /// the selected item.
        /// </summary>
        Func<IRenderControlContext, string> DetailUriTemplate { get; }

        /// <summary>
        /// Gets or sets the css selector that identifies a selectable item within
        /// the master side. Leave unset to use the selectors of the built-in
        /// enumeration controls.
        /// </summary>
        Func<IRenderControlContext, string> ItemSelector { get; }

        /// <summary>
        /// Gets or sets the width below which the control switches to the
        /// sequential single-column mode.
        /// </summary>
        Func<IRenderControlContext, int> Breakpoint { get; }

        /// <summary>
        /// Gets or sets whether the detail side is visible initially. A hidden
        /// detail side takes the splitter with it and is brought back by selecting
        /// an item or through the toggle action.
        /// </summary>
        Func<IRenderControlContext, bool> DetailVisible { get; }

        /// <summary>
        /// Gets or sets whether the detail side carries a close button.
        /// </summary>
        Func<IRenderControlContext, bool> Closable { get; }

        /// <summary>
        /// Adds one or more controls to the master side.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlMasterDetail AddMaster(params IControl[] controls);

        /// <summary>
        /// Removes a control from the master side.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlMasterDetail RemoveMaster(IControl control);
    }
}
