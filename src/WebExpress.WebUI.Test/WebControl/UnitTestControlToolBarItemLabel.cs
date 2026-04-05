using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the toolbar item label control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlToolbarItemLabel
    {
        /// <summary>
        /// Tests the id property of the toolbar item label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-label""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-toolbar-label""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemLabel(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the toolbar item label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-label""></div>")]
        [InlineData("abc", @"<div class=""wx-toolbar-label"" data-label=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-toolbar-label"" data-label=""WebExpress.WebUI""></div>")]
        public void Text(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemLabel()
            {
                Text = text,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the toolbar item label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-label""></div>")]
        [InlineData("abc", @"<div class=""wx-toolbar-label"" data-title=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-toolbar-label"" data-title=""WebExpress.WebUI""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemLabel()
            {
                Tooltip = tooltip,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the toolbar item label control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""wx-toolbar-label""></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""wx-toolbar-label"" data-color-css=""text-primary""></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""wx-toolbar-label"" data-color-css=""text-secondary""></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""wx-toolbar-label"" data-color-css=""text-warning""></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""wx-toolbar-label"" data-color-css=""text-danger""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""wx-toolbar-label"" data-color-css=""text-dark""></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""wx-toolbar-label"" data-color-css=""text-light""></div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""wx-toolbar-label"" data-color-css=""text-muted""></div>")]
        public void Color(TypeColorText color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemLabel()
            {
                Color = new PropertyColorText(color)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the disabled property of the toolbar item label control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-toolbar-label""></div>")]
        [InlineData(true, @"<div class=""wx-toolbar-label"" disabled></div>")]
        public void Disable(bool disabled, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemLabel()
            {
                Disabled = disabled,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the alignment property of the toolbar item label control.
        /// </summary>
        [Theory]
        [InlineData(TypeToolbarItemAlignment.Default, @"<div class=""wx-toolbar-label""></div>")]
        [InlineData(TypeToolbarItemAlignment.Left, @"<div class=""wx-toolbar-label"" data-align=""left""></div>")]
        [InlineData(TypeToolbarItemAlignment.Right, @"<div class=""wx-toolbar-label"" data-align=""right""></div>")]
        public void Alignment(TypeToolbarItemAlignment alignment, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemLabel()
            {
                Alignment = alignment,
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }
    }
}
