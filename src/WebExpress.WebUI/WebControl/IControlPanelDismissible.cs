using System;
using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dismissible panel control with a title bar and an "x"
    /// dismiss button in the upper right corner. The panel can be re-shown
    /// programmatically (typically through the <c>show</c> bind reacting to a
    /// list/tile selection).
    /// </summary>
    public interface IControlPanelDismissible : IControl
    {
        /// <summary>
        /// Gets the collection of controls that make up the panel body.
        /// </summary>
        IEnumerable<IControl> Content { get; }

        /// <summary>
        /// Gets or sets the title text rendered in the header bar.
        /// </summary>
        Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets whether the panel starts in the hidden state.
        /// </summary>
        Func<IRenderControlContext, bool> InitialHidden { get; set; }

        /// <summary>
        /// Gets or sets the aria-label used on the dismiss button.
        /// </summary>
        Func<IRenderControlContext, string> DismissAriaLabel { get; set; }

        /// <summary>
        /// Gets or sets the binding applied to the rendered host element so
        /// the panel can react to external events (typically the <c>show</c>
        /// bind tied to a list selection).
        /// </summary>
        Func<IRenderControlContext, IBinding> Bind { get; set; }

        /// <summary>
        /// Adds one or more controls to the panel body.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelDismissible Add(params IControl[] controls);

        /// <summary>
        /// Adds one or more controls to the panel body.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelDismissible Add(IEnumerable<IControl> controls);

        /// <summary>
        /// Removes a control from the panel body.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelDismissible Remove(IControl control);
    }
}
