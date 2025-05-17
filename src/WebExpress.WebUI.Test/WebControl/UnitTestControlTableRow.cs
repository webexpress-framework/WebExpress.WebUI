using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the table row.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableRow
    {
        /// <summary>
        /// Tests the id property of the table row.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-table-row""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-table-row""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableRow(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the table row.
        /// </summary>
        [Theory]
        [InlineData(TypeTableColor.Default, @"<div class=""wx-table-row""></div>")]
        [InlineData(TypeTableColor.Primary, @"<div class=""wx-table-row"" data-color=""table-primary""></div>")]
        [InlineData(TypeTableColor.Secondary, @"<div class=""wx-table-row"" data-color=""table-secondary""></div>")]
        [InlineData(TypeTableColor.Info, @"<div class=""wx-table-row"" data-color=""table-info""></div>")]
        [InlineData(TypeTableColor.Success, @"<div class=""wx-table-row"" data-color=""table-success""></div>")]
        [InlineData(TypeTableColor.Warning, @"<div class=""wx-table-row"" data-color=""table-warning""></div>")]
        [InlineData(TypeTableColor.Danger, @"<div class=""wx-table-row"" data-color=""table-danger""></div>")]
        [InlineData(TypeTableColor.Light, @"<div class=""wx-table-row"" data-color=""table-light""></div>")]
        [InlineData(TypeTableColor.Dark, @"<div class=""wx-table-row"" data-color=""table-dark""></div>")]
        public void Color(TypeTableColor color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableRow()
            {
                Color = color
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the table row.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableRow();

            // test execution
            control.Add(new ControlTableCell() { Text = "abc" });

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-table-row""><div>abc</div></div>", html);
        }
    }
}
