using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a selection input form.
    /// </summary>
    public interface IControlFormItemInputSelectionItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the text of the selection item.
        /// </summary>
        string Text { get; }

        /// <summary>
        /// Gets the icon associated with the selection item.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Gets the color of the label.
        /// </summary>
        TypeColorSelection Color { get; }

        /// <summary>
        /// Gets a value indicating whether the selection item is selected.
        /// </summary>
        bool Selected { get; }

        /// <summary>
        /// Gets a value indicating whether the selection item is disabled.
        /// </summary>
        bool Disabled { get; }

        /// <summary>
        /// Gets the content of the selection item.
        /// </summary>
        IControl Content { get; }
    }
}
