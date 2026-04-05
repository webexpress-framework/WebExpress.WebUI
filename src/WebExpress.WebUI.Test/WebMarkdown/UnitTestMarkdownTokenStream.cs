using WebExpress.WebUI.WebMarkdown;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Contains unit tests for the MarkdownTokenStream class to verify correct stream behavior for peeking, consuming, skipping,
    /// and resetting token positions, as well as end-of-stream detection. Uses xUnit for test structure and assertions.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestMarkdownTokenStream
    {
        /// <summary>
        /// Tests that Peek returns true if the current token matches the expected type, otherwise false.
        /// </summary>
        [Theory]
        [InlineData(MarkdownTokenType.Text, "foo", MarkdownTokenType.Text, true)]
        [InlineData(MarkdownTokenType.Hash, "#", MarkdownTokenType.Hash, true)]
        [InlineData(MarkdownTokenType.Text, "foo", MarkdownTokenType.Hash, false)]
        public void Peek_WithTokenType(
            MarkdownTokenType firstType, string firstValue, MarkdownTokenType queryType, bool expected)
        {
            // arrange
            var tokens = CreateTokens((firstType, firstValue, 0));
            var stream = new MarkdownTokenStream(tokens, "foo#foo");

            // act
            var peek = stream.Peek(queryType);

            // validation
            Assert.Equal(expected, peek is not null);
        }

        /// <summary>
        /// Tests that Peek returns true if the current token matches any of the expected types.
        /// </summary>
        [Fact]
        public void Peek_ReturnsTrueForMatchingTokenType()
        {
            // arrange
            var firstType = MarkdownTokenType.Text;
            var firstValue = "foo";
            var queryTypes = new MarkdownTokenType[] { MarkdownTokenType.Text, MarkdownTokenType.Hash };
            var tokens = CreateTokens((firstType, firstValue, 0));
            var stream = new MarkdownTokenStream(tokens, "foo");

            // act
            var peek = stream.Peek(queryTypes);

            // validation
            Assert.True(peek is not null);
        }

        /// <summary>
        /// Tests that Peek returns false if the current token does not match any of the expected types.
        /// </summary>
        [Fact]
        public void Peek_ReturnsFalseForNonMatchingTokenType()
        {
            // arrange
            var firstType = MarkdownTokenType.Text;
            var firstValue = "foo";
            var queryTypes = new MarkdownTokenType[] { MarkdownTokenType.Hash };
            var tokens = CreateTokens((firstType, firstValue, 0));
            var stream = new MarkdownTokenStream(tokens, "foo");

            // act
            var peek = stream.Peek(queryTypes);

            // validation
            Assert.False(peek is not null);
        }

        /// <summary>
        /// Tests that Peek returns null if the stream is at the end.
        /// </summary>
        [Fact]
        public void Peek_AtEnd()
        {
            // arrange
            var tokens = CreateTokens();
            var stream = new MarkdownTokenStream(tokens, "");
            stream.Skip();

            // act
            var peek = stream.Peek();

            // validation
            Assert.Null(peek);
        }

        /// <summary>
        /// Tests that PeekNext returns true if the next token matches the expected type, otherwise false.
        /// </summary>
        [Theory]
        [InlineData(MarkdownTokenType.Text, "foo", MarkdownTokenType.EOL, "", MarkdownTokenType.EOL, true)]
        [InlineData(MarkdownTokenType.Hash, "#", MarkdownTokenType.Text, "Heading", MarkdownTokenType.Hash, false)]
        [InlineData(MarkdownTokenType.Text, "foo", MarkdownTokenType.EOF, "", MarkdownTokenType.EOL, false)]
        public void PeekNext_WithTokenType(
            MarkdownTokenType firstType, string firstValue,
            MarkdownTokenType secondType, string secondValue,
            MarkdownTokenType queryType, bool expected)
        {
            // arrange
            var tokens = CreateTokens((firstType, firstValue, 0), (secondType, secondValue, 1));
            var stream = new MarkdownTokenStream(tokens, "");

            // act
            var peekNext = stream.PeekNext(queryType);

            // validation
            Assert.Equal(expected, peekNext is not null);
        }

        /// <summary>
        /// Tests that PeekNext returns null if there is no next token.
        /// </summary>
        [Fact]
        public void PeekNext_NoNextToken()
        {
            // arrange
            var tokens = CreateTokens();
            var stream = new MarkdownTokenStream(tokens, "");

            // act
            var peekNext = stream.PeekNext();

            // validation
            Assert.Null(peekNext);
        }

        /// <summary>
        /// Tests that Consume(tokenType) consumes and returns the token only if it matches the given type.
        /// </summary>
        [Theory]
        [InlineData(MarkdownTokenType.Hash, "#", MarkdownTokenType.Hash, true)]
        [InlineData(MarkdownTokenType.Text, "foo", MarkdownTokenType.Hash, false)]
        public void Consume_IfMatches(
            MarkdownTokenType firstType, string firstValue, MarkdownTokenType queryType, bool expectNotNull)
        {
            // arrange
            var tokens = CreateTokens((firstType, firstValue, 0));
            var stream = new MarkdownTokenStream(tokens, "");

            // act
            var result = stream.Consume(queryType);

            // validation
            if (expectNotNull)
            {
                Assert.NotNull(result);
            }
            else
            {
                Assert.Null(result);
            }
        }

        /// <summary>
        /// Tests that Peek returns the current token without advancing the stream position.
        /// </summary>
        [Fact]
        public void Peek_WithoutAdvancing()
        {
            // arrange
            var tokens = CreateTokens((MarkdownTokenType.Text, "foo", 0), (MarkdownTokenType.EOL, "", 1), (MarkdownTokenType.EOF, "", 2));
            var stream = new MarkdownTokenStream(tokens, "foo");

            // act
            var peek1 = stream.Peek();
            var peek2 = stream.Peek();

            // validation
            Assert.NotNull(peek1);
            Assert.Equal(MarkdownTokenType.Text, peek1.Type);
            Assert.Equal(peek1, peek2);
            Assert.Equal(0, stream.Position);
        }

        /// <summary>
        /// Tests that Consume returns the current token and advances the stream position.
        /// </summary>
        [Fact]
        public void Consume()
        {
            // arrange
            var tokens = CreateTokens((MarkdownTokenType.Text, "foo", 0), (MarkdownTokenType.EOL, "", 1), (MarkdownTokenType.EOF, "", 2));
            var stream = new MarkdownTokenStream(tokens, "foo");

            // act
            var token = stream.Consume();

            // validation
            Assert.Equal(MarkdownTokenType.Text, token.Type);
            Assert.Equal(1, stream.Position);
        }

        /// <summary>
        /// Tests that Consume returns null at the end of the stream.
        /// </summary>
        [Fact]
        public void Consume_AtEnd()
        {
            // arrange
            var tokens = CreateTokens();
            var stream = new MarkdownTokenStream(tokens, "");

            // act
            var consume = stream.Consume();

            // validation
            Assert.Equal(MarkdownTokenType.EOF, consume?.Type);
        }

        /// <summary>
        /// Test suite for the ConsumeWhileValid method of MarkdownTokenStream.
        /// Validates correct token consumption behavior with different valid tokens and token streams,
        /// including the case where no valid token is present and the end of the stream is reached.
        /// </summary>
        [Theory]
        [InlineData("", 1)]
        [InlineData("<<<\n<<\n\n<<<<", 4)]
        [InlineData("###**##\n##**##", 2)]
        [InlineData("< < < < <#", 1)]
        public void ConsumeLine(string input, int expectedCount)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(input);
            var inputTokens = tokenizer.Tokenize();
            var stream = new MarkdownTokenStream(inputTokens, input);
            var count = 0;

            // act
            do
            {
                stream.ConsumeLine();
                count++;
            } while (!stream.IsAtEnd());

            // validation
            Assert.Equal(count, expectedCount);
        }

        /// <summary>
        /// Tests that Skip advances the position by one without returning a token.
        /// </summary>
        [Fact]
        public void Skip()
        {
            // arrange
            var tokens = CreateTokens
            (
                (MarkdownTokenType.Text, "foo", 0),
                (MarkdownTokenType.EOL, "", 1),
                (MarkdownTokenType.EOF, "", 2)
            );
            var stream = new MarkdownTokenStream(tokens, "foo");

            // act
            stream.Skip();

            // validation
            Assert.Equal(1, stream.Position);
            var token = stream.Peek();
            Assert.Equal(MarkdownTokenType.EOL, token.Type);
        }

        /// <summary>
        /// Tests that Skip advances the position by one without returning a token.
        /// </summary>
        [Theory]
        [InlineData("foo *", MarkdownTokenType.Text, 1, MarkdownTokenType.Space)]
        [InlineData("foo *", MarkdownTokenType.Star, 0, MarkdownTokenType.Text)]
        [InlineData("||||", MarkdownTokenType.Pipe, 4, MarkdownTokenType.EOF)]
        [InlineData("||||*", MarkdownTokenType.Pipe, 4, MarkdownTokenType.Star)]
        public void Skip_While(string input, MarkdownTokenType skipTokenType, int expectedPosition, MarkdownTokenType expectedTokenType)
        {
            // arrange
            var tokens = new MarkdownTokenizer(input).Tokenize();
            var stream = new MarkdownTokenStream(tokens, input);

            // act
            stream.Skip(skipTokenType);

            // validation
            Assert.Equal(expectedPosition, stream.Position);
            var token = stream.Peek();
            Assert.Equal(expectedTokenType, token.Type);
        }

        /// <summary>
        /// Tests that Skip advances the position by the specified count without returning a token.
        /// Ensures that the position is correctly updated and the next token is as expected.
        /// </summary>
        [Theory]
        [InlineData(1, 1, MarkdownTokenType.EOL)]
        [InlineData(2, 2, MarkdownTokenType.EOF)]
        [InlineData(5, 3, null)]
        public void SkipCount(int count, int expectedPosition, MarkdownTokenType? expectedNextTokenType)
        {
            // arrange
            var tokens = CreateTokens(
                (MarkdownTokenType.Text, "foo", 0),
                (MarkdownTokenType.EOL, "", 1),
                (MarkdownTokenType.EOF, "", 2)
            );
            var stream = new MarkdownTokenStream(tokens, "foo");

            // act
            stream.Skip(count);

            // validation
            Assert.Equal(expectedPosition, stream.Position);
            var token = stream.Peek();
            if (expectedNextTokenType is null)
            {
                Assert.Null(token); // Expect null if the position is beyond the end of the stream
            }
            else
            {
                Assert.NotNull(token);
                Assert.Equal(expectedNextTokenType, token.Type);
            }
        }

        /// <summary>
        /// Tests that Skip does nothing if already at the end of the stream.
        /// </summary>
        [Fact]
        public void Skip_AtEnd()
        {
            // arrange
            var tokens = CreateTokens();
            var stream = new MarkdownTokenStream(tokens, "");

            // act
            stream.Skip();

            // validation
            Assert.Equal(1, stream.Position);
        }

        /// <summary>
        /// Tests that IsAtEnd returns true at or after the end of the stream.
        /// </summary>
        [Fact]
        public void IsAtEnd()
        {
            // arrange
            var tokens = CreateTokens((MarkdownTokenType.Text, "foo", 0), (MarkdownTokenType.EOF, "", 1));
            var stream = new MarkdownTokenStream(tokens, "foo");

            // act
            var isAtEnd1 = stream.IsAtEnd();
            stream.Consume(); // consume "foo"
            var isAtEnd2 = stream.IsAtEnd();

            // validation
            Assert.False(isAtEnd1);
            Assert.True(isAtEnd2);
        }

        /// <summary>
        /// Tests that Seek correctly sets the position and allows access to the expected token.
        /// Uses inline test data to check multiple token positions, types, and texts.
        /// </summary>
        [Theory]
        [InlineData(0, MarkdownTokenType.Text, "Hello")]
        [InlineData(1, MarkdownTokenType.EOL, "")]
        [InlineData(2, MarkdownTokenType.Text, "World")]
        [InlineData(3, MarkdownTokenType.EOF, "")]
        public void Seek(int position, MarkdownTokenType expectedType, string expectedText)
        {
            // arrange
            var tokens = new MarkdownTokenizer("Hello\nWorld").Tokenize();
            var stream = new MarkdownTokenStream(tokens, "Hello\nWorld");

            // act
            var success = stream.Seek(position);
            var token = stream.Peek();

            // validation
            Assert.True(success);
            Assert.NotNull(token);
            Assert.Equal(expectedType, token.Type);
            Assert.Equal(expectedText, token.Value);
        }

        /// <summary>
        /// Tests that Seek fails when called with invalid positions (e.g. negative or beyond token count).
        /// </summary>
        [Theory]
        [InlineData(-1)]
        [InlineData(100)]
        public void Seek_Invalid(int invalidPos)
        {
            // arrange
            var tokens = new MarkdownTokenizer("Hello\nWorld").Tokenize();
            var stream = new MarkdownTokenStream(tokens, "Hello\nWorld");

            // act
            var result = stream.Seek(invalidPos);

            // validation
            Assert.False(result);
        }

        /// <summary>
        /// Tests the Split method with various stop token configurations.
        /// Ensures the method correctly divides the token stream into segments based on the specified stop tokens.
        /// </summary>
        /// <param name="stopTokens">The stop tokens to split the stream on.</param>
        /// <param name="expectedSegments">The expected number of resulting segments.</param>
        [Theory]
        [InlineData("", 1, MarkdownTokenType.Space)] // Empty input
        [InlineData("Token1 Token2 Token3", 3, MarkdownTokenType.Space)] // Splitting by spaces
        [InlineData("Token1|Token2|Token3", 3, MarkdownTokenType.Pipe)] // Splitting by pipes
        [InlineData("Token1 Token2|Token3", 3, MarkdownTokenType.Space, MarkdownTokenType.Pipe)] // Splitting by spaces and pipes
        [InlineData("Token1Token2Token3", 1, MarkdownTokenType.Space)] // No delimiters
        [InlineData("Token1 Token2 ", 3, MarkdownTokenType.Space)] // Trailing space
        [InlineData("Token1\nToken2\nToken3", 3, MarkdownTokenType.EOL)] // Splitting by EOL
        [InlineData("\n\n\n", 4, MarkdownTokenType.EOL)] // Only EOL tokens
        [InlineData("Token1 Token2 Token3", 1, MarkdownTokenType.EOF)] // Splitting by EOF, EOF is always at end
        [InlineData("Token1|Token2 Token3|Token4", 4, MarkdownTokenType.Space, MarkdownTokenType.Pipe)] // Multiple delimiters
        [InlineData("Token1", 1, MarkdownTokenType.Space)] // Single token input
        [InlineData("", 1, MarkdownTokenType.Pipe)] // Empty input with pipe delimiter
        public void Split(string input, int expectedSegments, params MarkdownTokenType[] stopTokens)
        {
            // arrange
            var tokens = new MarkdownTokenizer(input).Tokenize();
            var tokenStream = new MarkdownTokenStream(tokens, input);

            // act
            var result = tokenStream.Split(stopTokens);

            // validation
            Assert.NotNull(result);
            Assert.Equal(expectedSegments, result.Count); // Verify the expected number of segments

            // ensure each segment contains tokens and is not empty
            foreach (var segment in result)
            {
                Assert.NotEmpty(segment.Tokens);
            }
        }

        /// <summary>
        /// Tests that the Reverse method returns a stream with tokens in reverse order.
        /// </summary>
        [Fact]
        public void Reverse()
        {
            // arrange
            var tokens = new List<MarkdownToken>
            {
                new(MarkdownTokenType.Text, "Token1", 0),
                new(MarkdownTokenType.Text, "Token2", 1),
                new(MarkdownTokenType.Text, "Token3",2 )
            };
            var source = "TestSource";
            var tokenStream = new MarkdownTokenStream(tokens, source);

            // act
            var reversedStream = tokenStream.Reverse();

            // validation
            Assert.Equal("Token3", reversedStream.Tokens.FirstOrDefault().Value);
            Assert.Equal("Token2", reversedStream.Tokens.Skip(1).FirstOrDefault().Value);
            Assert.Equal("Token1", reversedStream.Tokens.Skip(2).FirstOrDefault().Value);
            Assert.Equal(MarkdownTokenType.EOF, reversedStream.Tokens.Skip(3).FirstOrDefault().Type);
        }

        /// <summary>
        /// Tests if the Preview method correctly returns matching tokens and restores the original stream position.
        /// </summary>
        [Theory]
        [InlineData("foo ** ", MarkdownTokenType.Text, 1)]
        [InlineData("foo ** ", MarkdownTokenType.Space, 2)]
        [InlineData("foo ** ", MarkdownTokenType.DoubleStar, 3)]
        [InlineData("foo ** ", MarkdownTokenType.Emoji, null)]
        [InlineData("foo ** ", null, 5)]
        public void Preview(string input, MarkdownTokenType? stopToken, int? expectedCount)
        {
            // arrange
            var tokens = new MarkdownTokenizer(input).Tokenize();
            var tokenStream = new MarkdownTokenStream(tokens, input);
            var originalPosition = tokenStream.Position;

            // act
            var previewedTokenStram = stopToken is not null ? tokenStream.Preview(stopToken.Value) : tokenStream.Preview();

            // validation
            Assert.Equal(expectedCount, previewedTokenStram?.Count());
            Assert.Equal(originalPosition, tokenStream.Position);
        }

        /// <summary>
        /// Tests that Count correctly returns the total number of tokens in the stream.
        /// </summary>
        [Theory]
        [InlineData("foo ** ", 5)]
        [InlineData("", 1)]
        [InlineData(null, 1)]
        public void Count(string input, int expectedCount)
        {
            // arrange
            var tokens = new MarkdownTokenizer(input).Tokenize();
            var stream = new MarkdownTokenStream(tokens, input);

            // act
            int result = stream.Count();

            // validation
            Assert.Equal(expectedCount, result);
        }

        /// <summary>
        /// Tests that Count returns 0 for an empty token stream.
        /// </summary>
        [Fact]
        public void Count_EmptyStream()
        {
            // arrange
            var tokens = new List<MarkdownToken>();
            var stream = new MarkdownTokenStream(tokens, "");

            // act
            int result = stream.Count();

            // validation
            Assert.Equal(1, result);
        }

        /// <summary>
        /// Tests that GetSource returns the expected substring.
        /// </summary>
        [Theory]
        [InlineData("This is a sample text for tokens.", "This is a sample text for tokens.")]
        public void GetSource(string sourceText, string expected)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(sourceText);
            var tokens = tokenizer.Tokenize();
            var stream = new MarkdownTokenStream(tokens, sourceText);

            // act
            var result = stream.GetSource();

            // validation
            Assert.Equal(expected, result);
        }

        /// <summary>
        /// Verifies that GetSource(start, end) returns the expected substring from the original markdown source.
        /// </summary>
        [Theory]
        [InlineData(4, 14, "# Title\nCode line 1\nCode line 2", "Code line 1\nCode line 2")]
        public void GetSource_StartEnd(int startIndex, int endIndex, string source, string expected)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer(source);
            var tokens = tokenizer.Tokenize().ToList();
            var stream = new MarkdownTokenStream(tokens, source);

            var startToken = tokens[startIndex];
            var endToken = tokens[endIndex];

            // act
            string result = stream.GetSource(startToken, endToken);

            // validation
            Assert.Equal(expected, result);
        }

        /// <summary>
        /// Verifies that GetSource returns an empty string when tokens are null or out of bounds.
        /// </summary>
        [Theory]
        [InlineData(-1, 4)]
        [InlineData(2, 100)]
        public void GetSource_Invalid(int startIndex, int endIndex)
        {
            // arrange
            string source = "# Title\nCode line 1\nCode line 2";
            var tokenizer = new MarkdownTokenizer(source);
            var tokens = tokenizer.Tokenize().ToList();
            var stream = new MarkdownTokenStream(tokens, source);

            MarkdownToken start = (startIndex >= 0 && startIndex < tokens.Count) ? tokens[startIndex] : null;
            MarkdownToken end = (endIndex >= 0 && endIndex < tokens.Count) ? tokens[endIndex] : null;

            // act
            string result = stream.GetSource(start, end);

            // validation
            Assert.Equal(string.Empty, result);
        }

        // <summary>
        /// Verifies that the Tokens property returns all remaining tokens from the current stream position.
        /// </summary>
        [Theory]
        [InlineData(0, 6)]
        [InlineData(1, 5)]
        [InlineData(2, 4)]
        [InlineData(3, 3)]
        [InlineData(4, 2)]
        [InlineData(5, 1)]
        [InlineData(6, 6)]
        public void Tokens(int position, int expectedCount)
        {
            // arrange
            var tokenizer = new MarkdownTokenizer("Start Middle End");
            var tokens = tokenizer.Tokenize().ToList();
            var stream = new MarkdownTokenStream(tokens, "Start Middle End");
            stream.Seek(position); // set the position

            // act
            var remaining = stream.Tokens.ToList();

            // validation
            Assert.Equal(expectedCount, remaining.Count);
        }

        /// <summary>
        /// Verifies that AsEnumerable returns all remaining tokens from the current stream position.
        /// </summary>
        [Fact]
        public void AsEnumerable()
        {
            // arrange
            var tokens = new List<MarkdownToken>
            {
                new(MarkdownTokenType.Tab, "\t", 0),
                new(MarkdownTokenType.Text, "Hello", 1),
                new(MarkdownTokenType.EOL, "\n", 6),
                new(MarkdownTokenType.EOF, "", 7)
            };

            var stream = new MarkdownTokenStream(tokens, "source");
            stream.Skip(1); // advance to second token

            // act
            var result = stream.AsEnumerable().ToList();

            // validation
            Assert.Equal(3, result.Count);
            Assert.Equal(MarkdownTokenType.Text, result[0].Type);
            Assert.Equal("Hello", result[0].Value);
            Assert.Equal(MarkdownTokenType.EOL, result[1].Type);
            Assert.Equal(MarkdownTokenType.EOF, result[2].Type);
        }

        /// <summary>
        /// Helper to create a list of tokens for the tests
        /// </summary>
        private List<MarkdownToken> CreateTokens(params (MarkdownTokenType type, string value, int position)[] items)
        {
            var tokens = new List<MarkdownToken>();

            foreach (var item in items)
            {
                tokens.Add(new MarkdownToken(item.type, item.value, item.position));
            }

            return tokens;
        }
    }
}