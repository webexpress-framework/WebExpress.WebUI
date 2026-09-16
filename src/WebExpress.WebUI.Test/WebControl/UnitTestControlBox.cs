using WebExpress.WebCore.WebScope;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the box control. The C# side only emits the host element and the relevant data-*
    /// attributes; the label row, the body and the frame are built at runtime by
    /// <c>webexpress.webui.BoxCtrl</c> (covered by <c>JsTest/control.box.test.mjs</c>). The
    /// composition from fragments is covered by the fragment manager tests.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlBox
    {
        /// <summary>
        /// Tests the id property of the box control. The layout is emitted whether or not it was
        /// set, because the client reads it the same way it reads the persisted frame of the
        /// editor's box add-on.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-box"" data-layout=""solid""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-box"" data-layout=""solid""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBox(id);

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the box control. The value is emitted as the
        /// <c>data-header</c> attribute and is resolved against the internationalization.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-box"" data-layout=""solid""></div>")]
        [InlineData("header", @"<div class=""wx-webui-box"" data-layout=""solid"" data-header=""header""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-box"" data-layout=""solid"" data-header=""WebExpress.WebUI""></div>")]
        public void Header(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBox()
            {
                Header = _ => header
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header icon property of the box control. A css-based icon is forwarded as
        /// a class name.
        /// </summary>
        [Fact]
        public void HeaderIcon()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBox()
            {
                HeaderIcon = _ => new IconAlignLeft()
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-box"" data-layout=""solid"" data-header-icon-css=""*""></div>", html);
        }

        /// <summary>
        /// Tests the layout property of the box control. Every frame travels as a data attribute
        /// value the client maps to a class, so the same attribute serves the control and the
        /// reading view of the editor's box add-on.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutBox.Solid, "solid")]
        [InlineData(TypeLayoutBox.Dashed, "dashed")]
        [InlineData(TypeLayoutBox.Dotted, "dotted")]
        [InlineData(TypeLayoutBox.Double, "double")]
        [InlineData(TypeLayoutBox.Accent, "accent")]
        [InlineData(TypeLayoutBox.Raised, "raised")]
        [InlineData(TypeLayoutBox.Inset, "inset")]
        [InlineData(TypeLayoutBox.None, "none")]
        public void Layout(TypeLayoutBox layout, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBox()
            {
                Layout = _ => layout
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders($@"<div class=""wx-webui-box"" data-layout=""{expected}""></div>", html);
        }

        /// <summary>
        /// Tests the accent color of the box control. A system color is forwarded as a class and
        /// a user color as a style, so the client can apply whichever arrived.
        /// </summary>
        [Fact]
        public void ColorSystem()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBox()
            {
                Color = _ => new PropertyColorText(TypeColorText.Danger)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-box"" data-layout=""solid"" data-color-class=""text-danger""></div>", html);
        }

        /// <summary>
        /// Tests a user-defined accent color of the box control.
        /// </summary>
        [Fact]
        public void ColorUser()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBox()
            {
                Color = _ => new PropertyColorText("gold")
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-box"" data-layout=""solid"" data-color-style=""*""></div>", html);
        }

        /// <summary>
        /// Tests that the generic border and background properties still land on the host, so a
        /// caller can recolor a frame the way every other panel is recolored.
        /// </summary>
        [Fact]
        public void BorderAndBackground()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBox()
            {
                BorderColor = _ => new PropertyColorBorder(TypeColorBorder.Primary),
                BackgroundColor = _ => new PropertyColorBackground(TypeColorBackground.Light)
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains("border-primary", html);
            Assert.Contains("bg-light", html);
        }

        /// <summary>
        /// Tests that the content controls are rendered inside the host, so the client can
        /// adopt them as the body.
        /// </summary>
        [Fact]
        public void Content()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBox("box", new ControlText() { Text = _ => "first" })
                .Add(new ControlText() { Text = _ => "second" });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div id=""box"" class=""wx-webui-box"" data-layout=""solid""><div>first</div><div>second</div></div>", html);
        }

        /// <summary>
        /// Tests that a box is a scope, which is what lets a fragment address one box type with
        /// <c>[Scope&lt;...&gt;]</c> rather than every box on the page.
        /// </summary>
        [Fact]
        public void IsScope()
        {
            // validation
            _ = Assert.IsAssignableFrom<IScope>(new ControlBox());
        }
    }
}
