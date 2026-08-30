using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the content control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlContent
    {
        /// <summary>
        /// Tests the id property of the content control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-content"" data-base64=""true""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-content"" data-base64=""true""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the content property of the content control. The markup is transported
        /// encoded so the browser cannot lay out the editing markup before the reading
        /// view replaces it.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-content"" data-base64=""true""></div>")]
        [InlineData("", @"<div class=""wx-webui-content"" data-base64=""true""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-content"" data-base64=""true"">YWJj</div>")]
        [InlineData("<p>Hello <b>World</b></p>", @"<div class=""wx-webui-content"" data-base64=""true"">PHA+SGVsbG8gPGI+V29ybGQ8L2I+PC9wPg==</div>")]
        public void Content(string content, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent()
            {
                Content = _ => content
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the content control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-content"" data-base64=""true""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-content"" data-placeholder=""abc"" data-base64=""true""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-content"" data-placeholder=""WebExpress.WebUI"" data-base64=""true""></div>")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent()
            {
                Placeholder = _ => placeholder
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the instruction property of the content control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-content"" data-base64=""true""></div>")]
        [InlineData(true, @"<div class=""wx-webui-content"" data-instruction=""true"" data-base64=""true""></div>")]
        public void Instruction(bool instruction, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent()
            {
                Instruction = _ => instruction
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the css classes of the content control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""wx-webui-content"" data-base64=""true""></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""wx-webui-content text-primary"" data-base64=""true""></div>")]
        public void TextColor(TypeColorText color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent()
            {
                TextColor = _ => new PropertyColorText(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
