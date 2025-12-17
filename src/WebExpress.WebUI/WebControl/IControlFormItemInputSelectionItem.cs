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
        /// Returns the text of the selection item.
        /// </summary>
        string Text { get; }

        /// <summary>
        /// Returns the icon associated with the selection item.
        /// </summary>
        IIcon Icon { get; }

        /// <summary>
        /// Returns the color of the label.
        /// </summary>
        TypeColorSelection LabelColor { get; }

        /// <summary>
        /// Returns a value indicating whether the selection item is selected.
        /// </summary>
        bool Selected { get; }

        /// <summary>
        /// Returns a value indicating whether the selection item is disabled.
        /// </summary>
        bool Disabled { get; }

        /// <summary>
        /// Returns the content of the selection item.
        /// </summary>
        IControl Content { get; }
    }
}
