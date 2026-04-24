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
        [InlineData(null, @"<div class=""wx-list-item-link""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-list-item-link""></div>")]
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
        [InlineData(null, @"<div class=""wx-list-item-link""></div>")]
        [InlineData("abc", @"<div class=""wx-list-item-link"">abc</div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-list-item-link"">WebExpress.WebUI</div>")]
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
        /// Tests the background color property of the list control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackgroundList.Default, @"<div class=""wx-list-item-link""></div>")]
        [InlineData(TypeColorBackgroundList.Primary, @"<div class=""wx-list-item-link"" data-bgcolor-css=""wx-list-bg-primary""></div>")]
        [InlineData(TypeColorBackgroundList.Secondary, @"<div class=""wx-list-item-link"" data-bgcolor-css=""wx-list-bg-secondary""></div>")]
        [InlineData(TypeColorBackgroundList.Warning, @"<div class=""wx-list-item-link"" data-bgcolor-css=""wx-list-bg-warning""></div>")]
        [InlineData(TypeColorBackgroundList.Danger, @"<div class=""wx-list-item-link"" data-bgcolor-css=""wx-list-bg-danger""></div>")]
        [InlineData(TypeColorBackgroundList.Dark, @"<div class=""wx-list-item-link"" data-bgcolor-css=""wx-list-bg-dark""></div>")]
        [InlineData(TypeColorBackgroundList.Light, @"<div class=""wx-list-item-link"" data-bgcolor-css=""wx-list-bg-light""></div>")]
        [InlineData(TypeColorBackgroundList.Transparent, @"<div class=""wx-list-item-link"" data-bgcolor-css=""wx-list-bg-transparent""></div>")]
        public void BackgroundColor(TypeColorBackgroundList backgroundColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink()
            {
                BackgroundColor = new PropertyColorBackgroundList(backgroundColor)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-list-item-link""></div>")]
        [InlineData("/a", @"<div class=""wx-list-item-link"" data-uri=""/a""></div>")]
        [InlineData("/a/b", @"<div class=""wx-list-item-link"" data-uri=""/a/b""></div>")]
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
        [InlineData(null, @"<div class=""wx-list-item-link""></div>")]
        [InlineData("a", @"<div class=""wx-list-item-link"" data-title=""a""></div>")]
        [InlineData("b", @"<div class=""wx-list-item-link"" data-title=""b""></div>")]
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
        [InlineData(TypeTarget.None, @"<div class=""wx-list-item-link""></div>")]
        [InlineData(TypeTarget.Blank, @"<div class=""wx-list-item-link"" data-target=""_blank""></div>")]
        [InlineData(TypeTarget.Self, @"<div class=""wx-list-item-link"" data-target=""_self""></div>")]
        [InlineData(TypeTarget.Parent, @"<div class=""wx-list-item-link"" data-target=""_parent""></div>")]
        [InlineData(TypeTarget.Framename, @"<div class=""wx-list-item-link"" data-target=""_framename""></div>")]
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
        [InlineData(null, @"<div class=""wx-list-item-link""></div>")]
        [InlineData("a", @"<div class=""wx-list-item-link"" data-tooltip=""a""></div>")]
        [InlineData("b", @"<div class=""wx-list-item-link"" data-tooltip=""b""></div>")]
        [InlineData("a<br/>b", @"<div class=""wx-list-item-link"" data-tooltip=""a<br/>b""></div>")]
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
        [InlineData(null, @"<div class=""wx-list-item-link""></div>")]
        [InlineData(typeof(IconStar), @"<div class=""wx-list-item-link"" data-icon=""fas fa-star""></div>")]
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
        [InlineData(TypeActive.None, @"<div class=""wx-list-item-link""></div>")]
        [InlineData(TypeActive.Active, @"<div class=""wx-list-item-link"" data-active=""active""></div>")]
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
        /// Tests the primary action property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-list-item-link""></div>")]
        [InlineData("modal", @"<div class=""wx-list-item-link"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal""></div>")]
        public void PrimaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink()
            {
                PrimaryAction = new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the secondary action property of the list item link control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-list-item-link""></div>")]
        [InlineData("modal", @"<div class=""wx-list-item-link"" data-wx-secondary-action=""modal"" data-wx-secondary-target=""#modal""></div>")]
        public void SecondaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemLink()
            {
                SecondaryAction = new ActionModal(modal)
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
            var control1 = new ControlListItemLink(null).Add(new ControlIcon() { Icon = new IconStar() });
            var control2 = new ControlListItemLink(null).Add([new ControlIcon() { Icon = new IconStar() }]);
            var control3 = new ControlListItemLink(null).Add(new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]).ToArray());
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
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-list-item-link""><i class=""fas fa-star""></i></div>", html1);
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-list-item-link""><i class=""fas fa-star""></i></div>", html2);
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-list-item-link""><i class=""fas fa-star""></i></div>", html3);
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-list-item-link""><i class=""fas fa-star""></i></div>", html4);
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-list-item-link""><i class=""fas fa-star""></i></div>", html5);
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-list-item-link""><i class=""fas fa-star""></i></div>", html6);
        }
    }
}
