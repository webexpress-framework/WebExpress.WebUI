using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the upload control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlUpload
    {
        /// <summary>
        /// Tests the id property of the upload control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-upload"" data-uri=""*"" name=""*""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-upload"" data-uri=""*"" name=""*""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-webui-upload"" data-uri=""*"" name=""*""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlUpload(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the upload control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-upload"" data-uri=""*"" name=""*""></div>")]
        [InlineData("http://www.example.com", @"<div class=""wx-webui-upload"" data-uri=""http://www.example.com/"" name=""*""></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlUpload(null)
            {
                Uri = !string.IsNullOrEmpty(uri)
                    ? new UriEndpoint(uri)
                    : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the multiple property of the upload control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-upload"" data-uri=""*"" data-multiple=""false"" name=""*""></div>")]
        [InlineData(true, @"<div class=""wx-webui-upload"" data-uri=""*"" name=""*""></div>")]
        public void Multiple(bool multiple, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlUpload(null)
            {
                Multiple = multiple
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the accept property of the upload control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-upload"" data-uri=""*"" name=""*""></div>")]
        [InlineData("", @"<div class=""wx-webui-upload"" data-uri=""*"" name=""*""></div>")]
        [InlineData("*/*", @"<div class=""wx-webui-upload"" data-uri=""*"" name=""*""></div>")]
        public void Accept(string accept, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlUpload(null)
            {
                Accept = accept
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto upload property of the upload control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-upload"" data-uri=""*"" name=""*""></div>")]
        [InlineData(true, @"<div class=""wx-webui-upload"" data-uri=""*"" data-autoupload=""true"" name=""*""></div>")]
        public void AutoUpload(bool autoupload, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlUpload(null)
            {
                AutoUpload = autoupload
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the full screen dropzone property of the upload control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-upload"" data-uri=""*"" name=""*""></div>")]
        [InlineData(true, @"<div class=""wx-webui-upload"" data-uri=""*"" data-fullscreen-dropzone=""true"" name=""*""></div>")]
        public void FullScreenDropzone(bool fullScreenDropzone, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlUpload(null)
            {
                FullScreenDropzone = fullScreenDropzone
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
