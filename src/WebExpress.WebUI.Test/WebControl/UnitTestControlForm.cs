using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlForm
    {
        /// <summary>
        /// Tests the id property of the form control.
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
            var control = new ControlForm(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the form control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Primary, @"<form id=""*"" class=""bg-primary"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Secondary, @"<form id=""*"" class=""bg-secondary"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Warning, @"<form id=""*"" class=""bg-warning"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Danger, @"<form id=""*"" class=""bg-danger"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Dark, @"<form id=""*"" class=""bg-dark"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Light, @"<form id=""*"" class=""bg-light"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Transparent, @"<form id=""*"" class=""bg-transparent"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void BackgroundColor(TypeColorBackground color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                BackgroundColor = new PropertyColorBackground(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData("abc", @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"" name=""abc"">*</form>")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the form control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<form id=""*"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData("", @"<form id=""*"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData("http://localhost:8080/webui", @"<form id=""*"" action=""http://localhost:8080/webui"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                Uri = uri != null ? new UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the method property of the form control.
        /// </summary>
        [Theory]
        [InlineData(RequestMethod.NONE, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(RequestMethod.POST, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(RequestMethod.PUT, @"<form id=""*"" action=""http://localhost:8080/"" method=""PUT"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(RequestMethod.GET, @"<form id=""*"" action=""http://localhost:8080/"" method=""GET"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(RequestMethod.PATCH, @"<form id=""*"" action=""http://localhost:8080/"" method=""PATCH"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(RequestMethod.DELETE, @"<form id=""*"" action=""http://localhost:8080/"" method=""DELETE"" enctype=""multipart/form-data"">*</form>")]
        public void Method(RequestMethod method, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                Method = method
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the form layout property of the form control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutForm.Default, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeLayoutForm.Inline, @"<form id=""*"" class=""wx-form-inline"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void FormLayout(TypeLayoutForm formLayout, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                FormLayout = formLayout
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the item layout property of the form control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutFormItem.Horizontal, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeLayoutFormItem.Vertical, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeLayoutFormItem.Mix, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void ItemLayout(TypeLayoutFormItem itemLayout, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                ItemLayout = itemLayout
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the justify property of the form control.
        /// </summary>
        [Theory]
        [InlineData(TypeJustifiedFlex.None, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeJustifiedFlex.Start, @"<form id=""*"" class=""justify-content-start"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeJustifiedFlex.Around, @"<form id=""*"" class=""justify-content-around"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeJustifiedFlex.Between, @"<form id=""*"" class=""justify-content-between"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeJustifiedFlex.End, @"<form id=""*"" class=""justify-content-end"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void Justify(TypeJustifiedFlex justify, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                Justify = justify,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests a empty form.
        /// </summary>
        [Fact]
        public void EmptyForm()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm();

            var html = control.Render(context, visualTree);

            // test execution
            AssertExtensions.EqualWithPlaceholders(@"<form id=""*"" action=*", html.Trim());
        }

        /// <summary>
        /// Tests a empty form.
        /// </summary>
        [Fact]
        public void EmptyFormChangeSubmitText()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm();
            control.AddPrimaryButton(new ControlFormItemButtonSubmit("") { Text = "sendbutton" });

            var html = control.Render(context, visualTree);

            // test execution
            Assert.Contains(@"sendbutton", html.Trim());
        }

        /// <summary>
        /// Tests the value property of the form text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<form *>*<input type=""text"" class=""form-control"">*</form>")]
        [InlineData("abc", @"<form *>*<input value=""abc"" type=""text"" class=""form-control"">*</form>")]
        public void Value(string value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueString(value));
            });

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
