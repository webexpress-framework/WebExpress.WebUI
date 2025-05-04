using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form reset button control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemButtonReset
    {
        /// <summary>
        /// Tests the id property of the form submit button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""reset"" class=""btn me-2 btn-secondary""><span class=""fa-solid fa-rotate-left me-2""></span>Reset</button>")]
        [InlineData("id", @"<button id=""id"" name=""id"" type=""reset"" class=""btn me-2 btn-secondary""><span class=""fa-solid fa-rotate-left me-2""></span>Reset</button>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonReset(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the form reset button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""reset"" class=""btn me-2 btn-secondary""><span class=""fa-solid fa-rotate-left""></span></button>")]
        [InlineData("abc", @"<button type=""reset"" class=""btn me-2 btn-secondary""><span class=""fa-solid fa-rotate-left me-2""></span>abc</button>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonReset()
            {
                Text = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the form reset button control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeButton.Default, @"<button type=""reset"" class=""btn me-2 btn-secondary"">*</button>")]
        [InlineData(TypeSizeButton.Small, @"<button type=""reset"" class=""btn me-2 btn-sm btn-secondary"">*</button>")]
        [InlineData(TypeSizeButton.Large, @"<button type=""reset"" class=""btn me-2 btn-lg btn-secondary"">*</button>")]
        public void Size(TypeSizeButton size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonReset()
            {
                Size = size
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the form reset button control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<button type=""reset"" class=""btn me-2 btn-secondary"">*</button>")]
        [InlineData(TypeColorBackground.Primary, @"<button type=""reset"" class=""btn bg-primary *"">*</button>")]
        [InlineData(TypeColorBackground.Secondary, @"<button type=""reset"" class=""btn bg-secondary *"">*</button>")]
        [InlineData(TypeColorBackground.Warning, @"<button type=""reset"" class=""btn bg-warning *"">*</button>")]
        [InlineData(TypeColorBackground.Danger, @"<button type=""reset"" class=""btn bg-danger *"">*</button>")]
        [InlineData(TypeColorBackground.Dark, @"<button type=""reset"" class=""btn bg-dark *"">*</button>")]
        [InlineData(TypeColorBackground.Light, @"<button type=""reset"" class=""btn bg-light *"">*</button>")]
        [InlineData(TypeColorBackground.White, @"<button type=""reset"" class=""btn bg-white *"">*</button>")]
        [InlineData(TypeColorBackground.Transparent, @"<button type=""reset"" class=""btn bg-transparent *"">*</button>")]
        public void BackgroundColor(TypeColorBackground color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonReset()
            {
                BackgroundColor = new PropertyColorBackground(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the form reset button control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorButton.Default, @"<button type=""reset"" class=""btn me-2"">*</button>")]
        [InlineData(TypeColorButton.Primary, @"<button type=""reset"" class=""btn me-2 btn-primary"">*</button>")]
        [InlineData(TypeColorButton.Secondary, @"<button type=""reset"" class=""btn me-2 btn-secondary"">*</button>")]
        [InlineData(TypeColorButton.Warning, @"<button type=""reset"" class=""btn me-2 btn-warning"">*</button>")]
        [InlineData(TypeColorButton.Danger, @"<button type=""reset"" class=""btn me-2 btn-danger"">*</button>")]
        [InlineData(TypeColorButton.Dark, @"<button type=""reset"" class=""btn me-2 btn-dark"">*</button>")]
        [InlineData(TypeColorButton.Light, @"<button type=""reset"" class=""btn me-2 btn-light"">*</button>")]
        public void Color(TypeColorButton color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonReset()
            {
                Color = new PropertyColorButton(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the outline property of the form reset button control.
        /// </summary>
        [Theory]
        [InlineData(false, TypeColorButton.Default, @"<button type=""reset"" class=""btn me-2"">*</button>")]
        [InlineData(true, TypeColorButton.Default, @"<button type=""reset"" class=""btn me-2"">*</button>")]
        [InlineData(true, TypeColorButton.Primary, @"<button type=""reset"" class=""btn me-2 btn-outline-primary"">*</button>")]
        [InlineData(true, TypeColorButton.Secondary, @"<button type=""reset"" class=""btn me-2 btn-outline-secondary"">*</button>")]
        [InlineData(true, TypeColorButton.Warning, @"<button type=""reset"" class=""btn me-2 btn-outline-warning"">*</button>")]
        [InlineData(true, TypeColorButton.Danger, @"<button type=""reset"" class=""btn me-2 btn-outline-danger"">*</button>")]
        [InlineData(true, TypeColorButton.Dark, @"<button type=""reset"" class=""btn me-2 btn-outline-dark"">*</button>")]
        [InlineData(true, TypeColorButton.Light, @"<button type=""reset"" class=""btn me-2"">*</button>")]
        public void Outline(bool outline, TypeColorButton color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonReset()
            {
                Outline = outline,
                Color = new PropertyColorButton(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the block property of the form reset button control.
        /// </summary>
        [Theory]
        [InlineData(TypeBlockButton.None, @"<button type=""reset"" class=""btn me-2 btn-secondary"">*</button>")]
        [InlineData(TypeBlockButton.Block, @"<button type=""reset"" class=""btn me-2 btn-secondary btn-block"">*</button>")]
        public void Block(TypeBlockButton block, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonReset()
            {
                Block = block
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the form reset button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""reset"" class=""btn me-2 btn-secondary"">*</button>")]
        [InlineData(typeof(IconStar), @"<button type=""reset"" class=""btn me-2 btn-secondary""><span class=""fas fa-star me-2""></span>Reset</button>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonReset()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the form reset button control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control1 = new ControlFormItemButtonReset(null, new ControlIcon() { Icon = new IconStar() });
            var control2 = new ControlFormItemButtonReset(null, [new ControlIcon() { Icon = new IconStar() }]);
            var control3 = new ControlFormItemButtonReset(null, new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]).ToArray());
            var control4 = new ControlFormItemButtonReset(null);
            var control5 = new ControlFormItemButtonReset(null);
            var control6 = new ControlFormItemButtonReset(null);

            // test execution
            control4.Add(new ControlIcon() { Icon = new IconStar() });
            control5.Add([new ControlIcon() { Icon = new IconStar() }]);
            control6.Add(new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]));

            var html1 = control1.Render(context, visualTree);
            var html2 = control2.Render(context, visualTree);
            var html3 = control3.Render(context, visualTree);
            var html4 = control4.Render(context, visualTree);
            var html5 = control5.Render(context, visualTree);
            var html6 = control6.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<button type=""reset"" class=""btn me-2 btn-secondary""><span class=""fa-solid fa-rotate-left me-2""></span>Reset<span class=""fas fa-star""></span></button>", html1.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<button type=""reset"" class=""btn me-2 btn-secondary""><span class=""fa-solid fa-rotate-left me-2""></span>Reset<span class=""fas fa-star""></span></button>", html2.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<button type=""reset"" class=""btn me-2 btn-secondary""><span class=""fa-solid fa-rotate-left me-2""></span>Reset<span class=""fas fa-star""></span></button>", html3.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<button type=""reset"" class=""btn me-2 btn-secondary""><span class=""fa-solid fa-rotate-left me-2""></span>Reset<span class=""fas fa-star""></span></button>", html4.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<button type=""reset"" class=""btn me-2 btn-secondary""><span class=""fa-solid fa-rotate-left me-2""></span>Reset<span class=""fas fa-star""></span></button>", html5.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<button type=""reset"" class=""btn me-2 btn-secondary""><span class=""fa-solid fa-rotate-left me-2""></span>Reset<span class=""fas fa-star""></span></button>", html6.Trim());
        }
    }
}
