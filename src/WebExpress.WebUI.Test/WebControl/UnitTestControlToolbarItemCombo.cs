using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the toolbar item combo control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlToolbarItemCombo
    {
        /// <summary>
        /// Tests the id property of the toolbar item combo control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-combo""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-toolbar-combo""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemCombo(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the toolbar item combo control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-combo""></div>")]
        [InlineData("abc", @"<div class=""wx-toolbar-combo"" data-label=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-toolbar-combo"" data-label=""WebExpress.WebUI""></div>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemCombo()
            {
                Text = text,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tooltip property of the toolbar item combo control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-combo""></div>")]
        [InlineData("abc", @"<div class=""wx-toolbar-combo"" data-title=""abc""></div>")]
        [InlineData("webexpress.WebUI:plugin.name", @"<div class=""wx-toolbar-combo"" data-title=""WebExpress.WebUI""></div>")]
        public void Tooltip(string tooltip, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemCombo()
            {
                Tooltip = tooltip,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the toolbar item combo control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-toolbar-combo""></div>")]
        [InlineData(typeof(IconStar), @"<div class=""wx-toolbar-combo"" data-icon=""fas fa-star""></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemCombo()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the active property of the toolbar item combo control.
        /// </summary>
        [Theory]
        [InlineData(TypeActive.None, @"<div class=""wx-toolbar-combo""></div>")]
        [InlineData(TypeActive.Active, @"<div class=""wx-toolbar-combo"" active></div>")]
        [InlineData(TypeActive.Disabled, @"<div class=""wx-toolbar-combo"" disabled></div>")]
        public void Active(TypeActive active, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemCombo()
            {
                Active = active
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the toolbar item combo control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""wx-toolbar-combo""></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""wx-toolbar-combo"" data-color-css=""text-primary""></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""wx-toolbar-combo"" data-color-css=""text-secondary""></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""wx-toolbar-combo"" data-color-css=""text-warning""></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""wx-toolbar-combo"" data-color-css=""text-danger""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""wx-toolbar-combo"" data-color-css=""text-dark""></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""wx-toolbar-combo"" data-color-css=""text-light""></div>")]
        public void Color(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemCombo()
            {
                Color = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the alignment property of the toolbar item combo control.
        /// </summary>
        [Theory]
        [InlineData(TypeToolbarItemAlignment.Default, @"<div class=""wx-toolbar-combo""></div>")]
        [InlineData(TypeToolbarItemAlignment.Left, @"<div class=""wx-toolbar-combo"" data-align=""left""></div>")]
        [InlineData(TypeToolbarItemAlignment.Right, @"<div class=""wx-toolbar-combo"" data-align=""right""></div>")]
        public void Alignment(TypeToolbarItemAlignment alignment, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemCombo()
            {
                Alignment = alignment,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html.Trim());
        }

        /// <summary>
        /// Tests the add function of the toolbar item combo control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlToolbarItemCombo();

            // test execution
            control.Add(new ControlFormItemInputComboItem() { Text = "webexpress.WebUI:plugin.name", Value = "1" });

            // validation
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-toolbar-combo""><option value=""1"">WebExpress.WebUI</option></div>", html.Trim());
        }
    }
}
