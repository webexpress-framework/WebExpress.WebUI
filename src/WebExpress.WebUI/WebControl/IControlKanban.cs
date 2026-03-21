using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a kanban control that can contain multiple cards.
    /// </summary>
    public interface IControlKanban : IControl
    {
        /// <summary>
        /// Returns the collection of cards.
        /// </summary>
        IEnumerable<IControlKanbanCard> Cards { get; }

        /// <summary>
        /// Adds one or more columns to the kanban control.
        /// </summary>
        /// <param name="columns">
        /// An array of columns to add to the kanban.
        /// </param>
        /// <returns>
        /// The updated kanban control instance with the specified columns added.
        /// </returns>
        IControlKanban Add(params IControlKanbanColumn[] columns);

        /// <summary>
        /// Adds the specified collection of swimlanes to the kanban control.
        /// </summary>
        /// <param name="swimlanes">
        /// An enumerable collection of swimlanes to add. Each swimlane represents a 
        /// distinct workflow lane to be included in the kanban control.
        /// </param>
        /// <returns>
        /// An instance of the control with the added swimlanes.
        /// </returns>
        IControlKanban Add(params IControlKanbanSwimlane[] swimlanes);

        /// <summary>
        /// Adds one or more cards to the kanban.
        /// </summary>
        /// <param name="cards">The cards to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlKanban Add(params IControlKanbanCard[] cards);

        /// <summary>
        /// Adds one or more columns to the kanban control.
        /// </summary>
        /// <param name="columns">
        /// An array of columns to add to the kanban.
        /// </param>
        /// <returns>
        /// The updated kanban control instance with the specified columns added.
        /// </returns>
        IControlKanban Add(IEnumerable<IControlKanbanColumn> columns);

        /// <summary>
        /// Adds the specified collection of swimlanes to the kanban control.
        /// </summary>
        /// <param name="swimlanes">
        /// An enumerable collection of swimlanes to add. Each swimlane represents a 
        /// distinct workflow lane to be included in the kanban control.
        /// </param>
        /// <returns>
        /// An instance of the control with the added swimlanes.
        /// </returns>
        IControlKanban Add(IEnumerable<IControlKanbanSwimlane> swimlanes);

        /// <summary>
        /// Adds a collection of cards to the kanban.
        /// </summary>
        /// <param name="cards">The collection of cards to be added.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlKanban Add(IEnumerable<IControlKanbanCard> cards);

        /// <summary>
        /// Removes all columns from the kanban control.
        /// </summary>
        /// <returns>
        /// The current instance of the kanban control, allowing for method 
        /// chaining.
        /// </returns>
        IControlKanban ClearColumns();

        /// <summary>
        /// Removes all swimlanes from the Kanban control.
        /// </summary>
        /// <returns>
        /// The current instance of the control, enabling method chaining.
        /// </returns>
        IControlKanban ClearSwimlanes();

        /// <summary>
        /// Clears all cards from the kanban.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        IControlKanban Clear();
    }
}
