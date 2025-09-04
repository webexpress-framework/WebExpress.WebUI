using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the tabele column template control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableColumnTemplate
    {
        /// <summary>
        /// Tests the id property of the tabele column edit control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("id", @"<div id=""id""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplate(id)
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
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplate()
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
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplate()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the table column.
        /// </summary>
        [Theory]
        [InlineData(TypeTableColor.Default, @"<div></div>")]
        [InlineData(TypeTableColor.Primary, @"<div data-color=""table-primary""></div>")]
        [InlineData(TypeTableColor.Secondary, @"<div data-color=""table-secondary""></div>")]
        [InlineData(TypeTableColor.Info, @"<div data-color=""table-info""></div>")]
        [InlineData(TypeTableColor.Success, @"<div data-color=""table-success""></div>")]
        [InlineData(TypeTableColor.Warning, @"<div data-color=""table-warning""></div>")]
        [InlineData(TypeTableColor.Danger, @"<div data-color=""table-danger""></div>")]
        [InlineData(TypeTableColor.Light, @"<div data-color=""table-light""></div>")]
        [InlineData(TypeTableColor.Dark, @"<div data-color=""table-dark""></div>")]
        public void Color(TypeTableColor color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplate()
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
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplate();
            var template = new ControlDate();

            // test execution
            control.Add(template);

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div><div class=""wx-webui-date""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

    }
}
