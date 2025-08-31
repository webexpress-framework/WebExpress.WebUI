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
    /// Tests the tabele column edit control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableColumnEditor
    {
        /// <summary>
        /// Tests the id property of the tabele column edit control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData("id", @"<div id=""id"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnEditor(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the table column.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("abc", @"<div data-label=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div data-label=""WebExpress.WebUI""></div>")]
        public void Title(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn()
            {
                Title = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the table column.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData(typeof(IconStar), @"<div data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the table column.
        /// </summary>
        [Theory]
        [InlineData(TypeTableColor.Default, @"<div></div>")]
        [InlineData(TypeTableColor.Primary, @"<div data-color=""table-primary""></div>")]
        [InlineData(TypeTableColor.Secondary, @"<div data-color=""table-secondary""></div>")]
        [InlineData(TypeTableColor.Info, @"<div data-color=""table-info""></div>")]
        [InlineData(TypeTableColor.Success, @"<div data-color=""table-success""></div>")]
        [InlineData(TypeTableColor.Warning, @"<div data-color=""table-warning""></div>")]
        [InlineData(TypeTableColor.Danger, @"<div data-color=""table-danger""></div>")]
        [InlineData(TypeTableColor.Light, @"<div data-color=""table-light""></div>")]
        [InlineData(TypeTableColor.Dark, @"<div data-color=""table-dark""></div>")]
        public void Color(TypeTableColor color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumn()
            {
                Color = color
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the method property of the tabele column edit control.
        /// </summary>
        [Theory]
        [InlineData(RequestMethod.NONE, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""NONE""></div>")]
        [InlineData(RequestMethod.POST, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(RequestMethod.PUT, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""PUT""></div>")]
        [InlineData(RequestMethod.GET, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""GET""></div>")]
        [InlineData(RequestMethod.PATCH, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""PATCH""></div>")]
        [InlineData(RequestMethod.DELETE, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""DELETE""></div>")]
        public void Method(RequestMethod method, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnEditor(null)
            {
                Method = method
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the tabele column edit control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData("", @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""/"" data-form-method=""POST""></div>")]
        [InlineData("http://localhost:8080/webui", @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/webui"" data-form-method=""POST""></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnEditor(null)
            {
                Uri = uri != null ? new UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
