using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;
using WebExpress.WebUI.WebSpreadsheet;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a spreadsheet as a form input: the workbook is posted as JSON with the form and
    /// read back as a <see cref="SpreadsheetWorkbook"/> through <see cref="GetWorkbook"/>.
    /// </summary>
    /// <remarks>
    /// The posted value comes from the client, so it is parsed and validated on the server; a
    /// value that is no workbook fails validation instead of reaching the page. A required
    /// spreadsheet counts as missing while no sheet holds a value or a formula.
    /// </remarks>
    public class ControlFormItemInputSpreadsheet : ControlFormItemInput<ControlFormInputValueString>
    {
        private readonly ControlSpreadsheet _host;

        /// <summary>
        /// Gets or sets whether the toolbar is shown.
        /// </summary>
        public Func<IRenderControlContext, bool> Toolbar { get => _host.Toolbar; set => _host.Toolbar = value; }

        /// <summary>
        /// Gets or sets whether the name box and the formula bar are shown.
        /// </summary>
        public Func<IRenderControlContext, bool> FormulaBar { get => _host.FormulaBar; set => _host.FormulaBar = value; }

        /// <summary>
        /// Gets or sets whether the sheet tabs are shown.
        /// </summary>
        public Func<IRenderControlContext, bool> SheetTabs { get => _host.SheetTabs; set => _host.SheetTabs = value; }

        /// <summary>
        /// Gets or sets whether the status bar is shown.
        /// </summary>
        public Func<IRenderControlContext, bool> StatusBar { get => _host.StatusBar; set => _host.StatusBar = value; }

        /// <summary>
        /// Gets or sets the number of rows of a new sheet.
        /// </summary>
        public Func<IRenderControlContext, int?> Rows { get => _host.Rows; set => _host.Rows = value; }

        /// <summary>
        /// Gets or sets the number of columns of a new sheet.
        /// </summary>
        public Func<IRenderControlContext, int?> Columns { get => _host.Columns; set => _host.Columns = value; }

        /// <summary>
        /// Gets or sets the height of the grid, as any css length.
        /// </summary>
        public Func<IRenderControlContext, string> GridHeight { get => _host.GridHeight; set => _host.GridHeight = value; }

        /// <summary>
        /// Gets or sets whether the spreadsheet takes the height its page or dialog has left over.
        /// </summary>
        public Func<IRenderControlContext, bool> Fill { get => _host.Fill; set => _host.Fill = value; }

        /// <summary>
        /// Gets or sets the language of the number and date conventions.
        /// </summary>
        public Func<IRenderControlContext, string> Locale { get => _host.Locale; set => _host.Locale = value; }

        /// <summary>
        /// Gets or sets how many undo steps are kept.
        /// </summary>
        public Func<IRenderControlContext, int?> HistoryLimit { get => _host.HistoryLimit; set => _host.HistoryLimit = value; }

        /// <summary>
        /// Gets or sets the zoom in percent.
        /// </summary>
        public Func<IRenderControlContext, int?> Zoom { get => _host.Zoom; set => _host.Zoom = value; }

        /// <summary>
        /// Gets or sets the name written as the author of new comments.
        /// </summary>
        public Func<IRenderControlContext, string> UserName { get => _host.UserName; set => _host.UserName = value; }

        /// <summary>
        /// Gets or sets whether the workbook can be viewed but not changed.
        /// </summary>
        public Func<IRenderControlContext, bool> ReadOnly { get => _host.ReadOnly; set => _host.ReadOnly = value; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormItemInputSpreadsheet()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputSpreadsheet(string id)
            : base(id)
        {
            _host = new ControlSpreadsheet(id);
        }

        /// <summary>
        /// Determines whether a label element may point at the field. The client moves the name to
        /// a hidden input and the focus to the grid inside the host, so the caption is a span the
        /// grid is labelled by.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>Always false.</returns>
        public override bool IsLabelable(IRenderControlFormContext renderContext) => false;

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text;
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var classes = Classes.ToList();

            if (disabled)
            {
                classes.Add("disabled");
            }

            // a value the client posted is re-rendered only in its validated form
            var workbook = SpreadsheetWorkbook.TryParse(value, out var parsed) ? parsed.ToJson() : null;

            return _host.RenderHost(renderContext, "wx-webui-spreadsheet", Css.Concatenate(classes.ToArray()), GetStyles(renderContext), workbook)
                .AddUserAttribute("name", Name?.Invoke(renderContext))
                .AddUserAttribute("data-disabled", disabled ? "true" : null)
                .AddUserAttribute("aria-disabled", disabled ? "true" : null)
                .AddUserAttribute("data-required", RequiredMark(renderContext));
        }

        /// <summary>
        /// Reads the submitted workbook.
        /// </summary>
        /// <param name="renderContext">The context in which the form is processed.</param>
        /// <returns>The workbook, or null if none was submitted or it is invalid.</returns>
        public SpreadsheetWorkbook GetWorkbook(IRenderControlFormContext renderContext)
        {
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text;

            return SpreadsheetWorkbook.TryParse(value, out var workbook) ? workbook : null;
        }

        /// <summary>
        /// Gets the i18n key of the message the required rule reports.
        /// </summary>
        protected override string RequiredMessage => "webexpress.webui:form.inputspreadsheet.validation.required";

        /// <summary>
        /// Determines whether the workbook is missing: no value at all, or no sheet holding a value
        /// or a formula. A value that cannot be read is no missing value but an invalid one, which
        /// the validation reports on its own.
        /// </summary>
        /// <param name="value">The submitted value.</param>
        /// <param name="renderContext">The context in which the inputs are validated.</param>
        /// <returns>True when nothing was entered.</returns>
        protected override bool IsEmpty(ControlFormInputValueString value, IRenderControlFormContext renderContext)
        {
            if (string.IsNullOrWhiteSpace(value?.Text))
            {
                return true;
            }

            return SpreadsheetWorkbook.TryParse(value.Text, out var workbook) && workbook.IsEmpty;
        }

        /// <summary>
        /// Validates the submitted workbook.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated.</param>
        /// <returns>The validation results.</returns>
        public override IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            var results = new List<ValidationResult>(base.Validate(renderContext));

            if (Disabled?.Invoke(renderContext) ?? false)
            {
                return [];
            }

            if (IsMissing(renderContext))
            {
                return results;
            }

            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text;

            if (!string.IsNullOrWhiteSpace(value))
            {
                try
                {
                    SpreadsheetWorkbook.Parse(value);
                }
                catch (JsonException)
                {
                    results.Add(new ValidationResult(TypeInputValidity.Error, "webexpress.webui:spreadsheet.state.invalid"));
                }
            }

            return results;
        }

        /// <summary>
        /// Creates a value from its string representation.
        /// </summary>
        /// <param name="value">The posted JSON.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The value.</returns>
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(value);
        }
    }
}
