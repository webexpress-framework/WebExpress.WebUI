using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the split button control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSplitButton
    {
        /// <summary>
        /// Tests the id property of the split button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""btn-group""><button class=""btn""></button><button class=""btn dropdown-toggle dropdown-toggle-split"" data-toggle=""dropdown"" data-bs-toggle=""dropdown"" aria-expanded=""false""><span class=""caret""></span></button><ul class=""dropdown-menu""></ul></div>")]
        [InlineData("id", @"<div id=""id"" class=""btn-group""><button id=""id_btn"" class=""btn""></button><button id=""id_toggle"" class=""btn dropdown-toggle dropdown-toggle-split"" data-toggle=""dropdown"" data-bs-toggle=""dropdown"" aria-expanded=""false""><span class=""caret""></span></button><ul class=""dropdown-menu""></ul></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButton(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the split button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""btn-group""><button class=""btn""></button>*</div>")]
        [InlineData("abc", @"<div class=""btn-group""><button class=""btn"">abc</button>*</div>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButton()
            {
                Text = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the split button control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeButton.Default, @"<div class=""btn-group""><button class=""btn""></button>*</div>")]
        [InlineData(TypeSizeButton.Small, @"<div class=""btn-group""><button class=""btn btn-sm""></button><button class=""btn * btn-sm"" *</div>")]
        [InlineData(TypeSizeButton.Large, @"<div class=""btn-group""><button class=""btn btn-lg""></button><button class=""btn * btn-lg"" *</div>")]
        public void Size(TypeSizeButton size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButton()
            {
                Size = size
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the split button control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorButton.Default, @"<div class=""btn-group""><button class=""btn""></button>*</div>")]
        [InlineData(TypeColorButton.Primary, @"<div class=""btn-group""><button class=""btn btn-primary""></button><button class=""btn * btn-primary"" *")]
        [InlineData(TypeColorButton.Secondary, @"<div class=""btn-group""><button class=""btn btn-secondary""></button><button class=""btn * btn-secondary"" *")]
        [InlineData(TypeColorButton.Warning, @"<div class=""btn-group""><button class=""btn btn-warning""></button><button class=""btn * btn-warning"" *")]
        [InlineData(TypeColorButton.Danger, @"<div class=""btn-group""><button class=""btn btn-danger""></button><button class=""btn * btn-danger"" *")]
        [InlineData(TypeColorButton.Dark, @"<div class=""btn-group""><button class=""btn btn-dark""></button><button class=""btn * btn-dark"" *")]
        public void BackgroundColor(TypeColorButton color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButton()
            {
                BackgroundColor = new PropertyColorButton(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the outline property of the split button control.
        /// </summary>
        [Theory]
        [InlineData(false, TypeColorButton.Default, @"<div class=""btn-group""><button class=""btn""></button>*</div>")]
        [InlineData(true, TypeColorButton.Default, @"<div class=""btn-group""><button class=""btn""></button>*</div>")]
        [InlineData(true, TypeColorButton.Primary, @"<div class=""btn-group""><button class=""btn btn-outline-primary""></button><button class=""btn * btn-outline-primary"" *")]
        [InlineData(true, TypeColorButton.Secondary, @"<div class=""btn-group""><button class=""btn btn-outline-secondary""></button><button class=""btn * btn-outline-secondary"" *")]
        [InlineData(true, TypeColorButton.Warning, @"<div class=""btn-group""><button class=""btn btn-outline-warning""></button><button class=""btn * btn-outline-warning"" *")]
        [InlineData(true, TypeColorButton.Danger, @"<div class=""btn-group""><button class=""btn btn-outline-danger""></button><button class=""btn * btn-outline-danger"" *")]
        [InlineData(true, TypeColorButton.Dark, @"<div class=""btn-group""><button class=""btn btn-outline-dark""></button><button class=""btn * btn-outline-dark"" *")]
        public void Outline(bool outline, TypeColorButton color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButton()
            {
                Outline = outline,
                BackgroundColor = new PropertyColorButton(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the block property of the split button control.
        /// </summary>
        [Theory]
        [InlineData(TypeBlockButton.None, @"<div class=""btn-group""><button class=""btn""></button>*</div>")]
        [InlineData(TypeBlockButton.Block, @"<div class=""btn-group btn-block""><button class=""btn btn-block""></button>*</div>")]
        public void Block(TypeBlockButton block, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButton()
            {
                Block = block
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the split button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""btn-group""><button class=""btn""></button>*</div>")]
        [InlineData(typeof(IconStar), @"<div class=""btn-group""><button class=""btn""><i class=""fas fa-star""></i></button>*</div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButton()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the split button control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control1 = new ControlSplitButton(null, new ControlSplitButtonItemLink() { Text = "abc" });
            var control2 = new ControlSplitButton(null, [new ControlSplitButtonItemLink() { Text = "abc" }]);
            var control3 = new ControlSplitButton(null, new List<IControlSplitButtonItem>([new ControlSplitButtonItemLink() { Text = "abc" }]).ToArray());
            var control4 = new ControlSplitButton(null);
            var control5 = new ControlSplitButton(null);
            var control6 = new ControlSplitButton(null);

            // test execution
            control4.Add(new ControlSplitButtonItemLink() { Text = "abc" });
            control5.Add([new ControlSplitButtonItemLink() { Text = "abc" }]);
            control6.Add(new List<IControlSplitButtonItem>([new ControlSplitButtonItemLink() { Text = "abc" }]).ToArray());

            var html1 = control1.Render(context, visualTree);
            var html2 = control2.Render(context, visualTree);
            var html3 = control3.Render(context, visualTree);
            var html4 = control4.Render(context, visualTree);
            var html5 = control5.Render(context, visualTree);
            var html6 = control6.Render(context, visualTree);

            var expected = @"<div class=""btn-group"">*<a class=""link"">abc</a>*</div>";
            AssertExtensions.EqualWithPlaceholders(expected, html1);
            AssertExtensions.EqualWithPlaceholders(expected, html2);
            AssertExtensions.EqualWithPlaceholders(expected, html3);
            AssertExtensions.EqualWithPlaceholders(expected, html4);
            AssertExtensions.EqualWithPlaceholders(expected, html5);
            AssertExtensions.EqualWithPlaceholders(expected, html6);
        }
    }
}
