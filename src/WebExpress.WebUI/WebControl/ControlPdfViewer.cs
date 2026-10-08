using System;
using System.Collections.Generic;
using System.Globalization;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Shows a PDF file inside the page through the viewer the browser brings along. The file
    /// is embedded with an <c>&lt;object&gt;</c> element, so no script and no third-party
    /// renderer are involved: whatever the browser can show inline is shown, and a browser
    /// without an inline viewer - most mobile browsers among them - falls back to a link that
    /// opens the file on its own.
    /// </summary>
    /// <remarks>
    /// The embedded file is governed by the <c>object-src</c> directive of the content security
    /// policy. The default policy of the server allows the own origin only, so a file from
    /// another site has to be allowed there explicitly, and that site must permit being framed.
    /// </remarks>
    public class ControlPdfViewer : Control
    {
        /// <summary>
        /// Gets or sets the address of the PDF file.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the name a screen reader announces for the embedded document. The
        /// viewer is a self-contained region of the page, and without a name it would only be
        /// read out as an unnamed object.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Gets or sets the height in pixels. An object element without a height collapses to
        /// the 150 pixels of a replaced element, which is too small to read a page, so the
        /// stylesheet provides a usable default that this value overrides.
        /// </summary>
        public new Func<IRenderControlContext, int> Height { get; set; }

        /// <summary>
        /// Gets or sets the page the viewer opens at, counting from 1.
        /// </summary>
        public Func<IRenderControlContext, int> Page { get; set; }

        /// <summary>
        /// Gets or sets the zoom factor the viewer opens with, in percent.
        /// </summary>
        public Func<IRenderControlContext, int> Zoom { get; set; }

        /// <summary>
        /// Gets or sets whether the viewer shows its toolbar. Hiding it is a request to the
        /// browser's viewer, not a guarantee: Chromium follows it, Firefox ignores it.
        /// </summary>
        public Func<IRenderControlContext, bool> Toolbar { get; set; } = _ => true;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlPdfViewer(string id = null)
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
            var role = Role?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext)?.ToString();
            var label = I18N.Translate(renderContext, Label?.Invoke(renderContext));
            var height = Height?.Invoke(renderContext) ?? 0;
            var page = Page?.Invoke(renderContext) ?? 0;
            var zoom = Zoom?.Invoke(renderContext) ?? 0;
            var toolbar = Toolbar?.Invoke(renderContext) ?? true;

            var fallback = new HtmlElementTextContentDiv
            (
                new HtmlElementTextContentP(I18N.Translate(renderContext, "webexpress.webui:pdfviewer.fallback"))
            )
            {
                Class = "wx-webui-pdf-viewer-fallback"
            };

            if (!string.IsNullOrWhiteSpace(uri))
            {
                fallback.Add(new HtmlElementTextSemanticsA(I18N.Translate(renderContext, "webexpress.webui:pdfviewer.open"))
                {
                    Href = uri
                });
            }

            var html = new HtmlElementEmbeddedObject(fallback)
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-pdf-viewer", GetClasses(renderContext)),
                Style = Style.Concatenate(GetStyles(renderContext), height > 0 ? $"height: {height}px;" : null),
                Role = role
            };

            return html
                .AddUserAttribute("data", AppendOpenParameters(uri, page, zoom, toolbar))
                .AddUserAttribute("type", "application/pdf")
                .AddUserAttribute("aria-label", !string.IsNullOrWhiteSpace(label) ? label : null);
        }

        /// <summary>
        /// Appends the open parameters to the address of the file. They travel in the fragment,
        /// which the browser hands to its viewer instead of sending it to the server, so the
        /// same cached file can be opened at different places.
        /// </summary>
        /// <param name="uri">The address of the file, may be null.</param>
        /// <param name="page">The page to open, or 0 for the first.</param>
        /// <param name="zoom">The zoom in percent, or 0 for the viewer's choice.</param>
        /// <param name="toolbar">Whether the toolbar stays visible.</param>
        /// <returns>The address with the open parameters, or null without an address.</returns>
        private static string AppendOpenParameters(string uri, int page, int zoom, bool toolbar)
        {
            if (string.IsNullOrWhiteSpace(uri))
            {
                return null;
            }

            var parameters = new List<string>();

            if (page > 0)
            {
                parameters.Add($"page={page.ToString(CultureInfo.InvariantCulture)}");
            }

            if (zoom > 0)
            {
                parameters.Add($"zoom={zoom.ToString(CultureInfo.InvariantCulture)}");
            }

            if (!toolbar)
            {
                parameters.Add("toolbar=0");
            }

            if (parameters.Count == 0)
            {
                return uri;
            }

            // an address that already names a fragment keeps it, the parameters join it
            return uri + (uri.Contains('#') ? "&" : "#") + string.Join("&", parameters);
        }
    }
}
