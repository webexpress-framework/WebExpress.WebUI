namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a responsive control with multiple breakpoint-based panels.
    /// </summary>
    public interface IControlResponsive : IControl
    {
        /// <summary>
        /// Adds a panel with a specific breakpoint.
        /// </summary>
        /// <param name="panel">The panel to add.</param>
        /// <param name="breakpoint">
        /// The minimum width at which the panel becomes visible. Use values less than 0 to register as fallback panel.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        IControlResponsive Add(IControlPanel panel, int breakpoint);

        /// <summary>
        /// Removes a previously added panel.
        /// </summary>
        /// <param name="panel">The panel to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlResponsive Remove(IControlPanel panel);

        /// <summary>
        /// Sets the fallback panel to be shown when no breakpoint matches.
        /// </summary>
        /// <param name="panel">The fallback panel to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlResponsive SetFallback(IControlPanel panel);
    }
}
