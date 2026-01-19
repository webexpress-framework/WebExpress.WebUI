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
        [InlineData("id", @"<form id=""id-form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalForm(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the modal control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<form action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData("abc", @"<form action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data""><div class=""wx-webui-modal"" role=""dialog"" *><div class=""wx-modal-header"">abc</div>*</div></form>")]
        [InlineData("webexpress.webui:plugin.name", @"<form action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data""><div class=""wx-webui-modal"" role=""dialog"" *><div class=""wx-modal-header"">WebExpress.WebUI</div>*</div></form>")]
        public void Header(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalForm(null)
            {
                Header = header
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the modal control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var form = new ControlModalForm(null);

            // act
            form.Add(new ControlFormItemInputText());
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<form action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*<input * type=""text"" class=""form-control"">*</form>", html);
        }
    }
}
