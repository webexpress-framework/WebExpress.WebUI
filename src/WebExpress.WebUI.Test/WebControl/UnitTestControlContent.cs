using System;
using System.Text;
using System.Text.RegularExpressions;
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
        /// Tests that markdown content is parsed on the server, by the same parser that
        /// backs the text control, rather than shipped to the client as it stands.
        /// </summary>
        [Theory]
        [InlineData("**bold**", "<strong>bold</strong>")]
        [InlineData("*italic*", "<i>italic</i>")]
        [InlineData("# Heading", "<h1")]
        [InlineData("- a list item", "<li>")]
        [InlineData("[text](http://example.com)", "href=\"http://example.com\"")]
        public void MarkdownFormat(string markdown, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent()
            {
                Content = _ => markdown,
                Format = _ => TypeFormatContent.Markdown
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(expected, Decode(html));
        }

        /// <summary>
        /// Tests that both formats are delivered the same way - as the reading view - so the
        /// client keeps a single implementation and the markdown never reaches it unparsed.
        /// </summary>
        [Theory]
        [InlineData(TypeFormatContent.RichText)]
        [InlineData(TypeFormatContent.Markdown)]
        public void FormatIsReadingView(TypeFormatContent format)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent("id")
            {
                Content = _ => "text",
                Format = _ => format
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains("wx-webui-content", html);
            Assert.Contains("id=\"id\"", html);
        }

        /// <summary>
        /// Tests that rich text is handed over untouched, because the reading view on the
        /// client is what turns the editor's working surface into a document.
        /// </summary>
        [Fact]
        public void RichTextFormatKeepsMarkup()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent()
            {
                Content = _ => "<p>Hello <b>World</b></p>",
                Format = _ => TypeFormatContent.RichText
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Equal("<p>Hello <b>World</b></p>", Decode(html));
        }

        /// <summary>
        /// Tests that a value the editor stored can be brought into the markdown format and
        /// renders the same document, which is the round trip the two formats share.
        /// </summary>
        [Fact]
        public void MarkdownFormatFromEditorValue()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var editorValue = "<h2>Title</h2><p>A <b>bold</b> word.</p>"
                + "<p>Note <span class=\"wx-editor-instruction\">ask legal</span> here.</p>";
            var control = new ControlContent()
            {
                Content = _ => EditorContent.ConvertToMarkdown(editorValue),
                Format = _ => TypeFormatContent.Markdown
            };

            // act
            var markup = Decode(control.Render(context, visualTree).ToString());

            // validation
            Assert.Contains("<h2>Title</h2>", markup);
            Assert.Contains("<strong>bold</strong>", markup);
            Assert.DoesNotContain("ask legal", markup);
        }

        /// <summary>
        /// Tests that an empty value stays empty in either format, so nothing is parsed and
        /// the client shows the placeholder rather than an empty document.
        /// </summary>
        [Theory]
        [InlineData(TypeFormatContent.RichText)]
        [InlineData(TypeFormatContent.Markdown)]
        public void FormatWithoutContent(TypeFormatContent format)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent()
            {
                Format = _ => format,
                Placeholder = _ => "nothing yet"
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<div class=""wx-webui-content"" data-placeholder=""nothing yet"" data-base64=""true""></div>", html);
        }

        /// <summary>
        /// Returns the content the control transports, decoded from its base64 payload.
        /// </summary>
        /// <param name="html">The rendered control.</param>
        /// <returns>The transported markup.</returns>
        private static string Decode(string html)
        {
            var payload = Regex.Match(html, @">([A-Za-z0-9+/=]*)<").Groups[1].Value;

            return Encoding.UTF8.GetString(Convert.FromBase64String(payload));
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
