using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the spinner control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSpinner
    {
        /// <summary>
        /// Tests the id property of the spinner control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""spinner-border"" role=""status""><span class=""visually-hidden"">Loading...</span></div>")]
        [InlineData("id", @"<div id=""id"" class=""spinner-border"" role=""status""><span class=""visually-hidden"">Loading...</span></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSpinner(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the type property of the spinner control.
        /// </summary>
        [Theory]
        [InlineData(TypeSpinner.Border, @"<div class=""spinner-border"" role=""status""><span class=""visually-hidden"">Loading...</span></div>")]
        [InlineData(TypeSpinner.Grow, @"<div class=""spinner-grow"" role=""status""><span class=""visually-hidden"">Loading...</span></div>")]
        public void Type(TypeSpinner type, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSpinner()
            {
                Type = _ => type
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the small variant of the spinner control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""spinner-border"" role=""status""><span class=""visually-hidden"">Loading...</span></div>")]
        [InlineData(true, @"<div class=""spinner-border spinner-border-sm"" role=""status""><span class=""visually-hidden"">Loading...</span></div>")]
        public void Small(bool small, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSpinner()
            {
                Small = _ => small
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label property of the spinner control.
        /// </summary>
        [Fact]
        public void Label()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSpinner()
            {
                Label = _ => "Please wait"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""spinner-border"" role=""status""><span class=""visually-hidden"">Please wait</span></div>", html);
        }

        /// <summary>
        /// Tests the text color property of the spinner control.
        /// </summary>
        [Fact]
        public void TextColor()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSpinner()
            {
                TextColor = _ => new PropertyColorText(TypeColorText.Primary)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""spinner-border text-primary"" role=""status""><span class=""visually-hidden"">Loading...</span></div>", html);
        }
    }
}
