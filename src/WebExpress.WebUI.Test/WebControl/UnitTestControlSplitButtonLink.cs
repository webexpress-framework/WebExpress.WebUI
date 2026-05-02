using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the split button link control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSplitButtonLink
    {
        /// <summary>
        /// Tests the id property of the split button link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""btn-group"" role=""button""><a class=""btn""></a><span class=""btn dropdown-toggle dropdown-toggle-split"" data-bs-toggle=""dropdown"" aria-expanded=""false""><span class=""caret""></span></span><ul class=""dropdown-menu""></ul></div>")]
        [InlineData("id", @"<div id=""id"" class=""btn-group"" role=""button""><a id=""id_btn"" class=""btn""></a><span id=""id_btn"" class=""btn dropdown-toggle dropdown-toggle-split"" data-bs-toggle=""dropdown"" aria-expanded=""false""><span class=""caret""></span></span><ul class=""dropdown-menu""></ul></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButtonLink(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the split button link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""btn-group"" role=""button""><a class=""btn""></a>*</div>")]
        [InlineData("abc", @"<div class=""btn-group"" role=""button""><a class=""btn"">abc</a>*</div>")]
        public void Text(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButtonLink()
            {
                Text = text
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the split button link control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeButton.Default, @"<div class=""btn-group"" role=""button""><a class=""btn""></a>*</div>")]
        [InlineData(TypeSizeButton.Small, @"<div class=""btn-group"" role=""button""><a class=""btn btn-sm""></a>*</div>")]
        [InlineData(TypeSizeButton.Large, @"<div class=""btn-group"" role=""button""><a class=""btn btn-lg""></a>*</div>")]
        public void Size(TypeSizeButton size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButtonLink()
            {
                Size = size
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the split button link control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorButton.Default, @"<div class=""btn-group"" role=""button""><a class=""btn""></a>*</div>")]
        [InlineData(TypeColorButton.Primary, @"<div class=""btn-group"" role=""button""><a class=""btn btn-primary""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-primary"" *</div>")]
        [InlineData(TypeColorButton.Secondary, @"<div class=""btn-group"" role=""button""><a class=""btn btn-secondary""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-secondary"" *</div>")]
        [InlineData(TypeColorButton.Warning, @"<div class=""btn-group"" role=""button""><a class=""btn btn-warning""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-warning"" *</div>")]
        [InlineData(TypeColorButton.Danger, @"<div class=""btn-group"" role=""button""><a class=""btn btn-danger""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-danger"" *</div>")]
        [InlineData(TypeColorButton.Dark, @"<div class=""btn-group"" role=""button""><a class=""btn btn-dark""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-dark"" *</div>")]
        [InlineData(TypeColorButton.Highlight, @"<div class=""btn-group"" role=""button""><a class=""btn btn-highlight""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-highlight"" *</div>")]
        public void BackgroundColor(TypeColorButton color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButtonLink()
            {
                BackgroundColor = new PropertyColorButton(color)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the outline property of the split button link control.
        /// </summary>
        [Theory]
        [InlineData(false, TypeColorButton.Default, @"<div class=""btn-group"" role=""button""><a class=""btn""></a>*</div>")]
        [InlineData(true, TypeColorButton.Default, @"<div class=""btn-group"" role=""button""><a class=""btn""></a>*</div>")]
        [InlineData(true, TypeColorButton.Primary, @"<div class=""btn-group"" role=""button""><a class=""btn btn-outline-primary""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-outline-primary"" *</div>")]
        [InlineData(true, TypeColorButton.Secondary, @"<div class=""btn-group"" role=""button""><a class=""btn btn-outline-secondary""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-outline-secondary"" *</div>")]
        [InlineData(true, TypeColorButton.Warning, @"<div class=""btn-group"" role=""button""><a class=""btn btn-outline-warning""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-outline-warning"" *</div>")]
        [InlineData(true, TypeColorButton.Danger, @"<div class=""btn-group"" role=""button""><a class=""btn btn-outline-danger""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-outline-danger"" *</div>")]
        [InlineData(true, TypeColorButton.Dark, @"<div class=""btn-group"" role=""button""><a class=""btn btn-outline-dark""></a><span class=""btn dropdown-toggle dropdown-toggle-split btn-outline-dark"" *</div>")]
        public void Outline(bool outline, TypeColorButton color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButtonLink()
            {
                Outline = outline,
                BackgroundColor = new PropertyColorButton(color)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the block property of the split button link control.
        /// </summary>
        [Theory]
        [InlineData(TypeBlockButton.None, @"<div class=""btn-group"" role=""button""><a class=""btn""></a>*</div>")]
        [InlineData(TypeBlockButton.Block, @"<div class=""btn-group btn-block"" role=""button""><a class=""btn btn-block""></a>*</div>")]
        public void Block(TypeBlockButton block, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButtonLink()
            {
                Block = block
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the split button link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""btn-group"" role=""button""><a class=""btn""></a>*</div>")]
        [InlineData(typeof(IconStar), @"<div class=""btn-group"" role=""button""><a class=""btn""><i class=""fas fa-star""></i>*</div>")]
        public void Icon(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSplitButtonLink()
            {
                Icon = icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the split button link control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control1 = new ControlSplitButtonLink(null, new ControlSplitButtonItemLink() { Text = "abc" });
            var control2 = new ControlSplitButtonLink(null, [new ControlSplitButtonItemLink() { Text = "abc" }]);
            var control3 = new ControlSplitButtonLink(null, new List<IControlSplitButtonItem>([new ControlSplitButtonItemLink() { Text = "abc" }]).ToArray());
            var control4 = new ControlSplitButtonLink(null);
            var control5 = new ControlSplitButtonLink(null);
            var control6 = new ControlSplitButtonLink(null);

            // act
            control4.Add(new ControlSplitButtonItemLink() { Text = "abc" });
            control5.Add([new ControlSplitButtonItemLink() { Text = "abc" }]);
            control6.Add(new List<IControlSplitButtonItem>([new ControlSplitButtonItemLink() { Text = "abc" }]).ToArray());

            var html1 = control1.Render(context, visualTree);
            var html2 = control2.Render(context, visualTree);
            var html3 = control3.Render(context, visualTree);
            var html4 = control4.Render(context, visualTree);
            var html5 = control5.Render(context, visualTree);
            var html6 = control6.Render(context, visualTree);

            var expected = @"<div class=""btn-group"" role=""button"">*<a class=""wx-link"">abc</a>*</div>";
            AssertExtensions.EqualWithPlaceholders(expected, html1);
            AssertExtensions.EqualWithPlaceholders(expected, html2);
            AssertExtensions.EqualWithPlaceholders(expected, html3);
            AssertExtensions.EqualWithPlaceholders(expected, html4);
            AssertExtensions.EqualWithPlaceholders(expected, html5);
            AssertExtensions.EqualWithPlaceholders(expected, html6);
        }
    }
}
