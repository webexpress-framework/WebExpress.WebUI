using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the timeline control and its entries.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTimeline
    {
        /// <summary>
        /// Tests the id property of the timeline control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-timeline""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-timeline""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTimeline(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests a timeline entry with a title and a timestamp.
        /// </summary>
        [Fact]
        public void Item()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTimelineItem()
            {
                Title = _ => "Created",
                Timestamp = _ => "10:00"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-timeline-item""><span class=""wx-timeline-marker""></span><div class=""wx-timeline-content""><div class=""wx-timeline-header""><span class=""wx-timeline-title"">Created</span><span class=""wx-timeline-time"">10:00</span></div><div class=""wx-timeline-body""></div></div></div>", html);
        }

        /// <summary>
        /// Tests the marker color of a timeline entry.
        /// </summary>
        [Theory]
        [InlineData(true, @"<div class=""wx-timeline-item""><span class=""wx-timeline-marker"" style=""background:#ff8800;""></span>*</div>")]
        [InlineData(false, @"<div class=""wx-timeline-item""><span class=""wx-timeline-marker bg-success""></span>*</div>")]
        public void Color(bool userColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTimelineItem()
            {
                Title = _ => "Created",
                Color = _ => userColor ? new PropertyColorBackground("#ff8800") : new PropertyColorBackground(TypeColorBackground.Success)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
