using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control panel interface for defining the structure and behavior 
    /// of cell panels in the WebExpress WebUI framework.
    /// </summary>
    public interface IControlTableCellPanel : IControlTableCell
    {
        /// <summary> 
        /// Gets the content of the cell panel. 
        /// </summary> 
        /// <remarks> 
        /// The content property holds a collection of controls that represent 
        /// the visual and interactive elements within this cell. 
        /// </remarks>
        public IEnumerable<IControl> Content { get; }

        /// <summary> 
        /// Adds one or more controls to the content of the cell panel.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <returns>The current instance for method chaining.</returns>
        IControlTableCellPanel Add(params IControl[] controls);

        /// <summary> 
        /// Adds one or more controls to the content of the cell panel.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <returns>The current instance for method chaining.</returns>
        IControlTableCellPanel Add(IEnumerable<IControl> controls);

        /// <summary>
        /// Removes a control from the content of the cell panel.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableCellPanel Remove(IControl control);

        /// <summary>
        /// Clears all controls from the content of the cell panel.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        IControlTableCellPanel Clear();
    }
}
