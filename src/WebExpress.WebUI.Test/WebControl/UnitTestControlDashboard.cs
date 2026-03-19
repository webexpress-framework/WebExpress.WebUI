using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the dashboard control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlDashboard
    {
        /// <summary>
        /// Tests the id property of the dashboard control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-dashboard""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-dashboard""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDashboard(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a column to the dashboard control.
        /// </summary>
        [Fact]
        public void AddWColumn()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDashboard(null);

            // act
            control.Add(new ControlDashboardColumn("A", "10%"));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-dashboard""><div class=""wx-column"" data-label=""A"" data-size=""10%""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a column to the dashboard control.
        /// </summary>
        [Fact]
        public void AddWColumns()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDashboard(null);

            // act
            control.Add(new ControlDashboardColumn("A", "10%"));
            control.Add(new ControlDashboardColumn("B", "*"));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-dashboard""><div class=""wx-column"" data-label=""A"" data-size=""10%""></div><div class=""wx-column"" data-label=""B"" data-size=""*""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a widget to the dashboard control.
        /// </summary>
        [Fact]
        public void AddWidget()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDashboard(null);

            // act
            control.Add(new ControlDashboardWidget(null));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-dashboard""><div class=""wx-dashboard-widget""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
