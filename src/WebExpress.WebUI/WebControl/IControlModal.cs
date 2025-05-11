using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a modal control that extends the base control functionality.
    /// </summary>
    public interface IControlModal : IControl
    {
        /// <summary>
        /// Returns the content.
        /// </summary>
        IEnumerable<IControl> Content { get; }

        /// <summary>
        /// Returns or sets the header.
        /// </summary>
        string Header { get; set; }

        /// <summary>  
        /// Returns or sets the size of the modal dialog.  
        /// </summary>  
        /// <value>  
        /// One of the values of the <see cref="TypeModalSize"/> enumeration, specifying the size of the modal.  
        /// </value>  
        /// <remarks>  
        /// This property allows you to define the size of the modal dialog, such as Default, Small, Large, ExtraLarge, or Fullscreen.  
        /// </remarks>  
        TypeModalSize Size { get; set; }

        /// <summary>
        /// Returns or sets the label for the close button of the modal.
        /// </summary>
        string CloseLabel { get; set; }

        /// <summary> 
        /// Adds one or more controls to the content of the modal.
        /// </summary> 
        /// <param name="controls">The controls to add to the modal.</param> 
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks> 
        /// This method allows adding one or multiple controls to the <see cref="Content"/> collection of 
        /// the modal. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the panel's content. 
        /// Example usage: 
        /// <code> 
        /// var modal = new ControlModal(); 
        /// var text1 = new ControlText { Text = "Save" };
        /// var text2 = new ControlText { Text = "Cancel" };
        /// modal.Add(text1, text2);
        /// </code> 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        IControlModal Add(params IControl[] controls);

        /// <summary> 
        /// Adds one or more controls to the content of the modal.
        /// </summary> 
        /// <param name="controls">The controls to add to the modal.</param> 
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks> 
        /// This method allows adding one or multiple controls to the <see cref="Content"/> collection of 
        /// the modal. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the panel's content. 
        /// Example usage: 
        /// <code> 
        /// var modal = new ControlModal(); 
        /// var text1 = new ControlText { Text = "Save" };
        /// var text2 = new ControlText { Text = "Cancel" };
        /// modal.Add(new List<IControl>([text1, text2]));
        /// </code> 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        IControlModal Add(IEnumerable<IControl> controls);

        /// <summary>
        /// Removes a control from the content of the modal.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        /// <remarks>
        /// This method allows removing a specific control from the <see cref="Content"/> collection of 
        /// the modal.
        /// </remarks>
        IControlModal Remove(IControl control);
    }
}
