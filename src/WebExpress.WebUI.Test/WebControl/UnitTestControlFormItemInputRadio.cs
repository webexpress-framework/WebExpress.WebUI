using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item input radio control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputRadio
    {
        /// <summary>
        /// Tests the id property of the form item input radio control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""radio""><label><input type=""radio""></label></div>")]
        [InlineData("id", @"<div class=""radio""><label><input id=""id"" name=""id"" type=""radio""></label></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Inline property of the form item input radio control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""radio""><label><input type=""radio""></label></div>")]
        [InlineData(true, @"<div class=""radio form-check-inline""><label><input type=""radio""></label></div>")]
        public void Inline(bool inline, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio
            {
                Inline = inline
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Description property of the form item input radio control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""radio""><label><input type=""radio""></label></div>")]
        [InlineData("description", @"<div class=""radio""><label><input type=""radio"">&nbsp;description </label></div>")]
        public void Description(string description, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio
            {
                Description = description
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Pattern property of the form item input radio control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""radio""><label><input type=""radio""></label></div>")]
        [InlineData("pattern", @"<div class=""radio""><label><input pattern=""pattern"" type=""radio""></label></div>")]
        public void Pattern(string pattern, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputRadio
            {
                Pattern = pattern
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
