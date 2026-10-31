using System.Collections.Generic;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Protects request-local rendering of cached menu and form definitions.
    /// </summary>
    public class UnitTestContextExtensions
    {
        /// <summary>
        /// Evaluates the same menu against each current context without retaining visibility.
        /// </summary>
        [Fact]
        public void VisibilityUsesEachRenderContext()
        {
            // arrange
            var first = UnitTestControlFixture.CreateRenderContextMock();
            var second = UnitTestControlFixture.CreateRenderContextMock();
            var link = new ControlDropdownItemLink { Text = _ => "Private entry", Visible = context => ReferenceEquals(context, first) };
            // act
            var visible = link.Render(first, null);
            var hidden = link.Render(second, null);
            var visibleAgain = link.Render(first, null);
            // validation
            Assert.NotNull(visible);
            Assert.Null(hidden);
            Assert.NotNull(visibleAgain);
        }

        /// <summary>
        /// Creates title items per request and places them once inside the form header.
        /// </summary>
        [Fact]
        public void FormTitleFactoryDoesNotRetainItems()
        {
            // arrange
            var hub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var tree = new VisualTreeControl(hub, context.PageContext);
            var created = new List<ControlFormItem>();
            var form = new ControlForm("form")
            {
                TitleInputFactory = _ =>
                {
                    var input = new ControlFormItemInputText("title") { Name = _ => "title" };
                    created.Add(input);
                    return input;
                }
            };
            // act
            var first = form.Render(context, tree).ToString();
            var second = form.Render(context, tree).ToString();
            // validation
            Assert.Equal(2, created.Count);
            Assert.NotSame(created[0], created[1]);
            Assert.Empty(form.Items);
            Assert.Contains("wx-modal-title-input", first);
            Assert.Contains("<header", first);
            Assert.Contains("name=\"title\"", second);
            Assert.True(first.IndexOf("<header") < first.IndexOf("wx-form-main"));
        }

        /// <summary>
        /// Rejects invalid structured submissions after strict format detection was introduced.
        /// </summary>
        /// <param name="value">The malformed or unrelated JSON input.</param>
        [Theory]
        [InlineData("{}")]
        [InlineData("{broken")]
        [InlineData("{\"version\":1,\"sheets\":[]}")]
        public void WysiwygValidationRejectsInvalidState(string value)
        {
            // arrange
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var input = new ControlFormItemInputText("body") { Name = _ => "body", Format = _ => TypeEditTextFormat.Wysiwyg };
            context.SetValue(input, new ControlFormInputValueString(value));
            // act
            var validation = input.Validate(context);
            // validation
            Assert.NotEmpty(validation);
        }
        /// <summary>
        /// Honors an explicit request-local menu collection instead of cached items.
        /// </summary>
        [Fact]
        public void DropdownRendersSuppliedItems()
        {
            // arrange
            var hub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var tree = new VisualTreeControl(hub, context.PageContext);
            var menu = new ControlDropdown();
            menu.Add(new ControlDropdownItemLink { Text = _ => "Cached item" });
            // act
            var html = menu.Render(context, tree, [new ControlDropdownItemLink { Text = _ => "Request item" }]).ToString();
            // validation
            Assert.Contains("Request item", html);
            Assert.DoesNotContain("Cached item", html);
        }
    }
}
