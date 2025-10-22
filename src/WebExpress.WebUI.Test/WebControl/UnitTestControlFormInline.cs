using WebExpress.WebCore.WebMessage;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the inline form control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormInline
    {
        /// <summary>
        /// Tests the id property of the pagination control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<form class=""wx-form-inline"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData("id", @"<form id=""id"" class=""wx-form-inline"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm(id)
            {
                FormLayout = TypeLayoutForm.Inline,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<form class=""wx-form-inline"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData("abc", @"<form class=""wx-form-inline"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"" name=""abc"">*</form>")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm(null)
            {
                FormLayout = TypeLayoutForm.Inline,
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the method property of the form control.
        /// </summary>
        [Theory]
        [InlineData(RequestMethod.NONE, @"<form class=""wx-form-inline"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(RequestMethod.POST, @"<form class=""wx-form-inline"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(RequestMethod.GET, @"<form class=""wx-form-inline"" action=""http://localhost:8080/"" method=""GET"" enctype=""multipart/form-data"">*</form>")]
        public void Method(RequestMethod method, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm(null)
            {
                FormLayout = TypeLayoutForm.Inline,
                Method = method
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
