using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item group column horizontal control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemGroupColumnHorizontal
    {
        /// <summary>
        /// Tests the id property of the form item group column horizontal control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-form-group-column-horizontal""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-form-group-column-horizontal""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemGroupColumnHorizontal(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form item group column horizontal control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-form-group-column-horizontal""></div>")]
        [InlineData("abc", @"<div class=""wx-form-group-column-horizontal""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemGroupColumnHorizontal()
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
