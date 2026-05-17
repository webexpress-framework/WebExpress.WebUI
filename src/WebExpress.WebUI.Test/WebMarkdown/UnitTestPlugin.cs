using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebMarkdown.Element;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Unit tests for inline and block plugin parsing in Markdown.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestPlugin
    {
        /// <summary>
        /// Tests whether the tokenizer correctly recognizes inline plugin syntax.
        /// </summary>
        [Theory]
        [InlineData("{{my_plugin}}", "my_plugin", "")]
        [InlineData("{{alert}}", "alert", "")]
        [InlineData("{{video src=\"test.mp4\"}}", "video", "src=\"test.mp4\"")]
        [InlineData("{{chart type=\"bar\" data=\"values\"}}", "chart", "type=\"bar\" data=\"values\"")]
        public void TokenizeInlinePlugin(string input, string expectedName, string expectedParams)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            var pluginToken = tokens.First(t => t.Type == MarkdownTokenType.InlinePlugin);
            Assert.NotNull(pluginToken);
            Assert.Equal(expectedName, pluginToken.Value);
            Assert.Equal(expectedParams, pluginToken.Parameter ?? "");
        }

        /// <summary>
        /// Tests whether the tokenizer correctly recognizes block plugin opening tags.
        /// </summary>
        [Theory]
        [InlineData("{{% note %}}", "note", "")]
        [InlineData("{{% alert type=\"warning\" %}}", "alert", "type=\"warning\"")]
        public void TokenizePluginBlock(string input, string expectedName, string expectedParams)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            var pluginToken = tokens.First(t => t.Type == MarkdownTokenType.PluginBlock);
            Assert.NotNull(pluginToken);
            Assert.Equal(expectedName, pluginToken.Value);
            Assert.Equal(expectedParams, pluginToken.Parameter ?? "");
        }

        /// <summary>
        /// Tests whether the tokenizer correctly recognizes block plugin closing tags.
        /// </summary>
        [Theory]
        [InlineData("{{% /note %}}", "note")]
        [InlineData("{{% /alert %}}", "alert")]
        public void TokenizePluginBlockEnd(string input, string expectedName)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            var pluginToken = tokens.First(t => t.Type == MarkdownTokenType.PluginBlockEnd);
            Assert.NotNull(pluginToken);
            Assert.Equal(expectedName, pluginToken.Value);
        }

        /// <summary>
        /// Tests whether the parser correctly parses an inline plugin.
        /// </summary>
        [Theory]
        [InlineData("{{my_plugin}}", "my_plugin", 0)]
        [InlineData("{{chart type=\"bar\"}}", "chart", 1)]
        [InlineData("{{video src=\"test.mp4\" width=\"640\"}}", "video", 2)]
        public void ParseInlinePlugin(string input, string expectedName, int expectedParamCount)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var paragraph = doc.Elements.OfType<MarkdownBlockElementParagraph>().FirstOrDefault();
            Assert.NotNull(paragraph);

            var plugin = paragraph.Content.OfType<MarkdownInlineElementPlugin>().FirstOrDefault();
            Assert.NotNull(plugin);
            Assert.Equal(expectedName, plugin.Name);
            Assert.Equal(expectedParamCount, plugin.Parameters.Count);
        }

        /// <summary>
        /// Tests whether the parser correctly extracts inline plugin parameter values.
        /// </summary>
        [Fact]
        public void ParseInlinePluginParameters()
        {
            // act
            var doc = MarkdownParser.Parse("{{video src=\"test.mp4\" width=\"640\"}}");

            // validation
            var paragraph = doc.Elements.OfType<MarkdownBlockElementParagraph>().FirstOrDefault();
            Assert.NotNull(paragraph);

            var plugin = paragraph.Content.OfType<MarkdownInlineElementPlugin>().FirstOrDefault();
            Assert.NotNull(plugin);
            Assert.Equal("video", plugin.Name);
            Assert.Equal("test.mp4", plugin.Parameters["src"]);
            Assert.Equal("640", plugin.Parameters["width"]);
        }

        /// <summary>
        /// Tests whether the parser correctly parses an inline plugin mixed with text.
        /// </summary>
        [Fact]
        public void ParseInlinePluginWithText()
        {
            // act
            var doc = MarkdownParser.Parse("Before {{my_plugin}} after");

            // validation
            var paragraph = doc.Elements.OfType<MarkdownBlockElementParagraph>().FirstOrDefault();
            Assert.NotNull(paragraph);

            var elements = paragraph.Content.ToList();
            Assert.True(elements.Count >= 3);

            Assert.IsType<MarkdownInlineElementPlainText>(elements[0]);
            Assert.Contains("Before", ((MarkdownInlineElementPlainText)elements[0]).Text);

            var plugin = elements.OfType<MarkdownInlineElementPlugin>().FirstOrDefault();
            Assert.NotNull(plugin);
            Assert.Equal("my_plugin", plugin.Name);
        }

        /// <summary>
        /// Tests whether the parser correctly parses a block plugin.
        /// </summary>
        [Theory]
        [InlineData("{{% note %}}\nThis is a note.\n{{% /note %}}", "note", 0)]
        [InlineData("{{% alert type=\"warning\" %}}\nBe careful!\n{{% /alert %}}", "alert", 1)]
        public void ParseBlockPlugin(string input, string expectedName, int expectedParamCount)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var plugin = doc.Elements.OfType<MarkdownBlockElementPlugin>().FirstOrDefault();
            Assert.NotNull(plugin);
            Assert.Equal(expectedName, plugin.Name);
            Assert.Equal(expectedParamCount, plugin.Parameters.Count);
            Assert.NotEmpty(plugin.Content);
        }

        /// <summary>
        /// Tests whether the parser correctly extracts block plugin content.
        /// </summary>
        [Fact]
        public void ParseBlockPluginContent()
        {
            // arrange
            var input = "{{% note %}}\nThis is important content.\n{{% /note %}}";

            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var plugin = doc.Elements.OfType<MarkdownBlockElementPlugin>().FirstOrDefault();
            Assert.NotNull(plugin);
            Assert.Equal("note", plugin.Name);
            Assert.Contains("important content", plugin.PlainText);
        }

        /// <summary>
        /// Tests whether the parser correctly extracts block plugin parameters.
        /// </summary>
        [Fact]
        public void ParseBlockPluginParameters()
        {
            // arrange
            var input = "{{% alert type=\"danger\" title=\"Error\" %}}\nSomething failed.\n{{% /alert %}}";

            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var plugin = doc.Elements.OfType<MarkdownBlockElementPlugin>().FirstOrDefault();
            Assert.NotNull(plugin);
            Assert.Equal("alert", plugin.Name);
            Assert.Equal("danger", plugin.Parameters["type"]);
            Assert.Equal("Error", plugin.Parameters["title"]);
        }

        /// <summary>
        /// Tests that the parser correctly handles a block plugin with nested markdown.
        /// </summary>
        [Fact]
        public void ParseBlockPluginWithNestedMarkdown()
        {
            // arrange
            var input = "{{% note %}}\n**Bold text** and *italic text*.\n{{% /note %}}";

            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var plugin = doc.Elements.OfType<MarkdownBlockElementPlugin>().FirstOrDefault();
            Assert.NotNull(plugin);
            Assert.Equal("note", plugin.Name);
            Assert.Contains("Bold text", plugin.PlainText);
            Assert.Contains("italic text", plugin.PlainText);
        }

        /// <summary>
        /// Tests that the inline plugin PlainText round-trips correctly.
        /// </summary>
        [Fact]
        public void InlinePluginPlainTextRoundTrip()
        {
            // arrange
            var plugin = new MarkdownInlineElementPlugin("video", new Dictionary<string, string>
            {
                { "src", "test.mp4" },
                { "width", "640" }
            });

            // act
            var plainText = plugin.PlainText;

            // validation
            Assert.Contains("{{video", plainText);
            Assert.Contains("src=\"test.mp4\"", plainText);
            Assert.Contains("width=\"640\"", plainText);
            Assert.Contains("}}", plainText);
        }

        /// <summary>
        /// Tests that text containing curly braces that don't match plugin syntax is treated as plain text.
        /// </summary>
        [Theory]
        [InlineData("{just text}", "{just text}")]
        [InlineData("{{123invalid}}", "{{123invalid}}")]
        public void NonPluginBracesAsText(string input, string expectedText)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var paragraph = doc.Elements.OfType<MarkdownBlockElementParagraph>().FirstOrDefault();
            Assert.NotNull(paragraph);
            Assert.DoesNotContain(paragraph.Content, e => e is MarkdownInlineElementPlugin);
            Assert.Contains(expectedText, paragraph.PlainText);
        }
    }
}
