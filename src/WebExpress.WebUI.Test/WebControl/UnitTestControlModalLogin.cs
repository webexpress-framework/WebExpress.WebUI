using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the login dialog. The control emits the dialog sections around a real
    /// login control; the dialog itself is assembled by the JS controller
    /// <c>webexpress.webui.ModalLoginCtrl</c>.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlModalLogin
    {
        /// <summary>
        /// Tests the id property of the login dialog. The framed login derives its
        /// id from the dialog, so a page addressing the dialog can address its login.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dialog class=""wx-webui-modal-login"" data-close-label=""Close""><div class=""wx-modal-header"">Login</div><div class=""wx-modal-content""><div class=""wx-webui-login""></div></div><div class=""wx-modal-footer""></div></dialog>")]
        [InlineData("id", @"<dialog id=""id"" class=""wx-webui-modal-login"" data-close-label=""Close""><div class=""wx-modal-header"">Login</div><div class=""wx-modal-content""><div id=""id_login"" class=""wx-webui-login""></div></div><div class=""wx-modal-footer""></div></dialog>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalLogin(id);

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header of the login dialog, which defaults to the login title
        /// and takes an i18n key.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dialog class=""wx-webui-modal-login"" *><div class=""wx-modal-header"">Login</div>*</dialog>")]
        [InlineData("abc", @"<dialog class=""wx-webui-modal-login"" *><div class=""wx-modal-header"">abc</div>*</dialog>")]
        [InlineData("webexpress.webui:plugin.name", @"<dialog class=""wx-webui-modal-login"" *><div class=""wx-modal-header"">WebExpress.WebUI</div>*</dialog>")]
        public void Header(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalLogin(null);

            if (header is not null)
            {
                control.Header = _ => header;
            }

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the username reaches the framed login as its prefill.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dialog class=""wx-webui-modal-login"" *><div class=""wx-modal-content""><div class=""wx-webui-login""></div></div>*</dialog>")]
        [InlineData("abc", @"<dialog class=""wx-webui-modal-login"" *><div class=""wx-modal-content""><div class=""wx-webui-login"" data-username=""abc""></div></div>*</dialog>")]
        public void Username(string username, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalLogin(null)
            {
                Username = _ => username
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the login dialog.
        /// </summary>
        [Theory]
        [InlineData(TypeModalSize.Default, @"<dialog class=""wx-webui-modal-login"" data-close-label=""Close"">*</dialog>")]
        [InlineData(TypeModalSize.Small, @"<dialog class=""wx-webui-modal-login"" data-size=""modal-sm"" *>*</dialog>")]
        [InlineData(TypeModalSize.Large, @"<dialog class=""wx-webui-modal-login"" data-size=""modal-lg"" *>*</dialog>")]
        public void Size(TypeModalSize size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalLogin(null)
            {
                Size = _ => size
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the dialog opens on its own only when asked to, and that
        /// scrolling is opted out of rather than into, matching the base dialog.
        /// </summary>
        [Theory]
        [InlineData(false, true, @"<dialog class=""wx-webui-modal-login"" data-close-label=""Close"">*</dialog>")]
        [InlineData(true, true, @"<dialog class=""wx-webui-modal-login"" data-close-label=""Close"" data-auto-show=""true"">*</dialog>")]
        [InlineData(false, false, @"<dialog class=""wx-webui-modal-login"" data-close-label=""Close"" data-scrollable=""false"">*</dialog>")]
        public void AutoShowAndScrollable(bool autoShow, bool scrollable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalLogin(null)
            {
                AutoShow = _ => autoShow,
                Scrollable = _ => scrollable
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that content a page adds reads below the login, where a hint or a
        /// link to a password reset belongs.
        /// </summary>
        [Fact]
        public void Content_FollowsTheLogin()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlModalLogin("o1", new ControlText() { Text = _ => "Forgot your password?" });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<dialog id=""o1"" class=""wx-webui-modal-login"" data-close-label=""Close""><div class=""wx-modal-header"">Login</div><div class=""wx-modal-content""><div id=""o1_login"" class=""wx-webui-login""></div><div>Forgot your password?</div></div><div class=""wx-modal-footer""></div></dialog>",
                html);
        }
    }
}
