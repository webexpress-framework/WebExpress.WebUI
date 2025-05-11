using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the table column control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableColumn
    {
        /// <summary>
        /// Tests the id property of the table column control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<th><div></div></th>")]
        [InlineData("id", @"<th id=""id""><div id=""id""></div></th>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the table column control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<th><div></div></th>")]
        [InlineData("abc", @"<th><div>abc</div></th>")]
        [InlineData("webexpress.webui:plugin.name", @"<th><div>WebExpress.WebUI</div></th>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn()
            {
                Text = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the layout property of the table column control.
        /// </summary>
        [Theory]
        [InlineData(TypesLayoutTableRow.Default, @"<th><div></div></th>")]
        [InlineData(TypesLayoutTableRow.Primary, @"<th class=""table-primary""><div class=""table-primary""></div></th>")]
        [InlineData(TypesLayoutTableRow.Secondary, @"<th class=""table-secondary""><div class=""table-secondary""></div></th>")]
        [InlineData(TypesLayoutTableRow.Info, @"<th class=""table-info""><div class=""table-info""></div></th>")]
        [InlineData(TypesLayoutTableRow.Success, @"<th class=""table-success""><div class=""table-success""></div></th>")]
        [InlineData(TypesLayoutTableRow.Warning, @"<th class=""table-warning""><div class=""table-warning""></div></th>")]
        [InlineData(TypesLayoutTableRow.Danger, @"<th class=""table-danger""><div class=""table-danger""></div></th>")]
        [InlineData(TypesLayoutTableRow.Light, @"<th class=""table-light""><div class=""table-light""></div></th>")]
        [InlineData(TypesLayoutTableRow.Dark, @"<th class=""table-dark""><div class=""table-dark""></div></th>")]
        public void Layout(TypesLayoutTableRow layout, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn()
            {
                Layout = layout
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the table column control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<th><div></div></th>")]
        [InlineData(typeof(IconStar), @"<th><div><i class=""fas fa-star""></i></div></th>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
