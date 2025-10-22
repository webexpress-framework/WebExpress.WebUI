using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form file input control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputFile
    {
        /// <summary>
        /// Tests the id property of the form file input control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input id=""file"" name=""file"" type=""file"" class=""form-control-file me-2"">")]
        [InlineData("id", @"<input id=""id"" name=""id"" type=""file"" class=""form-control-file me-2"">")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputFile(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form file input control.
        /// </summary>
        [Theory]
        [InlineData(@"<input id=""*"" name=""*"" type=""file"" class=""form-control-file me-2"">")]
        public void AutoId(string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputFile()
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form file input control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input id=""file"" type=""file"" class=""form-control-file me-2"">")]
        [InlineData("abc", @"<input id=""file"" name=""abc"" type=""file"" class=""form-control-file me-2"">")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputFile(null)
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the required property of the form file input control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<input id=""file"" name=""file"" type=""file"" class=""form-control-file me-2"">")]
        [InlineData(true, @"<input id=""file"" name=""file"" type=""file"" class=""form-control-file me-2"">")]
        public void Required(bool required, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputFile(null)
            {
                Required = required
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the accept property of the form file input control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<input id=""file"" name=""file"" type=""file"" class=""form-control-file me-2"">")]
        [InlineData("image/*", @"<input id=""file"" name=""file"" type=""file"" class=""form-control-file me-2"" accept=""image/*"">")]
        public void Accept(string accept, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputFile(null);

            // test execution
            control.AddAcceptFile(accept);
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
