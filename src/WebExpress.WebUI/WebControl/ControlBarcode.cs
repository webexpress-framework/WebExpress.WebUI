using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a read-only barcode: a value encoded as a scannable graphic,
    /// either as a linear symbology or as a QR code. It is purely a display
    /// control; to let the user edit the encoded value use
    /// <see cref="ControlFormItemInputBarcode"/> instead, and to edit it in place
    /// inside a table use <see cref="ControlTableTemplateBarcode"/>.
    /// </summary>
    /// <remarks>
    /// The control only emits a host element carrying the value and its settings
    /// as data attributes; the symbol itself is drawn by the client runtime (see
    /// webexpress.webui.barcode.js) as inline svg. Encoding on the client keeps
    /// the rendered markup small, lets the value change without a round trip, and
    /// avoids shipping a raster image that would blur when printed.
    /// </remarks>
    public class ControlBarcode : Control
    {
        /// <summary>
        /// Gets or sets the value the symbol encodes.
        /// </summary>
        public Func<IRenderControlContext, string> Value { get; set; }

        /// <summary>
        /// Gets or sets the color of the modules - the bars of a linear symbology
        /// or the squares of a QR code. Accepts a palette color as well as a
        /// custom one.
        /// </summary>
        /// <remarks>
        /// A scanner reads a barcode by contrast and expects a dark symbol on a
        /// light ground, so a light color needs a dark <see cref="BackgroundColor"/>
        /// to stay readable. Colors that are close to each other do not scan at
        /// all, however good they look on screen.
        /// </remarks>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the color of the quiet zone, the margin the symbol needs
        /// around itself to be found by a scanner.
        /// </summary>
        /// <remarks>
        /// The property is emitted for the client to apply to the symbol rather
        /// than being folded into the classes of the host, so that the quiet
        /// zone and the modules are colored by the same mechanism.
        /// </remarks>
        public override Func<IRenderControlContext, PropertyColorBackground> BackgroundColor
        {
            get => (Func<IRenderControlContext, PropertyColorBackground>)GetPropertyObjectValue();
            set => SetProperty(value, null, null);
        }

        /// <summary>
        /// Gets or sets the symbology. Defaults to <see cref="TypeBarcode.Code128"/>.
        /// </summary>
        public Func<IRenderControlContext, TypeBarcode> Type { get; set; }

        /// <summary>
        /// Gets or sets the error correction level. It applies to
        /// <see cref="TypeBarcode.QR"/> only, where a higher level survives more
        /// damage at the cost of capacity.
        /// </summary>
        public Func<IRenderControlContext, TypeErrorCorrectionBarcode> ErrorCorrection { get; set; }

        /// <summary>
        /// Gets or sets the height of the bars in pixels. It applies to the
        /// linear symbologies; a QR code is square and takes its extent from the
        /// module width instead.
        /// </summary>
        public Func<IRenderControlContext, int> BarHeight { get; set; } = _ => -1;

        /// <summary>
        /// Gets or sets the width of a single module in pixels, which is what
        /// scales the symbol. Scanners need a module of a certain size to resolve
        /// the symbol at all, so this is the setting to raise when a printed code
        /// is not read rather than the css size.
        /// </summary>
        public Func<IRenderControlContext, int> ModuleWidth { get; set; } = _ => -1;

        /// <summary>
        /// Gets or sets whether the encoded value is printed below a linear
        /// symbol, so it stays readable when the symbol does not scan.
        /// </summary>
        public Func<IRenderControlContext, bool> ShowText { get; set; } = _ => true;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlBarcode(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var type = Type?.Invoke(renderContext) ?? TypeBarcode.Default;
            var errorCorrection = ErrorCorrection?.Invoke(renderContext) ?? TypeErrorCorrectionBarcode.Default;
            var barHeight = BarHeight?.Invoke(renderContext) ?? -1;
            var moduleWidth = ModuleWidth?.Invoke(renderContext) ?? -1;
            var color = Color?.Invoke(renderContext);
            var backgroundColor = BackgroundColor?.Invoke(renderContext);

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-barcode", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("data-value", Value?.Invoke(renderContext))
                // the defaults are implied; only a deviation is emitted, which
                // keeps the markup free of settings nobody chose
                .AddUserAttribute("data-type", type != TypeBarcode.Default ? type.ToValue() : null)
                .AddUserAttribute("data-level", type == TypeBarcode.QR && errorCorrection != TypeErrorCorrectionBarcode.Default ? errorCorrection.ToValue() : null)
                .AddUserAttribute("data-height", barHeight > 0 ? barHeight.ToString() : null)
                .AddUserAttribute("data-module", moduleWidth > 0 ? moduleWidth.ToString() : null)
                .AddUserAttribute("data-text", ShowText?.Invoke(renderContext) == false ? "false" : null)
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-bgcolor-css", backgroundColor?.ToClass())
                .AddUserAttribute("data-bgcolor-style", backgroundColor?.ToStyle());
        }
    }
}
