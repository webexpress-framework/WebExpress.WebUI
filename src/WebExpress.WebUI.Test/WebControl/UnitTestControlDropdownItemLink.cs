using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the dropdown item link control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlDropdownItemLink
    {
        /// <summary>
        /// Tests the id property of the dropdown item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dropdown-item""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-dropdown-item""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdownItemLink(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the text property of the dropdown item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dropdown-item""></div>")]
        [InlineData("abc", @"<div class=""wx-dropdown-item"">abc</div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-dropdown-item"">WebExpress.WebUI</div>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdownItemLink()
            {
                Label = text,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the uri property of the dropdown item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dropdown-item""></div>")]
        [InlineData("/a", @"<div class=""wx-dropdown-item"" data-uri=""/a""></div>")]
        [InlineData("/a/b", @"<div class=""wx-dropdown-item"" data-uri=""/a/b""></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdownItemLink()
            {
                Uri = uri != null ? new UriEndpoint(uri) : null,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the target property of the dropdown item link control.
        /// </summary>
        [Theory]
        [InlineData(TypeTarget.None, @"<div class=""wx-dropdown-item""></div>")]
        [InlineData(TypeTarget.Blank, @"<div class=""wx-dropdown-item"" data-target=""_blank""></div>")]
        [InlineData(TypeTarget.Self, @"<div class=""wx-dropdown-item"" data-target=""_self""></div>")]
        [InlineData(TypeTarget.Parent, @"<div class=""wx-dropdown-item"" data-target=""_parent""></div>")]
        [InlineData(TypeTarget.Framename, @"<div class=""wx-dropdown-item"" data-target=""_framename""></div>")]
        public void Target(TypeTarget target, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdownItemLink()
            {
                Target = target,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the tooltip property of the dropdown item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dropdown-item""></div>")]
        [InlineData("a", @"<div class=""wx-dropdown-item"" data-tooltip=""a""></div>")]
        [InlineData("b", @"<div class=""wx-dropdown-item"" data-tooltip=""b""></div>")]
        [InlineData("a<br/>b", @"<div class=""wx-dropdown-item"" data-tooltip=""a<br/>b""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdownItemLink()
            {
                Tooltip = tooltip
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the icon property of the dropdown item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-dropdown-item""></div>")]
        [InlineData(typeof(IconStar), @"<div class=""wx-dropdown-item"" data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdownItemLink()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the add function of the dropdown item link control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control1 = new ControlDropdownItemLink(null);
            var control2 = new ControlDropdownItemLink(null);
            var control3 = new ControlDropdownItemLink(null);
            var control4 = new ControlDropdownItemLink(null);
            var control5 = new ControlDropdownItemLink(null);
            var control6 = new ControlDropdownItemLink(null);

            // test execution
            control1.Icon = new IconStar();
            control2.Icon = new IconStar();
            control3.Icon = new IconStar();
            control4.Icon = new IconStar();
            control5.Icon = new IconStar();
            control6.Icon = new IconStar();

            var html1 = control1.Render(context, visualTree);
            var html2 = control2.Render(context, visualTree);
            var html3 = control3.Render(context, visualTree);
            var html4 = control4.Render(context, visualTree);
            var html5 = control5.Render(context, visualTree);
            var html6 = control6.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-dropdown-item"" data-icon=""fas fa-star""></div>", html1.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-dropdown-item"" data-icon=""fas fa-star""></div>", html2.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-dropdown-item"" data-icon=""fas fa-star""></div>", html3.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-dropdown-item"" data-icon=""fas fa-star""></div>", html4.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-dropdown-item"" data-icon=""fas fa-star""></div>", html5.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-dropdown-item"" data-icon=""fas fa-star""></div>", html6.Trim());
        }
    }
}
