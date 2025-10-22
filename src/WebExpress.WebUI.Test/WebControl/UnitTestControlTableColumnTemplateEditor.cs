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
    public class UnitTestControlTableColumnTemplateEditor
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
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplateEditor(id)
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
        [InlineData(null, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData("abc", @"<div data-label=""abc"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div data-label=""WebExpress.WebUI"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        public void Title(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplateEditor(null)
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
        [InlineData(null, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(typeof(IconStar), @"<div data-icon=""fas fa-star"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplateEditor(null)
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
        [InlineData(TypeColorTable.Default, @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(TypeColorTable.Primary, @"<div data-color=""table-primary"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(TypeColorTable.Secondary, @"<div data-color=""table-secondary"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(TypeColorTable.Info, @"<div data-color=""table-info"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(TypeColorTable.Success, @"<div data-color=""table-success"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(TypeColorTable.Warning, @"<div data-color=""table-warning"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(TypeColorTable.Danger, @"<div data-color=""table-danger"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(TypeColorTable.Light, @"<div data-color=""table-light"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        [InlineData(TypeColorTable.Dark, @"<div data-color=""table-dark"" data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""></div>")]
        public void Color(TypeColorTable color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplateEditor(null)
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
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplateEditor(null)
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
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplateEditor(null)
            {
                Uri = uri != null ? new UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a column to the table.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableColumnTemplateEditor(null);
            var template = new ControlFormItemInputDate(null);

            // test execution
            control.Add(template);

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div data-editable=""true"" data-object-name=""*"" data-form-action=""http://localhost:8080/"" data-form-method=""POST""><div class=""wx-webui-input-date"" data-format=""M/d/yyyy""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
