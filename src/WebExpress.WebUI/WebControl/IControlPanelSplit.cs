using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a split control panel interface that allows adding and removing controls
    /// to/from two separate panels (Panel1 and Panel2).
    /// </summary>
    public interface IControlPanelSplit : IControl
    {
        /// <summary>
        /// Returns the left or top panel in the ControlPanelSplit.
        /// </summary>
        IEnumerable<IControl> SidePanel { get; }

        /// <summary>
        /// Returns the right or bottom pane in the ControlPanelSplit.
        /// </summary>
        IEnumerable<IControl> MainPanel { get; }

        /// <summary>
        /// Returns or sets whether the splitter is horziontal or vertically oriented.
        /// </summary>
        TypeOrientationSplit Orientation { get; }

        /// <summary>
        /// Returns or sets the color of the splitter.
        /// </summary>
        PropertyColorBackground SplitterColor { get; }

        /// <summary>
        /// Returns or sets the width of the splitter.
        /// </summary>
        int SplitterSize { get; }

        /// <summary>
        /// Returns or sets the minimum size of the left or top area in the ControlPanelSplit.
        /// </summary>
        int SidePanelMinSize { get; }

        /// <summary>
        /// Returns or sets the initial size of the left or top area in the ControlPanelSplit in %.
        /// </summary>
        int SidePanelInitialSize { get; }

        /// <summary>
        /// Returns or sets the maximum size of the left or top area in the ControlPanelSplit.
        /// </summary>
        int SidePanelMaxSize { get; }

        /// <summary>
        /// Return or sets the order in which the main and side components are arranged.
        /// </summary>
        TypeSplitOrder Order { get; }

        /// <summary>
        /// Returns or sets the unit of measurement for the type size.
        /// </summary>
        TypeSizeUnit Unit { get; }

        /// <summary>
        /// Adds one or more controls to the left or top panel (Panel1).
        /// </summary>
        /// <param name="controls">The controls to add to Panel1.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelSplit AddSidePanel(params IControl[] controls);

        /// <summary>
        /// Removes a control from the left or top panel (Panel1).
        /// </summary>
        /// <param name="control">The control to remove from Panel1.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelSplit RemoveSidePanel(IControl control);

        /// <summary>
        /// Adds one or more controls to the right or bottom panel (Panel2).
        /// </summary>
        /// <param name="controls">The controls to add to Panel2.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelSplit AddMainPanel(params IControl[] controls);

        /// <summary>
        /// Removes a control from the right or bottom panel (Panel2).
        /// </summary>
        /// <param name="control">The control to remove from Panel2.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlPanelSplit RemoveMainPanel(IControl control);
    }
}
