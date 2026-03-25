using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the tab view control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTabView
    {
        /// <summary>
        /// Tests the id property of the tab view control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tab-view""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-tab-view""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTabView(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the tab view control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tab-view""></div>")]
        [InlineData("abc", @"<div class=""wx-tab-view"" data-label=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-tab-view"" data-label=""WebExpress.WebUI""></div>")]
        public void Title(string title, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTabView()
            {
                Title = title
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the tab view control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-tab-view""></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-tab-view"" data-icon=""fas fa-folder""></div>")]
        [InlineData(typeof(ImageIconWebExpress), @"<div class=""wx-tab-view"" data-image=""/assets/img/webexpress.svg""></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlTabView(null)
            {
                Icon = icon
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a item to the tab view control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTabView(null);

            // act
            control.Add(new ControlText());

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-tab-view""><div></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
