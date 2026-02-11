using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    // <summary>
    // Interface for a control button.
    // </summary>
    public interface IControlButton : IControl
    {
        /// <summary>
        /// Returns or sets the color. der Schaltfläche
        /// </summary>
        new PropertyColorButton BackgroundColor { get; }

        /// <summary>
        /// Returns or sets the size.
        /// </summary>
        TypeSizeButton Size { get; }

        /// <summary>
        /// Returns or sets the outline property
        /// </summary>
        bool Outline { get; }

        /// <summary>
        /// Returns or sets whether the button should take up the full width.
        /// </summary>
        TypeBlockButton Block { get; }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        string Text { get; }

        /// <summary>
        /// Returns or sets the value.
        /// </summary>
        string Value { get; }

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Returns or sets the activation status of the button.
        /// </summary>
        TypeActive Active { get; }

        /// <summary>
        /// Returns the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        IAction PrimaryAction { get; }

        /// <summary>
        /// Returns the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        IAction SecondaryAction { get; }

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlButton Add(params IControl[] items);

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlButton Add(IEnumerable<IControl> items);

        /// <summary>
        /// Removes a control from the content of the button.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlButton Remove(IControl control);
    }
}