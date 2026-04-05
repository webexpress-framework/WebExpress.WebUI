using System.Globalization;
using WebExpress.WebUI.WebMarkdown;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Contains unit tests for the MarkdownTokenizer class. 
    /// Tests cover detection and tokenization of various Markdown constructs such as code markers, special characters, text runs, and line endings.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestMarkdownTokenizer
    {
        /// <summary>
        /// Tests that the tokenizer correctly identifies and tokenizes simple text without markdown special characters.
        /// </summary>
        [Theory]
        [InlineData("plain", MarkdownTokenType.Text, MarkdownTokenType.EOF)]
        [InlineData("hello world", MarkdownTokenType.Text, MarkdownTokenType.Space, MarkdownTokenType.Text, MarkdownTokenType.EOF)]
        public void SimpleText(string input, params MarkdownTokenType[] expectedType)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // act
            Assert.Equal(expectedType.Length, tokens.Count);
            Assert.Equal(expectedType, tokens.Select(t => t.Type)); // Verify types match
        }

        /// <summary>
        /// Tests the tokenizer for handling special characters in Markdown.
        /// Ensures that special characters are either ignored or processed correctly without errors.
        /// </summary>
        [Theory]
        [InlineData("!", "!")] // Single exclamation mark
        [InlineData("[text]", "[text]")] // Square brackets with content
        [InlineData("10 < 20", "10 < 20")] // Less-than sign
        [InlineData("20 > 10", "20 > 10")] // Greater-than sign
        [InlineData("This is [text] and 10 < 20!", "This is [text] and 10 < 20!")] // Mixed content
        public void SpecialCharacters(string input, string expectedValue)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize();

            // validation
            var combine = string.Join("", tokens.Select(x => x.Value));
            Assert.Equal(expectedValue, combine);
        }

        /// <summary>
        /// Tests that the tokenizer correctly detects and tokenizes code block markers (three backticks).
        /// </summary>
        [Fact]
        public void CodeBlockMarker()
        {
            // arrange
            var tokenizer = new MarkdownTokenizer("```");

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(2, tokens.Count); // CodeMarker + EOF
            Assert.Equal(MarkdownTokenType.CodeMarker, tokens[0].Type);
            Assert.Equal("```", tokens[0].Value);
            Assert.Equal(3, tokens[0].Count);
            Assert.Equal(MarkdownTokenType.EOF, tokens[1].Type);
        }

        /// <summary>
        /// Tests that the tokenizer correctly identifies and tokenizes multiple special markdown characters and their counts.
        /// </summary>
        [Theory]
        [InlineData("**", MarkdownTokenType.DoubleStar, "**", 2)]
        [InlineData("***", MarkdownTokenType.TripleStar, "***", 3)]
        [InlineData("****", MarkdownTokenType.MultiStar, "****", 4)]
        [InlineData("__", MarkdownTokenType.DoubleUnderscore, "__", 2)]
        [InlineData("___", MarkdownTokenType.TripleUnderscore, "___", 3)]
        [InlineData("____", MarkdownTokenType.MultiUnderscore, "____", 4)]
        [InlineData("###", MarkdownTokenType.Hash, "###", 3)]
        [InlineData("~~", MarkdownTokenType.DoubleTilde, "~~", 2)]
        [InlineData("~~~", MarkdownTokenType.TripleTilde, "~~~", 3)]
        [InlineData("~~~~", MarkdownTokenType.MultiTilde, "~~~~", 4)]
        [InlineData("-", MarkdownTokenType.Hyphen, "-", 1)]
        [InlineData("--", MarkdownTokenType.DoubleHyphen, "--", 2)]
        [InlineData("---", MarkdownTokenType.TripleHyphen, "---", 3)]
        [InlineData("----", MarkdownTokenType.MultiHyphen, "----", 4)]
        public void MultiCharSpecials(string input, MarkdownTokenType expectedType, string expectedValue, int expectedCount)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(2, tokens.Count); // Special + EOF
            Assert.Equal(expectedType, tokens[0].Type);
            Assert.Equal(expectedValue, tokens[0].Value);
            Assert.Equal(expectedCount, tokens[0].Count);
            Assert.Equal(MarkdownTokenType.EOF, tokens[1].Type);
        }

        /// <summary>
        /// Tests that the tokenizer correctly identifies and tokenizes single character Markdown specials.
        /// </summary>
        [Theory]
        [InlineData("|", MarkdownTokenType.Pipe)]
        [InlineData(">", MarkdownTokenType.Greater)]
        [InlineData("`", MarkdownTokenType.Backtick)]
        [InlineData("*", MarkdownTokenType.Star)]
        [InlineData("_", MarkdownTokenType.Underscore)]
        [InlineData("~", MarkdownTokenType.Tilde)]
        public void SingleSpecials(string input, MarkdownTokenType expectedType)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(2, tokens.Count); // Special + EOF
            Assert.Equal(expectedType, tokens[0].Type);
            Assert.Equal(input, tokens[0].Value);
            Assert.Equal(MarkdownTokenType.EOF, tokens[1].Type);
        }

        /// <summary>
        /// Tests that the tokenizer correctly processes newline characters (\n, \r, and \r\n).
        /// </summary>
        [Theory]
        [InlineData("\n", "")]
        [InlineData("\r", "")]
        [InlineData("\r\n", "")]
        public void Newlines(string input, string expectedValue)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(2, tokens.Count); // EOL + EOF
            Assert.Equal(MarkdownTokenType.EOL, tokens[0].Type);
            Assert.Equal(expectedValue, tokens[0].Value);
            Assert.Equal(MarkdownTokenType.EOF, tokens[1].Type);
        }

        /// <summary>
        /// Tests that the tokenizer correctly processes a mixed Markdown string with text, special characters, and code markers.
        /// </summary>
        [Theory]
        [InlineData("# Heading\nText *italic* and **bold**\n```code block```", MarkdownTokenType.Hash, "#")]
        [InlineData("## Title\nParagraph with _emphasis_ and `inline code`\n```block```", MarkdownTokenType.Hash, "##")]
        [InlineData("Normal text\n- List item\n* Bullet\n```block```", MarkdownTokenType.Text, "Normal")]
        [InlineData("> Blockquote\nText\n```block```", MarkdownTokenType.Greater, ">")]
        [InlineData("Token1|Token2", MarkdownTokenType.Text, "Token1")]
        public void ComplexMarkdownString(string input, MarkdownTokenType firstExpectedType, string firstExpectedValue)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(firstExpectedType, tokens[0].Type);
            Assert.Equal(firstExpectedValue, tokens[0].Value);
            Assert.Equal(MarkdownTokenType.EOF, tokens.Last().Type);
        }

        /// <summary>
        /// Tests that the tokenizer collects text until a special markdown character is encountered.
        /// </summary>
        [Fact]
        public void TextUntilSpecialChar()
        {
            // arrange
            var tokenizer = new MarkdownTokenizer("foo*bar");

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(MarkdownTokenType.Text, tokens[0].Type);
            Assert.Equal("foo", tokens[0].Value);
            Assert.Equal(MarkdownTokenType.Star, tokens[1].Type);
            Assert.Equal("*", tokens[1].Value);
            Assert.Equal(MarkdownTokenType.Text, tokens[2].Type);
            Assert.Equal("bar", tokens[2].Value);
            Assert.Equal(MarkdownTokenType.EOF, tokens[3].Type);
        }

        /// <summary>
        /// Tests that the tokenizer throws ArgumentNullException if initialized with null input.
        /// </summary>
        [Fact]
        public void NullInput()
        {
            // act
            var tokenizer = new MarkdownTokenizer(null);

            // validation
            var tokens = tokenizer.Tokenize();
            Assert.Single(tokens);
            Assert.Equal(MarkdownTokenType.EOF, tokens.FirstOrDefault().Type);
        }

        /// <summary>
        /// Tests edge cases for multi-character tokens, including long runs of stars, underscores, tildes, and hyphens.
        /// </summary>
        [Theory]
        [InlineData("*****", MarkdownTokenType.MultiStar, "*****", 5)]
        [InlineData("______", MarkdownTokenType.MultiUnderscore, "______", 6)]
        [InlineData("~~~~~~", MarkdownTokenType.MultiTilde, "~~~~~~", 6)]
        [InlineData("-------", MarkdownTokenType.MultiHyphen, "-------", 7)]
        public void LongMultiCharTokens(string input, MarkdownTokenType expectedType, string expectedValue, int expectedCount)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(2, tokens.Count); // MultiToken + EOF
            Assert.Equal(expectedType, tokens[0].Type);
            Assert.Equal(expectedValue, tokens[0].Value);
            Assert.Equal(expectedCount, tokens[0].Count);
            Assert.Equal(MarkdownTokenType.EOF, tokens[1].Type);
        }

        /// <summary>
        /// Tests that tokenizer does not combine different special characters into a single token.
        /// </summary>
        [Fact]
        public void Split()
        {
            // arrange
            var tokenizer = new MarkdownTokenizer("***___");

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(MarkdownTokenType.TripleStar, tokens[0].Type);
            Assert.Equal("***", tokens[0].Value);
            Assert.Equal(MarkdownTokenType.TripleUnderscore, tokens[1].Type);
            Assert.Equal("___", tokens[1].Value);
            Assert.Equal(MarkdownTokenType.EOF, tokens[2].Type);
        }

        /// <summary>
        /// Tests that the tokenizer correctly identifies and tokenizes spaces.
        /// </summary>
        [Theory]
        [InlineData(" ", MarkdownTokenType.Space, " ")]
        public void Spaces(string input, MarkdownTokenType expectedType, string expectedValue)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(input.Length + 1, tokens.Count); // Number of spaces + EOF
            for (int i = 0; i < input.Length; i++)
            {
                Assert.Equal(expectedType, tokens[i].Type);
                Assert.Equal(expectedValue, tokens[i].Value);
            }
            Assert.Equal(MarkdownTokenType.EOF, tokens.Last().Type);
        }

        /// <summary>
        /// Tests that the tokenizer correctly identifies and tokenizes single emojis.
        /// </summary>
        [Theory]
        [InlineData("😊", MarkdownTokenType.Emoji, "😊")]
        [InlineData("🚀", MarkdownTokenType.Emoji, "🚀")]
        [InlineData("🎉", MarkdownTokenType.Emoji, "🎉")]
        public void Emojis(string input, MarkdownTokenType expectedType, string expectedValue)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(2, tokens.Count); // Emoji + EOF
            Assert.Equal(expectedType, tokens[0].Type);
            Assert.Equal(expectedValue, tokens[0].Value);
            Assert.Equal(MarkdownTokenType.EOF, tokens[1].Type);
        }

        /// <summary>
        /// Tests that the tokenizer correctly processes text with spaces and emojis.
        /// </summary>
        [Theory]
        [InlineData("Hello 😊 World 🚀", new MarkdownTokenType[] { MarkdownTokenType.Text, MarkdownTokenType.Space, MarkdownTokenType.Emoji, MarkdownTokenType.Space, MarkdownTokenType.Text, MarkdownTokenType.Space, MarkdownTokenType.Emoji },
                    new string[] { "Hello", " ", "😊", " ", "World", " ", "🚀" })]
        [InlineData("😊 🚀 😊", new MarkdownTokenType[] { MarkdownTokenType.Emoji, MarkdownTokenType.Space, MarkdownTokenType.Emoji, MarkdownTokenType.Space, MarkdownTokenType.Emoji },
                    new string[] { "😊", " ", "🚀", " ", "😊" })]
        public void SpacesAndEmojis(string input, MarkdownTokenType[] expectedTypes, string[] expectedValues)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(expectedTypes.Length + 1, tokens.Count); // Expected tokens + EOF
            for (int i = 0; i < expectedTypes.Length; i++)
            {
                Assert.Equal(expectedTypes[i], tokens[i].Type);
                Assert.Equal(expectedValues[i], tokens[i].Value);
            }
            Assert.Equal(MarkdownTokenType.EOF, tokens.Last().Type);
        }

        /// <summary>
        /// Tests that the tokenizer correctly processes multiple emojis in a row.
        /// </summary>
        [Theory]
        [InlineData("😊🚀🎉", MarkdownTokenType.Emoji, MarkdownTokenType.Emoji, MarkdownTokenType.Emoji)]
        public void MultipleEmojis(string input, params MarkdownTokenType[] expectedTypes)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);
            var expectedValues = Enumerable.Range(0, new StringInfo(input).LengthInTextElements)
                               .Select(i => new StringInfo(input).SubstringByTextElements(i, 1))
                               .ToList();

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(expectedTypes.Length + 1, tokens.Count); // Emojis + EOF
            for (int i = 0; i < expectedTypes.Length; i++)
            {
                Assert.Equal(expectedTypes[i], tokens[i].Type);
                Assert.Equal(expectedValues[i], tokens[i].Value);
            }

            Assert.Equal(MarkdownTokenType.EOF, tokens.Last().Type);
        }

        /// <summary>
        /// Tests that URLs are correctly identified and tokenized using MarkdownTokenType.Url.
        /// </summary>
        [Theory]
        [InlineData("https://example.com", "https://example.com", MarkdownTokenType.Url)]
        [InlineData("Visit https://example.com for more info.", "https://example.com", MarkdownTokenType.Url)]
        [InlineData("mailto:user@example.com", "mailto:user@example.com", MarkdownTokenType.Url)]
        [InlineData("Contact us at mailto:user@example.com.", "mailto:user@example.com", MarkdownTokenType.Url)]
        public void Uri(string input, string expectedValue, MarkdownTokenType expectedType)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize();

            // validation
            Assert.Contains(tokens, token =>
                token.Type == expectedType &&
                token.Value == expectedValue
            );
        }

        /// <summary>
        /// Tests that no false positives for URLs occur in text without URLs.
        /// </summary>
        [Fact]
        public void Uri_Invalid()
        {
            // arrange
            var input = "This text does not contain any URLs.";
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize();

            // validation
            Assert.DoesNotContain(tokens, token => token.Type == MarkdownTokenType.Url);
        }

        /// <summary>
        /// Tests the tokenizer for recognizing links in Markdown format.
        /// </summary>
        [Theory]
        [InlineData("[Link](https://example.com)", "Link", "https://example.com", MarkdownTokenType.Link)]
        [InlineData("[GitHub](https://github.com)", "GitHub", "https://github.com", MarkdownTokenType.Link)]
        [InlineData("[ GitHub ]( https://github.com )", "GitHub", "https://github.com", MarkdownTokenType.Link)]
        [InlineData("[](https://example.com)", "", "https://example.com", MarkdownTokenType.Link)] // Optional link text
        public void Links(string input, string expectedLabel, string expectedUri, MarkdownTokenType expectedType)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize();

            // validation
            Assert.Contains
            (
                tokens, token =>
                token.Type == expectedType &&
                token.Value == expectedUri &&
                token.Parameter == expectedLabel
            );
        }

        /// <summary>
        /// Tests the tokenizer for handling invalid or incomplete link syntax in Markdown.
        /// Ensures that no link token is created when the syntax is malformed.
        /// </summary>
        [Theory]
        [InlineData("[Link]https://example.com")] // Missing parentheses
        [InlineData("[Link](https://example.com")] // Missing closing parenthesis
        [InlineData("[Link] (https://example.com)")] // Space between text and parentheses
        [InlineData("[Link]( )")] // Empty URL
        [InlineData("[ ]()")] // Empty text and URL
        [InlineData("[]( )")] // Empty text and URL with space
        public void Links_Invalid(string input)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize();

            // validation
            Assert.DoesNotContain(tokens, token => token.Type == MarkdownTokenType.Link);
        }

        /// <summary>
        /// Tests the tokenizer for recognizing images in Markdown format.
        /// </summary>
        [Theory]
        [InlineData("![Alt](https://img.com/test.png)", "Alt", "https://img.com/test.png", MarkdownTokenType.Image)]
        [InlineData("![Logo](https://company.com/logo.png)", "Logo", "https://company.com/logo.png", MarkdownTokenType.Image)]
        [InlineData("![ Logo ]( https://company.com/logo.png )", "Logo", "https://company.com/logo.png", MarkdownTokenType.Image)]
        [InlineData("![](https://img.com/test.png)", "", "https://img.com/test.png", MarkdownTokenType.Image)] // Optional alt text
        [InlineData("!(https://img.com/test.png)", "", "https://img.com/test.png", MarkdownTokenType.Image)] // Optional alt text
        public void Images(string input, string expectedLabel, string expectedUrl, MarkdownTokenType expectedType)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize();

            // validation
            Assert.Contains
            (
                tokens, token =>
                token.Type == expectedType &&
                token.Value == expectedUrl &&
                token.Parameter == expectedLabel
            );
        }

        /// <summary>
        /// Tests the tokenizer for handling invalid or incomplete image syntax in Markdown.
        /// Ensures that no image token is created when the URL is missing.
        /// </summary>
        [Theory]
        [InlineData("![]")] // Invalid image syntax: missing URL
        [InlineData("![Alt]")] // Invalid image syntax: missing URL
        [InlineData("![Alt]())")] // Invalid image syntax: malformed URL
        public void Images_Invalid(string input)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize();

            // validation
            Assert.DoesNotContain(tokens, token => token.Type == MarkdownTokenType.Image);
        }

        /// <summary>
        /// Tests the MarkdownTokenizer for its ability to recognize and tokenize HTML elements.
        /// The test ensures that valid HTML tags are correctly identified and their content is preserved.
        /// </summary>
        [Theory]
        [InlineData("<div>Example</div>", "<div>Example</div>", MarkdownTokenType.Html)]
        [InlineData("<span>Text</span>", "<span>Text</span>", MarkdownTokenType.Html)]
        [InlineData("<p>This is a paragraph.</p>", "<p>This is a paragraph.</p>", MarkdownTokenType.Html)]
        [InlineData("<a href=\"https://example.com\">Link</a>", "<a href=\"https://example.com\">Link</a>", MarkdownTokenType.Html)]
        public void Html(string input, string expectedValue, MarkdownTokenType expectedType)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize();

            // validation
            Assert.Contains(tokens, token =>
                token.Type == expectedType &&
                token.Value == expectedValue);
        }

        /// <summary>
        /// Tests the MarkdownTokenizer for its ability to recognize and tokenize checkboxes in Markdown format.
        /// </summary>
        [Theory]
        [InlineData("[ ]", false)]
        [InlineData("[x]", true)]
        [InlineData("[X]", true)]
        [InlineData("[  ]", false)]
        [InlineData("[ x ]", true)]
        [InlineData("[ X ]", true)]
        public void Checkbox(string input, bool expected)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize();

            // validation
            Assert.Contains
            (
                tokens, token =>
                token.Type == MarkdownTokenType.Checkbox &&
                token.Value == "true" ? true : false == expected
            );
        }

        /// <summary>
        /// Tests the MarkdownTokenizer to ensure it does not incorrectly recognize invalid checkbox formats.
        /// </summary>
        [Theory]
        [InlineData("[Xx]")]
        [InlineData("[x")]
        public void Checkbox_Invalid(string input)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize();

            // validation
            Assert.DoesNotContain(tokens, token => token.Type == MarkdownTokenType.Checkbox);
        }

        /// <summary>
        /// Tests that the tokenizer correctly identifies and tokenizes spaces, combining four spaces into a single tab token.
        /// </summary>
        [Theory]
        [InlineData("  ", MarkdownTokenType.Tab, "\t")]
        [InlineData("        ", MarkdownTokenType.Tab, "\t\t\t\t")]
        public void SpacesToTabs(string input, MarkdownTokenType expected, string expectedValue)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(expectedValue.Length + 1, tokens.Count); // Number of tabs/spaces + EOF
            for (int i = 0; i < expectedValue.Length; i++)
            {
                Assert.Equal(expected, tokens[i].Type);
                Assert.Equal(expectedValue[i].ToString(), tokens[i].Value.ToString());
            }
            Assert.Equal(MarkdownTokenType.EOF, tokens.Last().Type);
        }

        /// <summary>
        /// Tests that the tokenizer correctly identifies and tokenizes spaces, ensuring invalid cases 
        /// like less than four spaces remain as individual space tokens.
        /// </summary>
        [Theory]
        [InlineData("   ")] // Less than four spaces remain as spaces
        public void SpacesToTabs_Invalid(string input)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);

            // act
            var tokens = tokenizer.Tokenize().ToList();

            // validation
            Assert.Equal(MarkdownTokenType.Tab, tokens[0].Type);
            Assert.Equal(MarkdownTokenType.Space, tokens[1].Type);
            Assert.Equal(MarkdownTokenType.EOF, tokens.Last().Type);
        }
    }
}