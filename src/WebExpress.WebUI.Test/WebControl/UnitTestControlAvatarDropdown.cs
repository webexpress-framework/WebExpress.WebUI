using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the avatar dropdown control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlAvatarDropdown
    {
        /// <summary>
        /// Tests the id property of the avatar dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-avatar-dropdown"" role=""button""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-avatar-dropdown"" role=""button""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the avatar dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-avatar-dropdown"" role=""button""></div>")]
        [InlineData("Max Mustermann", @"<div class=""wx-webui-avatar-dropdown"" role=""button"" data-name=""Max Mustermann""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown()
            {
                User = name
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the image property of the avatar dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-avatar-dropdown"" role=""button""></div>")]
        [InlineData("http://example.com/avatar.png", @"<div class=""wx-webui-avatar-dropdown"" role=""button"" data-src=""http://example.com/avatar.png""></div>")]
        public void Image(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown()
            {
                Image = uri is not null ? new UriEndpoint(uri) : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the initials property of the avatar dropdown control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-avatar-dropdown"" role=""button""></div>")]
        [InlineData("MM", @"<div class=""wx-webui-avatar-dropdown"" role=""button"" data-initials=""MM""></div>")]
        public void Initials(string initials, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown()
            {
                Initials = initials
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the shape property of the avatar dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeShapeAvatar.Circle, @"<div class=""wx-webui-avatar-dropdown"" role=""button""></div>")]
        [InlineData(TypeShapeAvatar.Rect, @"<div class=""wx-webui-avatar-dropdown"" role=""button"" data-shape=""rect""></div>")]
        public void Shape(TypeShapeAvatar shape, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown()
            {
                Shape = shape
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the avatar dropdown control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<div class=""wx-webui-avatar-dropdown"" role=""button""></div>")]
        [InlineData(48, @"<div class=""wx-webui-avatar-dropdown"" role=""button"" data-size=""48""></div>")]
        public void Size(int size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown()
            {
                Size = size
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the avatar dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorButton.Default, @"<div class=""wx-webui-avatar-dropdown"" role=""button""></div>")]
        [InlineData(TypeColorButton.Primary, @"<div class=""wx-webui-avatar-dropdown"" role=""button"" data-color=""btn-primary""></div>")]
        [InlineData(TypeColorButton.Secondary, @"<div class=""wx-webui-avatar-dropdown"" role=""button"" data-color=""btn-secondary""></div>")]
        public void Color(TypeColorButton color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown()
            {
                Color = new PropertyColorButton(color)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the alignment menu property of the avatar dropdown control.
        /// </summary>
        [Theory]
        [InlineData(TypeAlignmentDropdownMenu.Default, @"<div class=""wx-webui-avatar-dropdown"" role=""button""></div>")]
        [InlineData(TypeAlignmentDropdownMenu.Right, @"<div class=""wx-webui-avatar-dropdown"" role=""button"" data-menuCss=""dropdown-menu-end""></div>")]
        public void AlignmentMenu(TypeAlignmentDropdownMenu alignmentMenu, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown()
            {
                AlignmentMenu = alignmentMenu
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the avatar dropdown control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown();

            // act
            control.Add(new ControlDropdownItemLink() { Text = "abc" });

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-avatar-dropdown"" role=""button""><div class=""wx-dropdown-item"">abc</div></div>", html.Trim());
        }

        /// <summary>
        /// Tests the add separator function of the avatar dropdown control.
        /// </summary>
        [Fact]
        public void AddSeparator()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown();

            // act
            control.AddSeparator();

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-avatar-dropdown"" role=""button""><div class=""wx-dropdown-divider"" role=""separator""></div></div>", html.Trim());
        }

        /// <summary>
        /// Tests the add header function of the avatar dropdown control.
        /// </summary>
        [Fact]
        public void AddHeader()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown();

            // act
            control.AddHeader("Settings");

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-avatar-dropdown"" role=""button""><div class=""wx-dropdown-header"" role=""heading"">Settings</div></div>", html.Trim());
        }

        /// <summary>
        /// Tests the combined name and image properties of the avatar dropdown control.
        /// </summary>
        [Fact]
        public void NameAndImage()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown()
            {
                User = "Max Mustermann",
                Image = new UriEndpoint("http://example.com/avatar.png")
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-avatar-dropdown"" role=""button"" data-name=""Max Mustermann"" data-src=""http://example.com/avatar.png""></div>", html);
        }

        /// <summary>
        /// Tests multiple combined data attributes of the avatar dropdown control.
        /// </summary>
        [Fact]
        public void CombinedAttributes()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown()
            {
                User = "Max Mustermann",
                Initials = "MM",
                Shape = TypeShapeAvatar.Rect,
                Size = 48
            };

            // act
            control.Add(new ControlDropdownItemLink() { Text = "Profile" });

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-avatar-dropdown"" role=""button"" data-name=""Max Mustermann"" data-initials=""MM"" data-shape=""rect"" data-size=""48""><div class=""wx-dropdown-item"">Profile</div></div>", html.Trim());
        }

        /// <summary>
        /// Tests the remove function of the avatar dropdown control.
        /// </summary>
        [Fact]
        public void Remove()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarDropdown();
            var item = new ControlDropdownItemLink() { Text = "abc" };

            // act
            control.Add(item);
            control.Remove(item);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-avatar-dropdown"" role=""button""></div>", html);
        }
    }
}
