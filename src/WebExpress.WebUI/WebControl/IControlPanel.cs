using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control panel interface for defining the structure and behavior of control panels in the WebExpress WebUI framework.
    /// </summary>
    public interface IControlPanel : IControl
    {
        /// <summary> 
        /// Gets the content of the panel. 
        /// </summary> 
        /// <remarks> 
        /// The content property holds a collection of controls that represent 
        /// the visual and interactive elements within this container. 
        /// </remarks>
        IEnumerable<IControl> Content { get; }

        /// <summary> 
        /// Adds one or more controls to the content of the control panel.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple controls to the content collection of 
        /// the control panel. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the panel's content. 
        /// 
        /// Example usage: 
        /// <code> 
        /// var panel = new ControlPanel(); 
        /// var text1 = new ControlText { Text = "A" };
        /// var text2 = new ControlText { Text = "B" };
        /// panel.Add(text1, text2);
        /// </code> 
        /// 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanel Add(params IControl[] controls);

        /// <summary> 
        /// Adds one or more controls to the content of the control panel.
        /// </summary> 
        /// <param name="controls">The controls to add to the content.</param> 
        /// <remarks> 
        /// This method allows adding one or multiple controls to the content collection of 
        /// the control panel. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the panel's content. 
        /// 
        /// Example usage: 
        /// <code> 
        /// var panel = new ControlPanel(); 
        /// var text1 = new ControlText { Text = "A" };
        /// var text2 = new ControlText { Text = "B" };
        /// panel.Add(text1, text2);
        /// </code> 
        /// 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanel Add(IEnumerable<IControl> controls);

        /// <summary>
        /// Removes a control from the content of the control panel.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <remarks>
        /// This method allows removing a specific control from the content collection of 
        /// the control panel.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanel Remove(IControl control);

        /// <summary>
        /// Clears all controls from the content of the control panel.
        /// </summary>
        /// <remarks>
        /// This method removes all controls from the <see cref="Content"/> collection of the control panel.
        /// It is useful for resetting the panel's content to an empty state.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanel Clear();
    }
}
