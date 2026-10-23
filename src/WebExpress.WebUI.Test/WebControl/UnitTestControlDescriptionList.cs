using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the description list control and its items.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlDescriptionList
    {
        /// <summary>
        /// Tests the id property of the description list control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dl class=""wx-description-list""></dl>")]
        [InlineData("id", @"<dl id=""id"" class=""wx-description-list""></dl>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDescriptionList(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the horizontal layout of the description list control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<dl class=""wx-description-list""></dl>")]
        [InlineData(true, @"<dl class=""wx-description-list wx-description-list-horizontal""></dl>")]
        public void Horizontal(bool horizontal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDescriptionList()
            {
                Horizontal = _ => horizontal
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests a term/description pair.
        /// </summary>
        [Fact]
        public void Item()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDescriptionListItem()
            {
                Term = _ => "Name",
                Description = _ => "Guybrush Threepwood"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-description-list-item""><dt class=""wx-description-list-term"">Name</dt><dd class=""wx-description-list-description"">Guybrush Threepwood</dd></div>", html);
        }

        /// <summary>
        /// Tests that the pairs are rendered inside the list.
        /// </summary>
        [Fact]
        public void Items()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDescriptionList
            (
                null,
                new ControlDescriptionListItem() { Term = _ => "Name", Description = _ => "Guybrush" }
            );

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<dl class=""wx-description-list""><div class=""wx-description-list-item"">*</div></dl>", html);
        }
    }
}
