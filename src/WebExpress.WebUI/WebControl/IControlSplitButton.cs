using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an interface for a split button control.
    /// A split button is a combination of a button and a dropdown menu.
    /// </summary>
    public interface IControlSplitButton : IControl
    {
        /// <summary>
        /// Gets or sets the color. der Schaltfläche
        /// </summary>
        new Func<IRenderControlContext, PropertyColorButton> BackgroundColor { get; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        Func<IRenderControlContext, TypeSizeButton> Size { get; }

        /// <summary>
        /// Gets or sets the outline property
        /// </summary>
        Func<IRenderControlContext, bool> Outline { get; set; }

        /// <summary>
        /// Gets or sets whether the button should take up the full width.
        /// </summary>
        Func<IRenderControlContext, TypeBlockButton> Block { get; }

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
        Func<IRenderControlContext, TypeActive> Active { get; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the content.
        /// </summary>
        IEnumerable<IControlSplitButtonItem> Items { get; }

        /// <summary>
        /// Adds one or more items to the split button.
        /// </summary>
        /// <param name="items">The items to add to the split button.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSplitButton Add(params IControlSplitButtonItem[] items);

        /// <summary>
        /// Adds one or more items to the split button.
        /// </summary>
        /// <param name="items">The items to add to the split button.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSplitButton Add(IEnumerable<IControlSplitButtonItem> items);

        /// <summary>
        /// Adds a divider to the split button.
        /// </summary>
        /// <returns>The current instance for method chaining.</returns>
        IControlSplitButton AddDivider();

        /// <summary>
        /// Adds a header item to the split button.
        /// </summary>
        /// <param name="text">The text of the header item.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSplitButton AddHeader(string text);

        /// <summary>
        /// Removes a item from the content of the split button.
        /// </summary>
        /// <param name="items">The items to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlSplitButton Remove(IControlSplitButtonItem items);
    }
}
