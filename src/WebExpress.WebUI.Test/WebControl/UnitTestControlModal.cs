using System.Globalization;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the modal control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlModal
    {
        /// <summary>
        /// Tests the id property of the modal control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dialog class=""wx-webui-modal"" data-close-label=""Close"">*</dialog>")]
        [InlineData("id", @"<dialog id=""id"" class=""wx-webui-modal"" data-close-label=""Close"">*</dialog>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(id)
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
        [InlineData(null, @"<dialog class=""wx-webui-modal"" *>*</dialog>")]
        [InlineData("abc", @"<dialog class=""wx-webui-modal"" *><div class=""wx-modal-header"">abc</div>*</dialog>")]
        [InlineData("webexpress.webui:plugin.name", @"<dialog class=""wx-webui-modal"" *><div class=""wx-modal-header"">WebExpress.WebUI</div>*</dialog>")]
        public void Header(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(null)
            {
                Header = _ => header
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests that both texts of the modal control resolve against the culture the page is
        /// requested in. The close label matters most: it defaults to a resource key, so every
        /// modal in the framework carries it and a modal resolved against the server default
        /// offers to close in a language the reader did not ask for.
        /// </summary>
        [Fact]
        public void HeaderAndCloseLabelFollowTheRequestCulture()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock(CultureInfo.GetCultureInfo("de"));
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(null)
            {
                Header = _ => "webexpress.webui:form.submit.label"
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders
            (
                @"<dialog class=""wx-webui-modal"" data-close-label=""Schließen""><div class=""wx-modal-header"">Speichern</div>*</dialog>",
                html
            );
        }

        /// <summary>
        /// Tests the size property of the modal control.
        /// </summary>
        [Theory]
        [InlineData(TypeModalSize.Default, @"<dialog class=""wx-webui-modal"" data-close-label=""Close"">*</dialog>")]
        [InlineData(TypeModalSize.Small, @"<dialog class=""wx-webui-modal"" data-size=""modal-sm"" *>*</dialog>")]
        [InlineData(TypeModalSize.Large, @"<dialog class=""wx-webui-modal"" data-size=""modal-lg"" *>*</dialog>")]
        [InlineData(TypeModalSize.ExtraLarge, @"<dialog class=""wx-webui-modal"" data-size=""modal-xl"" *>*</dialog>")]
        [InlineData(TypeModalSize.Fullscreen, @"<dialog class=""wx-webui-modal"" data-size=""modal-fullscreen"" *>*</dialog>")]
        public void Size(TypeModalSize size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(null)
            {
                Size = _ => size
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the scrollable property of the modal control. The data-scrollable
        /// attribute is only emitted when scrolling is disabled; absent (the default)
        /// means scrollable.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dialog class=""wx-webui-modal"" data-close-label=""Close"">*</dialog>")]
        [InlineData(true, @"<dialog class=""wx-webui-modal"" data-close-label=""Close"">*</dialog>")]
        [InlineData(false, @"<dialog class=""wx-webui-modal"" data-close-label=""Close"" data-scrollable=""false"">*</dialog>")]
        public void Scrollable(bool? scrollable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModal(null)
            {
            };

            if (scrollable.HasValue)
            {
                control.Scrollable = _ => scrollable.Value;
            }

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }
    }
}
