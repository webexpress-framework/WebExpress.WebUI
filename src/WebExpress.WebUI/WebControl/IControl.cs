using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Base contract for all WebUI controls: visual building blocks that render themselves into a page's HTML.
    /// </summary>
    public interface IControl : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets or sets the horizontal alignment.
        /// </summary>
        Func<IRenderControlContext, TypeHorizontalAlignment> HorizontalAlignment { get; }

        /// <summary>
        /// Gets or sets the flex grow property of the control.
        /// </summary>
        Func<IRenderControlContext, TypeFlexGrow> FlexGrow { get; }

        /// <summary>
        /// Gets or sets the text color.
        /// </summary>
        Func<IRenderControlContext, PropertyColorText> TextColor { get; }

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        Func<IRenderControlContext, PropertyColorBackground> BackgroundColor { get; }

        /// <summary>
        /// Gets or sets the border color.
        /// </summary>
        Func<IRenderControlContext, PropertyColorBorder> BorderColor { get; }

        /// <summary>
        /// Gets or sets the padding.
        /// </summary>
        Func<IRenderControlContext, PropertySpacingPadding> Padding { get; }

        /// <summary>
        /// Gets or sets the margin.
        /// </summary>
        Func<IRenderControlContext, PropertySpacingMargin> Margin { get; }

        /// <summary>
        /// Gets or sets the border.
        /// </summary>
        Func<IRenderControlContext, PropertyBorder> Border { get; }

        /// <summary>
        /// Gets or sets the column property if the control is on a grid.
        /// </summary>
        Func<IRenderControlContext, PropertyGrid> GridColumn { get; }

        /// <summary>
        /// Gets or sets the width property of the control.
        /// </summary>
        Func<IRenderControlContext, TypeWidth> Width { get; }

        /// <summary>
        /// Gets or sets the height property of the control.
        /// </summary>
        Func<IRenderControlContext, TypeHeight> Height { get; }

        /// <summary>
        /// Gets or sets the display type for the current object.
        /// </summary>
        /// <remarks>
        /// This property determines how the object is visually represented. Setting this
        /// property may involve converting the value to a class representation.
        /// </remarks>
        Func<IRenderControlContext, TypeDisplay> Display { get; }

        /// <summary>
        /// Gets or sets the css class.
        /// </summary>
        IEnumerable<string> Classes { get; }

        /// <summary>
        /// Gets or sets the css style.
        /// </summary>
        IEnumerable<string> Styles { get; }

        /// <summary>
        /// Gets or sets the role.
        /// </summary>
        Func<IRenderControlContext, string> Role { get; }

        /// <summary>
        /// Determines whether the control is active and rendering.
        /// </summary>
        Func<IRenderControlContext, bool> Enable { get; }
    }
}
