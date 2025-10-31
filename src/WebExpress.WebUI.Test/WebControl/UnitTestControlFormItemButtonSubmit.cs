using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form submit button control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemButtonSubmit
    {
        /// <summary>
        /// Tests the id property of the form submit button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""submit"" class=""btn me-2 btn-success""><i class=""fas fa-save me-2""></i>Submit</button>")]
        [InlineData("id", @"<button id=""id"" name=""id"" type=""submit"" class=""btn me-2 btn-success"">*</i>Submit</button>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonSubmit(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the form submit button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""submit"" class=""btn me-2 btn-success""><i class=""fas fa-save""></i></button>")]
        [InlineData("abc", @"<button type=""submit"" class=""btn me-2 btn-success""><i class=""fas fa-save me-2""></i>abc</button>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonSubmit()
            {
                Text = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the form submit button control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeButton.Default, @"<button type=""submit"" class=""btn me-2 btn-success"">*</button>")]
        [InlineData(TypeSizeButton.Small, @"<button type=""submit"" class=""btn me-2 btn-sm btn-success"">*</button>")]
        [InlineData(TypeSizeButton.Large, @"<button type=""submit"" class=""btn me-2 btn-lg btn-success"">*</button>")]
        public void Size(TypeSizeButton size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonSubmit()
            {
                Size = size
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the form submit button control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<button type=""submit"" class=""btn me-2 btn-success"">*</button>")]
        [InlineData(TypeColorBackground.Primary, @"<button type=""submit"" class=""btn bg-primary *"">*</button>")]
        [InlineData(TypeColorBackground.Secondary, @"<button type=""submit"" class=""btn bg-secondary *"">*</button>")]
        [InlineData(TypeColorBackground.Warning, @"<button type=""submit"" class=""btn bg-warning *"">*</button>")]
        [InlineData(TypeColorBackground.Danger, @"<button type=""submit"" class=""btn bg-danger *"">*</button>")]
        [InlineData(TypeColorBackground.Dark, @"<button type=""submit"" class=""btn bg-dark *"">*</button>")]
        [InlineData(TypeColorBackground.Light, @"<button type=""submit"" class=""btn bg-light *"">*</button>")]
        [InlineData(TypeColorBackground.White, @"<button type=""submit"" class=""btn bg-white *"">*</button>")]
        [InlineData(TypeColorBackground.Transparent, @"<button type=""submit"" class=""btn bg-transparent *"">*</button>")]
        public void BackgroundColor(TypeColorBackground color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonSubmit()
            {
                BackgroundColor = new PropertyColorBackground(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the form submit button control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorButton.Default, @"<button type=""submit"" class=""btn me-2"">*</button>")]
        [InlineData(TypeColorButton.Primary, @"<button type=""submit"" class=""btn me-2 btn-primary"">*</button>")]
        [InlineData(TypeColorButton.Secondary, @"<button type=""submit"" class=""btn me-2 btn-secondary"">*</button>")]
        [InlineData(TypeColorButton.Warning, @"<button type=""submit"" class=""btn me-2 btn-warning"">*</button>")]
        [InlineData(TypeColorButton.Danger, @"<button type=""submit"" class=""btn me-2 btn-danger"">*</button>")]
        [InlineData(TypeColorButton.Dark, @"<button type=""submit"" class=""btn me-2 btn-dark"">*</button>")]
        [InlineData(TypeColorButton.Light, @"<button type=""submit"" class=""btn me-2 btn-light"">*</button>")]
        public void Color(TypeColorButton color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonSubmit()
            {
                Color = new PropertyColorButton(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the outline property of the form submit button control.
        /// </summary>
        [Theory]
        [InlineData(false, TypeColorButton.Default, @"<button type=""submit"" class=""btn me-2"">*</button>")]
        [InlineData(true, TypeColorButton.Default, @"<button type=""submit"" class=""btn me-2"">*</button>")]
        [InlineData(true, TypeColorButton.Primary, @"<button type=""submit"" class=""btn me-2 btn-outline-primary"">*</button>")]
        [InlineData(true, TypeColorButton.Secondary, @"<button type=""submit"" class=""btn me-2 btn-outline-secondary"">*</button>")]
        [InlineData(true, TypeColorButton.Warning, @"<button type=""submit"" class=""btn me-2 btn-outline-warning"">*</button>")]
        [InlineData(true, TypeColorButton.Danger, @"<button type=""submit"" class=""btn me-2 btn-outline-danger"">*</button>")]
        [InlineData(true, TypeColorButton.Dark, @"<button type=""submit"" class=""btn me-2 btn-outline-dark"">*</button>")]
        [InlineData(true, TypeColorButton.Light, @"<button type=""submit"" class=""btn me-2"">*</button>")]
        public void Outline(bool outline, TypeColorButton color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonSubmit()
            {
                Outline = outline,
                Color = new PropertyColorButton(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the block property of the form submit button control.
        /// </summary>
        [Theory]
        [InlineData(TypeBlockButton.None, @"<button type=""submit"" class=""btn me-2 btn-success"">*</button>")]
        [InlineData(TypeBlockButton.Block, @"<button type=""submit"" class=""btn me-2 btn-success btn-block"">*</button>")]
        public void Block(TypeBlockButton block, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonSubmit()
            {
                Block = block
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the form submit button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""submit"" class=""btn me-2 btn-success"">*</button>")]
        [InlineData(typeof(IconStar), @"<button type=""submit"" class=""btn me-2 btn-success""><i class=""fas fa-star me-2""></i>Submit</button>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemButtonSubmit()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the form submit button control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control1 = new ControlFormItemButtonSubmit(null, new ControlIcon() { Icon = new IconStar() });
            var control2 = new ControlFormItemButtonSubmit(null, [new ControlIcon() { Icon = new IconStar() }]);
            var control3 = new ControlFormItemButtonSubmit(null, new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]).ToArray());
            var control4 = new ControlFormItemButtonSubmit(null);
            var control5 = new ControlFormItemButtonSubmit(null);
            var control6 = new ControlFormItemButtonSubmit(null);

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

            AssertExtensions.EqualWithPlaceholders(@"<button type=""submit"" class=""btn me-2 btn-success""><i class=""fas fa-save me-2""></i>Submit<i class=""fas fa-star""></i></button>", html1.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<button type=""submit"" class=""btn me-2 btn-success""><i class=""fas fa-save me-2""></i>Submit<i class=""fas fa-star""></i></button>", html2.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<button type=""submit"" class=""btn me-2 btn-success""><i class=""fas fa-save me-2""></i>Submit<i class=""fas fa-star""></i></button>", html3.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<button type=""submit"" class=""btn me-2 btn-success""><i class=""fas fa-save me-2""></i>Submit<i class=""fas fa-star""></i></button>", html4.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<button type=""submit"" class=""btn me-2 btn-success""><i class=""fas fa-save me-2""></i>Submit<i class=""fas fa-star""></i></button>", html5.Trim());
            AssertExtensions.EqualWithPlaceholders(@"<button type=""submit"" class=""btn me-2 btn-success""><i class=""fas fa-save me-2""></i>Submit<i class=""fas fa-star""></i></button>", html6.Trim());
        }
    }
}
