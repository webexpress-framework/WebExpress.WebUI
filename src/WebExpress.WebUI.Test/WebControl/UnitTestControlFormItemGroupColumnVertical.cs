using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item group column vertical control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemGroupColumnVertical
    {
        /// <summary>
        /// Tests the id property of the form item group column vertical control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-form-group-column""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-form-group-column""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemGroupColumnVertical(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form item group column vertical control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-form-group-column""></div>")]
        [InlineData("abc", @"<div class=""wx-form-group-column""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemGroupColumnVertical()
            {
                Name = name
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
