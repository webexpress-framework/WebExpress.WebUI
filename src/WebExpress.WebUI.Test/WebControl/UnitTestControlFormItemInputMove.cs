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
        [InlineData(null, @"<div class=""wx-webui-input-move"" *></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-move"" name=""id"" *></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-move"" name=""*"" *></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-move"" *></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-move"" name=""abc"" *></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null)
            {
                Name = name
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the selected header property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-move"" data-header-available=""Available options""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-move"" data-header-selected=""abc"" data-header-available=""Available options""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-move"" data-header-selected=""WebExpress.WebUI"" data-header-available=""Available options""></div>")]
        public void SelectedHeader(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null)
            {
                SelectedHeader = header
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the available header property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-move"" data-header-selected=""Selected options""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-move"" data-header-selected=""Selected options"" data-header-available=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-move"" data-header-selected=""Selected options"" data-header-available=""WebExpress.WebUI""></div>")]
        public void AvailableHeader(string header, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null)
            {
                AvailableHeader = header
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form move control.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div class=""wx-webui-input-move"" *></div>*")]
        [InlineData("abc", @"*<div class=""wx-webui-input-move"" * data-value=""abc""></div>*")]
        public void Value(string value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null);
            var form = new ControlForm().Add(control).Initialize(renderContext =>
            {
                renderContext.SetValue(control, new ControlFormInputValueStringList(value));
            });

            // act
            var html = form.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the form move control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-move"" *><div class=""wx-webui-move-option""></div></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-move"" *><div class=""wx-webui-move-option"">abc</div></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-move"" *><div class=""wx-webui-move-option"">WebExpress.WebUI</div></div>")]
        public void Text(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null, new ControlFormItemInputMoveItem() { Text = label })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the form move control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-move"" *><div class=""wx-webui-move-option""></div></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-webui-input-move"" *><div class=""wx-webui-move-option"" data-icon=""fas fa-folder""></div></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlFormItemInputMove(null, new ControlFormItemInputMoveItem() { Icon = icon })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Add method of the form move control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputMove(null)
            {
            };

            // act
            control.Add(new ControlFormItemInputMoveItem() { Text = "label" });
            var html = control.Render(context, visualTree);

            Assert.NotEmpty(control.Options);
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-input-move"" data-header-selected=""Selected options"" data-header-available=""Available options""><div class=""wx-webui-move-option"">label</div></div>", html);
        }
    }
}
