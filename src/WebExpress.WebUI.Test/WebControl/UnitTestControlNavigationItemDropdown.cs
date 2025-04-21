using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the navigation item dropdown control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlNavigationItemDropdown
    {
        /// <summary>
        /// Tests the id property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData("id", @"<div id=""id"" class=""dropdown""><button id=""id_btn"" class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorButton.Default, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeColorButton.Primary, @"<div class=""dropdown""><button class=""btn btn-primary"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeColorButton.Secondary, @"<div class=""dropdown""><button class=""btn btn-secondary"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeColorButton.Info, @"<div class=""dropdown""><button class=""btn btn-info"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeColorButton.Warning, @"<div class=""dropdown""><button class=""btn btn-warning"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeColorButton.Danger, @"<div class=""dropdown""><button class=""btn btn-danger"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeColorButton.Light, @"<div class=""dropdown""><button class=""btn btn-light"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeColorButton.Dark, @"<div class=""dropdown""><button class=""btn btn-dark"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        public void BackgroundColor(TypeColorButton backgroundColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                BackgroundColor = new PropertyColorButton(backgroundColor)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeButton.Default, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeSizeButton.Small, @"<div class=""dropdown""><button class=""btn btn-sm"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeSizeButton.Large, @"<div class=""dropdown""><button class=""btn btn-lg"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        public void Size(TypeSizeButton size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                Size = size
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the outline property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""dropdown""><button class=""btn btn-primary"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(true, @"<div class=""dropdown""><button class=""btn btn-outline-primary"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        public void Outline(bool outline, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                Outline = outline,
                BackgroundColor = new PropertyColorButton(TypeColorButton.Primary)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the block property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeBlockButton.None, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeBlockButton.Block, @"<div class=""dropdown""><button class=""btn btn-block"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        public void Block(TypeBlockButton block, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                Block = block
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the toogle property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeToggleDropdown.None, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeToggleDropdown.Toggle, @"<div class=""dropdown""><button class=""btn dropdown-toggle"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        public void Toogle(TypeToggleDropdown toogle, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                Toggle = toogle
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData("abc", @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false"">abc</button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false"">WebExpress.WebUI</button><ul class=""dropdown-menu""></ul></div>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                Text = text,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData("abc", @"<div class=""dropdown""><button class=""btn"" title=""abc"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""dropdown""><button class=""btn"" title=""WebExpress.WebUI"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                Tooltip = tooltip,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData("abc", @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        public void Value(string value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                Value = value,
            };

            // test execution
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the icon property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(typeof(IconStar), @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""><span class=""fas fa-star""></span></button><ul class=""dropdown-menu""></ul></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the active property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeActive.None, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeActive.Active, @"<div class=""dropdown""><button class=""btn active"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeActive.Disabled, @"<div class=""dropdown""><button class=""btn disabled"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        public void Active(TypeActive active, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                Active = active
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the alignment menu property of the navigation item dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeAlignmentDropdownMenu.Default, @"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData(TypeAlignmentDropdownMenu.Right, @"<div class=""dropdown""><button class=""btn dropdown-menu-lg-end"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu dropdown-menu-lg-end""></ul></div>")]
        public void AlignmentMenu(TypeAlignmentDropdownMenu alignmentMenu, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown()
            {
                AlignmentMenu = alignmentMenu
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the navigation item dropdown control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlNavigationItemDropdown();

            // test execution
            control.Add(new ControlDropdownItemLink() { Text = "abc" });

            var html = control.Render(context, visualTree);

            Assert.Equal(@"<div class=""dropdown""><button class=""btn"" data-bs-toggle=""dropdown"" aria-expanded=""false""></button><ul class=""dropdown-menu""><li class=""dropdown-item ""><a class=""link"">abc</a></li></ul></div>", html.Trim());
        }
    }
}
