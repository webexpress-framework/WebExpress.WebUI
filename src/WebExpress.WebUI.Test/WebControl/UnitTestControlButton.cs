using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the button control.
    /// </summary>
    public class UnitTestControlButton
    {
        /// <summary>
        /// Tests the id property of the button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""button"" class=""wx-button btn""></button>")]
        [InlineData("id", @"<button id=""id"" type=""button"" class=""wx-button btn""></button>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButton(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""button"" class=""wx-button btn""></button>")]
        [InlineData("abc", @"<button type=""button"" class=""wx-button btn"">abc</button>")]
        public void Text(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButton()
            {
                Text = (c) => text
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the button control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeButton.Default, @"<button type=""button"" class=""wx-button btn""></button>")]
        [InlineData(TypeSizeButton.Small, @"<button type=""button"" class=""wx-button btn btn-sm""></button>")]
        [InlineData(TypeSizeButton.Large, @"<button type=""button"" class=""wx-button btn btn-lg""></button>")]
        public void Size(TypeSizeButton size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButton()
            {
                Size = _ => size
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the button control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorButton.Default, @"<button type=""button"" class=""wx-button btn""></button>")]
        [InlineData(TypeColorButton.Primary, @"<button type=""button"" class=""wx-button btn btn-primary""></button>")]
        [InlineData(TypeColorButton.Secondary, @"<button type=""button"" class=""wx-button btn btn-secondary""></button>")]
        [InlineData(TypeColorButton.Info, @"<button type=""button"" class=""wx-button btn btn-info""></button>")]
        [InlineData(TypeColorButton.Warning, @"<button type=""button"" class=""wx-button btn btn-warning""></button>")]
        [InlineData(TypeColorButton.Danger, @"<button type=""button"" class=""wx-button btn btn-danger""></button>")]
        [InlineData(TypeColorButton.Dark, @"<button type=""button"" class=""wx-button btn btn-dark""></button>")]
        [InlineData(TypeColorButton.Highlight, @"<button type=""button"" class=""wx-button btn btn-highlight""></button>")]
        public void BackgroundColor(TypeColorButton color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButton()
            {
                BackgroundColor = _ => new PropertyColorButton(color)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the outline property of the button control.
        /// </summary>
        [Theory]
        [InlineData(false, TypeColorButton.Default, @"<button type=""button"" class=""wx-button btn""></button>")]
        [InlineData(true, TypeColorButton.Default, @"<button type=""button"" class=""wx-button btn""></button>")]
        [InlineData(true, TypeColorButton.Primary, @"<button type=""button"" class=""wx-button btn btn-outline-primary""></button>")]
        [InlineData(true, TypeColorButton.Secondary, @"<button type=""button"" class=""wx-button btn btn-outline-secondary""></button>")]
        [InlineData(true, TypeColorButton.Warning, @"<button type=""button"" class=""wx-button btn btn-outline-warning""></button>")]
        [InlineData(true, TypeColorButton.Danger, @"<button type=""button"" class=""wx-button btn btn-outline-danger""></button>")]
        [InlineData(true, TypeColorButton.Dark, @"<button type=""button"" class=""wx-button btn btn-outline-dark""></button>")]
        public void Outline(bool outline, TypeColorButton color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButton()
            {
                Outline = _ => outline,
                BackgroundColor = _ => new PropertyColorButton(color)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the block property of the button control.
        /// </summary>
        [Theory]
        [InlineData(TypeBlockButton.None, @"<button type=""button"" class=""wx-button btn""></button>")]
        [InlineData(TypeBlockButton.Block, @"<button type=""button"" class=""wx-button btn btn-block""></button>")]
        public void Block(TypeBlockButton block, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButton()
            {
                Block = _ => block
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""button"" class=""wx-button btn""></button>")]
        [InlineData(typeof(IconStar), @"<button type=""button"" class=""wx-button btn""><i class=""wx-icon-light wx-icon-light-star""></i></button>")]
        public void Icon(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButton()
            {
                Icon = _ => icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the primary action property of the button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""button"" class=""wx-button btn""></button>")]
        [InlineData("modal", @"<button type=""button"" class=""wx-button btn"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal""></button>")]
        public void PrimaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButton()
            {
                PrimaryAction = _ => new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the secondary action property of the button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""button"" class=""wx-button btn""></button>")]
        [InlineData("modal", @"<button type=""button"" class=""wx-button btn"" data-wx-secondary-action=""modal"" data-wx-secondary-target=""#modal""></button>")]
        public void SecondaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButton()
            {
                SecondaryAction = _ => new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the button control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control1 = new ControlButton(null, new ControlIcon() { Icon = _ => new IconStar() });
            var control2 = new ControlButton(null, [new ControlIcon() { Icon = _ => new IconStar() }]);
            var control3 = new ControlButton(null, new List<ControlIcon>([new ControlIcon() { Icon = _ => new IconStar() }]).ToArray());
            var control4 = new ControlButton(null);
            var control5 = new ControlButton(null);
            var control6 = new ControlButton(null);

            // act
            control4.Add(new ControlIcon() { Icon = _ => new IconStar() });
            control5.Add([new ControlIcon() { Icon = _ => new IconStar() }]);
            control6.Add(new List<ControlIcon>([new ControlIcon() { Icon = _ => new IconStar() }]));

            var html1 = control1.Render(context, visualTree);
            var html2 = control2.Render(context, visualTree);
            var html3 = control3.Render(context, visualTree);
            var html4 = control4.Render(context, visualTree);
            var html5 = control5.Render(context, visualTree);
            var html6 = control6.Render(context, visualTree);

            Assert.Equal(@"<button type=""button"" class=""wx-button btn""><i class=""wx-icon-light wx-icon-light-star""></i></button>", html1.Trim());
            Assert.Equal(@"<button type=""button"" class=""wx-button btn""><i class=""wx-icon-light wx-icon-light-star""></i></button>", html2.Trim());
            Assert.Equal(@"<button type=""button"" class=""wx-button btn""><i class=""wx-icon-light wx-icon-light-star""></i></button>", html3.Trim());
            Assert.Equal(@"<button type=""button"" class=""wx-button btn""><i class=""wx-icon-light wx-icon-light-star""></i></button>", html4.Trim());
            Assert.Equal(@"<button type=""button"" class=""wx-button btn""><i class=""wx-icon-light wx-icon-light-star""></i></button>", html5.Trim());
            Assert.Equal(@"<button type=""button"" class=""wx-button btn""><i class=""wx-icon-light wx-icon-light-star""></i></button>", html6.Trim());
        }

        /// <summary>
        /// Tests that a modal action names the success action a form in the dialog is told to
        /// run, and that None is written out, since an absent option leaves the form to decide.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button type=""button"" class=""wx-button btn"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal""></button>")]
        [InlineData(TypeModalSuccessAction.None, @"<button type=""button"" class=""wx-button btn"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal"" data-wx-primary-success=""none""></button>")]
        [InlineData(TypeModalSuccessAction.Reload, @"<button type=""button"" class=""wx-button btn"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal"" data-wx-primary-success=""reload""></button>")]
        [InlineData(TypeModalSuccessAction.FollowUri, @"<button type=""button"" class=""wx-button btn"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal"" data-wx-primary-success=""follow-uri""></button>")]
        public void PrimaryActionSuccess(TypeModalSuccessAction? success, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlButton()
            {
                PrimaryAction = _ => new ActionModal("modal") { SuccessAction = success }
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the json form of a modal action carries the success option, which the
        /// client writes onto the element of a card or a row like every other option.
        /// </summary>
        [Fact]
        public void ActionModalSuccessToJson()
        {
            // act
            var plain = new ActionModal("modal").ToJson();
            var none = new ActionModal("modal") { SuccessAction = TypeModalSuccessAction.None }.ToJson();

            // validation
            Assert.False(plain.ContainsKey("success"));
            Assert.Equal("none", none["success"]);
        }
    }
}
