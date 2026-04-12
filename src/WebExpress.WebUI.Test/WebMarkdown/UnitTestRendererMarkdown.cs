using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebMarkdown.Element;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Unit tests for converting Markdown AST back to Markdown text (MarkdownRendererMarkdown).
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestRendererMarkdown
    {
        /// <summary>
        /// Tests round-trip conversion for inline formatting elements.
        /// </summary>
        [Theory]
        [InlineData("*italic*")]
        [InlineData("**bold**")]
        [InlineData("_underline_")]
        [InlineData("~~strikethrough~~")]
        [InlineData("==highlighted==")]
        [InlineData("`code`")]
        public void RoundTripInlineFormatting(string markdown)
        {
            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation - reparsed document should produce equivalent plain text
            var doc2 = MarkdownParser.Parse(result);
            Assert.Equal(doc.GetPlainText().Trim(), doc2.GetPlainText().Trim());
        }

        /// <summary>
        /// Tests round-trip conversion for headers.
        /// </summary>
        [Theory]
        [InlineData("# Header One")]
        [InlineData("## Header Two")]
        [InlineData("### Header Three")]
        [InlineData("#### Header Four")]
        [InlineData("##### Header Five")]
        [InlineData("###### Header Six")]
        public void RoundTripHeaders(string markdown)
        {
            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            var doc2 = MarkdownParser.Parse(result);
            Assert.Equal(doc.GetPlainText().Trim(), doc2.GetPlainText().Trim());

            var header1 = doc.Elements.OfType<MarkdownBlockElementHeader>().First();
            var header2 = doc2.Elements.OfType<MarkdownBlockElementHeader>().First();
            Assert.Equal(header1.Level, header2.Level);
        }

        /// <summary>
        /// Tests round-trip conversion for a horizontal rule.
        /// </summary>
        [Fact]
        public void RoundTripHorizontalRule()
        {
            // act
            var doc = MarkdownParser.Parse("---");
            var result = doc.ConvertToMarkdown();

            // validation
            Assert.Contains("---", result);
            var doc2 = MarkdownParser.Parse(result);
            Assert.Contains(doc2.Elements, e => e is MarkdownBlockElementHorizontalRule);
        }

        /// <summary>
        /// Tests round-trip conversion for code blocks.
        /// </summary>
        [Fact]
        public void RoundTripCodeBlock()
        {
            // arrange
            var markdown = "```csharp\nvar x = 1;\n```";

            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            var doc2 = MarkdownParser.Parse(result);
            var code1 = doc.Elements.OfType<MarkdownBlockElementCode>().First();
            var code2 = doc2.Elements.OfType<MarkdownBlockElementCode>().First();
            Assert.Equal(code1.Language, code2.Language);
            Assert.Equal(code1.Content.Trim(), code2.Content.Trim());
        }

        /// <summary>
        /// Tests round-trip conversion for paragraphs.
        /// </summary>
        [Theory]
        [InlineData("This is a simple paragraph.")]
        [InlineData("Hello **world** and *universe*!")]
        public void RoundTripParagraph(string markdown)
        {
            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            var doc2 = MarkdownParser.Parse(result);
            Assert.Equal(doc.GetPlainText().Trim(), doc2.GetPlainText().Trim());
        }

        /// <summary>
        /// Tests round-trip conversion for links.
        /// </summary>
        [Fact]
        public void RoundTripLink()
        {
            // arrange
            var markdown = "[text](http://example.com)";

            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            Assert.Contains("[text](http://example.com)", result);
        }

        /// <summary>
        /// Tests round-trip conversion for images.
        /// </summary>
        [Fact]
        public void RoundTripImage()
        {
            // arrange
            var markdown = "![alt](http://example.com/image.png)";

            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            Assert.Contains("![alt](http://example.com/image.png)", result);
        }

        /// <summary>
        /// Tests round-trip conversion for blockquotes.
        /// </summary>
        [Fact]
        public void RoundTripBlockQuote()
        {
            // arrange
            var markdown = "> This is a quote.";

            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            var doc2 = MarkdownParser.Parse(result);
            Assert.Equal(doc.GetPlainText().Trim(), doc2.GetPlainText().Trim());
        }

        /// <summary>
        /// Tests round-trip conversion for inline plugins.
        /// </summary>
        [Fact]
        public void RoundTripInlinePlugin()
        {
            // arrange
            var markdown = "Text with {{my_plugin}} inside.";

            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            Assert.Contains("{{my_plugin}}", result);
            var doc2 = MarkdownParser.Parse(result);
            var paragraph = doc2.Elements.OfType<MarkdownBlockElementParagraph>().First();
            Assert.Contains(paragraph.Content, e => e is MarkdownInlineElementPlugin);
        }

        /// <summary>
        /// Tests round-trip conversion for inline plugins with parameters.
        /// </summary>
        [Fact]
        public void RoundTripInlinePluginWithParams()
        {
            // arrange
            var markdown = "{{video src=\"test.mp4\"}}";

            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            Assert.Contains("{{video", result);
            Assert.Contains("src=\"test.mp4\"", result);
            var doc2 = MarkdownParser.Parse(result);
            var paragraph = doc2.Elements.OfType<MarkdownBlockElementParagraph>().First();
            var plugin = paragraph.Content.OfType<MarkdownInlineElementPlugin>().First();
            Assert.Equal("video", plugin.Name);
            Assert.Equal("test.mp4", plugin.Parameters["src"]);
        }

        /// <summary>
        /// Tests round-trip conversion for block plugins.
        /// </summary>
        [Fact]
        public void RoundTripBlockPlugin()
        {
            // arrange
            var markdown = "{{% note %}}\nThis is a note.\n{{% /note %}}";

            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            Assert.Contains("{{% note %}}", result);
            Assert.Contains("{{% /note %}}", result);
            var doc2 = MarkdownParser.Parse(result);
            var plugin = doc2.Elements.OfType<MarkdownBlockElementPlugin>().First();
            Assert.Equal("note", plugin.Name);
        }

        /// <summary>
        /// Tests round-trip conversion for block plugins with parameters.
        /// </summary>
        [Fact]
        public void RoundTripBlockPluginWithParams()
        {
            // arrange
            var markdown = "{{% alert type=\"warning\" %}}\nBe careful!\n{{% /alert %}}";

            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            Assert.Contains("{{% alert", result);
            Assert.Contains("type=\"warning\"", result);
            Assert.Contains("{{% /alert %}}", result);
            var doc2 = MarkdownParser.Parse(result);
            var plugin = doc2.Elements.OfType<MarkdownBlockElementPlugin>().First();
            Assert.Equal("alert", plugin.Name);
            Assert.Equal("warning", plugin.Parameters["type"]);
        }

        /// <summary>
        /// Tests that ConvertToMarkdown on a null document returns empty string.
        /// </summary>
        [Fact]
        public void NullDocumentReturnsEmpty()
        {
            // act
            var result = MarkdownRendererMarkdown.ConvertToMarkdown(null);

            // validation
            Assert.Equal(string.Empty, result);
        }

        /// <summary>
        /// Tests that ConvertToMarkdown on an empty document returns empty string.
        /// </summary>
        [Fact]
        public void EmptyDocumentReturnsEmpty()
        {
            // arrange
            var doc = new MarkdownDocument();

            // act
            var result = doc.ConvertToMarkdown();

            // validation
            Assert.Equal(string.Empty, result);
        }

        /// <summary>
        /// Tests round-trip for checkboxes.
        /// </summary>
        [Theory]
        [InlineData("[X]", true)]
        [InlineData("[ ]", false)]
        public void RoundTripCheckbox(string markdown, bool expectedChecked)
        {
            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            var doc2 = MarkdownParser.Parse(result);
            var paragraph = doc2.Elements.OfType<MarkdownBlockElementParagraph>().First();
            var checkbox = paragraph.Content.OfType<MarkdownInlineElementCheckbox>().First();
            Assert.Equal(expectedChecked, checkbox.Value == "true");
        }

        /// <summary>
        /// Tests round-trip for footnotes.
        /// </summary>
        [Fact]
        public void RoundTripFootnote()
        {
            // arrange
            var markdown = "Text[^1]";

            // act
            var doc = MarkdownParser.Parse(markdown);
            var result = doc.ConvertToMarkdown();

            // validation
            Assert.Contains("[^1]", result);
        }
    }
}
