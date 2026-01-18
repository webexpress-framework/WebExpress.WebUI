using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the smart edit control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSmartEdit
    {
        /// <summary>
        /// Tests the id property of the smart edit control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSmartEdit(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the method property of the smart edit control.
        /// </summary>
        [Theory]
        [InlineData(RequestMethod.NONE, @"<div id=""*"" class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""NONE""></div>")]
        [InlineData(RequestMethod.POST, @"<div id=""*"" class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(RequestMethod.PUT, @"<div id=""*"" class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""PUT""></div>")]
        [InlineData(RequestMethod.GET, @"<div id=""*"" class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""GET""></div>")]
        [InlineData(RequestMethod.PATCH, @"<div id=""*"" class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""PATCH""></div>")]
        [InlineData(RequestMethod.DELETE, @"<div id=""*"" class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""DELETE""></div>")]
        public void Method(RequestMethod method, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSmartEdit()
            {
                Method = method
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the smart edit control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div id=""*"" class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData("", @"<div id=""*"" class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""/"" data-form-method=""POST""></div>")]
        [InlineData("http://localhost:8080/webui", @"<div id=""*"" class=""wx-webui-smart-edit"" data-object-name=""*"" data-form-action=""http://localhost:8080/webui"" data-form-method=""POST""></div>")]
        public void Uri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSmartEdit()
            {
                Uri = uri is not null ? new UriEndpoint(uri) : null
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
