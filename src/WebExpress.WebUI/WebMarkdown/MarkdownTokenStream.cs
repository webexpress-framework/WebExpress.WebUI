using System;
using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Provides controlled access to a stream of <see cref="MarkdownToken"/>s, supporting peeking and consuming tokens.
    /// </summary>
    public class MarkdownTokenStream
    {
        private readonly string _source;
        private readonly List<MarkdownToken> _tokens = [];
        private int _position;

        /// <summary>
        /// Returns the current position in the stream.
        /// </summary>
        public int Position => _position;

        /// <summary>
        /// Returns an enumerable sequence of all remaining tokens starting from the current position.
        /// </summary>
        public IEnumerable<MarkdownToken> Tokens => _tokens.Skip(_position);

        /// <summary>
        /// Initializes a new instance of the <see cref="MarkdownTokenStream"/> class with the given tokens.
        /// </summary>
        /// <param name="tokens">The sequence of <see cref="MarkdownToken"/>s to operate on.</param>
        /// <param name="input">The markdown source.</param>
        public MarkdownTokenStream(IEnumerable<MarkdownToken> tokens, string source)
        {
            // copy tokens to list for index-based access
            _tokens.AddRange(tokens);
            _source = source;

            var last = _tokens.LastOrDefault();

            if (last is null)
            {
                _tokens.Add(new MarkdownToken(MarkdownTokenType.EOF, "", 0));
            }
            else if (last.Type != MarkdownTokenType.EOF)
            {
                _tokens.Add(new MarkdownToken(MarkdownTokenType.EOF, "", last.Position + last.Count + 1));
            }
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="MarkdownTokenStream"/> class with the given tokens.
        /// </summary>
        /// <param name="tokenStreams">The sequence of <see cref="MarkdownTokenStream"/>s to operate on.</param>
        public MarkdownTokenStream(IEnumerable<MarkdownTokenStream> tokenStreams)
        {
            // merge token streams with EOL separators between them (except after last)
            foreach (var tokenStream in tokenStreams.SkipLast(1))
            {
                var tokens = tokenStream._tokens.Where(x => x.Type != MarkdownTokenType.EOF);
                var lastToken = tokens.LastOrDefault();
                var position = lastToken is not null ? lastToken.Position + lastToken.Count + 1 : 0;

                _tokens.AddRange(tokens);
                _tokens.Add(new MarkdownToken(MarkdownTokenType.EOL, "", position));
            }

            foreach (var tokenStream in tokenStreams.TakeLast(1))
            {
                _tokens.AddRange(tokenStream._tokens);
            }

            var last = _tokens.LastOrDefault();
            if (last?.Type != MarkdownTokenType.EOF)
            {
                _tokens.Add(new MarkdownToken(MarkdownTokenType.EOF, "", last.Position + last.Count + 1));
            }

            _source = tokenStreams.FirstOrDefault()?._source;
        }

        /// <summary>
        /// Returns the current token without advancing the stream. 
        /// If specific token types are provided, returns the token only if its type matches.
        /// If no token types are specified, simply returns the current token or null at the end of the stream.
        /// </summary>
        /// <param name="tokenType">Optional token types to match against the current token.</param>
        /// <returns>
        /// The current token if it matches any of the specified types; 
        /// or the next token if no types are specified; otherwise null if the end of stream is reached.
        /// </returns>
        public MarkdownToken Peek(params MarkdownTokenType[] tokenType)
        {
            var currentToken = _position < _tokens.Count ? _tokens[_position] : null;

            if (currentToken is null)
            {
                return null;
            }

            if (tokenType is null || tokenType.Length == 0)
            {
                return currentToken;
            }

            if (tokenType.Contains(currentToken.Type))
            {
                return currentToken;
            }

            return null;
        }

        /// <summary>
        /// Returns the token at the next position without advancing the stream.
        /// If specific token types are provided, the token is only returned if its type matches.
        /// If no token types are specified, the next token is returned regardless of its type.
        /// Returns <c>null</c> if the end of the stream has been reached.
        /// </summary>
        /// <param name="tokenType">Optional token types to match against the next token.</param>
        /// <returns>
        /// The next <see cref="MarkdownToken"/> if it matches one of the specified types, 
        /// or the next token if no types are specified; otherwise, <c>null</c>.
        /// </returns>
        public MarkdownToken PeekNext(params MarkdownTokenType[] tokenType)
        {
            var nextIndex = _position + 1;
            var nextToken = nextIndex < _tokens.Count ? _tokens[nextIndex] : null;

            if (nextToken is null)
                return null;

            if (tokenType is null || tokenType.Length == 0)
                return nextToken;

            if (tokenType.Contains(nextToken.Type))
                return nextToken;

            return null;
        }

        /// <summary>
        /// Previews tokens from the current position until a stop token is encountered or the 
        /// end of the stream is reached. If no stop tokens are specified, all remaining tokens 
        /// are returned. Does not consume tokens.
        /// </summary>
        /// <param name="stopTokens">
        /// A list of token types that act as stop tokens. If none are provided, everything 
        /// until the end is returned.</param>
        /// <returns>
        /// A <see cref="MarkdownTokenStream"/> containing all previewed tokens up to the first 
        /// stop token or to the end of the stream or null.
        /// </returns>
        public MarkdownTokenStream Preview(params MarkdownTokenType[] stopTokens)
        {
            // no stop tokens specified → return everything
            if (stopTokens is null || stopTokens.Length == 0)
            {
                var remaining = _tokens.Skip(_position);
                return new MarkdownTokenStream(remaining, _source);
            }

            var stopSet = new HashSet<MarkdownTokenType>(stopTokens);
            var takeTokenCount = 0;
            var reachedStopToken = false;

            for (int i = _position; i < _tokens.Count; i++)
            {
                var currentToken = _tokens[i];

                if (stopSet.Contains(currentToken.Type))
                {
                    reachedStopToken = true;
                    break;
                }

                takeTokenCount++;
            }

            if (!reachedStopToken)
            {
                return null;
            }

            var previewedTokens = _tokens.Skip(_position).Take(takeTokenCount);
            return new MarkdownTokenStream(previewedTokens, _source);
        }

        /// <summary>
        /// Consumes and returns the current token, optionally matching it against one or more expected token types.
        /// If no expected types are specified, the current token is consumed unconditionally.
        /// Returns null if the end of the stream is reached or the current token does not match any of the expected types.
        /// </summary>
        /// <param name="expectedTypes">Optional token types to match against the current token.</param>
        /// <returns>
        /// The consumed token if its type matches one of the expected types (or unconditionally if none are specified); 
        /// otherwise, null.
        /// </returns>
        public MarkdownToken Consume(params MarkdownTokenType[] expectedTypes)
        {
            var current = Peek();

            if (current is null)
                return null;

            if (expectedTypes is null || expectedTypes.Length == 0 || expectedTypes.Contains(current.Type))
                return _tokens[_position++];

            return null;
        }

        /// <summary>
        /// Consumes all tokens from the current position in the stream until eol or eof token is encountered.
        /// Returns a new MarkdownTokenStream containing all consumed tokens.
        /// </summary>
        /// <returns>A new MarkdownTokenStream containing all tokens consumed up to the end of line.</returns>
        public MarkdownTokenStream ConsumeLine()
        {
            var consumedTokens = new List<MarkdownToken>();

            while (!IsAtEnd() && Peek() is not null)
            {
                var currentToken = Peek();

                // break when a stop token is encountered
                if (currentToken.Type == MarkdownTokenType.EOL || currentToken.Type == MarkdownTokenType.EOF)
                {
                    Consume();

                    break;
                }

                // consume the current token and add it to the result list
                consumedTokens.Add(Consume());
            }

            // return the consumed tokens as a new MarkdownTokenStream
            return new MarkdownTokenStream(consumedTokens, _source);
        }

        /// <summary>
        /// Skips all consecutive tokens whose types are contained in the given skipTokenTypes array.
        /// If no types are specified, skips a single token by default.
        /// </summary>
        /// <param name="skipTokenTypes">
        /// The token types to skip. If none are provided, a single token is skipped unconditionally.
        /// </param>
        /// <returns>
        /// Returns the current instance after advancing the position. This allows method chaining for 
        /// further operations on the stream.
        /// </returns>
        public MarkdownTokenStream Skip(params MarkdownTokenType[] skipTokenTypes)
        {
            // if no types provided, skip one token unconditionally
            if (skipTokenTypes is null || skipTokenTypes.Length == 0)
            {
                if (_position < _tokens.Count)
                {
                    _position++;
                }

                return this;
            }

            var skipSet = new HashSet<MarkdownTokenType>(skipTokenTypes);

            while (!IsAtEnd())
            {
                var currentToken = Peek();

                if (currentToken is null || !skipSet.Contains(currentToken.Type))
                    break;

                if (_position < _tokens.Count)
                {
                    _position++;
                }
            }

            return this;
        }

        /// <summary>
        /// Skips the specified number of tokens by advancing the stream's position.
        /// If the end of the stream is reached before the specified number is skipped, skipping stops.
        /// </summary>
        /// <param name="count">The number of tokens to skip. Defaults to 1 if not specified.</param>
        /// <returns>
        /// Returns the current instance after advancing the position. This allows method chaining for 
        /// further operations on the stream.
        /// </returns>
        public MarkdownTokenStream Skip(int count)
        {
            // ensure count is positive
            if (count <= 0)
            {
                return this;
            }

            // advance the position by the specified count, ensuring it does not exceed the token count
            _position = Math.Min(_position + count, _tokens.Count);

            return this;
        }

        /// <summary>
        /// Splits the token stream into multiple streams based on the specified stop tokens.
        /// </summary>
        /// <param name="stopTokens">
        /// A list of token types that act as delimiters for splitting the stream.
        /// </param>
        /// <returns>
        /// A list of <see cref="MarkdownTokenStream"/> objects, each representing a segment of the original stream.
        /// </returns>
        public List<MarkdownTokenStream> Split(params MarkdownTokenType[] stopTokens)
        {
            var splitStreams = new List<MarkdownTokenStream>();
            var currentSegment = new List<MarkdownToken>();

            foreach (var token in _tokens)
            {
                if (stopTokens.Contains(token.Type))
                {
                    // create a new stream for the current segment
                    splitStreams.Add(new MarkdownTokenStream(currentSegment, _source));
                    currentSegment = [];
                }
                else
                {
                    currentSegment.Add(token);
                }
            }

            // add the final segment if it has any tokens
            if (currentSegment.Count > 0)
            {
                splitStreams.Add(new MarkdownTokenStream(currentSegment, _source));
            }

            return splitStreams;
        }

        /// <summary>
        /// Returns a new stream with the tokens in reverse order.
        /// This allows for processing tokens from the end of the stream towards the beginning.
        /// </summary>
        /// <returns>A reversed token stream.</returns>
        public MarkdownTokenStream Reverse()
        {
            var reversedTokens = Tokens.Reverse();

            return new MarkdownTokenStream(reversedTokens.Where(x => x.Type != MarkdownTokenType.EOF), _source);
        }

        /// <summary>
        /// Moves the position within the token stream to the specified index.
        /// </summary>
        /// <param name="position">The zero-based index to seek to.</param>
        /// <returns>
        /// True if the position is valid and was set; false if the index is out of range.
        /// </returns>
        public bool Seek(int position)
        {
            if (position < 0 || position >= _tokens.Count)
            {
                return false;
            }

            _position = position;
            return true;
        }

        /// <summary>
        /// Checks if the end of the token stream is reached.
        /// </summary>
        public bool IsAtEnd()
        {
            // returns true if the stream is at or past the end
            return _position >= _tokens.Count ||
                (_position < _tokens.Count && _tokens[_position].Type == MarkdownTokenType.EOF);
        }

        /// <summary>
        /// Returns the total number of tokens in the stream.
        /// This method provides the count of all tokens, including those that may have already been processed or skipped.
        /// </summary>
        /// <returns>The total count of tokens in the stream.</returns>
        public int Count()
        {
            return _tokens.Count;
        }

        /// <summary>
        /// Returns the substring from the original source text that spans all tokens in this collection.
        /// If no tokens are present, an empty string is returned.
        /// </summary>
        /// <returns>
        /// The substring from the start position of the first token to the end of the last token.
        /// Returns an empty string if the token collection is empty.
        /// </returns>
        public string GetSource()
        {
            // if there are no tokens, return an empty string
            if (_tokens.Count == 0)
            {
                return string.Empty;
            }

            var firstToken = _tokens.FirstOrDefault();
            var lastToken = _tokens.LastOrDefault()?.Type == MarkdownTokenType.EOF
                ? _tokens.SkipLast(1).LastOrDefault()
                : _tokens.LastOrDefault();

            // get the start position of the first token, and the end position of the last token
            var first = firstToken?.Position ?? 0;
            // assuming tokens have a Length property to know how many characters they span
            int end = (lastToken is not null) ? lastToken.Position + lastToken.Count : firstToken?.Count ?? 0;

            // extract and return the substring from the source text
            return _source[first..end];
        }

        /// <summary>
        /// Returns the substring from the original source text that spans from the specified start token to the end token.
        /// </summary>
        /// <param name="start">The token marking the beginning of the range.</param>
        /// <param name="end">The token marking the end of the range.</param>
        /// <returns>
        /// The substring from <paramref name="start"/> to the end of <paramref name="end"/>.
        /// Returns an empty string if either token is null or not found in the stream.
        /// </returns>
        public string GetSource(MarkdownToken start, MarkdownToken end)
        {
            if (start is null || end is null)
            {
                return string.Empty;
            }

            int startIndex = start.Position;
            int endIndex = end.Position + end.Count;

            // ensure positions are within bounds of the source
            if (startIndex < 0 || endIndex > _source.Length || startIndex >= endIndex)
            {
                return string.Empty;
            }

            return _source[startIndex..endIndex];
        }

        /// <summary>
        /// Returns an <see cref="IEnumerable{MarkdownToken}"/> that enumerates tokens from the current position to the end of the stream.
        /// </summary>
        /// <returns>An enumerable sequence of <see cref="MarkdownToken"/>s.</returns>
        public IEnumerable<MarkdownToken> AsEnumerable()
        {
            for (int i = _position; i < _tokens.Count; i++)
            {
                yield return _tokens[i];
            }
        }
    }
}