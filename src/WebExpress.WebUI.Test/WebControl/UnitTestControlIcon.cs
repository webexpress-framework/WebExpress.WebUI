using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

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
        [InlineData(null, @"<i class=""fas fa-star""></i>")]
        [InlineData("id", @"<i id=""id"" class=""fas fa-star""></i>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon(id)
            {
                Icon = new IconStar()
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the title property of the icon control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<i class=""fas fa-star""></i>")]
        [InlineData("abc", @"<i class=""fas fa-star"" title=""abc""></i>")]
        public void Title(string title, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon()
            {
                Icon = new IconStar(),
                Title = title
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
        [InlineData(typeof(IconStar), @"<i class=""fas fa-star""></i>")]
        public void Icon(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon()
            {
                Icon = icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the size property of the icon control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeText.Default, @"<i class=""fas fa-star""></i>")]
        [InlineData(TypeSizeText.ExtraSmall, @"<i class=""fas fa-star wx-esm""></i>")]
        [InlineData(TypeSizeText.Small, @"<i class=""fas fa-star wx-sm""></i>")]
        [InlineData(TypeSizeText.Large, @"<i class=""fas fa-star wx-lg""></i>")]
        [InlineData(TypeSizeText.ExtraLarge, @"<i class=""fas fa-star wx-elg""></i>")]
        public void Size(TypeSizeText size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon()
            {
                Icon = new IconStar(),
                Size = new PropertySizeText(size)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the vertical alignment property of the icon control.
        /// </summary>
        [Theory]
        [InlineData(TypeVerticalAlignment.Default, @"<i class=""fas fa-star""></i>")]
        [InlineData(TypeVerticalAlignment.Middle, @"<i class=""fas fa-star align-middle""></i>")]
        [InlineData(TypeVerticalAlignment.TextTop, @"<i class=""fas fa-star align-text-top""></i>")]
        [InlineData(TypeVerticalAlignment.TextBottom, @"<i class=""fas fa-star align-text-bottom""></i>")]
        [InlineData(TypeVerticalAlignment.Bottom, @"<i class=""fas fa-star align-bottom""></i>")]
        public void VerticalAlignment(TypeVerticalAlignment verticalAlignment, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlIcon()
            {
                Icon = new IconStar(),
                VerticalAlignment = verticalAlignment
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }
    }
}
