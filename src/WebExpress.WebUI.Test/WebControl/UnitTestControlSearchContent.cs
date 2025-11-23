using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the search content control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSearchContent
    {
        /// <summary>
        /// Tests the id property of the search control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-search-content""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-search-content""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSearchContent(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the search control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-search-content""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-search-content"" placeholder=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-search-content"" placeholder=""WebExpress.WebUI""></div>")]
        public void Placeholder(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSearchContent()
            {
                Placeholder = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the target ids property of the search control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-search-content""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-search-content"" data-target-ids=""abc""></div>")]
        [InlineData(",abc,,def,", @"<div class=""wx-webui-search-content"" data-target-ids=""abc,def""></div>")]
        public void TargetIds(string ids, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSearchContent()
            {
                TargetIds = ids?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the data-highlight-color attribute of the search content control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-search-content"" data-highlight-color=""yellow""></div>")]
        [InlineData("lime", @"<div class=""wx-webui-search-content"" data-highlight-color=""lime""></div>")]
        public void HighlightColor(string color, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = new RenderControlContext(UnitTestControlFixture.CreateRenderContextMock());
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSearchContent()
            {
                HighlightColor = color ?? "yellow"
            };

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the search content control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-search-content""></div>")]
        [InlineData(typeof(IconStar), @"<div class=""wx-webui-search-content"" data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSearchContent()
            {
                Icon = icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
