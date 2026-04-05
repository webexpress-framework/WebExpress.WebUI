using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the selection control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSelection
    {
        /// <summary>
        /// Tests the id property of the tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-selection""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-selection""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSelection(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-selection""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-selection"" data-value=""abc""></div>")]
        public void Value(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSelection()
            {
                Value = text
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
