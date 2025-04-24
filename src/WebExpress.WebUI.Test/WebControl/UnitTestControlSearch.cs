using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the search control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSearch
    {
        /// <summary>
        /// Tests the id property of the search control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-search""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-search""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSearch(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the search control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-search""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-search"" placeholder=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-search"" placeholder=""WebExpress.WebUI""></div>")]
        public void Placeholder(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSearch()
            {
                Placeholder = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the suggestion property of the search control.
        /// </summary>
        [Fact]
        public void Suggestion()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var control = new ControlSearch(null, [new ControlSearchItemSuggestion("1")
            {
                Label = "Home",
                Icon = new IconHome(),
                Favorited = true,
            }])
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-search""><div id=""1"" class=""wx-search-suggestion"" data-icon=""fas fa-home"" data-favorited=""true"">Home</div>*</div>", html);

        }
    }
}
