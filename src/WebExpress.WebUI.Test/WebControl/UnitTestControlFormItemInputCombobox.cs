using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form item input combobox control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputCombobox
    {
        /// <summary>
        /// Tests the id property of the form item input combobox control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<select class=""form-select""></select>")]
        [InlineData("id", @"<select id=""id"" class=""form-select""></select>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCombobox(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Icon property of the form item input combobox control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<select class=""form-select""></select>")]
        [InlineData(typeof(IconStar), @"<select class=""form-select""></select>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCombobox()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Label property of the form item input combobox control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<select class=""form-select""></select>")]
        [InlineData("label", @"<select class=""form-select""></select>")]
        public void Label(string label, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCombobox
            {
                Label = label
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the help property of the form item input combobox control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<select class=""form-select""></select>")]
        [InlineData("help", @"<select class=""form-select""></select>")]
        public void Help(string help, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCombobox
            {
                Help = help
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the disabled property of the form item input combobox control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<select class=""form-select""></select>")]
        [InlineData(true, @"<select class=""form-select"" disabled></select>")]
        public void Disabled(bool disabled, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCombobox
            {
                Disabled = disabled
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the prepend property of the form item input combobox control.
        /// </summary>
        [Fact]
        public void Prepend()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCombobox();
            control.AddPrepend(new ControlText { Text = "prepend" });

            // test execution
            var html = control.Render(context, visualTree);

            var expected = @"<select class=""form-select""></select>";
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the append property of the form item input combobox control.
        /// </summary>
        [Fact]
        public void Append()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCombobox();
            control.AddPrepend(new ControlText { Text = "append" });

            // test execution
            var html = control.Render(context, visualTree);

            var expected = @"<select class=""form-select""></select>";
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the tag property of the form item input combobox control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<select class=""form-select""></select>")]
        [InlineData("tag", @"<select class=""form-select""></select>")]
        public void Tag(object tag, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CrerateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputCombobox
            {
                Tag = tag
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
