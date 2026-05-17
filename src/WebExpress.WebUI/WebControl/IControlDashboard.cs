using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a dashboard control that can contain multiple widgets.
    /// </summary>
    public interface IControlDashboard : IControl
    {
        /// <summary>
        /// Gets the collection of widgets.
        /// </summary>
        IEnumerable<IControlDashboardWidget> Widgets { get; }

        /// <summary>
        /// Adds one or more columns to the dashboard control.
        /// </summary>
        /// <param name="columns">
        /// An array of columns to add to the dashboard.
        /// </param>
        /// <returns>
        /// The updated dashboard control instance with the specified columns added.
        /// </returns>
        IControlDashboard Add(params IControlDashboardColumn[] columns);

        /// <summary>
        /// Adds one or more widgets to the dashboard.
        /// </summary>
        /// <param name="widgets">The widgets to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlDashboard Add(params IControlDashboardWidget[] widgets);

        /// <summary>
        /// Adds one or more columns to the dashboard control.
        /// </summary>
        /// <param name="columns">
        /// An array of columns to add to the dashboard.
        /// </param>
        /// <returns>
        /// The updated dashboard control instance with the specified columns added.
        /// </returns>
        IControlDashboard Add(IEnumerable<IControlDashboardColumn> columns);

        /// <summary>
        /// Adds a collection of widgets to the dashboard.
        /// </summary>
        /// <param name="widgets">The collection of widgets to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlDashboard Add(IEnumerable<IControlDashboardWidget> widgets);

        /// <summary>
        /// Removes all columns from the dashboard control.
        /// </summary>
        /// <returns>
        /// The current instance of the dashboard control, allowing for method 
        /// chaining.
        /// </returns>
        IControlDashboard ClearColumns();

        /// <summary>
        /// Clears all widgets from the dashboard.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        IControlDashboard Clear();
    }
}
