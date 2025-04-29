namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a split control panel interface that allows adding and removing controls
    /// to/from two separate panels (Panel1 and Panel2).
    /// </summary>
    public interface IControlPanelSplit : IControl
    {
        /// <summary>
        /// Adds one or more controls to the left or top panel (Panel1).
        /// </summary>
        /// <param name="controls">The controls to add to Panel1.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelSplit AddPanel1(params IControl[] controls);

        /// <summary>
        /// Removes a control from the left or top panel (Panel1).
        /// </summary>
        /// <param name="control">The control to remove from Panel1.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelSplit RemovePanel1(IControl control);

        /// <summary>
        /// Adds one or more controls to the right or bottom panel (Panel2).
        /// </summary>
        /// <param name="controls">The controls to add to Panel2.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelSplit AddPanel2(params IControl[] controls);

        /// <summary>
        /// Removes a control from the right or bottom panel (Panel2).
        /// </summary>
        /// <param name="control">The control to remove from Panel2.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelSplit RemovePanel2(IControl control);
    }
}
