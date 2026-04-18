using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents an item in a selection input form.
    /// </summary>
    public class ControlFormItemInputSelectionItem : IControlFormItemInputSelectionItem
    {
        /// <summary>
        /// Returns the unique identifier of the selection item.
        /// </summary>
        public string Id { get; }

        /// <summary>
        /// Gets or sets the text of the selection item.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the selection item.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets the color of the label.
        /// </summary>
        public TypeColorSelection Color { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the selection item is selected.
        /// </summary>
        public bool Selected { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the selection item is disabled.
        /// </summary>
        public bool Disabled { get; set; }

        /// <summary>
        /// Gets or sets the content of the selection item.
        /// </summary>
        public IControl Content { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputSelectionItem()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The unique identifier of the selection item. Optional.</param>
        public ControlFormItemInputSelectionItem(string id)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the cell to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-selection-item"),
            }
                .AddUserAttribute("data-label", I18N.Translate(Text))
                .AddUserAttribute("data-icon", Icon is Icon ? (Icon as Icon).Class : null)
                .AddUserAttribute("data-image", Icon is ImageIcon
                    ? (Icon as ImageIcon).Uri?.ToString()
                    : null)
                .AddUserAttribute("data-color", Color != TypeColorSelection.Default
                    ? Color.ToClass()
                    : null)
                .Add(Content?.Render(renderContext, visualTree));

            if (Selected)
            {
                html.AddUserAttribute("selected");
            }

            if (Disabled)
            {
                html.AddUserAttribute("disabled");
            }

            return html;
        }
    }
}
