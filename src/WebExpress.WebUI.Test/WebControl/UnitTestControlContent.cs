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
        /// Tests that the markdown format shows the source of the stored value rather than
        /// the document: the scaffolding is removed and what is left is written as markdown,
        /// presented through the code control.
        /// </summary>
        [Theory]
        [InlineData("<h2>Title</h2>", "## Title")]
        [InlineData("<p>A <b>bold</b> word.</p>", "A **bold** word.")]
        [InlineData("<ul><li>one</li><li>two</li></ul>", "- one")]
        [InlineData("<p>a <a href=\"http://x.test\">link</a></p>", "[link](http://x.test)")]
        public void MarkdownFormat(string editorValue, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent()
            {
                Content = _ => editorValue,
                Format = _ => TypeFormatContent.Markdown
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(expected, Decode(html));
        }

        /// <summary>
        /// Tests that the markdown format is presented as source, through the same control
        /// that presents any other source.
        /// </summary>
        [Fact]
        public void MarkdownFormatIsSource()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent("id")
            {
                Content = _ => "<p>text</p>",
                Format = _ => TypeFormatContent.Markdown
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains("wx-webui-code", html);
            Assert.Contains("data-language=\"markdown\"", html);
            Assert.Contains("id=\"id\"", html);
            Assert.DoesNotContain("wx-webui-content", html);
        }

        /// <summary>
        /// Tests that the scaffolding of the editor never reaches the markdown source, which
        /// is the whole reason the conversion sits in the control rather than in the caller.
        /// </summary>
        [Fact]
        public void MarkdownFormatDropsScaffolding()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlContent()
            {
                Content = _ => "<p>Note <span class=\"wx-editor-instruction\">ask legal</span> here.</p>"
                    + "<div class=\"wx-addon-frame card\" contenteditable=\"false\">"
                    + "<div class=\"card-header\"><span>Warning Widget</span></div>"
                    + "<div class=\"card-body wx-addon-body-widget\"><div class=\"alert\">Careful.</div></div></div>",
                Format = _ => TypeFormatContent.Markdown
            };

            // act
            var markdown = Decode(control.Render(context, visualTree).ToString());

            // validation
            Assert.Contains("Careful.", markdown);
            Assert.DoesNotContain("ask legal", markdown);
            Assert.DoesNotContain("Warning Widget", markdown);
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
            Assert.Contains("wx-webui-content", html);
            Assert.Equal("<p>Hello <b>World</b></p>", Decode(html));
        }

        /// <summary>
        /// Tests that an empty value stays with the reading view in either format, so the
        /// placeholder is shown rather than an empty source block.
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
