using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the dashboard widget control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlDashboardWidget
    {
        /// <summary>
        /// Tests the id property of the dashboard widget control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dashboard-widget""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-dashboard-widget""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDashboardWidget(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the dashboard widget control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dashboard-widget""></div>")]
        [InlineData("", @"<div class=""wx-dashboard-widget""></div>")]
        [InlineData("abc", @"<div class=""wx-dashboard-widget"" data-title=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-dashboard-widget"" data-title=""WebExpress.WebUI""></div>")]
        public void Title(string title, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDashboardWidget()
            {
                Title = title
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the dashboard widget control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dashboard-widget""></div>")]
        [InlineData("red", @"<div class=""wx-dashboard-widget"" data-color=""red""></div>")]
        public void Color(string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDashboardWidget()
            {
                Color = color
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the column property of the dashboard widget control.
        /// </summary>
        [Theory]
        [InlineData(uint.MaxValue, @"<div class=""wx-dashboard-widget""></div>")]
        [InlineData(0, @"<div class=""wx-dashboard-widget"" data-column=""0""></div>")]
        [InlineData(10, @"<div class=""wx-dashboard-widget"" data-column=""10""></div>")]
        public void Column(uint column, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDashboardWidget()
            {
                Column = column
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the movable property of the dashboard widget control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-dashboard-widget""></div>")]
        [InlineData(true, @"<div class=""wx-dashboard-widget"" data-movable=""true""></div>")]
        public void Moveable(bool movable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDashboardWidget()
            {
                Movable = movable
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the widget property of the dashboard widget control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dashboard-widget""></div>")]
        [InlineData("", @"<div class=""wx-dashboard-widget""></div>")]
        [InlineData("abc", @"<div class=""wx-dashboard-widget"" data-widget=""abc""></div>")]
        public void Widget(string widget, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDashboardWidget()
            {
                Widget = widget
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the dashboard widget control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dashboard-widget""></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-dashboard-widget"" data-icon=""fas fa-folder""></div>")]
        [InlineData(typeof(ImageIconWebExpress), @"<div class=""wx-dashboard-widget"" data-image=""/assets/img/webexpress.svg""></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlDashboardWidget(null)
            {
                Icon = icon
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
