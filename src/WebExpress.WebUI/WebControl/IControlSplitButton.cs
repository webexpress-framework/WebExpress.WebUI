using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an interface for a split button control.
    /// A split button is a combination of a button and a dropdown menu.
    /// </summary>
    public interface IControlSplitButton : IControl
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
