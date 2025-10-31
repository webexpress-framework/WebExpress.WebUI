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
        new PropertyColorButton BackgroundColor { get; set; }

        /// <summary>
        /// Returns or sets the size.
        /// </summary>
        TypeSizeButton Size { get; set; }

        /// <summary>
        /// Returns or sets the outline property
        /// </summary>
        bool Outline { get; set; }

        /// <summary>
        /// Returns or sets whether the button should take up the full width.
        /// </summary>
        TypeBlockButton Block { get; set; }

        /// <summary>
        /// Returns or sets the text.
        /// </summary>
        string Text { get; set; }

        /// <summary>
        /// Returns or sets the value.
        /// </summary>
        string Value { get; set; }

        /// <summary>
        /// Returns or sets the icon.
        /// </summary>
        IIcon Icon { get; set; }

        /// <summary>
        /// Returns or sets the activation status of the button.
        /// </summary>
        TypeActive Active { get; set; }

        /// <summary>
        /// Returns or sets the id of a modal dialogue.
        /// </summary>
        string Modal { get; set; }

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