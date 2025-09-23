using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the link control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlLink
    {
        /// <summary>
        /// Tests the id property of the link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""wx-link""></a>")]
        [InlineData("id", @"<a id=""id"" class=""wx-link""></a>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLink(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""wx-link""></a>")]
        [InlineData("abc", @"<a class=""wx-link"">abc</a>")]
        [InlineData("webexpress.webui:plugin.name", @"<a class=""wx-link"">WebExpress.WebUI</a>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLink()
            {
                Text = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""wx-link""></a>")]
        [InlineData("/a", @"<a class=""wx-link"" href=""/a""></a>")]
        [InlineData("/a/b", @"<a class=""wx-link"" href=""/a/b""></a>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLink()
            {
                Uri = uri != null ? new UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""wx-link""></a>")]
        [InlineData("a", @"<a class=""wx-link"" title=""a""></a>")]
        [InlineData("b", @"<a class=""wx-link"" title=""b""></a>")]
        public void Title(string title, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLink()
            {
                Title = title
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the target property of the link control.
        /// </summary>
        [Theory]
        [InlineData(TypeTarget.None, @"<a class=""wx-link""></a>")]
        [InlineData(TypeTarget.Blank, @"<a class=""wx-link"" target=""_blank""></a>")]
        [InlineData(TypeTarget.Self, @"<a class=""wx-link"" target=""_self""></a>")]
        [InlineData(TypeTarget.Parent, @"<a class=""wx-link"" target=""_parent""></a>")]
        [InlineData(TypeTarget.Framename, @"<a class=""wx-link"" target=""_framename""></a>")]
        public void Target(TypeTarget target, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLink()
            {
                Target = target
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""wx-link""></a>")]
        [InlineData("a", @"<a class=""wx-link"" title=""a"" data-bs-toggle=""tooltip""></a>")]
        [InlineData("b", @"<a class=""wx-link"" title=""b"" data-bs-toggle=""tooltip""></a>")]
        [InlineData("a<br/>b", @"<a class=""wx-link"" title=""a<br/>b"" data-bs-toggle=""tooltip""></a>")]
        public void Tooltip(string tooltip, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLink()
            {
                Tooltip = tooltip
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""wx-link""></a>")]
        [InlineData(typeof(IconStar), @"<a class=""wx-link""><i class=""fas fa-star""></i></a>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLink()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            Assert.Equal(expected, html.Trim());
        }

        /// <summary>
        /// Tests the modal property of the link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<a class=""wx-link""></a>")]
        [InlineData("modal", @"<a class=""wx-link"" data-wx-toggle=""modal"" data-wx-target=""#modal""></a>")]
        public void Modal(string modal, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlLink()
            {
                Modal = modal
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the link control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control1 = new ControlLink(null, new ControlIcon() { Icon = new IconStar() });
            var control2 = new ControlLink(null, [new ControlIcon() { Icon = new IconStar() }]);
            var control3 = new ControlLink(null, new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]).ToArray());
            var control4 = new ControlLink(null);
            var control5 = new ControlLink(null);
            var control6 = new ControlLink(null);

            // test execution
            control4.Add(new ControlIcon() { Icon = new IconStar() });
            control5.Add([new ControlIcon() { Icon = new IconStar() }]);
            control6.Add(new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]).ToArray());

            var html1 = control1.Render(context, visualTree);
            var html2 = control2.Render(context, visualTree);
            var html3 = control3.Render(context, visualTree);
            var html4 = control4.Render(context, visualTree);
            var html5 = control5.Render(context, visualTree);
            var html6 = control6.Render(context, visualTree);

            Assert.Equal(@"<a class=""wx-link""><i class=""fas fa-star""></i></a>", html1.Trim());
            Assert.Equal(@"<a class=""wx-link""><i class=""fas fa-star""></i></a>", html2.Trim());
            Assert.Equal(@"<a class=""wx-link""><i class=""fas fa-star""></i></a>", html4.Trim());
            Assert.Equal(@"<a class=""wx-link""><i class=""fas fa-star""></i></a>", html5.Trim());
            Assert.Equal(@"<a class=""wx-link""><i class=""fas fa-star""></i></a>", html6.Trim());
        }
    }
}
