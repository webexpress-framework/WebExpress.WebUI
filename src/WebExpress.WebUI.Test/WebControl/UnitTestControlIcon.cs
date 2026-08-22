using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;
using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the icon control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlIcon
    {
        /// <summary>
        /// Tests the id property of the icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<i class=""wx-icon-light wx-icon-light-star""></i>")]
        [InlineData("id", @"<i id=""id"" class=""wx-icon-light wx-icon-light-star""></i>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon(id)
            {
                Icon = _ => new IconStar()
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the title property of the icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<i class=""wx-icon-light wx-icon-light-star""></i>")]
        [InlineData("abc", @"<i class=""wx-icon-light wx-icon-light-star"" title=""abc""></i>")]
        public void Title(string title, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon()
            {
                Icon = _ => new IconStar(),
                Title = _ => title
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the icon property of the icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"")]
        [InlineData(typeof(IconStar), @"<i class=""wx-icon-light wx-icon-light-star""></i>")]
        public void Icon(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon()
            {
                Icon = _ => icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the size property of the icon control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeText.Default, @"<i class=""wx-icon-light wx-icon-light-star""></i>")]
        [InlineData(TypeSizeText.ExtraSmall, @"<i class=""wx-icon-light wx-icon-light-star wx-esm""></i>")]
        [InlineData(TypeSizeText.Small, @"<i class=""wx-icon-light wx-icon-light-star wx-sm""></i>")]
        [InlineData(TypeSizeText.Large, @"<i class=""wx-icon-light wx-icon-light-star wx-lg""></i>")]
        [InlineData(TypeSizeText.ExtraLarge, @"<i class=""wx-icon-light wx-icon-light-star wx-elg""></i>")]
        public void Size(TypeSizeText size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon()
            {
                Icon = _ => new IconStar(),
                Size = _ => new PropertySizeText(size)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the vertical alignment property of the icon control.
        /// </summary>
        [Theory]
        [InlineData(TypeVerticalAlignment.Default, @"<i class=""wx-icon-light wx-icon-light-star""></i>")]
        [InlineData(TypeVerticalAlignment.Middle, @"<i class=""wx-icon-light wx-icon-light-star align-middle""></i>")]
        [InlineData(TypeVerticalAlignment.TextTop, @"<i class=""wx-icon-light wx-icon-light-star align-text-top""></i>")]
        [InlineData(TypeVerticalAlignment.TextBottom, @"<i class=""wx-icon-light wx-icon-light-star align-text-bottom""></i>")]
        [InlineData(TypeVerticalAlignment.Bottom, @"<i class=""wx-icon-light wx-icon-light-star align-bottom""></i>")]
        public void VerticalAlignment(TypeVerticalAlignment verticalAlignment, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon()
            {
                Icon = _ => new IconStar(),
                VerticalAlignment = _ => verticalAlignment
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests that an icon renders the css class pair of the light set, which is the
        /// only set the framework ships since FontAwesome was removed.
        /// </summary>
        [Fact]
        public void RendersLightClass()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon()
            {
                Icon = _ => new IconStar()
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<i class=""wx-icon-light wx-icon-light-star""></i>", html.Trim());
        }

        /// <summary>
        /// Tests the background colour of the icon control.
        /// </summary>
        /// <remarks>
        /// The colour has to end up on a wrapper: a drawn icon is painted by masking
        /// background-color, so putting it on the icon itself would recolour the glyph
        /// instead of backing it. The default colour paints nothing and must not wrap.
        /// </remarks>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<i class=""wx-icon-light wx-icon-light-star""></i>")]
        [InlineData(TypeColorBackground.Primary, @"<span class=""wx-icon-backdrop bg-primary""><i class=""wx-icon-light wx-icon-light-star""></i></span>")]
        [InlineData(TypeColorBackground.Danger, @"<span class=""wx-icon-backdrop bg-danger""><i class=""wx-icon-light wx-icon-light-star""></i></span>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon()
            {
                Icon = _ => new IconStar(),
                BackgroundColor = _ => new PropertyColorBackground(backgroundColor)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests that the symbolic name drives the css class, so a renamed or missing
        /// drawing surfaces as a wrong class rather than as a silently empty icon.
        /// </summary>
        [Fact]
        public void SymbolDrivesClass()
        {
            // arrange
            var icon = new IconStar();

            // assert
            Assert.Equal("star", icon.Symbol);
            Assert.Equal("wx-icon-light wx-icon-light-star", icon.Class);
        }
    }
}
