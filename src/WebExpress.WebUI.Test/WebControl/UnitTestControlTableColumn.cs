using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the table column.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableColumn
    {
        /// <summary>
        /// Tests the id property of the table column.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("id", @"<div id=""id""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the table column.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("abc", @"<div data-label=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div data-label=""WebExpress.WebUI""></div>")]
        public void Title(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn()
            {
                Title = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the table column.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData(typeof(IconStar), @"<div data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn()
            {
                Icon = icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the table column.
        /// </summary>
        [Theory]
        [InlineData(TypeColorTable.Default, @"<div></div>")]
        [InlineData(TypeColorTable.Primary, @"<div data-color=""table-primary""></div>")]
        [InlineData(TypeColorTable.Secondary, @"<div data-color=""table-secondary""></div>")]
        [InlineData(TypeColorTable.Info, @"<div data-color=""table-info""></div>")]
        [InlineData(TypeColorTable.Success, @"<div data-color=""table-success""></div>")]
        [InlineData(TypeColorTable.Warning, @"<div data-color=""table-warning""></div>")]
        [InlineData(TypeColorTable.Danger, @"<div data-color=""table-danger""></div>")]
        [InlineData(TypeColorTable.Light, @"<div data-color=""table-light""></div>")]
        [InlineData(TypeColorTable.Dark, @"<div data-color=""table-dark""></div>")]
        public void Color(TypeColorTable color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn()
            {
                Color = color
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
