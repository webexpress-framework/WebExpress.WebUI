using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the table control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTable
    {
        /// <summary>
        /// Tests the id property of the table control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-table""><div class=""wx-table-columns""></div></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-table""><div class=""wx-table-columns""></div></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the table border property of the table control.
        /// </summary>
        [Theory]
        [InlineData(TypeTableBorder.Default, @"<div class=""wx-webui-table""><div class=""wx-table-columns""></div></div>")]
        [InlineData(TypeTableBorder.Borderless, @"<div class=""wx-webui-table"" data-border=""table-borderless""><div class=""wx-table-columns""></div></div>")]
        [InlineData(TypeTableBorder.Bordered, @"<div class=""wx-webui-table"" data-border=""table-bordered""><div class=""wx-table-columns""></div></div>")]
        public void TableBorder(TypeTableBorder border, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable
            {
                TableBorder = border
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the striped property of the table control.
        /// </summary>
        [Theory]
        [InlineData(TypeTableStriped.Default, @"<div class=""wx-webui-table""><div class=""wx-table-columns""></div></div>")]
        [InlineData(TypeTableStriped.Column, @"<div class=""wx-webui-table"" data-striped=""table-striped-columns""><div class=""wx-table-columns""></div></div>")]
        [InlineData(TypeTableStriped.Row, @"<div class=""wx-webui-table"" data-striped=""table-striped""><div class=""wx-table-columns""></div></div>")]
        [InlineData(TypeTableStriped.Both, @"<div class=""wx-webui-table"" data-striped=""table-striped-columns table-striped""><div class=""wx-table-columns""></div></div>")]
        public void Striped(TypeTableStriped striped, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable
            {
                Striped = striped
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the table control.
        /// </summary>
        [Theory]
        [InlineData(TypeTableColor.Default, @"<div class=""wx-webui-table"">*</div>")]
        [InlineData(TypeTableColor.Primary, @"<div class=""wx-webui-table"" data-color=""table-primary"">*</div>")]
        [InlineData(TypeTableColor.Secondary, @"<div class=""wx-webui-table"" data-color=""table-secondary"">*</div>")]
        [InlineData(TypeTableColor.Info, @"<div class=""wx-webui-table"" data-color=""table-info"">*</div>")]
        [InlineData(TypeTableColor.Success, @"<div class=""wx-webui-table"" data-color=""table-success"">*</div>")]
        [InlineData(TypeTableColor.Warning, @"<div class=""wx-webui-table"" data-color=""table-warning"">*</div>")]
        [InlineData(TypeTableColor.Danger, @"<div class=""wx-webui-table"" data-color=""table-danger"">*</div>")]
        [InlineData(TypeTableColor.Light, @"<div class=""wx-webui-table"" data-color=""table-light"">*</div>")]
        [InlineData(TypeTableColor.Dark, @"<div class=""wx-webui-table"" data-color=""table-dark"">*</div>")]
        public void Color(TypeTableColor color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable
            {
                Color = color
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a column to the table.
        /// </summary>
        [Fact]
        public void AddColumn()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable();

            // add column
            control.AddColumn("Column 1");

            // test execution
            var html = control.Render(context, visualTree);

            // expected HTML
            var expected = @"<div class=""wx-webui-table""><div class=""wx-table-columns""><div>Column 1</div></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding rows to the table.
        /// </summary>
        [Fact]
        public void AddRow()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable();

            // add rows
            control.AddRow(new ControlTableCell());
            control.AddRow(new ControlTableCell());

            // test execution
            var html = control.Render(context, visualTree);

            // expected HTML
            var expected = @"<div class=""wx-webui-table""><div class=""wx-table-columns""></div><div class=""wx-table-row""><div></div></div><div class=""wx-table-row""><div></div></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

    }
}
