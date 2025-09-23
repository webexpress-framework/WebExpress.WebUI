using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the toast control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelOverflow
    {
        /// <summary>
        /// Tests the id property of the toast control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-overflow""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-overflow""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelOverflow(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the toast control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div class=""wx-webui-overflow""></div>")]
        [InlineData(TypeColorBackground.Primary, @"<div class=""wx-webui-overflow bg-primary""></div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div class=""wx-webui-overflow bg-secondary""></div>")]
        [InlineData(TypeColorBackground.Info, @"<div class=""wx-webui-overflow bg-info""></div>")]
        [InlineData(TypeColorBackground.Warning, @"<div class=""wx-webui-overflow bg-warning""></div>")]
        [InlineData(TypeColorBackground.Danger, @"<div class=""wx-webui-overflow bg-danger""></div>")]
        [InlineData(TypeColorBackground.Dark, @"<div class=""wx-webui-overflow bg-dark""></div>")]
        [InlineData(TypeColorBackground.Light, @"<div class=""wx-webui-overflow bg-light""></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""wx-webui-overflow bg-transparent""></div>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelOverflow()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the theme property of the panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeTheme.None, @"<div class=""wx-webui-overflow""></div>")]
        [InlineData(TypeTheme.Light, @"<div class=""wx-webui-overflow"" data-bs-theme=""light""></div>")]
        [InlineData(TypeTheme.Dark, @"<div class=""wx-webui-overflow"" data-bs-theme=""dark""></div>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelOverflow()
            {
                Theme = theme
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the toast control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<div class=""wx-webui-overflow""><div></div></div>")]
        [InlineData(typeof(ControlLink), @"<div class=""wx-webui-overflow""><a class=""wx-link""></a></div>")]
        [InlineData(typeof(ControlImage), @"<div class=""wx-webui-overflow""><img></div>")]
        public void Add(Type child, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlPanelOverflow();

            // test execution
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
