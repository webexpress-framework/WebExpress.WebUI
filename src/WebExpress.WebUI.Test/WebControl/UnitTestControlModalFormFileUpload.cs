using WebExpress.WebCore.WebParameter;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the modal file upload form: the upload event reached through its interface, and
    /// the validation that refuses a submission without a file.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlModalFormFileUpload
    {
        /// <summary>
        /// Exposes the upload trigger, so a test can fire it without a request.
        /// </summary>
        private sealed class Upload(string id) : ControlModalFormFileUpload(id)
        {
            public void Fire(ControlFormEventFormUpload eventArgs) => OnUpload(eventArgs);
        }

        /// <summary>
        /// A handler registered through the interface fires with the class's own handlers and
        /// can be removed again; both accessors go to the one public event.
        /// </summary>
        [Fact]
        public void InterfaceEventForwardsToThePublicEvent()
        {
            // arrange
            var control = new Upload("upload");
            var viaInterface = 0;
            var viaClass = 0;
            void Handler(ControlFormEventFormUpload e) => viaInterface++;

            ((IControlModalFormFileUpload)control).UploadForm += Handler;
            control.Upload(_ => viaClass++);

            // act
            control.Fire(new ControlFormEventFormUpload());
            ((IControlModalFormFileUpload)control).UploadForm -= Handler;
            control.Fire(new ControlFormEventFormUpload());

            // validation
            Assert.Equal(1, viaInterface);
            Assert.Equal(2, viaClass);
        }

        /// <summary>
        /// A submission without a file fails validation and is not processed, so no upload is
        /// raised for it; the form reports the missing file instead.
        /// </summary>
        [Fact]
        public void SubmissionWithoutFileIsRefused()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var uploads = 0;
            var control = new ControlModalFormFileUpload("upload") { Name = _ => "upload" };
            control.Upload(_ => uploads++);

            // the form counts as submitted once the request carries its name
            var context = UnitTestControlFixture.CreateRenderContextMock(null, null, new Parameter("upload", "", ParameterScope.Parameter));
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Equal(0, uploads);
            Assert.Contains("wx-validation-alert", html);
        }

        /// <summary>
        /// A submission with a file passes validation and raises the upload with that file.
        /// </summary>
        [Fact]
        public void SubmissionWithFileIsUploaded()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            ParameterFile uploaded = null;
            var control = new ControlModalFormFileUpload("upload") { Name = _ => "upload" };
            control.Upload(e => uploaded = e.File);

            var context = UnitTestControlFixture.CreateRenderContextMock(null, null, new Parameter("upload", "", ParameterScope.Parameter));
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            context.Request.AddParameter(new ParameterFile("file", "greeting.txt", ParameterScope.Parameter));

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.NotNull(uploaded);
            Assert.Equal("greeting.txt", uploaded.Value);
            Assert.DoesNotContain("wx-validation-alert", html);
        }
    }
}
