using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form selection control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputSelection
    {
        /// <summary>
        /// Tests the id property of the form selection control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-selection""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-selection"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSelection(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form selection control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-selection""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-selection"" name=""abc""></div>")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSelection()
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the form selection control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-selection""></div>")]
        [InlineData("Select an option", @"<div class=""wx-webui-selection"" placeholder=""Select an option""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-selection"" placeholder=""WebExpress.WebUI""></div>")]
        public void Placeholder(string placeholder, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSelection()
            {
                Placeholder = placeholder
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the MultiSelect property of the form selection control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-selection""></div>")]
        [InlineData(true, @"<div class=""wx-webui-selection"" data-multiselection=""true""></div>")]
        public void MultiSelect(bool multiSelect, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSelection()
            {
                MultiSelect = multiSelect
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the form selection control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-selection""><div class=""wx-selection-item""></div></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-icon=""fas fa-folder""></div></div>")]
        public void Icon(Type iconType, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType != null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlFormItemInputSelection(null, new ControlFormItemInputSelectionItem() { Icon = icon })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label property of the form selection control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-selection""><div class=""wx-selection-item""></div></div>")]
        [InlineData("abc", @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label=""abc""></div></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label=""WebExpress.WebUI""></div></div>")]
        public void Label(string label, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSelection(null, new ControlFormItemInputSelectionItem() { Label = label })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the selected property of the form selection control item.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-selection""><div class=""wx-selection-item""></div></div>")]
        [InlineData(true, @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" selected></div></div>")]
        public void Selected(bool selected, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSelection(null, new ControlFormItemInputSelectionItem() { Selected = selected })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the selected property of the form selection control item.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-selection""><div class=""wx-selection-item""></div></div>")]
        [InlineData(true, @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" disabled></div></div>")]
        public void Disabled(bool disabled, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSelection(null, new ControlFormItemInputSelectionItem() { Disabled = disabled })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the content property of the form selection control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-selection""><div class=""wx-selection-item""></div></div>")]
        [InlineData(typeof(ControlText), @"<div class=""wx-webui-selection""><div class=""wx-selection-item""><div></div></div></div>")]
        public void Content(Type controlType, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var content = controlType != null ? Activator.CreateInstance(controlType, [""]) as IControl : null;
            var control = new ControlFormItemInputSelection(null, new ControlFormItemInputSelectionItem() { Content = content })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the content property of the form selection control item.
        /// </summary>
        [Theory]
        [InlineData(TypeColorSelection.Default, @"<div class=""wx-webui-selection""><div class=""wx-selection-item""></div></div>")]
        [InlineData(TypeColorSelection.Primary, @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label-color=""wx-selection-primary""></div></div>")]
        [InlineData(TypeColorSelection.Secondary, @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label-color=""wx-selection-secondary""></div></div>")]
        [InlineData(TypeColorSelection.Success, @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label-color=""wx-selection-success""></div></div>")]
        [InlineData(TypeColorSelection.Info, @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label-color=""wx-selection-info""></div></div>")]
        [InlineData(TypeColorSelection.Warning, @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label-color=""wx-selection-warning""></div></div>")]
        [InlineData(TypeColorSelection.Danger, @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label-color=""wx-selection-danger""></div></div>")]
        [InlineData(TypeColorSelection.Light, @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label-color=""wx-selection-light""></div></div>")]
        [InlineData(TypeColorSelection.Dark, @"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label-color=""wx-selection-dark""></div></div>")]
        public void LabelColor(TypeColorSelection color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSelection(null, new ControlFormItemInputSelectionItem() { LabelColor = color })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the MultiSelect property of the form selection control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputSelection()
            {
            };

            // test execution
            control.Add(new ControlFormItemInputSelectionItem() { Label = "label" });
            var html = control.Render(context, visualTree);

            Assert.NotEmpty(control.Options);
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-selection""><div class=""wx-selection-item"" data-label=""label""></div></div>", html);
        }
    }
}
