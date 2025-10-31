using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item help text control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemHelpText
    {
        /// <summary>
        /// Tests the id property of the form item help text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<small class=""text-muted""></small>")]
        [InlineData("id", @"<small id=""id"" class=""text-muted""></small>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemHelpText(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the form item help text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<small class=""text-muted""></small>")]
        [InlineData("abc", @"<small class=""text-muted"">abc</small>")]
        [InlineData("webexpress.webui:plugin.name", @"<small class=""text-muted"">WebExpress.WebUI</small>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemHelpText()
            {
                Text = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the form item help text control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeText.Default, @"<small class=""text-muted""></small>")]
        [InlineData(TypeSizeText.ExtraSmall, @"<small class=""text-muted wx-esm""></small>")]
        [InlineData(TypeSizeText.Small, @"<small class=""text-muted wx-sm""></small>")]
        [InlineData(TypeSizeText.Large, @"<small class=""text-muted wx-lg""></small>")]
        [InlineData(TypeSizeText.ExtraLarge, @"<small class=""text-muted wx-elg""></small>")]
        public void Size(TypeSizeText size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemHelpText()
            {
                Size = new PropertySizeText(size)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
