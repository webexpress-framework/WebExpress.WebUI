using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the stat (metric) control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlStat
    {
        /// <summary>
        /// Tests the id property of the stat control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-stat""><div class=""wx-stat-body""><span class=""wx-stat-value""></span></div></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-stat""><div class=""wx-stat-body""><span class=""wx-stat-value""></span></div></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlStat(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label and value of the stat control.
        /// </summary>
        [Fact]
        public void LabelAndValue()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlStat()
            {
                Label = _ => "Revenue",
                Value = _ => "12.4k"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-stat""><div class=""wx-stat-body""><span class=""wx-stat-label"">Revenue</span><span class=""wx-stat-value"">12.4k</span></div></div>", html);
        }

        /// <summary>
        /// Tests the delta and its trend color.
        /// </summary>
        [Theory]
        [InlineData(TypeStatTrend.Up, @"<div class=""wx-stat""><div class=""wx-stat-body""><span class=""wx-stat-value"">12.4k</span><span class=""wx-stat-delta wx-stat-up"">+12%</span></div></div>")]
        [InlineData(TypeStatTrend.Down, @"<div class=""wx-stat""><div class=""wx-stat-body""><span class=""wx-stat-value"">12.4k</span><span class=""wx-stat-delta wx-stat-down"">+12%</span></div></div>")]
        [InlineData(TypeStatTrend.Neutral, @"<div class=""wx-stat""><div class=""wx-stat-body""><span class=""wx-stat-value"">12.4k</span><span class=""wx-stat-delta wx-stat-neutral"">+12%</span></div></div>")]
        public void Delta(TypeStatTrend trend, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlStat()
            {
                Value = _ => "12.4k",
                Delta = _ => "+12%",
                Trend = _ => trend
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
