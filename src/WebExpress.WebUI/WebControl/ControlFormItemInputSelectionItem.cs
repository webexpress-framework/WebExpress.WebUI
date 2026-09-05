using System;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A single selectable option within a selection input.
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
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the icon associated with the selection item.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets the color of the label.
        /// </summary>
        public Func<IRenderControlContext, TypeColorSelection> Color { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the selection item is selected.
        /// </summary>
        public Func<IRenderControlContext, bool> Selected { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the selection item is disabled.
        /// </summary>
        public Func<IRenderControlContext, bool> Disabled { get; set; }

        /// <summary>
        /// Gets or sets the content of the selection item.
        /// </summary>
        public Func<IRenderControlContext, IControl> Content { get; set; }

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
                .AddUserAttribute("data-label", I18N.Translate(renderContext, Text?.Invoke(renderContext)))
                .AddUserAttribute("data-icon", Icon?.Invoke(renderContext) is Icon ? (Icon?.Invoke(renderContext) as Icon).Class : null)
                .AddUserAttribute("data-image", Image?.Invoke(renderContext)?.ToString() ?? (Icon?.Invoke(renderContext) is ImageIcon imageIcon ? imageIcon.Uri?.ToString() : null))
                .AddUserAttribute("data-color", (Color?.Invoke(renderContext) ?? TypeColorSelection.Default) != TypeColorSelection.Default
                    ? (Color?.Invoke(renderContext) ?? TypeColorSelection.Default).ToClass()
                    : null)
                .Add(Content?.Invoke(renderContext)?.Render(renderContext, visualTree));

            if (Selected?.Invoke(renderContext) == true)
            {
                html.AddUserAttribute("selected");
            }

            if (Disabled?.Invoke(renderContext) == true)
            {
                html.AddUserAttribute("disabled");
            }

            return html;
        }
    }
}
