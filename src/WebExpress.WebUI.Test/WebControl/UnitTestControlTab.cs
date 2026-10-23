using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the tab control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTab
    {
        /// <summary>
        /// Tests the id property of the tab control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tab"" data-layout=""default""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-tab"" data-layout=""default""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTab(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the layout property of the tab control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutTab.Default, @"<div class=""wx-webui-tab"" data-layout=""default""></div>")]
        [InlineData(TypeLayoutTab.Pill, @"<div class=""wx-webui-tab"" data-layout=""pill""></div>")]
        [InlineData(TypeLayoutTab.Underline, @"<div class=""wx-webui-tab"" data-layout=""underline""></div>")]
        public void Layout(TypeLayoutTab layout, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTab(null)
            {
                Layout = _ => layout
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the system color property of the tab control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutTab.Default, TypeColorText.Danger, @"<div class=""wx-webui-tab"" data-layout=""default""></div>")]
        [InlineData(TypeLayoutTab.Tab, TypeColorText.Danger, @"<div class=""wx-webui-tab"" data-layout=""tab""></div>")]
        [InlineData(TypeLayoutTab.Underline, TypeColorText.Default, @"<div class=""wx-webui-tab"" data-layout=""underline""></div>")]
        [InlineData(TypeLayoutTab.Underline, TypeColorText.Danger, @"<div class=""wx-webui-tab"" data-layout=""underline"" style=""--wx-nav-underline-link-active-color: var(--wx-danger);""></div>")]
        [InlineData(TypeLayoutTab.Underline, TypeColorText.Highlight, @"<div class=""wx-webui-tab"" data-layout=""underline"" style=""--wx-nav-underline-link-active-color: var(--wx-highlight);""></div>")]
        [InlineData(TypeLayoutTab.Pill, TypeColorText.Default, @"<div class=""wx-webui-tab"" data-layout=""pill""></div>")]
        [InlineData(TypeLayoutTab.Pill, TypeColorText.Success, @"<div class=""wx-webui-tab"" data-layout=""pill"" style=""--wx-nav-pills-link-active-bg: var(--wx-success); --wx-nav-pills-link-active-color: var(--wx-success-contrast, var(--wx-body-color));""></div>")]
        public void ColorSystem(TypeLayoutTab layout, TypeColorText color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTab(null)
            {
                Layout = _ => layout,
                Color = _ => new PropertyColorText(color)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the underline color property of the tab control, alone and next to the color
        /// of the active tab.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutTab.Underline, null, "#ff0000", @"<div class=""wx-webui-tab"" data-layout=""underline"" style=""--wx-nav-underline-border-color: #ff0000;""></div>")]
        [InlineData(TypeLayoutTab.Underline, "#000080", "#ff0000", @"<div class=""wx-webui-tab"" data-layout=""underline"" style=""--wx-nav-underline-link-active-color: #000080; --wx-nav-underline-border-color: #ff0000;""></div>")]
        [InlineData(TypeLayoutTab.Underline, "#000080", " ", @"<div class=""wx-webui-tab"" data-layout=""underline"" style=""--wx-nav-underline-link-active-color: #000080;""></div>")]
        [InlineData(TypeLayoutTab.Pill, null, "#ff0000", @"<div class=""wx-webui-tab"" data-layout=""pill""></div>")]
        [InlineData(TypeLayoutTab.Tab, null, "#ff0000", @"<div class=""wx-webui-tab"" data-layout=""tab""></div>")]
        public void UnderlineColorUser(TypeLayoutTab layout, string color, string underlineColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTab(null)
            {
                Layout = _ => layout,
                Color = _ => color == null ? null : new PropertyColorText(color),
                UnderlineColor = _ => new PropertyColorBorder(underlineColor)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the underline color property of the tab control with a system color.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBorder.Default, @"<div class=""wx-webui-tab"" data-layout=""underline""></div>")]
        [InlineData(TypeColorBorder.Warning, @"<div class=""wx-webui-tab"" data-layout=""underline"" style=""--wx-nav-underline-border-color: var(--wx-warning);""></div>")]
        [InlineData(TypeColorBorder.Highlight, @"<div class=""wx-webui-tab"" data-layout=""underline"" style=""--wx-nav-underline-border-color: var(--wx-highlight);""></div>")]
        public void UnderlineColorSystem(TypeColorBorder underlineColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTab(null)
            {
                Layout = _ => TypeLayoutTab.Underline,
                UnderlineColor = _ => new PropertyColorBorder(underlineColor)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the user color property of the tab control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutTab.Underline, "#ff0000", @"<div class=""wx-webui-tab"" data-layout=""underline"" style=""--wx-nav-underline-link-active-color: #ff0000;""></div>")]
        [InlineData(TypeLayoutTab.Pill, "#ffff00", @"<div class=""wx-webui-tab"" data-layout=""pill"" style=""--wx-nav-pills-link-active-bg: #ffff00; --wx-nav-pills-link-active-color: #000;""></div>")]
        [InlineData(TypeLayoutTab.Pill, "navy", @"<div class=""wx-webui-tab"" data-layout=""pill"" style=""--wx-nav-pills-link-active-bg: navy; --wx-nav-pills-link-active-color: #fff;""></div>")]
        [InlineData(TypeLayoutTab.Pill, "hsl(0 0% 50%)", @"<div class=""wx-webui-tab"" data-layout=""pill"" style=""--wx-nav-pills-link-active-bg: hsl(0 0% 50%);""></div>")]
        [InlineData(TypeLayoutTab.Pill, " ", @"<div class=""wx-webui-tab"" data-layout=""pill""></div>")]
        public void ColorUser(TypeLayoutTab layout, string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTab(null)
            {
                Layout = _ => layout,
                Color = _ => new PropertyColorText(color)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a page to the tab control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTab(null);

            // act
            control.Add(new ControlTabView());

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-tab"" data-layout=""default""><div class=""wx-tab-view""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
