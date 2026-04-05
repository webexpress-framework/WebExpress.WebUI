using System.Collections.Generic;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Interface for a control.
    /// </summary>
    public interface IControl : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Returns or sets the horizontal alignment.
        /// </summary>
        TypeHorizontalAlignment HorizontalAlignment { get; }

        /// <summary>
        /// Returns or sets the flex grow property of the control.
        /// </summary>
        TypeFlexGrow FlexGrow { get; }

        /// <summary>
        /// Returns or sets the text color.
        /// </summary>
        PropertyColorText TextColor { get; }

        /// <summary>
        /// Returns or sets the background color.
        /// </summary>
        PropertyColorBackground BackgroundColor { get; }

        /// <summary>
        /// Returns or sets the border color.
        /// </summary>
        PropertyColorBorder BorderColor { get; }

        /// <summary>
        /// Returns or sets the padding.
        /// </summary>
        PropertySpacingPadding Padding { get; }

        /// <summary>
        /// Returns or sets the margin.
        /// </summary>
        PropertySpacingMargin Margin { get; }

        /// <summary>
        /// Returns or sets the border.
        /// </summary>
        PropertyBorder Border { get; }

        /// <summary>
        /// Returns or sets the column property if the control is on a grid.
        /// </summary>
        PropertyGrid GridColumn { get; }

        /// <summary>
        /// Returns or sets the width property of the control.
        /// </summary>
        TypeWidth Width { get; }

        /// <summary>
        /// Returns or sets the height property of the control.
        /// </summary>
        TypeHeight Height { get; }

        /// <summary>
        /// Returns or sets the display type for the current object.
        /// </summary>
        /// <remarks>
        /// This property determines how the object is visually represented. Setting this
        /// property may involve converting the value to a class representation.
        /// </remarks>
        TypeDisplay Display { get; }

        /// <summary>
        /// Returns or sets the css class.
        /// </summary>
        IEnumerable<string> Classes { get; }

        /// <summary>
        /// Returns or sets the css style.
        /// </summary>
        IEnumerable<string> Styles { get; }

        /// <summary>
        /// Returns or sets the role.
        /// </summary>
        string Role { get; }

        /// <summary>
        /// Returns or sets the OnClick attribute, which executes a java script on the client.
        /// </summary>
        PropertyOnClick OnClick { get; }

        /// <summary>
        /// Determines whether the control is active and rendering.
        /// </summary>
        bool Enable { get; }
    }
}
