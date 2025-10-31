using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a navigation control that allows adding, removing, and managing navigation items.
    /// </summary>
    public interface IControlNavigation : IControl
    {
        /// <summary> 
        /// Adds one or more items to the content of the control.
        /// </summary> 
        /// <param name="items">The items to add to the control.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple items to the collection of 
        /// the control.
        /// 
        /// Example usage: 
        /// <code> 
        /// var control = new ControlNavigation(); 
        /// var text1 = new ControlNavigationItemLink { Text = "A" };
        /// var text2 = new ControlNavigationItemLink { Text = "B" };
        /// control.Add(text1, text2);
        /// </code> 
        /// 
        /// This method accepts any items that implement the <see cref="IControlNavigationItem"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlNavigation Add(params IControlNavigationItem[] items);

        /// <summary> 
        /// Adds one or more items to the content of the control.
        /// </summary> 
        /// <param name="items">The items to add to the control.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple items to the collection of 
        /// the control.
        /// 
        /// Example usage: 
        /// <code> 
        /// var control = new ControlNavigation(); 
        /// var text1 = new ControlNavigationItemLink { Text = "A" };
        /// var text2 = new ControlNavigationItemLink { Text = "B" };
        /// control.Add(text1, text2);
        /// </code> 
        /// 
        /// This method accepts any items that implement the <see cref="IControlNavigationItem"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlNavigation Add(IEnumerable<IControlNavigationItem> items);

        /// <summary>
        /// Removes an item from the content of the control.
        /// </summary>
        /// <param name="item">The item to remove from the content.</param>
        /// <remarks>
        /// This method allows removing a specific item from the collection of 
        /// the control.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlNavigation Remove(IControlNavigationItem item);
    }
}
