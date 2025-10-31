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
    /// Tests the table row control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableCell
    {
        /// <summary>
        /// Tests the id property of the table cell.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("id", @"<div id=""id""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCell(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Class property of the table cell.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("cell-class", @"<div class=""cell-class""></div>")]
        public void Class(string classValue, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCell()
            {
                Class = classValue
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Style property of the table cell.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("color:red;", @"<div style=""color:red;""></div>")]
        public void Style(string style, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCell()
            {
                Style = style
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Text property of the table cell.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("content", @"<div>content</div>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCell()
            {
                Text = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Icon property of the table cell.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData(typeof(IconStar), @"<div data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCell()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Uri property of the table cell.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("/a", @"<div data-uri=""/a""></div>")]
        [InlineData("/a/b", @"<div data-uri=""/a/b""></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCell()
            {
                Uri = uri != null ? new UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the target property of the table cell.
        /// </summary>
        [Theory]
        [InlineData(TypeTarget.None, @"<div></div>")]
        [InlineData(TypeTarget.Blank, @"<div data-target=""_blank""></div>")]
        [InlineData(TypeTarget.Self, @"<div data-target=""_self""></div>")]
        [InlineData(TypeTarget.Parent, @"<div data-target=""_parent""></div>")]
        [InlineData(TypeTarget.Framename, @"<div data-target=""_framename""></div>")]
        public void Target(TypeTarget target, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCell()
            {
                Target = target
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the modal property of the table cell.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("modal", @"<div data-modal=""modal""></div>")]
        public void Modal(string modal, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCell()
            {
                Modal = modal
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the table cell.
        /// </summary>
        [Theory]
        [InlineData(TypeColorTable.Default, @"<div></div>")]
        [InlineData(TypeColorTable.Primary, @"<div data-color=""table-primary""></div>")]
        [InlineData(TypeColorTable.Secondary, @"<div data-color=""table-secondary""></div>")]
        [InlineData(TypeColorTable.Info, @"<div data-color=""table-info""></div>")]
        [InlineData(TypeColorTable.Success, @"<div data-color=""table-success""></div>")]
        [InlineData(TypeColorTable.Warning, @"<div data-color=""table-warning""></div>")]
        [InlineData(TypeColorTable.Danger, @"<div data-color=""table-danger""></div>")]
        [InlineData(TypeColorTable.Light, @"<div data-color=""table-light""></div>")]
        [InlineData(TypeColorTable.Dark, @"<div data-color=""table-dark""></div>")]
        public void Color(TypeColorTable color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCell()
            {
                Color = color
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
