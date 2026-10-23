using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form label control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemLabel
    {
        /// <summary>
        /// Tests the id property of the form label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""wx-form-label""></span>")]
        [InlineData("id", @"<span id=""id"" class=""wx-form-label""></span>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemLabel(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""wx-form-label""></span>")]
        [InlineData("abc", @"<span class=""wx-form-label""></span>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemLabel()
            {
                Name = _ => name
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the form label control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""wx-form-label""></span>")]
        [InlineData("abc", @"<span class=""wx-form-label"">abc</span>")]
        public void Text(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemLabel()
            {
                Text = _ => text
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the form item property of the form label control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<span class=""wx-form-label""></span>")]
        [InlineData(true, @"<label class=""wx-form-label"" for=""*""></label>")]
        public void FormItem(bool formItem, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemLabel(null)
            {
                FormItem = formItem ? new ControlFormItemInputText() : null
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that a field without a labelable element is captioned by a span, since the
        /// browser flags a label whose for attribute reaches no labelable element.
        /// </summary>
        [Theory]
        [InlineData("rating", @"<span id=""l"" class=""wx-form-label""></span>")]
        [InlineData("wysiwyg", @"<span id=""l"" class=""wx-form-label""></span>")]
        [InlineData("multiline", @"<label id=""l"" class=""wx-form-label"" for=""*""></label>")]
        public void FormItemLabelable(string field, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemLabel("l")
            {
                FormItem = field switch
                {
                    "rating" => new ControlFormItemInputRating(),
                    "wysiwyg" => new ControlFormItemInputText() { Format = _ => TypeEditTextFormat.Wysiwyg },
                    _ => new ControlFormItemInputText() { Format = _ => TypeEditTextFormat.Multiline }
                }
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
