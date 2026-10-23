using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a combined, multi-part entry on a toolbar.
    /// </summary>
    public interface IControlToolbarItemCombo : IControlToolbarItem
    {
        /// <summary>
        /// Gets the items in the dropdown.
        /// </summary>
        IEnumerable<ControlFormItemInputComboItem> Items { get; }

        /// <summary>
        /// Gets the color. 
        /// </summary>
        Func<IRenderControlContext, PropertyColorText> Color { get; }

        /// <summary>
        /// Gets the size.
        /// </summary>
        Func<IRenderControlContext, TypeSizeButton> Size { get; }

        /// <summary>
        /// Gets the outline property.
        /// </summary>
        Func<IRenderControlContext, bool> Outline { get; }

        /// <summary>
        /// Gets whether the button should take up the full width.
        /// </summary>
        Func<IRenderControlContext, TypeBlockButton> Block { get; }

        /// <summary>
        /// Gets an indicator that indicates that a menu is present.
        /// </summary>
        Func<IRenderControlContext, TypeToggleDropdown> Toggle { get; }

        /// <summary>
        /// Gets the label.
        /// </summary>
        Func<IRenderControlContext, string> Text { get; }

        /// <summary>
        /// Gets the tooltip.
        /// </summary>
        Func<IRenderControlContext, string> Tooltip { get; }

        /// <summary>
        /// Gets the icon.
        /// </summary>
        Func<IRenderControlContext, IIcon> Icon { get; }

        /// <summary>
        /// Gets the activation status of the button.
        /// </summary>
        Func<IRenderControlContext, TypeActive> Active { get; }

        /// <summary>
        /// Adds one or more items to the combo.
        /// </summary>
        /// <param name="items">The items to add to the combo.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbarItemCombo Add(params ControlFormItemInputComboItem[] items);

        /// <summary>
        /// Adds one or more items to the combo.
        /// </summary>
        /// <param name="items">The items to add to the combo.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbarItemCombo Add(IEnumerable<ControlFormItemInputComboItem> items);

        /// <summary>
        /// Removes the specified item from the combo control.
        /// </summary>
        /// <param name="item">The combo item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlToolbarItemCombo Remove(ControlFormItemInputComboItem item);
    }
}
