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
        [InlineData(null, @"<form class=""wx-form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData("id", @"<form id=""id"" class=""wx-form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the form control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<form id=""*"" class=""wx-form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Primary, @"<form id=""*"" class=""wx-form bg-primary"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Secondary, @"<form id=""*"" class=""wx-form bg-secondary"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Warning, @"<form id=""*"" class=""wx-form bg-warning"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Danger, @"<form id=""*"" class=""wx-form bg-danger"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Dark, @"<form id=""*"" class=""wx-form bg-dark"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Light, @"<form id=""*"" class=""wx-form bg-light"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Highlight, @"<form id=""*"" class=""wx-form bg-highlight"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeColorBackground.Transparent, @"<form id=""*"" class=""wx-form bg-transparent"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void BackgroundColor(TypeColorBackground color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                BackgroundColor = new PropertyColorBackground(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                Name = name
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                Uri = uri is not null ? new UriEndpoint(uri) : null
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                Method = method
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the form layout property of the form control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutForm.Default, @"<form id=""*"" class=""wx-form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeLayoutForm.Inline, @"<form id=""*"" class=""wx-form wx-form-inline"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void FormLayout(TypeLayoutForm formLayout, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                FormLayout = formLayout
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                ItemLayout = itemLayout
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the justify property of the form control.
        /// </summary>
        [Theory]
        [InlineData(TypeJustifiedFlex.None, @"<form id=""*"" class=""wx-form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeJustifiedFlex.Start, @"<form id=""*"" class=""wx-form justify-content-start"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeJustifiedFlex.Around, @"<form id=""*"" class=""wx-form justify-content-around"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeJustifiedFlex.Between, @"<form id=""*"" class=""wx-form justify-content-between"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        [InlineData(TypeJustifiedFlex.End, @"<form id=""*"" class=""wx-form justify-content-end"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"">*</form>")]
        public void Justify(TypeJustifiedFlex justify, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm()
            {
                Justify = justify,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests a empty form.
        /// </summary>
        [Fact]
        public void EmptyForm()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm();

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<form id=""*"" action=*", html.Trim());
        }

        /// <summary>
        /// Tests a empty form.
        /// </summary>
        [Fact]
        public void EmptyFormChangeSubmitText()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlForm();
            control.AddPrimaryButton(new ControlFormItemButtonSubmit("") { Text = "sendbutton" });

            // act
            var html = control.Render(context, visualTree);

            // validation
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputText(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueString(value));
            });

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
