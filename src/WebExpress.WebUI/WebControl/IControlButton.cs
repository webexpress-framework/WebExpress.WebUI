using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    // <summary>
    // Interface for a control button.
    // </summary>
    public interface IControlButton : IControl
    {
        /// <summary>
        /// Gets or sets the color. der Schaltfläche
        /// </summary>
        new PropertyColorButton BackgroundColor { get; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        TypeSizeButton Size { get; }

        /// <summary>
        /// Gets or sets the outline property
        /// </summary>
        Func<IRenderControlContext, bool> Outline { get; set; }

        /// <summary>
        /// Gets or sets whether the button should take up the full width.
        /// </summary>
        TypeBlockButton Block { get; }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        Func<IRenderControlContext, string> Value { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the activation status of the button.
        /// </summary>
        TypeActive Active { get; }

        /// <summary>
        /// Gets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

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