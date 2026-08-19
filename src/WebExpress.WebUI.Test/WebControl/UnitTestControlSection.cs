using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the section control. The C# side only emits the host element and the relevant
    /// data-* attributes; the label row, the chevron and the collapsible body are built at
    /// runtime by <c>webexpress.webui.SectionCtrl</c> (covered by
    /// <c>JsTest/control.section.test.mjs</c>).
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSection
    {
        /// <summary>
        /// Tests the id property of the section control. Every state flag is emitted whether or
        /// not it was set, because the client has to know the declared state without guessing.
        /// </summary>
        [Theory]
        [InlineData(null, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData("id", @"<section id=""id"" class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header property of the section control. The value is emitted as the
        /// <c>data-header</c> attribute and is resolved against the internationalization.
        /// </summary>
        [Theory]
        [InlineData(null, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData("header", @"<section class=""wx-webui-section"" data-header=""header"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData("webexpress.webui:plugin.name", @"<section class=""wx-webui-section"" data-header=""WebExpress.WebUI"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        public void Header(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Header = _ => header
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the note property of the section control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData("12", @"<section class=""wx-webui-section"" data-note=""12"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        public void Note(string note, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Note = _ => note
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the header icon property of the section control. A css-based icon is forwarded
        /// as a class name.
        /// </summary>
        [Fact]
        public void HeaderIcon()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                HeaderIcon = _ => new IconAlignLeft()
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<section class=""wx-webui-section"" data-header-icon-css=""*"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>", html);
        }

        /// <summary>
        /// Tests the badge property of the section control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData("3 open", @"<section class=""wx-webui-section"" data-badge=""3 open"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData("webexpress.webui:plugin.name", @"<section class=""wx-webui-section"" data-badge=""WebExpress.WebUI"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        public void Badge(string badge, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Badge = _ => badge
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the badge color of the section control. A system color is forwarded as a class
        /// and a user color as a style, so the client can apply whichever arrived.
        /// </summary>
        [Fact]
        public void BadgeColorSystem()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Badge = _ => "9",
                BadgeColor = _ => new PropertyColorBackgroundBadge(TypeColorBackgroundBadge.Danger)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<section class=""wx-webui-section"" data-badge=""9"" data-badge-bg-class=""text-bg-danger"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>", html);
        }

        /// <summary>
        /// Tests a user-defined badge color of the section control.
        /// </summary>
        [Fact]
        public void BadgeColorUser()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Badge = _ => "9",
                BadgeColor = _ => new PropertyColorBackgroundBadge("gold")
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<section class=""wx-webui-section"" data-badge=""9"" data-badge-bg-style=""background:gold;"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>", html);
        }

        /// <summary>
        /// Tests the accent color of the section control.
        /// </summary>
        [Fact]
        public void ColorSystem()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Color = _ => new PropertyColorText(TypeColorText.Primary)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<section class=""wx-webui-section"" data-color-class=""text-primary"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>", html);
        }

        /// <summary>
        /// Tests a user-defined accent color of the section control.
        /// </summary>
        [Fact]
        public void ColorUser()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Color = _ => new PropertyColorText("gold")
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<section class=""wx-webui-section"" data-color-style=""*"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>", html);
        }

        /// <summary>
        /// Tests the layout property of the section control. The layout is a class on the host
        /// rather than a data attribute, because it changes nothing the client has to drive.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutSection.Stacked, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData(TypeLayoutSection.Aside, @"<section class=""wx-webui-section wx-section-aside"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData(TypeLayoutSection.Rule, @"<section class=""wx-webui-section wx-section-rule"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        public void Layout(TypeLayoutSection layout, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Layout = _ => layout
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uppercase property of the section control. Like the layout it is a class
        /// rather than a data attribute, because it only paints.
        /// </summary>
        [Theory]
        [InlineData(true, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData(false, @"<section class=""wx-webui-section wx-section-verbatim"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        public void Uppercase(bool uppercase, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Uppercase = _ => uppercase
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label css property of the section control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData("fw-bold", @"<section class=""wx-webui-section"" data-label-css=""fw-bold"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        public void LabelCss(string labelCss, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                LabelCss = _ => labelCss
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the collapsible property of the section control.
        /// </summary>
        [Theory]
        [InlineData(true, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData(false, @"<section class=""wx-webui-section"" data-collapsible=""false"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        public void Collapsible(bool collapsible, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Collapsible = _ => collapsible
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the expanded property of the section control.
        /// </summary>
        [Theory]
        [InlineData(true, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData(false, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""false"" data-guide=""true"" data-persist=""true""></section>")]
        public void Expanded(bool expanded, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Expanded = _ => expanded
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the guide property of the section control.
        /// </summary>
        [Theory]
        [InlineData(true, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData(false, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""false"" data-persist=""true""></section>")]
        public void Guide(bool guide, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Guide = _ => guide
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the persist property of the section control.
        /// </summary>
        [Theory]
        [InlineData(true, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""></section>")]
        [InlineData(false, @"<section class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""false""></section>")]
        public void Persist(bool persist, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection()
            {
                Persist = _ => persist
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the content of the section is rendered inside the host element, where the
        /// client picks it up and moves it into the collapsible body.
        /// </summary>
        [Fact]
        public void Content()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection
            (
                "section",
                new ControlText("text") { Text = _ => "content" }
            );

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<section id=""section"" class=""wx-webui-section"" data-collapsible=""true"" data-expanded=""true"" data-guide=""true"" data-persist=""true""><div id=""text"">content</div></section>", html);
        }

        /// <summary>
        /// Tests that the section draws no frame of its own: unlike a card it adds no border
        /// class, which is the whole point of choosing it over one.
        /// </summary>
        [Fact]
        public void NoBorder()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSection("section");

            // act
            var html = control.Render(context, visualTree).ToString();

            Assert.DoesNotContain("border", html);
        }
    }
}
