using WebExpress.WebCore.WebIcon;
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSearch(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the search control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-search""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-search"" placeholder=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-search"" placeholder=""WebExpress.WebUI""></div>")]
        public void Placeholder(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSearch()
            {
                Placeholder = _ => text
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the suggestion property of the search control.
        /// </summary>
        [Fact]
        public void Suggestion()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var control = new ControlSearch(null, [new ControlSearchItemSuggestion("1")
            {
                Label = _ => "Home",
                Icon = _ => new IconHome(),
                Favorited = _ => true,
            }])
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-search""><div id=""1"" class=""wx-search-suggestion"" data-icon=""wx-icon-light wx-icon-light-home"" data-favorited=""true"">Home</div>*</div>", html);

        }

        /// <summary>
        /// Tests the icon property of the search control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-search""></div>")]
        [InlineData(typeof(IconStar), @"<div class=""wx-webui-search"" data-icon=""wx-icon-light wx-icon-light-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSearch()
            {
                Icon = _ => icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the enable favorited property of the search control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-search"">*</div>")]
        [InlineData(true, @"<div class=""wx-webui-search"" data-favorited=""true"">*</div>")]
        public void EnableFavorited(bool enableFavorited, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var control = new ControlSearch(null, [new ControlSearchItemSuggestion("1")
            {
                Label = _ => "Home",
                Icon = _ => new IconHome(),
                Favorited = _ => true,
            }])
            {
                EnableFavorited = _ => enableFavorited
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the footer control is rendered into the marked element the client lifts
        /// into the suggestion menu.
        /// </summary>
        [Fact]
        public void Footer()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var control = new ControlSearch()
            {
                Footer = new ControlText("footer")
                {
                    Text = _ => "more"
                }
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-search""><div class=""wx-search-footer"">*more*</div></div>", html);
        }

        /// <summary>
        /// Tests the value property of the search control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-search"">*</div>")]
        [InlineData("", @"<div class=""wx-webui-search"">*</div>")]
        [InlineData("hello", @"<div class=""wx-webui-search"" data-value=""hello"">*</div>")]
        public void Value(string searchTerm, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var control = new ControlSearch()
            {
                Value = _ => searchTerm
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
