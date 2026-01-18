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
    /// Tests the list item link control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlListItemLink
    {
        /// <summary>
        /// Tests the id property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<li class=""list-group-item-action""><a class=""wx-link""></a></li>")]
        [InlineData("id", @"<li id=""id"" class=""list-group-item-action""><a id=""id"" class=""wx-link""></a></li>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<li class=""list-group-item-action""><a class=""wx-link""></a></li>")]
        [InlineData("abc", @"<li class=""list-group-item-action""><a class=""wx-link"">abc</a></li>")]
        [InlineData("webexpress.webui:plugin.name", @"<li class=""list-group-item-action""><a class=""wx-link"">WebExpress.WebUI</a></li>")]
        public void Text(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink()
            {
                Text = text,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<li class=""list-group-item-action""><a class=""wx-link""></a></li>")]
        [InlineData("/a", @"<li class=""list-group-item-action""><a class=""wx-link"" href=""/a""></a></li>")]
        [InlineData("/a/b", @"<li class=""list-group-item-action""><a class=""wx-link"" href=""/a/b""></a></li>")]
        public void Uri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink()
            {
                Uri = uri is not null ? new UriEndpoint(uri) : null,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<li class=""list-group-item-action""><a class=""wx-link""></a></li>")]
        [InlineData("a", @"<li class=""list-group-item-action""><a class=""wx-link"" title=""a""></a></li>")]
        [InlineData("b", @"<li class=""list-group-item-action""><a class=""wx-link"" title=""b""></a></li>")]
        public void Title(string title, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink()
            {
                Title = title,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the target property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(TypeTarget.None, @"<li class=""list-group-item-action""><a class=""wx-link""></a></li>")]
        [InlineData(TypeTarget.Blank, @"<li class=""list-group-item-action""><a class=""wx-link"" target=""_blank""></a></li>")]
        [InlineData(TypeTarget.Self, @"<li class=""list-group-item-action""><a class=""wx-link"" target=""_self""></a></li>")]
        [InlineData(TypeTarget.Parent, @"<li class=""list-group-item-action""><a class=""wx-link"" target=""_parent""></a></li>")]
        [InlineData(TypeTarget.Framename, @"<li class=""list-group-item-action""><a class=""wx-link"" target=""_framename""></a></li>")]
        public void Target(TypeTarget target, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink()
            {
                Target = target,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<li class=""list-group-item-action""><a class=""wx-link""></a></li>")]
        [InlineData("a", @"<li class=""list-group-item-action""><a class=""wx-link"" data-bs-toggle=""tooltip""></a></li>")]
        [InlineData("b", @"<li class=""list-group-item-action""><a class=""wx-link"" data-bs-toggle=""tooltip""></a></li>")]
        [InlineData("a<br/>b", @"<li class=""list-group-item-action""><a class=""wx-link"" data-bs-toggle=""tooltip""></a></li>")]
        public void Tooltip(string tooltip, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink()
            {
                Tooltip = tooltip
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<li class=""list-group-item-action""><a class=""wx-link""></a></li>")]
        [InlineData(typeof(IconStar), @"<li class=""list-group-item-action""><a class=""wx-link""><i class=""fas fa-star""></i></a></li>")]
        public void Icon(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink()
            {
                Icon = icon is not null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Active property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(TypeActive.None, @"<li class=""list-group-item-action""><a class=""wx-link""></a></li>")]
        [InlineData(TypeActive.Active, @"<li class=""list-group-item-action active""><a class=""wx-link""></a></li>")]
        public void Active(TypeActive active, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink(null)
            {
                Active = active
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the list item link control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control1 = new ControlListItemLink(null, new ControlIcon() { Icon = new IconStar() });
            var control2 = new ControlListItemLink(null, [new ControlIcon() { Icon = new IconStar() }]);
            var control3 = new ControlListItemLink(null, new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]).ToArray());
            var control4 = new ControlListItemLink(null);
            var control5 = new ControlListItemLink(null);
            var control6 = new ControlListItemLink(null);

            // act
            control4.Add(new ControlIcon() { Icon = new IconStar() });
            control5.Add([new ControlIcon() { Icon = new IconStar() }]);
            control6.Add(new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]).ToArray());

            var html1 = control1.Render(context, visualTree);
            var html2 = control2.Render(context, visualTree);
            var html3 = control3.Render(context, visualTree);
            var html4 = control4.Render(context, visualTree);
            var html5 = control5.Render(context, visualTree);
            var html6 = control6.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<li class=""list-group-item-action""><a class=""wx-link""><i class=""fas fa-star""></i></a></li>", html1);
            AssertExtensions.EqualWithPlaceholders(@"<li class=""list-group-item-action""><a class=""wx-link""><i class=""fas fa-star""></i></a></li>", html2);
            AssertExtensions.EqualWithPlaceholders(@"<li class=""list-group-item-action""><a class=""wx-link""><i class=""fas fa-star""></i></a></li>", html3);
            AssertExtensions.EqualWithPlaceholders(@"<li class=""list-group-item-action""><a class=""wx-link""><i class=""fas fa-star""></i></a></li>", html4);
            AssertExtensions.EqualWithPlaceholders(@"<li class=""list-group-item-action""><a class=""wx-link""><i class=""fas fa-star""></i></a></li>", html5);
            AssertExtensions.EqualWithPlaceholders(@"<li class=""list-group-item-action""><a class=""wx-link""><i class=""fas fa-star""></i></a></li>", html6);
        }
    }
}
