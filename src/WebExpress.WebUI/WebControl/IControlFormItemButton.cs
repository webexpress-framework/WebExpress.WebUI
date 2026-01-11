using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    public interface IControlFormItemButton : IControlFormItem
    {
        /// <summary>
        /// Returns or sets the content.
        /// </summary>
        IEnumerable<IControl> Content { get; }

        /// <summary>
        /// Returns or sets the color of the button.
        /// </summary>
        PropertyColorButton Color { get; }

        /// <summary>
        /// Returns or sets the size.
        /// </summary>
        TypeSizeButton Size { get; }

        /// <summary>
        /// Returns or sets the Outline property.
        /// </summary>
        bool Outline { get; }

        /// <summary>
        /// Returns or sets whether the button should take up the full width.
        /// </summary>
        TypeBlockButton Block { get; }

        /// <summary>
        /// Returns or sets whether the button is disabled.
        /// </summary>
        bool Disabled { get; }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        string Text { get; }

        /// <summary>
        /// Returns or sets the type. (button, submit, reset)
        /// </summary>
        TypeButton Type { get; }

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <remarks>
        /// This method allows adding one or multiple controls to the content collection of the 
        /// control panel. It is useful for dynamically constructing the user interface by appending 
        /// various controls to the panel's content.
        /// 
        /// Example usage:
        /// <code>
        /// var button = new ControlFormItemButton();
        /// var text1 = new ControlText { Text = "Save" };
        /// var text2 = new ControlText { Text = "Cancel" };
        /// button.Add(text1, text2);
        /// </code>
        /// 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemButton Add(params IControl[] controls);

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <remarks>
        /// This method allows adding one or multiple controls to the content collection of the control 
        /// panel. It is useful for dynamically constructing the user interface by appending various 
        /// controls to the panel's content.
        /// 
        /// Example usage:
        /// <code>
        /// var button = new ControlFormItemButton();
        /// var text1 = new ControlText { Text = "Save" };
        /// var text2 = new ControlText { Text = "Cancel" };
        /// button.Add(text1, text2);
        /// </code>
        /// 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemButton Add(IEnumerable<IControl> controls);

        /// <summary>
        /// Removes a control from the content of the control panel.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <remarks>
        /// This method allows removing a specific control from the content collection of 
        /// the control panel.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemButton Remove(IControl control);
    }
}
