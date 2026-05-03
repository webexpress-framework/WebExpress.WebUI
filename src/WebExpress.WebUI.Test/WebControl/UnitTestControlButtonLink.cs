using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the buttonlink control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlButtonLink
    {
        /// <summary>
        /// Tests the id property of the buttonlink control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""btn""></a>")]
        [InlineData("id", @"<a id=""id"" class=""btn""></a>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonLink(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the text property of the buttonlink control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""btn""></a>")]
        [InlineData("abc", @"<a class=""btn"">abc</a>")]
        public void Text(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonLink()
            {
                Text = (c) => text
            };

            // act
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the tooltip property of the buttonlink control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""btn""></a>")]
        [InlineData("a", @"<a class=""btn"" title=""a"" data-bs-toggle=""tooltip""></a>")]
        [InlineData("b", @"<a class=""btn"" title=""b"" data-bs-toggle=""tooltip""></a>")]
        [InlineData("a<br/>b", @"<a class=""btn"" title=""a<br/>b"" data-bs-toggle=""tooltip""></a>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<a class=""btn"" title=""WebExpress.WebUI"" data-bs-toggle=""tooltip""></a>")]
        public void Tooltip(string tooltip, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonLink()
            {
                Tooltip = tooltip
            };

            // act
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the size property of the buttonlink control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeButton.Default, @"<a class=""btn""></a>")]
        [InlineData(TypeSizeButton.Small, @"<a class=""btn btn-sm""></a>")]
        [InlineData(TypeSizeButton.Large, @"<a class=""btn btn-lg""></a>")]
        public void Size(TypeSizeButton size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonLink()
            {
                Size = size
            };

            // act
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the backgroundcolor property of the buttonlink control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorButton.Default, @"<a class=""btn""></a>")]
        [InlineData(TypeColorButton.Primary, @"<a class=""btn btn-primary""></a>")]
        [InlineData(TypeColorButton.Secondary, @"<a class=""btn btn-secondary""></a>")]
        [InlineData(TypeColorButton.Warning, @"<a class=""btn btn-warning""></a>")]
        [InlineData(TypeColorButton.Danger, @"<a class=""btn btn-danger""></a>")]
        [InlineData(TypeColorButton.Dark, @"<a class=""btn btn-dark""></a>")]
        [InlineData(TypeColorButton.Highlight, @"<a class=""btn btn-highlight""></a>")]
        public void BackgroundColor(TypeColorButton color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonLink()
            {
                BackgroundColor = new PropertyColorButton(color)
            };

            // act
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the outline property of the buttonlink control.
        /// </summary>
        [Theory]
        [InlineData(false, TypeColorButton.Default, @"<a class=""btn""></a>")]
        [InlineData(true, TypeColorButton.Default, @"<a class=""btn""></a>")]
        [InlineData(true, TypeColorButton.Primary, @"<a class=""btn btn-outline-primary""></a>")]
        [InlineData(true, TypeColorButton.Secondary, @"<a class=""btn btn-outline-secondary""></a>")]
        [InlineData(true, TypeColorButton.Warning, @"<a class=""btn btn-outline-warning""></a>")]
        [InlineData(true, TypeColorButton.Danger, @"<a class=""btn btn-outline-danger""></a>")]
        [InlineData(true, TypeColorButton.Dark, @"<a class=""btn btn-outline-dark""></a>")]
        public void Outline(bool outline, TypeColorButton color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonLink()
            {
                Outline = outline,
                BackgroundColor = new PropertyColorButton(color)
            };

            // act
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the block property of the buttonlink control.
        /// </summary>
        [Theory]
        [InlineData(TypeBlockButton.None, @"<a class=""btn""></a>")]
        [InlineData(TypeBlockButton.Block, @"<a class=""btn btn-block""></a>")]
        public void Block(TypeBlockButton block, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonLink()
            {
                Block = block
            };

            // act
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the icon property of the buttonlink control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""btn""></a>")]
        [InlineData(typeof(IconStar), @"<a class=""btn""><i class=""fas fa-star""></i></a>")]
        public void Icon(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonLink()
            {
                Icon = icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // act
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the primary action property of the buttonlink control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""btn""></a>")]
        [InlineData("modal", @"<a class=""btn"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal""></a>")]
        public void PrimaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonLink()
            {
                PrimaryAction = new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the secondary action property of the buttonlink control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""btn""></a>")]
        [InlineData("modal", @"<a class=""btn"" data-wx-secondary-action=""modal"" data-wx-secondary-target=""#modal""></a>")]
        public void SecondaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButtonLink()
            {
                SecondaryAction = new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the content property of the buttonlink control.
        /// </summary>
        [Fact]
        public void Content()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control1 = new ControlButtonLink(null, new ControlIcon() { Icon = new IconStar() });
            var control2 = new ControlButtonLink(null, [new ControlIcon() { Icon = new IconStar() }]);
            var control3 = new ControlButtonLink(null, new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]).ToArray());

            // act
            var html1 = control1.Render(context, visualTree);
            var html2 = control2.Render(context, visualTree);
            var html3 = control3.Render(context, visualTree);

            Assert.Equal(@"<a class=""btn""><i class=""fas fa-star""></i></a>", html1.Trim());
            Assert.Equal(@"<a class=""btn""><i class=""fas fa-star""></i></a>", html2.Trim());
            Assert.Equal(@"<a class=""btn""><i class=""fas fa-star""></i></a>", html3.Trim());
        }
    }
}
