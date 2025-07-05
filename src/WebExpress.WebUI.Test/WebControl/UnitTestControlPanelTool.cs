using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the tool panel control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelTool
    {
        /// <summary>
        /// Tests the id property of the tool panel control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""></div><div></div></div>")]
        [InlineData("id", @"<div id=""id"" class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""></div><div></div></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelTool(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the direction property of the tool panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeDirection.Default, @"<div class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""></div><div></div></div>")]
        [InlineData(TypeDirection.Vertical, @"<div class=""toolpanel border flex-column"">*</div>")]
        [InlineData(TypeDirection.VerticalReverse, @"<div class=""toolpanel border flex-column-reverse"">*</div>")]
        [InlineData(TypeDirection.Horizontal, @"<div class=""toolpanel border flex-row"">*</div>")]
        [InlineData(TypeDirection.HorizontalReverse, @"<div class=""toolpanel border flex-row-reverse"">*</div>")]
        public void Direction(TypeDirection direction, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelTool()
            {
                Direction = direction,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the fluid property of the tool panel control.
        /// </summary>
        [Theory]
        [InlineData(TypePanelContainer.None, @"<div class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""></div><div></div></div>")]
        [InlineData(TypePanelContainer.Default, @"<div class=""toolpanel border container"">*</div>")]
        [InlineData(TypePanelContainer.Fluid, @"<div class=""toolpanel border container-fluid"">*</div>")]
        public void Fluid(TypePanelContainer fluid, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelTool()
            {
                Fluid = fluid,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tools property of the tool panel control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""><div class=""wx-dropdown-item""></div></div><div></div></div>")]
        [InlineData("abc", @"<div class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""><div class=""wx-dropdown-item"">abc</div></div><div></div></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""><div class=""wx-dropdown-item"">webexpress.webui:plugin.name</div></div><div></div></div>")]
        public void Tools(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = new ControlDropdownItemLink() { Text = text };
            var control = new ControlPanelTool()
            {
            };

            // test execution
            control.Tools.Add(childInstance);
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the theme property of the panel control.
        /// </summary>
        [Theory]
        [InlineData(TypeTheme.None, @"<div class=""toolpanel border"">*</div>")]
        [InlineData(TypeTheme.Light, @"<div class=""toolpanel border"" data-bs-theme=""light"">*</div>")]
        [InlineData(TypeTheme.Dark, @"<div class=""toolpanel border"" data-bs-theme=""dark"">*</div>")]
        public void Theme(TypeTheme theme, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelTool()
            {
                Theme = theme
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the tool panel control.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlText), @"<div class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""></div><div><div></div></div></div>")]
        [InlineData(typeof(ControlLink), @"<div class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""></div><div><a class=""link""></a></div></div>")]
        [InlineData(typeof(ControlImage), @"<div class=""toolpanel border""><div class=""wx-webui-dropdown"" role=""button""></div><div><img></div></div>")]
        public void Add(Type child, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance = Activator.CreateInstance(child, [null]) as IControl;
            var control = new ControlPanelTool();

            // test execution
            control.Add(childInstance);

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
