using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the toolbar item dropdown control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlToolbarItemDropdown
    {
        /// <summary>
        /// Tests the id property of the toolbar item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-dropdown""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-toolbar-dropdown""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDropdown(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the toolbar item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-dropdown""></div>")]
        [InlineData("abc", @"<div class=""wx-toolbar-dropdown"" data-label=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-toolbar-dropdown"" data-label=""WebExpress.WebUI""></div>")]
        public void Text(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDropdown()
            {
                Text = text,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the toolbar item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-dropdown""></div>")]
        [InlineData("abc", @"<div class=""wx-toolbar-dropdown"" data-title=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-toolbar-dropdown"" data-title=""WebExpress.WebUI""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDropdown()
            {
                Tooltip = tooltip,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the toogle property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeToggleDropdown.None, @"<div class=""wx-toolbar-dropdown""></div>")]
        [InlineData(TypeToggleDropdown.Toggle, @"<div class=""wx-toolbar-dropdown"" data-toggle=""true""></div>")]
        public void Toogle(TypeToggleDropdown toogle, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDropdown()
            {
                Toggle = toogle
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the toolbar item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-dropdown""></div>")]
        [InlineData(typeof(IconStar), @"<div class=""wx-toolbar-dropdown"" data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDropdown()
            {
                Icon = icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the active property of the toolbar item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeActive.None, @"<div class=""wx-toolbar-dropdown""></div>")]
        [InlineData(TypeActive.Active, @"<div class=""wx-toolbar-dropdown"" active></div>")]
        [InlineData(TypeActive.Disabled, @"<div class=""wx-toolbar-dropdown"" disabled></div>")]
        public void Active(TypeActive active, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDropdown()
            {
                Active = active
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the toolbar item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""wx-toolbar-dropdown""></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""wx-toolbar-dropdown"" data-color-css=""text-primary""></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""wx-toolbar-dropdown"" data-color-css=""text-secondary""></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""wx-toolbar-dropdown"" data-color-css=""text-warning""></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""wx-toolbar-dropdown"" data-color-css=""text-danger""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""wx-toolbar-dropdown"" data-color-css=""text-dark""></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""wx-toolbar-dropdown"" data-color-css=""text-light""></div>")]
        [InlineData(TypeColorText.Highlight, @"<div class=""wx-toolbar-dropdown"" data-color-css=""text-highlight""></div>")]
        public void Color(TypeColorText color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDropdown()
            {
                Color = new PropertyColorText(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the alignment property of the toolbar item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeToolbarItemAlignment.Default, @"<div class=""wx-toolbar-dropdown""></div>")]
        [InlineData(TypeToolbarItemAlignment.Left, @"<div class=""wx-toolbar-dropdown"" data-align=""left""></div>")]
        [InlineData(TypeToolbarItemAlignment.Right, @"<div class=""wx-toolbar-dropdown"" data-align=""right""></div>")]
        public void Alignment(TypeToolbarItemAlignment alignment, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDropdown()
            {
                Alignment = alignment,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the add function of the toolbar item dropdown control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemDropdown();

            // act
            control.Add(new ControlDropdownItemLink() { Text = "webexpress.WebUI:plugin.name" });

            // validation
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-toolbar-dropdown""><div class=""wx-dropdown-item"">WebExpress.WebUI</div></div>", html.Trim());
        }
    }
}
