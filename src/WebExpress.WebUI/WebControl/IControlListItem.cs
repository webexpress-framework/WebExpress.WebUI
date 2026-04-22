using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a list item control that can contain other controls as its content.
    /// </summary>
    public interface IControlListItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the color scheme used for the row.
        /// </summary>
        PropertyColorText Color { get; }

        /// <summary>
        /// Gets or sets the color scheme used for the row.
        /// </summary>
        PropertyColorBackgroundList BackgroundColor { get; }

        /// <summary>
        /// Gets the options.
        /// </summary>
        IEnumerable<IControlDropdownItem> Options { get; }

        /// <summary>
        /// Gets the icon associated with this instance.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Gets the image uri.
        /// </summary>
        IUri Image { get; }

        /// <summary>
        /// Gets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        IAction PrimaryAction { get; }

        /// <summary>
        /// Gets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        IAction SecondaryAction { get; }

        /// <summary>
        /// Gets the ativity state of the list item.
        /// </summary>
        TypeActive Active { get; }

        /// <summary>
        /// Gets the content associated with this cell.
        /// </summary>
        string Text { get; }

        /// <summary>
        /// Gets the description associated with this cell.
        /// </summary>
        string Description { get; }

        /// <summary> 
        /// Adds one or more controls to the content of the list item.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <returns>The current instance for method chaining.</returns>
        IControlListItem Add(params IControl[] controls);

        /// <summary> 
        /// Adds one or more controls to the content of the list item.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <returns>The current instance for method chaining.</returns>
        IControlListItem Add(IEnumerable<IControl> controls);

        /// <summary>
        /// Removes a control from the content of the list item.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlListItem Remove(IControl control);
    }
}
