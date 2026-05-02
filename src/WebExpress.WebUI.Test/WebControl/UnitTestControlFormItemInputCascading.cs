using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form cascading control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputCascading
    {
        /// <summary>
        /// Tests the id property of the form cascading control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-cascading""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-cascading"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCascading(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form cascading control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-cascading"" name=""*""></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCascading()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form cascading control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-cascading""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-cascading"" name=""abc""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCascading(null)
            {
                Name = name
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the form cascading control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-cascading""></div>")]
        [InlineData("Select an option", @"<div class=""wx-webui-input-cascading"" placeholder=""Select an option""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-cascading"" placeholder=""WebExpress.WebUI""></div>")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCascading(null)
            {
                Placeholder = placeholder
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the form cascading control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item""></div></div>")]
        [InlineData(typeof(IconFolder), @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-icon=""fas fa-folder""></div></div>")]
        public void Icon(Type iconType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var icon = iconType is not null ? Activator.CreateInstance(iconType) as IIcon : null;
            var control = new ControlFormItemInputCascading(null, new ControlFormItemInputCascadingItem(null) { Icon = icon })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the form cascading control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item""></div></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label=""abc""></div></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label=""WebExpress.WebUI""></div></div>")]
        public void Text(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCascading(null, new ControlFormItemInputCascadingItem(null) { Text = label })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the selected property of the form cascading control item.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item""></div></div>")]
        [InlineData(true, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" disabled></div></div>")]
        public void Disabled(bool disabled, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCascading(null, new ControlFormItemInputCascadingItem(null) { Disabled = disabled })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the content property of the form cascading control item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item""></div></div>")]
        [InlineData(typeof(ControlText), @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item""><div></div></div></div>")]
        public void Content(Type controlType, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var content = controlType is not null ? Activator.CreateInstance(controlType, [""]) as IControl : null;
            var control = new ControlFormItemInputCascading(null, new ControlFormItemInputCascadingItem(null) { Content = content })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the content property of the form cascading control item.
        /// </summary>
        [Theory]
        [InlineData(TypeColorSelection.Default, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item""></div></div>")]
        [InlineData(TypeColorSelection.Primary, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label-color=""wx-selection-primary""></div></div>")]
        [InlineData(TypeColorSelection.Secondary, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label-color=""wx-selection-secondary""></div></div>")]
        [InlineData(TypeColorSelection.Success, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label-color=""wx-selection-success""></div></div>")]
        [InlineData(TypeColorSelection.Info, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label-color=""wx-selection-info""></div></div>")]
        [InlineData(TypeColorSelection.Warning, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label-color=""wx-selection-warning""></div></div>")]
        [InlineData(TypeColorSelection.Danger, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label-color=""wx-selection-danger""></div></div>")]
        [InlineData(TypeColorSelection.Light, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label-color=""wx-selection-light""></div></div>")]
        [InlineData(TypeColorSelection.Highlight, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label-color=""wx-selection-highlight""></div></div>")]
        [InlineData(TypeColorSelection.Dark, @"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label-color=""wx-selection-dark""></div></div>")]
        public void LabelColor(TypeColorSelection color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCascading(null, new ControlFormItemInputCascadingItem(null) { LabelColor = color })
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the MultiSelect property of the form cascading control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCascading(null)
            {
            };

            // act
            control.Add(new ControlFormItemInputCascadingItem(null) { Text = "label" });
            var html = control.Render(context, visualTree);

            // validation
            Assert.NotEmpty(control.Options);
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-input-cascading""><div class=""wx-cascading-item"" data-label=""label""></div></div>", html);
        }
    }
}
