using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the modal control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlModalForm
    {
        /// <summary>
        /// Tests the id property of the modal control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<form action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData("id", @"<form id=""id"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalForm(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the modal control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<form action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData("abc", @"<form action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*<h4 class=""modal-title"">abc</h4>*</form>")]

        public void Header(string header, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalForm()
            {
                Header = header
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the modal control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalForm();
            var form = new ControlModalForm();

            // test execution
            form.Add(new ControlFormItemInputTextBox());
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<form action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*<input * type=""text"" class=""form-control"">*</form>", html);
        }
    }
}
