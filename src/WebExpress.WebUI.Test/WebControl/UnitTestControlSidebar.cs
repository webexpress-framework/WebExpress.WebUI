
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
        [InlineData(null, @"<div class=""wx-webui-sidebar""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-sidebar""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-webui-sidebar""></div>")]
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

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the sidebar control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div class=""wx-webui-sidebar""></div>")]
        [InlineData(TypeColorBackground.Primary, @"<div class=""wx-webui-sidebar bg-primary""></div>")]
        [InlineData(TypeColorBackground.Info, @"<div class=""wx-webui-sidebar bg-info""></div>")]
        [InlineData(TypeColorBackground.Success, @"<div class=""wx-webui-sidebar bg-success""></div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div class=""wx-webui-sidebar bg-secondary""></div>")]
        [InlineData(TypeColorBackground.Warning, @"<div class=""wx-webui-sidebar bg-warning""></div>")]
        [InlineData(TypeColorBackground.Danger, @"<div class=""wx-webui-sidebar bg-danger""></div>")]
        [InlineData(TypeColorBackground.Dark, @"<div class=""wx-webui-sidebar bg-dark""></div>")]
        [InlineData(TypeColorBackground.Light, @"<div class=""wx-webui-sidebar bg-light""></div>")]
        [InlineData(TypeColorBackground.Highlight, @"<div class=""wx-webui-sidebar bg-highlight""></div>")]
        [InlineData(TypeColorBackground.White, @"<div class=""wx-webui-sidebar bg-white""></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""wx-webui-sidebar bg-transparent""></div>")]
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

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the breakpoint property of the sidebar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-sidebar""></div>")]
        [InlineData(-1, @"<div class=""wx-webui-sidebar""></div>")]
        [InlineData(0, @"<div class=""wx-webui-sidebar"" data-breakpoint=""0""></div>")]
        [InlineData(100, @"<div class=""wx-webui-sidebar"" data-breakpoint=""100""></div>")]
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

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the hover-expanded property of the sidebar control. The client enables the
        /// flyout by default, so only the opt-out (false) is expected to emit an attribute.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-sidebar""></div>")]
        [InlineData(true, @"<div class=""wx-webui-sidebar""></div>")]
        [InlineData(false, @"<div class=""wx-webui-sidebar"" data-hover-expanded=""false""></div>")]
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

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the scroll-active property of the sidebar control. The client scrolls the first
        /// active item into view by default, so only the opt-out (false) emits an attribute.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-sidebar""></div>")]
        [InlineData(true, @"<div class=""wx-webui-sidebar""></div>")]
        [InlineData(false, @"<div class=""wx-webui-sidebar"" data-scroll-active=""false""></div>")]
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

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-sidebar""><div class=""wx-sidebar-link"" data-label=""abc""></div></div>", html);
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

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-sidebar""><div class=""wx-sidebar-toolbar""><div class=""wx-toolbar-button"" data-label=""abc""></div></div></div>", html);
        }
    }
}
