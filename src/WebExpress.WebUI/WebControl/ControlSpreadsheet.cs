using System;
using System.Globalization;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;
using WebExpress.WebUI.WebSpreadsheet;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a spreadsheet: workbooks with several sheets, formulas, number and date formats,
    /// cell formatting, the clipboard formats of the common spreadsheets, undo and redo, and
    /// real-time collaboration.
    /// </summary>
    /// <remarks>
    /// The control emits a host element carrying the workbook as JSON and its options as data
    /// attributes; the grid, the formula engine and all interaction are built by the client
    /// runtime (webexpress.webui.spreadsheet*.js). Inside a <c>ControlCollaborative</c> of WebApp
    /// the workbook is shared automatically. For a spreadsheet whose workbook is posted with a
    /// form, use <see cref="ControlFormItemInputSpreadsheet"/>.
    /// </remarks>
    public class ControlSpreadsheet : Control
    {
        /// <summary>
        /// Gets or sets the workbook shown.
        /// </summary>
        public Func<IRenderControlContext, SpreadsheetWorkbook> Workbook { get; set; }

        /// <summary>
        /// Gets or sets whether the workbook can be viewed but not changed.
        /// </summary>
        public Func<IRenderControlContext, bool> ReadOnly { get; set; }

        /// <summary>
        /// Gets or sets whether the toolbar is shown.
        /// </summary>
        public Func<IRenderControlContext, bool> Toolbar { get; set; }

        /// <summary>
        /// Gets or sets whether the name box and the formula bar are shown.
        /// </summary>
        public Func<IRenderControlContext, bool> FormulaBar { get; set; }

        /// <summary>
        /// Gets or sets whether the sheet tabs are shown.
        /// </summary>
        public Func<IRenderControlContext, bool> SheetTabs { get; set; }

        /// <summary>
        /// Gets or sets whether the status bar with the mode and the aggregates of the selection is shown.
        /// </summary>
        public Func<IRenderControlContext, bool> StatusBar { get; set; }

        /// <summary>
        /// Gets or sets the number of rows of a new sheet (default 1000).
        /// </summary>
        public Func<IRenderControlContext, int?> Rows { get; set; }

        /// <summary>
        /// Gets or sets the number of columns of a new sheet (default 26).
        /// </summary>
        public Func<IRenderControlContext, int?> Columns { get; set; }

        /// <summary>
        /// Gets or sets the height of the grid, as any css length, such as "30rem".
        /// </summary>
        public Func<IRenderControlContext, string> GridHeight { get; set; }

        /// <summary>
        /// Gets or sets whether the spreadsheet takes the height its page or dialog has left over.
        /// </summary>
        /// <remarks>
        /// The height is a viewport calculation, as for the rich-text editor; the amount of chrome
        /// above and below is subtracted through the <c>--wx-spreadsheet-fill-offset</c> custom
        /// property (default 20rem).
        /// </remarks>
        public Func<IRenderControlContext, bool> Fill { get; set; }

        /// <summary>
        /// Gets or sets the language whose number, date and truth value conventions apply to input
        /// and display. When unset, the language of the request is used.
        /// </summary>
        public Func<IRenderControlContext, string> Locale { get; set; }

        /// <summary>
        /// Gets or sets how many undo steps are kept (default 500).
        /// </summary>
        public Func<IRenderControlContext, int?> HistoryLimit { get; set; }

        /// <summary>
        /// Gets or sets the time in milliseconds within which related changes, such as the steps
        /// of resizing one column, merge into one undo step (default 1000).
        /// </summary>
        public Func<IRenderControlContext, int?> HistoryMerge { get; set; }

        /// <summary>
        /// Gets or sets the zoom in percent (default 100).
        /// </summary>
        public Func<IRenderControlContext, int?> Zoom { get; set; }

        /// <summary>
        /// Gets or sets the endpoint the workbook is loaded from as JSON when the page renders no workbook.
        /// </summary>
        public Func<IRenderControlContext, IUri> LoadUri { get; set; }

        /// <summary>
        /// Gets or sets the endpoint the workbook is saved to as JSON (see the save method of the control).
        /// </summary>
        public Func<IRenderControlContext, IUri> SaveUri { get; set; }

        /// <summary>
        /// Gets or sets the HTTP method of saving (default PUT).
        /// </summary>
        public Func<IRenderControlContext, string> SaveMethod { get; set; }

        /// <summary>
        /// Gets or sets the delay in milliseconds after which a changed workbook saves itself; 0
        /// turns autosaving off. Requires <see cref="SaveUri"/>.
        /// </summary>
        public Func<IRenderControlContext, int?> Autosave { get; set; }

        /// <summary>
        /// Gets or sets the name written as the author of new comments and shown to collaborators.
        /// </summary>
        public Func<IRenderControlContext, string> UserName { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSpreadsheet(string id = null)
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
            return RenderHost(renderContext, "wx-webui-spreadsheet", GetClasses(renderContext), GetStyles(renderContext), Workbook?.Invoke(renderContext)?.ToJson());
        }

        /// <summary>
        /// Renders the host element with the workbook and every option as data attributes; the
        /// form input renders through here as well, so both offer the same options.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="marker">The marker class the client registers under.</param>
        /// <param name="classes">The css classes.</param>
        /// <param name="styles">The inline styles.</param>
        /// <param name="value">The workbook as JSON, or null.</param>
        /// <returns>The host element.</returns>
        internal IHtmlElement RenderHost(IRenderControlContext renderContext, string marker, string classes, string styles, string value)
        {
            static string Flag(bool? value, bool fallback) => value is null || value == fallback ? null : value.Value ? "true" : "false";
            static string Number(int? value) => value?.ToString(CultureInfo.InvariantCulture);
            var height = GridHeight?.Invoke(renderContext);
            var locale = Locale?.Invoke(renderContext) ?? renderContext?.Request?.Culture?.TwoLetterISOLanguageName;

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate(marker, classes),
                Style = string.IsNullOrWhiteSpace(height) ? styles : string.Join("; ", new[] { styles, "--wx-spreadsheet-height: " + height }.Where(s => !string.IsNullOrWhiteSpace(s))),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("value", value)
                .AddUserAttribute("data-readonly", ReadOnly?.Invoke(renderContext) == true ? "true" : null)
                .AddUserAttribute("data-toolbar", Flag(Toolbar?.Invoke(renderContext), true))
                .AddUserAttribute("data-formula-bar", Flag(FormulaBar?.Invoke(renderContext), true))
                .AddUserAttribute("data-sheet-tabs", Flag(SheetTabs?.Invoke(renderContext), true))
                .AddUserAttribute("data-status-bar", Flag(StatusBar?.Invoke(renderContext), true))
                .AddUserAttribute("data-rows", Number(Rows?.Invoke(renderContext)))
                .AddUserAttribute("data-cols", Number(Columns?.Invoke(renderContext)))
                .AddUserAttribute("data-fill", Fill?.Invoke(renderContext) == true ? "true" : null)
                .AddUserAttribute("data-locale", locale)
                .AddUserAttribute("data-history-limit", Number(HistoryLimit?.Invoke(renderContext)))
                .AddUserAttribute("data-history-merge", Number(HistoryMerge?.Invoke(renderContext)))
                .AddUserAttribute("data-zoom", Number(Zoom?.Invoke(renderContext)))
                .AddUserAttribute("data-load-uri", LoadUri?.Invoke(renderContext)?.ToString())
                .AddUserAttribute("data-save-uri", SaveUri?.Invoke(renderContext)?.ToString())
                .AddUserAttribute("data-save-method", SaveMethod?.Invoke(renderContext))
                .AddUserAttribute("data-autosave", Number(Autosave?.Invoke(renderContext)))
                .AddUserAttribute("data-user-name", UserName?.Invoke(renderContext));
        }
    }
}
