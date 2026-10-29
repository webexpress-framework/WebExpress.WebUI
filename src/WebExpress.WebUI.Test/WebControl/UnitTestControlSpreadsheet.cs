using System.Text.Json.Nodes;
using WebExpress.WebCore.WebParameter;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;
using WebExpress.WebUI.WebSpreadsheet;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the spreadsheet control and its form input.
    /// </summary>
    public class UnitTestControlSpreadsheet
    {
        /// <summary>
        /// Tests the id property of the spreadsheet control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-spreadsheet"" data-locale=""*""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-spreadsheet"" data-locale=""*""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSpreadsheet(id);

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the workbook is rendered as its JSON value.
        /// </summary>
        [Fact]
        public void WorkbookIsRenderedAsValue()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var workbook = new SpreadsheetWorkbook();
            workbook.AddSheet("Plan").SetValue("A1", "<b>x</b>");
            var control = new ControlSpreadsheet("sheet") { Workbook = _ => workbook, Locale = _ => "de" };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains("data-locale=\"de\"", html);
            Assert.DoesNotContain("<b>x</b>", html);
            var value = System.Net.WebUtility.HtmlDecode(System.Text.RegularExpressions.Regex.Match(html, "value=\"([^\"]*)\"").Groups[1].Value);
            Assert.Equal("<b>x</b>", (string)JsonNode.Parse(value)!["sheets"]![0]!["cells"]!["A1"]!["v"]!);
        }

        /// <summary>
        /// Tests that every option becomes a data attribute.
        /// </summary>
        [Fact]
        public void OptionsBecomeDataAttributes()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSpreadsheet("sheet")
            {
                ReadOnly = _ => true,
                Toolbar = _ => false,
                FormulaBar = _ => false,
                SheetTabs = _ => false,
                StatusBar = _ => true,
                Rows = _ => 50,
                Columns = _ => 8,
                GridHeight = _ => "30rem",
                Fill = _ => true,
                Locale = _ => "en",
                HistoryLimit = _ => 100,
                HistoryMerge = _ => 500,
                Zoom = _ => 125,
                LoadUri = _ => new UriEndpoint("/api/book"),
                SaveUri = _ => new UriEndpoint("/api/book"),
                SaveMethod = _ => "POST",
                Autosave = _ => 2000,
                UserName = _ => "Ann"
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            foreach (var expected in new[]
            {
                "data-readonly=\"true\"", "data-toolbar=\"false\"", "data-formula-bar=\"false\"", "data-sheet-tabs=\"false\"",
                "data-rows=\"50\"", "data-cols=\"8\"", "data-fill=\"true\"", "data-locale=\"en\"", "data-history-limit=\"100\"",
                "data-history-merge=\"500\"", "data-zoom=\"125\"", "data-load-uri=\"/api/book\"", "data-save-uri=\"/api/book\"",
                "data-save-method=\"POST\"", "data-autosave=\"2000\"", "data-user-name=\"Ann\"", "--wx-spreadsheet-height: 30rem"
            })
            {
                Assert.Contains(expected, html);
            }

            Assert.DoesNotContain("data-status-bar", html);
        }

        /// <summary>
        /// Tests that the form input renders the posted workbook in its validated form, its name
        /// and its required mark.
        /// </summary>
        [Fact]
        public void FormInputRendersValidatedValue()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("book", """{"sheets":[{"name":"S","cells":{"A1":{"v":1,"s":{"color":"url(x)"}}}}]}""", ParameterScope.Parameter)
            ), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSpreadsheet("book")
            {
                Required = _ => true,
                Disabled = _ => true,
                Toolbar = _ => false,
                FormulaBar = _ => false,
                SheetTabs = _ => false,
                StatusBar = _ => false,
                Rows = _ => 10,
                Columns = _ => 3,
                GridHeight = _ => "10rem",
                Fill = _ => false,
                Locale = _ => "de",
                HistoryLimit = _ => 20,
                Zoom = _ => 90,
                UserName = _ => "Ann",
                ReadOnly = _ => false
            };
            control.Initialize(context);

            // act
            var html = control.Render(context, visualTree).ToString();
            var workbook = control.GetWorkbook(context);

            // validation
            Assert.Contains("class=\"wx-webui-spreadsheet disabled\"", html);
            Assert.Contains("name=\"book\"", html);
            Assert.Contains("data-required=\"true\"", html);
            Assert.Contains("data-disabled=\"true\"", html);
            Assert.DoesNotContain("url(x)", html);
            Assert.Equal(1d, workbook.Sheets[0].GetValue("A1"));
            Assert.False(control.IsLabelable(context));
            Assert.NotNull(control.Toolbar);
            Assert.NotNull(control.FormulaBar);
            Assert.NotNull(control.SheetTabs);
            Assert.NotNull(control.StatusBar);
            Assert.NotNull(control.Rows);
            Assert.NotNull(control.Columns);
            Assert.NotNull(control.GridHeight);
            Assert.NotNull(control.Fill);
            Assert.NotNull(control.Locale);
            Assert.NotNull(control.HistoryLimit);
            Assert.NotNull(control.Zoom);
            Assert.NotNull(control.UserName);
            Assert.NotNull(control.ReadOnly);
        }

        /// <summary>
        /// Tests the validation of the form input: a required empty workbook, an invalid value
        /// and a valid one.
        /// </summary>
        [Theory]
        [InlineData("", true, 1)]
        [InlineData("""{"sheets":[{"name":"S"}]}""", true, 1)]
        [InlineData("""{"sheets":[{"name":"S","cells":{"A1":{"s":{"bold":true}}}}]}""", true, 1)]
        [InlineData("""{"sheets":[{"name":"S","cells":{"A1":1}}]}""", true, 0)]
        [InlineData("""{ broken""", false, 1)]
        [InlineData("""{ broken""", true, 1)]
        [InlineData("", false, 0)]
        public void FormInputValidates(string posted, bool required, int errors)
        {
            // arrange
            UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("book", posted, ParameterScope.Parameter)
            ), form);
            var control = new ControlFormItemInputSpreadsheet("book") { Required = _ => required };
            control.Initialize(context);

            // act
            var results = control.Validate(context).ToList();

            // validation
            Assert.Equal(errors, results.Count);
            if (posted.StartsWith("{ broken"))
            {
                Assert.Null(control.GetWorkbook(context));
            }
        }

        /// <summary>
        /// Tests that a disabled form input is not validated.
        /// </summary>
        [Fact]
        public void DisabledFormInputIsNotValidated()
        {
            UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("book", "{ broken", ParameterScope.Parameter)
            ), form);
            var control = new ControlFormItemInputSpreadsheet("book") { Disabled = _ => true };
            control.Initialize(context);

            Assert.Empty(control.Validate(context));
            Assert.NotNull(new ControlFormItemInputSpreadsheet().Id);
        }
    }
}
