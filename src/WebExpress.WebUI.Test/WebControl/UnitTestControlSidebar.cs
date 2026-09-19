
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the sidebar control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSidebar
    {
        /// <summary>
        /// Tests the id property of the sidebar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar""></nav>")]
        [InlineData("id", @"<nav id=""id"" class=""wx-webui-sidebar"" aria-label=""Sidebar""></nav>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<nav id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-webui-sidebar"" aria-label=""Sidebar""></nav>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebar(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the sidebar control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.Primary, @"<nav class=""wx-webui-sidebar bg-primary"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.Info, @"<nav class=""wx-webui-sidebar bg-info"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.Success, @"<nav class=""wx-webui-sidebar bg-success"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.Secondary, @"<nav class=""wx-webui-sidebar bg-secondary"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.Warning, @"<nav class=""wx-webui-sidebar bg-warning"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.Danger, @"<nav class=""wx-webui-sidebar bg-danger"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.Dark, @"<nav class=""wx-webui-sidebar bg-dark"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.Light, @"<nav class=""wx-webui-sidebar bg-light"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.Highlight, @"<nav class=""wx-webui-sidebar bg-highlight"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.White, @"<nav class=""wx-webui-sidebar bg-white"" aria-label=""Sidebar""></nav>")]
        [InlineData(TypeColorBackground.Transparent, @"<nav class=""wx-webui-sidebar bg-transparent"" aria-label=""Sidebar""></nav>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebar()
            {
                BackgroundColor = _ => new PropertyColorBackground(backgroundColor)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the breakpoint property of the sidebar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar""></nav>")]
        [InlineData(-1, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar""></nav>")]
        [InlineData(0, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar"" data-breakpoint=""0""></nav>")]
        [InlineData(100, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar"" data-breakpoint=""100""></nav>")]
        public void Breakpoint(int? breakpoint, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = breakpoint.HasValue
                ? new ControlSidebar()
                {
                    Breakpoint = _ => breakpoint.Value
                }
                : new ControlSidebar();

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the hover-expanded property of the sidebar control. The client enables the
        /// flyout by default, so only the opt-out (false) is expected to emit an attribute.
        /// </summary>
        [Theory]
        [InlineData(null, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar""></nav>")]
        [InlineData(true, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar""></nav>")]
        [InlineData(false, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar"" data-hover-expanded=""false""></nav>")]
        public void HoverExpanded(bool? hoverExpanded, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = hoverExpanded.HasValue
                ? new ControlSidebar()
                {
                    HoverExpanded = _ => hoverExpanded.Value
                }
                : new ControlSidebar();

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the scroll-active property of the sidebar control. The client scrolls the first
        /// active item into view by default, so only the opt-out (false) emits an attribute.
        /// </summary>
        [Theory]
        [InlineData(null, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar""></nav>")]
        [InlineData(true, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar""></nav>")]
        [InlineData(false, @"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar"" data-scroll-active=""false""></nav>")]
        public void ScrollActiveIntoView(bool? scrollActiveIntoView, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = scrollActiveIntoView.HasValue
                ? new ControlSidebar()
                {
                    ScrollActiveIntoView = _ => scrollActiveIntoView.Value
                }
                : new ControlSidebar();

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the sidebar control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebar(null)
                .Add(new ControlSidebarItemLink()
                {
                    Text = _ => "abc"
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar""><div class=""wx-sidebar-link"" data-label=""abc""></div></nav>", html);
        }

        /// <summary>
        /// Tests the add function of the sidebar control.
        /// </summary>
        [Fact]
        public void AddToolbarItem()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSidebar(null)
                .Add(new ControlToolbarItemButton()
                {
                    Text = _ => "abc"
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<nav class=""wx-webui-sidebar"" aria-label=""Sidebar""><div class=""wx-sidebar-toolbar""><div class=""wx-toolbar-button"" data-label=""abc""></div></div></nav>", html);
        }
    }
}
