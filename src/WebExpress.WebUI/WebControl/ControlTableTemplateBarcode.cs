using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control that renders a barcode in a table using a template.
    /// Made editable it becomes an inline edit: the cell shows the symbol and
    /// swaps to a text field with a live preview when it is edited.
    /// </summary>
    public class ControlTableTemplateBarcode : IControlTableTemplateEditable
    {
        /// <summary>
        /// Gets or sets the unique identifier for the object.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the current template is editable or read-only.
        /// </summary>
        public Func<IRenderControlContext, bool> Editable { get; set; }

        /// <summary>
        /// Gets or sets the symbology. Defaults to <see cref="TypeBarcode.Code128"/>.
        /// </summary>
        public Func<IRenderControlContext, TypeBarcode> Type { get; set; }

        /// <summary>
        /// Gets or sets the error correction level, which applies to
        /// <see cref="TypeBarcode.QR"/> only.
        /// </summary>
        public Func<IRenderControlContext, TypeErrorCorrectionBarcode> ErrorCorrection { get; set; }

        /// <summary>
        /// Gets or sets the color of the modules.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the color of the quiet zone.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackground> BackgroundColor { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlTableTemplateBarcode(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var type = Type?.Invoke(renderContext) ?? TypeBarcode.Default;
            var errorCorrection = ErrorCorrection?.Invoke(renderContext) ?? TypeErrorCorrectionBarcode.Default;
            var editable = Editable?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);
            var backgroundColor = BackgroundColor?.Invoke(renderContext);

            return new HtmlElement("template")
            {
                Id = Id
            }
                .AddUserAttribute("data-type", "barcode")
                // the symbology cannot travel as data-type: that one already
                // names the renderer this template selects
                .AddUserAttribute("data-barcode-type", type != TypeBarcode.Default ? type.ToValue() : null)
                .AddUserAttribute("data-level", type == TypeBarcode.QR && errorCorrection != TypeErrorCorrectionBarcode.Default ? errorCorrection.ToValue() : null)
                .AddUserAttribute("data-editable", editable == true ? "true" : null)
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-bgcolor-css", backgroundColor?.ToClass())
                .AddUserAttribute("data-bgcolor-style", backgroundColor?.ToStyle());
        }
    }
}
