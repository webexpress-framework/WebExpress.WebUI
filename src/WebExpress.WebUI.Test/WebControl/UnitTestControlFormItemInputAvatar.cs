using System.Linq;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebParameter;
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

            // validation
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

            // validation
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
                Name = _ => name
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
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
                Placeholder = _ => placeholder
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the URI property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData("/upload/avatar", @"<div class=""wx-webui-input-avatar"" data-uri=""/upload/avatar""></div>")]
        public void Uri(string uri, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                Uri = _ => uri is not null ? new UriEndpoint(uri) : null
            };

            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the shape property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(TypeAvatarShape.Default, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(TypeAvatarShape.Circle, @"<div class=""wx-webui-input-avatar"" data-shape=""circle""></div>")]
        [InlineData(TypeAvatarShape.Rect, @"<div class=""wx-webui-input-avatar"" data-shape=""rect""></div>")]
        public void Shape(TypeAvatarShape shape, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                Shape = _ => shape
            };

            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the viewport property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(320, @"<div class=""wx-webui-input-avatar"" data-viewport=""320""></div>")]
        public void Viewport(int viewport, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                Viewport = _ => viewport
            };

            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the output size property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(512, @"<div class=""wx-webui-input-avatar"" data-size=""512""></div>")]
        public void OutputSize(int size, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                OutputSize = _ => size
            };

            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the output format property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(ContentType.Unknown, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(ContentType.Jpeg, @"<div class=""wx-webui-input-avatar"" data-output-format=""image/jpeg""></div>")]
        public void OutputFormat(ContentType format, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                OutputFormat = _ => format
            };

            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the output quality property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(0.0, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(0.92, @"<div class=""wx-webui-input-avatar"" data-output-quality=""0.92""></div>")]
        public void OutputQuality(float quality, string expected)
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                OutputQuality = _ => quality
            };

            var html = control.Render(context, visualTree);

            // validation
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
                    ? _ => [.. accept.Split(',')
                        .Select(x => ContentTypeExtensions.ToContentTypeFromMime(x))]
                    : null
            };

            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the overlay alpha property of the avatar input control.
        /// </summary>
        [Theory]
        [InlineData(0.0, @"<div class=""wx-webui-input-avatar""></div>")]
        [InlineData(0.5, @"<div class=""wx-webui-input-avatar"" data-overlay-alpha=""0.5""></div>")]
        [InlineData(1.0, @"<div class=""wx-webui-input-avatar"" data-overlay-alpha=""1""></div>")]
        public void OverlayAlpha(float alpha, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null)
            {
                OverlayAlpha = _ => alpha
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form avatar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<form id=""id_*"" class=""wx-form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"" name=""id_*""><input name=""id_*"" type=""hidden""><input name=""controlform_id_*_state"" value=""Default"" type=""hidden""><div class=""wx-form-main""><div><fieldset class=""wx-form-group""><span></span><div id=""*"" class=""wx-webui-input-avatar""></div></fieldset></div></div><div></div></form>")]
        [InlineData("/assets/avatar.png", @"<form id=""id_*"" class=""wx-form"" action=""http://localhost:8080/"" method=""POST"" enctype=""multipart/form-data"" name=""id_*""><input name=""id_*"" type=""hidden""><input name=""controlform_id_*_state"" value=""Default"" type=""hidden""><div class=""wx-form-main""><div><fieldset class=""wx-form-group""><span></span><div id=""*"" class=""wx-webui-input-avatar"" data-value=""/assets/avatar.png""></div></fieldset></div></div><div></div></form>")]
        public void Value(string value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputAvatar(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueFile(value));
            });

            // act
            var html = form.Render(context, visualTree);

            // validation
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
                Label = _ => label,
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
            //control.Add(new ControlFormItemInputMoveItem() { Label = _ => "label" });
            //var html = control.Render(context, visualTree);

            // validation
            //Assert.NotEmpty(control.Options);
            //AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-input-move"" data-header-selected=""Selected options"" data-header-available=""Available options""><div class=""wx-webui-move-option"">label</div></div>", html);
        }

        /// <summary>
        /// A one pixel png, as the browser sends a cropped picture.
        /// </summary>
        private const string Png = "file:me;data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

        /// <summary>
        /// Tests what the server reads from the field: nothing, the picture the field was given
        /// (sent back while the user keeps it) or an upload; a malformed value is no exception.
        /// </summary>
        [Theory]
        [InlineData("", null, false)]
        [InlineData("/assets/avatar.png", "/assets/avatar.png", false)]
        [InlineData(Png, "me", true)]
        [InlineData("file:me;data:image/png;base64,", null, false)]
        [InlineData("file:me", null, false)]
        public void SubmittedValue(string submitted, string name, bool hasData)
        {
            var (control, context) = Submit(submitted);

            var value = context.GetValue<ControlFormInputValueFile>(control);

            Assert.Equal(name, value?.Name);
            Assert.Equal(hasData, value?.Data is { Length: > 0 });
        }

        /// <summary>
        /// Tests the validation of what was submitted: a kept picture and a readable image pass,
        /// an unreadable upload and a type the input does not accept are refused.
        /// </summary>
        [Theory]
        [InlineData("/assets/avatar.png", null, null)]
        [InlineData(Png, null, null)]
        [InlineData("file:me;data:image/png;base64,!!!", null, "webexpress.webui:form.inputavatar.validation.invalid")]
        [InlineData("file:me", null, "webexpress.webui:form.inputavatar.validation.invalid")]
        [InlineData("file:page;data:text/html;base64,PGI+aGk8L2I+", null, "webexpress.webui:form.inputavatar.validation.type")]
        [InlineData(Png, ContentType.Jpeg, "webexpress.webui:form.inputavatar.validation.type")]
        public void Validation(string submitted, ContentType? accept, string expected)
        {
            var (control, context) = Submit(submitted, accept);

            var results = control.Validate(context);

            Assert.Equal(expected, results.SingleOrDefault()?.Text);
        }

        /// <summary>
        /// Tests that an svg is taken only as a picture without code: shapes, styles, links and
        /// embedded raster images pass; scripts, event handlers, script addresses (however they
        /// are disguised), embedded html, nested documents, stylesheet instructions and document
        /// types are refused, as is anything that is no svg at all.
        /// </summary>
        [Theory]
        [InlineData(@"<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 10 10""><circle cx=""5"" cy=""5"" r=""4"" fill=""red""/></svg>", true)]
        [InlineData(@"<?xml version=""1.0"" encoding=""UTF-8""?><svg xmlns=""http://www.w3.org/2000/svg""><style>circle{fill:url(#g)}</style><a href=""https://example.com""><circle r=""4""/></a></svg>", true)]
        [InlineData(@"<svg xmlns=""http://www.w3.org/2000/svg""><image href=""data:image/png;base64,iVBORw0KGgo=""/></svg>", true)]
        [InlineData(@"<svg xmlns=""http://www.w3.org/2000/svg""><script>alert(1)</script></svg>", false)]
        [InlineData(@"<svg xmlns=""http://www.w3.org/2000/svg"" onload=""alert(1)""/>", false)]
        [InlineData(@"<svg xmlns=""http://www.w3.org/2000/svg""><a href=""javascript:alert(1)""><circle r=""4""/></a></svg>", false)]
        [InlineData(@"<svg xmlns=""http://www.w3.org/2000/svg"" xmlns:xlink=""http://www.w3.org/1999/xlink""><a xlink:href=""JAVA&#9;SCRIPT:alert(1)""><circle r=""4""/></a></svg>", false)]
        [InlineData(@"<svg xmlns=""http://www.w3.org/2000/svg""><a><animate attributeName=""href"" values=""javascript:alert(1)""/><circle r=""4""/></a></svg>", false)]
        [InlineData(@"<svg xmlns=""http://www.w3.org/2000/svg""><foreignObject><body xmlns=""http://www.w3.org/1999/xhtml"">hi</body></foreignObject></svg>", false)]
        [InlineData(@"<svg xmlns=""http://www.w3.org/2000/svg""><use href=""data:image/svg+xml;base64,PHN2Zy8+""/></svg>", false)]
        [InlineData(@"<svg xmlns=""http://www.w3.org/2000/svg""><style>@import url(javascript:alert(1));</style></svg>", false)]
        [InlineData(@"<!DOCTYPE svg [<!ENTITY js ""javascript:"">]><svg xmlns=""http://www.w3.org/2000/svg""><a href=""&js;alert(1)""/></svg>", false)]
        [InlineData(@"<?xml-stylesheet type=""text/xsl"" href=""evil.xsl""?><svg xmlns=""http://www.w3.org/2000/svg""/>", false)]
        [InlineData(@"<html><body>no picture</body></html>", false)]
        [InlineData(@"not even xml", false)]
        public void SvgIsTakenOnlyWithoutCode(string svg, bool taken)
        {
            var submitted = "file:logo;data:image/svg+xml;base64," + System.Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(svg));
            var (control, context) = Submit(submitted);

            var results = control.Validate(context).ToList();

            Assert.Equal(taken ? null : "webexpress.webui:form.inputavatar.validation.svg", results.SingleOrDefault()?.Text);
        }

        /// <summary>
        /// Tests that a picture uploaded in this request survives a form that is shown again: the
        /// field carries it whole, so the browser shows and sends it again rather than its name.
        /// </summary>
        [Fact]
        public void UploadSurvivesARenderAgain()
        {
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var (control, context) = Submit(Png);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var html = control.Render(context, visualTree).ToString();

            Assert.Contains($@"data-value=""{Png}""", html);
        }

        /// <summary>
        /// Builds an avatar input as the server sees it after the browser posted a value.
        /// </summary>
        /// <param name="submitted">The posted value.</param>
        /// <param name="accept">The one type the input accepts, or null for its default.</param>
        /// <returns>The input and the context it was initialized in.</returns>
        private static (ControlFormItemInputAvatar, RenderControlFormContext) Submit(string submitted, ContentType? accept = null)
        {
            UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("avatar", submitted, ParameterScope.Parameter)
            ), new ControlForm());
            var control = new ControlFormItemInputAvatar("avatar")
            {
                Accept = _ => accept.HasValue ? [accept.Value] : []
            };

            control.Initialize(context);

            return (control, context);
        }
    }
}
