using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the carousel control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlCarousel
    {
        /// <summary>
        /// Tests the id property of the carousel control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div id=""carousel"" class=""carousel slide"" data-bs-ride=""carousel"">*</div>")]
        [InlineData("id", @"<div id=""id"" class=""carousel slide"" data-bs-ride=""carousel""><div class=""carousel-indicators"">*</div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCarousel(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text color property of the carousel control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div id=""carousel"" class=""carousel slide"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorText.Primary, @"<div id=""carousel"" class=""carousel slide text-primary"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorText.Secondary, @"<div id=""carousel"" class=""carousel slide text-secondary"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorText.Info, @"<div id=""carousel"" class=""carousel slide text-info"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorText.Success, @"<div id=""carousel"" class=""carousel slide text-success"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorText.Warning, @"<div id=""carousel"" class=""carousel slide text-warning"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorText.Danger, @"<div id=""carousel"" class=""carousel slide text-danger"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorText.Light, @"<div id=""carousel"" class=""carousel slide text-light"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorText.Dark, @"<div id=""carousel"" class=""carousel slide text-dark"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorText.Muted, @"<div id=""carousel"" class=""carousel slide text-muted"" data-bs-ride=""carousel"">*</div>")]
        public void TextColor(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCarousel()
            {
                TextColor = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the carousel control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div id=""carousel"" class=""carousel slide"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorBackground.Primary, @"<div id=""carousel"" class=""carousel slide bg-primary"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div id=""carousel"" class=""carousel slide bg-secondary"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorBackground.Warning, @"<div id=""carousel"" class=""carousel slide bg-warning"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorBackground.Danger, @"<div id=""carousel"" class=""carousel slide bg-danger"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorBackground.Dark, @"<div id=""carousel"" class=""carousel slide bg-dark"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorBackground.Light, @"<div id=""carousel"" class=""carousel slide bg-light"" data-bs-ride=""carousel"">*</div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div id=""carousel"" class=""carousel slide bg-transparent"" data-bs-ride=""carousel"">*</div>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCarousel()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the carousel control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<div id=""carousel"" class=""carousel slide"" data-bs-ride=""carousel"">*<div></div>*</div>")]
        [InlineData(typeof(ControlLink), @"<div id=""carousel"" class=""carousel slide"" data-bs-ride=""carousel"">*<a class=""link""></a>*</div>")]
        [InlineData(typeof(ControlImage), @"<div id=""carousel"" class=""carousel slide"" data-bs-ride=""carousel"">*<img>*</div>")]
        public void Add(Type child, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var item = new ControlCarouselItem(childInstance);
            var control = new ControlCarousel();

            // test execution
            control.Add(item);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
