using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the dropdown control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlDropdown
    {
        /// <summary>
        /// Tests the id property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-dropdown"" role=""button""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorButton.Default, @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData(TypeColorButton.Primary, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-primary""></div>")]
        [InlineData(TypeColorButton.Secondary, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-secondary""></div>")]
        [InlineData(TypeColorButton.Info, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-info""></div>")]
        [InlineData(TypeColorButton.Warning, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-warning""></div>")]
        [InlineData(TypeColorButton.Danger, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-danger""></div>")]
        [InlineData(TypeColorButton.Light, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-light""></div>")]
        [InlineData(TypeColorButton.Dark, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-dark""></div>")]
        public void Color(TypeColorButton color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown()
            {
                Color = new PropertyColorButton(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeButton.Default, @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData(TypeSizeButton.Small, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-sm""></div>")]
        [InlineData(TypeSizeButton.Large, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-lg""></div>")]
        public void Size(TypeSizeButton size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown()
            {
                Size = size
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the outline property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-primary""></div>")]
        [InlineData(true, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-outline-primary""></div>")]
        public void Outline(bool outline, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown()
            {
                Outline = outline,
                Color = new PropertyColorButton(TypeColorButton.Primary)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the block property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeBlockButton.None, @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData(TypeBlockButton.Block, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""btn-block""></div>")]
        public void Block(TypeBlockButton block, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown()
            {
                Block = block
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the toogle property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeToggleDropdown.None, @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData(TypeToggleDropdown.Toggle, @"<div class=""wx-webui-dropdown"" role=""button"" data-buttonCss=""dropdown-toggle""></div>")]
        public void Toogle(TypeToggleDropdown toogle, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown()
            {
                Toggle = toogle
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-dropdown"" role=""button"" data-label=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-webui-dropdown"" role=""button"" data-label=""WebExpress.WebUI""></div>")]
        public void Label(string label, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown()
            {
                Label = label,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown()
            {
                Tooltip = tooltip,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData(typeof(IconStar), @"<div class=""wx-webui-dropdown"" role=""button"" data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the active property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeActive.None, @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData(TypeActive.Active, @"<div class=""wx-webui-dropdown"" role=""button"" active></div>")]
        [InlineData(TypeActive.Disabled, @"<div class=""wx-webui-dropdown"" role=""button"" disabled></div>")]
        public void Active(TypeActive active, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown()
            {
                Active = active
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the alignment menu property of the dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeAlignmentDropdownMenu.Default, @"<div class=""wx-webui-dropdown"" role=""button""></div>")]
        [InlineData(TypeAlignmentDropdownMenu.Right, @"<div class=""wx-webui-dropdown"" role=""button"" data-menuCss=""dropdown-menu-end""></div>")]
        public void AlignmentMenu(TypeAlignmentDropdownMenu alignmentMenu, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown()
            {
                AlignmentMenu = alignmentMenu
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the dropdown control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdown();

            // test execution
            control.Add(new ControlDropdownItemLink() { Label = "abc" });

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-dropdown"" role=""button""><div class=""wx-dropdown-item"">abc</div></div>", html.Trim());
        }
    }
}
