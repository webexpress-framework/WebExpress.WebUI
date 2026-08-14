using System;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input that edits the value of a barcode as text and
    /// previews the symbol it encodes while it is typed.
    /// </summary>
    /// <remarks>
    /// The preview is what makes the pairing worth having: a barcode is not
    /// human readable, so a bare text field gives no feedback on whether a value
    /// can be encoded at all. An EAN with a mistyped check digit reads perfectly
    /// well as text and fails only at the scanner; the preview answers that
    /// while the value is still being entered.
    /// </remarks>
    public class ControlFormItemInputBarcode : ControlFormItemInput<ControlFormInputValueString>
    {
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
        /// Gets or sets the placeholder shown while the field is empty.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets the value the field starts at. A value carried by the
        /// form takes precedence, so a submitted value is never overwritten by
        /// the initial one on the way back.
        /// </summary>
        public Func<IRenderControlContext, string> Value { get; set; }

        /// <summary>
        /// Gets or sets the color of the modules in the preview, so the field
        /// shows the symbol in the colors it will be displayed in.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the color of the quiet zone in the preview.
        /// </summary>
        public override Func<IRenderControlContext, PropertyColorBackground> BackgroundColor
        {
            get => (Func<IRenderControlContext, PropertyColorBackground>)GetPropertyObjectValue();
            set => SetProperty(value, null, null);
        }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned id.
        /// </summary>
        public ControlFormItemInputBarcode()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class with a specified id.
        /// </summary>
        /// <param name="id">The unique identifier for the control.</param>
        public ControlFormItemInputBarcode(string id)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.ToString
            (
                null,
                renderContext?.Request?.Culture
            );
            var name = Name?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var type = Type?.Invoke(renderContext) ?? TypeBarcode.Default;
            var errorCorrection = ErrorCorrection?.Invoke(renderContext) ?? TypeErrorCorrectionBarcode.Default;
            var placeholder = Placeholder?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);
            var backgroundColor = BackgroundColor?.Invoke(renderContext);
            var classes = Classes.ToList();

            if (disabled)
            {
                classes.Add("disabled");
            }

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-barcode", classes),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("name", name)
                // an unset form value arrives as an empty string rather than as
                // null, so a null check alone would swallow the initial value
                .AddUserAttribute("data-value", !string.IsNullOrEmpty(value) ? value : Value?.Invoke(renderContext))
                .AddUserAttribute("data-type", type != TypeBarcode.Default ? type.ToValue() : null)
                .AddUserAttribute("data-level", type == TypeBarcode.QR && errorCorrection != TypeErrorCorrectionBarcode.Default ? errorCorrection.ToValue() : null)
                .AddUserAttribute("data-placeholder", I18N.Translate(renderContext, placeholder))
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-bgcolor-css", backgroundColor?.ToClass())
                .AddUserAttribute("data-bgcolor-style", backgroundColor?.ToStyle());
        }

        /// <summary>
        /// Creates a value from the specified string representation.
        /// </summary>
        /// <param name="value">The string representation of the value.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The value.</returns>
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(value);
        }
    }
}
