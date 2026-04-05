using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the view control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlView
    {
        /// <summary>
        /// Tests the id property of the view control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-view""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-view""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlView(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the detail id property of the view control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-view""></div>")]
        [InlineData("id", @"<div class=""wx-webui-view"" data-detail-id=""id""></div>")]
        public void DetailId(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlView(null)
            {
                DetailId = id
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the detail selector property of the view control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-view""></div>")]
        [InlineData("#id", @"<div class=""wx-webui-view"" data-detail-selector=""#id""></div>")]
        public void DetailSelector(string selector, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlView(null)
            {
                DetailSelector = selector
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a item to the view control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlView(null);

            // act
            control.Add(new ControlViewItem());

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-view""><div class=""wx-view""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
