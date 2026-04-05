using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the view item control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlViewItem
    {
        /// <summary>
        /// Tests the id property of the view item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-view""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-view""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlViewItem(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the view item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-view""></div>")]
        [InlineData("abc", @"<div class=""wx-view"" data-label=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-view"" data-label=""WebExpress.WebUI""></div>")]
        public void Title(string title, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlViewItem()
            {
                Title = title
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the description property of the view item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-view""></div>")]
        [InlineData("abc", @"<div class=""wx-view"" data-description=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-view"" data-description=""WebExpress.WebUI""></div>")]
        public void Description(string description, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlViewItem()
            {
                Description = description
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the view item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-view""></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-view"" data-icon=""fas fa-folder""></div>")]
        [InlineData(typeof(ImageIconWebExpress), @"<div class=""wx-view"" data-image=""/assets/img/webexpress.svg""></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlViewItem(null)
            {
                Icon = icon
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the detail frame property of the view item control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-view""></div>")]
        [InlineData(true, @"<div class=""wx-view"" data-has-details=""true""></div>")]
        public void DetailFrame(bool hasFrame, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlViewItem(null)
            {
                DetailFrame = hasFrame
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a item to the view item control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlViewItem(null);

            // act
            control.Add(new ControlText());

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-view""><div></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

    }
}
