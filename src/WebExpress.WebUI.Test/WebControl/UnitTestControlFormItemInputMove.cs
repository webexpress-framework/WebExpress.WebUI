using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form move control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputMove
    {
        /// <summary>
        /// Tests the id property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-move"" *></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-move"" name=""id"" *></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-move"" name=""*"" *></div>")]
        public void AutoId(string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove()
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-move"" *></div>")]
        [InlineData("abc", @"<div class=""wx-webui-move"" name=""abc"" *></div>")]
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null)
            {
                Name = name
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the selected header property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-move"" data-header-available=""Available options""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-move"" data-header-selected=""abc"" data-header-available=""Available options""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-move"" data-header-selected=""WebExpress.WebUI"" data-header-available=""Available options""></div>")]
        public void SelectedHeader(string header, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null)
            {
                SelectedHeader = header
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the available header property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-move"" data-header-selected=""Selected options""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-move"" data-header-selected=""Selected options"" data-header-available=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-move"" data-header-selected=""Selected options"" data-header-available=""WebExpress.WebUI""></div>")]
        public void AvailableHeader(string header, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null)
            {
                AvailableHeader = header
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""wx-webui-move"" *></div>*")]
        [InlineData("abc", @"*<div class=""wx-webui-move"" * data-value=""abc""></div>*")]
        public void Value(string value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueString(value));
            });

            // test execution
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label property of the form move control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-move"" *><div class=""wx-webui-move-option""></div></div>")]
        [InlineData("abc", @"<div class=""wx-webui-move"" *><div class=""wx-webui-move-option"">abc</div></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-move"" *><div class=""wx-webui-move-option"">WebExpress.WebUI</div></div>")]
        public void Label(string label, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null, new ControlFormItemInputMoveItem() { Label = label })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the form move control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-move"" *><div class=""wx-webui-move-option""></div></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-webui-move"" *><div class=""wx-webui-move-option"" data-icon=""fas fa-folder""></div></div>")]
        public void Icon(Type iconType, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType != null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlFormItemInputMove(null, new ControlFormItemInputMoveItem() { Icon = icon })
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Add method of the form move control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null)
            {
            };

            // test execution
            control.Add(new ControlFormItemInputMoveItem() { Label = "label" });
            var html = control.Render(context, visualTree);

            Assert.NotEmpty(control.Options);
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-move"" data-header-selected=""Selected options"" data-header-available=""Available options""><div class=""wx-webui-move-option"">label</div></div>", html);
        }
    }
}
