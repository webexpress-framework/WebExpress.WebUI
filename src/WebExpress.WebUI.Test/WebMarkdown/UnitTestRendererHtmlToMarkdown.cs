using WebExpress.WebCore.WebHtml.Parser;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebMarkdown;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Unit tests for converting HTML into Markdown (MarkdownRendererHtmlToMarkdown), the
    /// direction that closes the round trip between the two formats.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestRendererHtmlToMarkdown
    {
        /// <summary>
        /// Tests the inline notations Markdown has a syntax for.
        /// </summary>
        [Theory]
        [InlineData("<p><strong>bold</strong></p>", "**bold**")]
        [InlineData("<p><b>bold</b></p>", "**bold**")]
        [InlineData("<p><em>italic</em></p>", "*italic*")]
        [InlineData("<p><i>italic</i></p>", "*italic*")]
        [InlineData("<p><u>underline</u></p>", "_underline_")]
        [InlineData("<p><s>strike</s></p>", "~~strike~~")]
        [InlineData("<p><del>strike</del></p>", "~~strike~~")]
        [InlineData("<p><mark>marked</mark></p>", "==marked==")]
        [InlineData("<p><code>x = 1</code></p>", "`x = 1`")]
        [InlineData("<p>a <strong>b</strong> c</p>", "a **b** c")]
        public void ConvertInline(string html, string expected)
        {
            // act
            var markdown = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown(html);

            // validation
            Assert.Equal(expected, markdown);
        }

        /// <summary>
        /// Tests the block notations.
        /// </summary>
        [Theory]
        [InlineData("<h1>Title</h1>", "# Title")]
        [InlineData("<h3>Title</h3>", "### Title")]
        [InlineData("<h6>Title</h6>", "###### Title")]
        [InlineData("<p>A sentence.</p>", "A sentence.")]
        [InlineData("<hr>", "---")]
        [InlineData("<blockquote><p>quoted</p></blockquote>", "> quoted")]
        public void ConvertBlock(string html, string expected)
        {
            // act
            var markdown = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown(html);

            // validation
            Assert.Equal(expected, markdown);
        }

        /// <summary>
        /// Tests links and images, which carry an attribute rather than only content.
        /// </summary>
        [Theory]
        [InlineData("<p><a href=\"http://example.com\">text</a></p>", "[text](http://example.com)")]
        [InlineData("<p><img src=\"http://example.com/a.png\" alt=\"alt\"></p>", "![alt](http://example.com/a.png)")]
        public void ConvertReference(string html, string expected)
        {
            // act
            var markdown = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown(html);

            // validation
            Assert.Equal(expected, markdown);
        }

        /// <summary>
        /// Tests that a list becomes list notation, and that a list nested in an item is
        /// indented rather than flattened into its parent.
        /// </summary>
        [Fact]
        public void ConvertList()
        {
            // arrange
            var html = "<ul><li>one</li><li>two<ul><li>nested</li></ul></li></ul>";

            // act
            var markdown = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown(html);

            // validation
            Assert.Contains("- one", markdown);
            Assert.Contains("- two", markdown);
            Assert.Contains("  - nested", markdown);
        }

        /// <summary>
        /// Tests that a numbered list keeps its numbering.
        /// </summary>
        [Fact]
        public void ConvertOrderedList()
        {
            // act
            var markdown = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown("<ol><li>one</li><li>two</li></ol>");

            // validation
            Assert.Contains("1. one", markdown);
            Assert.Contains("2. two", markdown);
        }

        /// <summary>
        /// Tests that a table keeps its header and its rows.
        /// </summary>
        [Fact]
        public void ConvertTable()
        {
            // arrange
            var html = "<table><thead><tr><th>Version</th><th>Change</th></tr></thead>"
                + "<tbody><tr><td>2.0.0</td><td>arrived</td></tr></tbody></table>";

            // act
            var markdown = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown(html);

            // validation
            Assert.Contains("Version", markdown);
            Assert.Contains("Change", markdown);
            Assert.Contains("2.0.0", markdown);
            Assert.Contains("arrived", markdown);
            Assert.Contains("---", markdown);
        }

        /// <summary>
        /// Tests that a table without a header row is given its first row as the header,
        /// because Markdown has no notation for a table without one.
        /// </summary>
        [Fact]
        public void ConvertTableWithoutHeader()
        {
            // act
            var markdown = MarkdownRendererHtmlToMarkdown
                .ConvertHtmlToMarkdown("<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>");

            // validation
            Assert.Contains("a", markdown);
            Assert.Contains("c", markdown);
            Assert.Contains("---", markdown);
        }

        /// <summary>
        /// Tests that a code block keeps its text and picks up the language from the class
        /// a highlighter puts on the code element.
        /// </summary>
        [Fact]
        public void ConvertCode()
        {
            // act
            var markdown = MarkdownRendererHtmlToMarkdown
                .ConvertHtmlToMarkdown("<pre><code class=\"language-csharp\">var a = 1;</code></pre>");

            // validation
            Assert.Contains("```csharp", markdown);
            Assert.Contains("var a = 1;", markdown);
        }

        /// <summary>
        /// Tests that markup Markdown cannot express loses the wrapper and keeps the text,
        /// so the result is a portable document rather than HTML in disguise.
        /// </summary>
        [Theory]
        [InlineData("<p><span style=\"background-color: rgb(255, 255, 0);\">text</span></p>", "text")]
        [InlineData("<div><p>text</p></div>", "text")]
        [InlineData("<section><p>text</p></section>", "text")]
        public void ConvertUnsupportedMarkup(string html, string expected)
        {
            // act
            var markdown = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown(html);

            // validation
            Assert.Equal(expected, markdown);
            Assert.DoesNotContain("<", markdown);
        }

        /// <summary>
        /// Tests that the empty guard paragraphs the editor keeps around its non-editable
        /// blocks do not become empty paragraphs in the document.
        /// </summary>
        [Fact]
        public void ConvertEmptyParagraph()
        {
            // act
            var markdown = MarkdownRendererHtmlToMarkdown
                .ConvertHtmlToMarkdown("<p><br></p><p>text</p><p><br></p>");

            // validation
            Assert.Equal("text", markdown);
        }

        /// <summary>
        /// Pins what the working surface of the editor converts to, which is the reason the
        /// renderer documents that it has to be stripped first: the label of an add-on, the
        /// drag handle and an instruction text are markup like any other to this renderer,
        /// so they arrive as text of the document rather than being recognised as chrome.
        /// Teaching the renderer about them would put a second copy of the reading view's
        /// rules here, where it would drift away from the one on the client.
        /// </summary>
        [Fact]
        public void ConvertEditorScaffolding()
        {
            // arrange
            var html = "<p>before</p>"
                + "<div class=\"wx-addon-frame card\" contenteditable=\"false\" data-addon-id=\"warning-box\">"
                + "<div class=\"card-header\"><span class=\"wx-addon-drag-handle\">H</span><span>Warning Widget</span></div>"
                + "<div class=\"card-body wx-addon-body-widget\"><div class=\"alert\">Achtung</div></div></div>"
                + "<p>Note <span class=\"wx-editor-instruction\">ask legal</span> here.</p>";

            // act
            var markdown = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown(html);

            // validation - the content survives
            Assert.Contains("before", markdown);
            Assert.Contains("Achtung", markdown);

            // validation - and so does the chrome, which is what a caller has to remove first
            Assert.Contains("Warning Widget", markdown);
            Assert.Contains("ask legal", markdown);
        }

        /// <summary>
        /// Tests that no input yields no output rather than an exception.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void ConvertWithoutContent(string html)
        {
            // act
            var markdown = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown(html);

            // validation
            Assert.Equal(string.Empty, markdown);
        }

        /// <summary>
        /// Tests the path the caller is meant to take: the HTML is read by the parser and the
        /// nodes are handed to the renderer, so both stages can be used on their own.
        /// </summary>
        [Fact]
        public void ConvertParsedNodes()
        {
            // arrange
            var nodes = new HtmlParser().Parse("<h2>Title</h2><p>Body <b>text</b>.</p>");

            // act
            var markdown = nodes.ConvertToMarkdown();
            var document = nodes.ConvertToDocument();

            // validation
            Assert.Contains("## Title", markdown);
            Assert.Contains("Body **text**.", markdown);
            Assert.Equal(2, document.Elements.Count());
        }

        /// <summary>
        /// Tests that a document survives the way back: markdown that is rendered to html and
        /// converted again describes the same document.
        /// </summary>
        [Theory]
        [InlineData("# Title")]
        [InlineData("A paragraph with **bold** and *italic*.")]
        [InlineData("- one\n- two")]
        [InlineData("> quoted")]
        public void RoundTrip(string markdown)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var html = MarkdownParser.Parse(markdown).ConvertToHtml(renderContext).ToString();

            // act
            var result = MarkdownRendererHtmlToMarkdown.ConvertHtmlToMarkdown(html);

            // validation
            Assert.Equal(
                MarkdownParser.Parse(markdown).GetPlainText().Trim(),
                MarkdownParser.Parse(result).GetPlainText().Trim()
            );
        }
    }
}
