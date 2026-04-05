using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form avatar control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputAvatar
    {
        /// <summary>
        /// Tests the id property of the form avatar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-avatar"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-avatar"" name=""*""></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-avatar"" name=""abc""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                Name = name
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the form tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-avatar"" placeholder=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-avatar"" placeholder=""WebExpress.WebUI""></div>")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                Placeholder = placeholder
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the URI property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData("/upload/avatar", @"<div class=""wx-webui-input-avatar"" uri=""/upload/avatar""></div>")]
        public void Uri(string uri, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                Uri = uri is not null ? new UriEndpoint(uri) : null
            };

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the shape property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(TypeAvatarShape.Default, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(TypeAvatarShape.Circle, @"<div class=""wx-webui-input-avatar"" shape=""circle""></div>")]
        [InlineData(TypeAvatarShape.Rect, @"<div class=""wx-webui-input-avatar"" shape=""rect""></div>")]
        public void Shape(TypeAvatarShape shape, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                Shape = shape
            };

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the viewport property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(320, @"<div class=""wx-webui-input-avatar"" viewport=""320""></div>")]
        public void Viewport(int viewport, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                Viewport = viewport
            };

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the output size property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(512, @"<div class=""wx-webui-input-avatar"" size=""512""></div>")]
        public void OutputSize(int size, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                OutputSize = size
            };

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the output format property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(ContentType.Unknown, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(ContentType.Jpeg, @"<div class=""wx-webui-input-avatar"" output-format=""image/jpeg""></div>")]
        public void OutputFormat(ContentType format, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                OutputFormat = format
            };

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the output quality property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(0.0, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(0.92, @"<div class=""wx-webui-input-avatar"" output-quality=""0.92""></div>")]
        public void OutputQuality(float quality, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                OutputQuality = quality
            };

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the accept property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData("image/png,image/jpeg", @"<div class=""wx-webui-input-avatar"" accept=""image/png,image/jpeg""></div>")]
        public void Accept(string accept, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                Accept = accept is not null
                    ? [.. accept.Split(',')
                        .Select(x => ContentTypeExtensions.ToContentTypeFromMime(x))]
                    : null
            };

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the overlay alpha property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(0.0, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(0.5, @"<div class=""wx-webui-input-avatar"" overlay-alpha=""0.5""></div>")]
        [InlineData(1.0, @"<div class=""wx-webui-input-avatar"" overlay-alpha=""1""></div>")]
        public void OverlayAlpha(float alpha, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                OverlayAlpha = alpha
            };

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data""><input name=""*"" type=""hidden""><main><div><fieldset class=""wx-form-group""><div class=""wx-webui-input-avatar""></div></fieldset></div></main><div></div></form>")]
        [InlineData("abc", @"<form id=""*"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data""><input name=""*"" type=""hidden""><main><div><fieldset class=""wx-form-group""><div class=""wx-webui-input-avatar""></div></fieldset></div></main><div></div></form>")]
        public void Value(string value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueStringList(value));
            });

            // act
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label property of the form move control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-avatar""></div>")]
        public void Label(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                Label = label,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the form move control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-webui-input-avatar""></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlFormItemInputAvatar(null)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Add method of the form move control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
            };

            // act
            //control.Add(new ControlFormItemInputMoveItem() { Label = "label" });
            //var html = control.Render(context, visualTree);

            // validation
            //Assert.NotEmpty(control.Options);
            //AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-input-move"" data-header-selected=""Selected options"" data-header-available=""Available options""><div class=""wx-webui-move-option"">label</div></div>", html);
        }
    }
}
