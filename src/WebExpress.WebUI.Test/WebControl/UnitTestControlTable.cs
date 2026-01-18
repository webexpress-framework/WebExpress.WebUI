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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the table border property of the table control.
        /// </summary>
        [Theory]
        [InlineData(TypeBorderTable.Default, @"<div class=""wx-webui-table""><div class=""wx-table-columns""></div></div>")]
        [InlineData(TypeBorderTable.Borderless, @"<div class=""wx-webui-table"" data-border=""table-borderless""><div class=""wx-table-columns""></div></div>")]
        [InlineData(TypeBorderTable.Bordered, @"<div class=""wx-webui-table"" data-border=""table-bordered""><div class=""wx-table-columns""></div></div>")]
        public void TableBorder(TypeBorderTable border, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable
            {
                TableBorder = border
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the striped property of the table control.
        /// </summary>
        [Theory]
        [InlineData(TypeStripedTable.Default, @"<div class=""wx-webui-table""><div class=""wx-table-columns""></div></div>")]
        [InlineData(TypeStripedTable.Column, @"<div class=""wx-webui-table"" data-striped=""table-striped-columns""><div class=""wx-table-columns""></div></div>")]
        [InlineData(TypeStripedTable.Row, @"<div class=""wx-webui-table"" data-striped=""table-striped""><div class=""wx-table-columns""></div></div>")]
        [InlineData(TypeStripedTable.Both, @"<div class=""wx-webui-table"" data-striped=""table-striped-columns table-striped""><div class=""wx-table-columns""></div></div>")]
        public void Striped(TypeStripedTable striped, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable
            {
                Striped = striped
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the table control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorTable.Default, @"<div class=""wx-webui-table"">*</div>")]
        [InlineData(TypeColorTable.Primary, @"<div class=""wx-webui-table"" data-color=""table-primary"">*</div>")]
        [InlineData(TypeColorTable.Secondary, @"<div class=""wx-webui-table"" data-color=""table-secondary"">*</div>")]
        [InlineData(TypeColorTable.Info, @"<div class=""wx-webui-table"" data-color=""table-info"">*</div>")]
        [InlineData(TypeColorTable.Success, @"<div class=""wx-webui-table"" data-color=""table-success"">*</div>")]
        [InlineData(TypeColorTable.Warning, @"<div class=""wx-webui-table"" data-color=""table-warning"">*</div>")]
        [InlineData(TypeColorTable.Danger, @"<div class=""wx-webui-table"" data-color=""table-danger"">*</div>")]
        [InlineData(TypeColorTable.Light, @"<div class=""wx-webui-table"" data-color=""table-light"">*</div>")]
        [InlineData(TypeColorTable.Dark, @"<div class=""wx-webui-table"" data-color=""table-dark"">*</div>")]
        public void Color(TypeColorTable color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable
            {
                Color = color
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the suppress headers property of the table control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-table"">*</div>")]
        [InlineData(true, @"<div class=""wx-webui-table""><div class=""wx-table-columns"" data-suppress-headers=""true""></div></div>")]
        public void SuppressHeaders(bool suppressHeaders, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable
            {
                SuppressHeaders = suppressHeaders
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a column to the table.
        /// </summary>
        [Fact]
        public void AddColumn()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable();

            // add column
            control.AddColumn("Column 1");

            // act
            var html = control.Render(context, visualTree);

            // expected HTML
            var expected = @"<div class=""wx-webui-table""><div class=""wx-table-columns""><div data-label=""Column 1""></div></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding rows to the table.
        /// </summary>
        [Fact]
        public void AddRow()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTable();

            // add rows
            control.AddRow(new ControlTableCell());
            control.AddRow(new ControlTableCell());

            // act
            var html = control.Render(context, visualTree);

            // expected HTML
            var expected = @"<div class=""wx-webui-table""><div class=""wx-table-columns""></div><div class=""wx-table-row""><div></div></div><div class=""wx-table-row""><div></div></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

    }
}
