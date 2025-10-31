using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Tokenizer for Markdown input, converts an input string into a list of MarkdownToken objects.
    /// </summary>
    public partial class MarkdownTokenizer
    {
        private static readonly int _tabSize = 2; // Default tab size for Markdown
        private static readonly Regex _urlRegex = UrlRegex();
        private static readonly Regex _linkRegex = LinkRegex();
        private static readonly Regex _imageRegex = ImageRegex();
        private static readonly Regex _htmlRegex = HtmlRegex();
        private static readonly Regex _checkboxRegex = CheckboxRegex();
        private static readonly Regex _footnoteRegex = FootnoteRegex();

        [GeneratedRegex(@"(?<url>((https?|ftp|ftps|ldap|ldaps|file):\/\/[^\s\)\]\}]+[^\.\s\)\]\}])|(mailto:[^\s\)\]\}]+[^\.\s\)\]\}]))", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
        private static partial Regex UrlRegex();

        [GeneratedRegex(@"\[\s*(?<text>[^\]]*)\s*\]\(\s*(?<url>[^\s\)\]\}]+)\s*\)", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
        private static partial Regex LinkRegex();

        [GeneratedRegex(@"!\s*(?:\[\s*(?<alt>[^\]]*)\s*\])?\s*\(\s*(?<url>[^\s\)\]\}]+)\s*\)", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
        private static partial Regex ImageRegex();

        [GeneratedRegex(@"<(?<tag>[a-zA-Z][^\s>]*)[^>]*>(.*?)<\/\k<tag>>", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
        private static partial Regex HtmlRegex();

        [GeneratedRegex(@"\[\s*(?<checkbox>[xX\s]?)\s*\]", RegexOptions.IgnoreCase | RegexOptions.Compiled)] // Regex for checkboxes
        private static partial Regex CheckboxRegex();

        [GeneratedRegex(@"\[\^\s*(?<footnote>[^\]]+)\s*\]", RegexOptions.IgnoreCase | RegexOptions.Compiled)] // Regex for footnotes
        private static partial Regex FootnoteRegex();

        private readonly string _input;
        private int _pos;
        private readonly int _length;

        /// <summary>
        /// Initializes a new instance of the MarkdownTokenizer class with the specified input string.
        /// </summary>
        /// <param name="input">The Markdown text to tokenize.</param>
        public MarkdownTokenizer(string input)
        {
            _input = input ?? "";
            _length = _input.Length;
            _pos = 0;
        }

        /// <summary>
        /// Converts the input string into a list of MarkdownToken objects.
        /// Recognizes all MarkdownTokenType values, including CodeMarker, Space, Emoji, and Url.
        /// </summary>
        /// <returns>List of tokens representing the input.</returns>
        public IEnumerable<MarkdownToken> Tokenize()
        {
            var tokens = new List<MarkdownToken>();
            while (_pos < _length)
            {
                // Check for HTML tags
                var htmlMatch = _htmlRegex.Match(_input, _pos);
                if (htmlMatch.Success && htmlMatch.Index == _pos)
                {
                    string htmlContent = htmlMatch.Value;
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Html, htmlContent, _pos, htmlMatch.Length));
                    _pos += htmlMatch.Length;
                    continue;
                }

                // Check for images in the format ![alt](URL)
                var imageMatch = _imageRegex.Match(_input, _pos);
                if (imageMatch.Success && imageMatch.Index == _pos)
                {
                    string altText = imageMatch.Groups["alt"].Value;
                    string imageUrl = imageMatch.Groups["url"].Value;
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Image, imageUrl?.Trim(), altText?.Trim(), _pos, imageMatch.Length));
                    _pos += imageMatch.Length;
                    continue;
                }

                // Check for links in the format [text](URL)
                var linkMatch = _linkRegex.Match(_input, _pos);
                if (linkMatch.Success && linkMatch.Index == _pos)
                {
                    string linkText = linkMatch.Groups["text"].Value;
                    string linkUrl = linkMatch.Groups["url"].Value;
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Link, linkUrl?.Trim(), linkText?.Trim(), _pos, linkMatch.Length));
                    _pos += linkMatch.Length;
                    continue;
                }

                // Check for URLs using the regex
                var urlMatch = _urlRegex.Match(_input, _pos);
                if (urlMatch.Success && urlMatch.Index == _pos)
                {
                    string url = urlMatch.Groups["url"].Value;
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Url, url, _pos, url.Length));
                    _pos += url.Length;
                    continue;
                }

                // Check for checkboxes in the format [ ], [x], [X], etc.
                var checkboxMatch = _checkboxRegex.Match(_input, _pos);
                if (checkboxMatch.Success && checkboxMatch.Index == _pos)
                {
                    string checkboxContent = checkboxMatch.Groups["checkbox"].Value.Trim();
                    MarkdownToken token = checkboxContent switch
                    {
                        "x" or "X" => new MarkdownToken(MarkdownTokenType.Checkbox, "true", _pos, 1),
                        "" => new MarkdownToken(MarkdownTokenType.Checkbox, "false", _pos, 1),
                        _ => new MarkdownToken(MarkdownTokenType.Text, checkboxContent, _pos, checkboxMatch.Length)
                    };
                    tokens.Add(token);
                    _pos += checkboxMatch.Length;
                    continue;
                }

                // Check for footnotes in the format [^1]
                var footnoteMatch = _footnoteRegex.Match(_input, _pos);
                if (footnoteMatch.Success && footnoteMatch.Index == _pos)
                {
                    string footnoteContent = footnoteMatch.Groups["footnote"].Value.Trim();
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Footnote, footnoteContent, _pos, footnoteMatch.Length));
                    _pos += footnoteMatch.Length;
                    continue;
                }

                // check for code block marker (three backticks) before single backtick
                if (_input[_pos] == '`' && _pos + 2 < _length &&
                    _input[_pos + 1] == '`' && _input[_pos + 2] == '`')
                {
                    tokens.Add(new MarkdownToken(MarkdownTokenType.CodeMarker, "```", _pos, 3));
                    _pos += 3;
                    continue;
                }

                // check for multi-char tokens: _, *, #, ~, -
                if
                (
                    _input[_pos] == '_' ||
                    _input[_pos] == '*' ||
                    _input[_pos] == '#' ||
                    _input[_pos] == '~' ||
                    _input[_pos] == '-'
                )
                {
                    int start = _pos;
                    char specialChar = _input[_pos];
                    int count = 1;
                    while (_pos + count < _length && _input[_pos + count] == specialChar)
                    {
                        count++;
                    }

                    string value = _input.Substring(_pos, count);

                    MarkdownTokenType type = specialChar switch
                    {
                        '_' => count switch
                        {
                            1 => MarkdownTokenType.Underscore,
                            2 => MarkdownTokenType.DoubleUnderscore,
                            3 => MarkdownTokenType.TripleUnderscore,
                            _ => MarkdownTokenType.MultiUnderscore
                        },
                        '*' => count switch
                        {
                            1 => MarkdownTokenType.Star,
                            2 => MarkdownTokenType.DoubleStar,
                            3 => MarkdownTokenType.TripleStar,
                            _ => MarkdownTokenType.MultiStar
                        },
                        '~' => count switch
                        {
                            1 => MarkdownTokenType.Tilde,
                            2 => MarkdownTokenType.DoubleTilde,
                            3 => MarkdownTokenType.TripleTilde,
                            _ => MarkdownTokenType.MultiTilde
                        },
                        '-' => count switch
                        {
                            1 => MarkdownTokenType.Hyphen,
                            2 => MarkdownTokenType.DoubleHyphen,
                            3 => MarkdownTokenType.TripleHyphen,
                            _ => MarkdownTokenType.MultiHyphen
                        },
                        '#' => MarkdownTokenType.Hash,
                        _ => MarkdownTokenType.Text
                    };

                    tokens.Add(new MarkdownToken(type, value, start, count));
                    _pos += count;
                    continue;
                }

                // check for tabs
                if (_pos + _tabSize - 1 < _length && _input.Substring(_pos, _tabSize) == "".PadRight(_tabSize, ' '))
                {
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Tab, "\t", _pos, _tabSize));
                    _pos += _tabSize;
                    continue;
                }

                char c = _input[_pos];

                switch (c)
                {
                    case '[': tokens.Add(new MarkdownToken(MarkdownTokenType.Pipe, "[", _pos++)); break;
                    case '|': tokens.Add(new MarkdownToken(MarkdownTokenType.Pipe, "|", _pos++)); break;
                    case '+': tokens.Add(new MarkdownToken(MarkdownTokenType.Plus, "+", _pos++)); break;
                    case '<': tokens.Add(new MarkdownToken(MarkdownTokenType.Less, "<", _pos++)); break;
                    case '>':
                        {
                            if (_pos + 1 < _length && _input[_pos + 1] == '?')
                            {
                                tokens.Add(new MarkdownToken(MarkdownTokenType.GratherHint, ">?", _pos));
                                _pos += 2;
                            }
                            else if (_pos + 2 < _length && _input[_pos + 1] == '!' && _input[_pos + 2] == '!')
                            {
                                tokens.Add(new MarkdownToken(MarkdownTokenType.GratherError, ">!!", _pos));
                                _pos += 3;
                            }
                            else if (_pos + 1 < _length && _input[_pos + 1] == '!')
                            {
                                tokens.Add(new MarkdownToken(MarkdownTokenType.GratherWarning, ">!", _pos));
                                _pos += 2;
                            }
                            else if (_pos + 1 < _length && _input[_pos + 1] == '*')
                            {
                                tokens.Add(new MarkdownToken(MarkdownTokenType.GratherSuccess, ">*", _pos));
                                _pos += 2;
                            }
                            else if (_pos + 1 < _length && _input[_pos + 1] == '>')
                            {
                                tokens.Add(new MarkdownToken(MarkdownTokenType.DoubleGreater, ">>", _pos));
                                _pos += 2;
                            }
                            else
                            {
                                tokens.Add(new MarkdownToken(MarkdownTokenType.Greater, ">", _pos++)); break;
                            }
                            break;
                        }
                    case '=':
                        {
                            if (_pos + 1 < _length && _input[_pos + 1] == '=')
                            {
                                tokens.Add(new MarkdownToken(MarkdownTokenType.DoubleEqual, "==", _pos));
                                _pos += 2;
                            }
                            else
                            {
                                tokens.Add(new MarkdownToken(MarkdownTokenType.Text, "=", _pos++)); break;
                            }
                            break;
                        }
                    case '`': tokens.Add(new MarkdownToken(MarkdownTokenType.Backtick, "`", _pos++)); break;
                    case '\n': tokens.Add(new MarkdownToken(MarkdownTokenType.EOL, "", _pos++)); break;
                    case '\r':
                        // handle Windows newlines (\r\n)
                        if (_pos + 1 < _length && _input[_pos + 1] == '\n')
                        {
                            tokens.Add(new MarkdownToken(MarkdownTokenType.EOL, "", _pos));
                            _pos += 2;
                        }
                        else
                        {
                            tokens.Add(new MarkdownToken(MarkdownTokenType.EOL, "", _pos++));
                        }
                        break;
                    case ' ':
                        // handle spaces
                        tokens.Add(new MarkdownToken(MarkdownTokenType.Space, " ", _pos++));
                        break;
                    case '\t':
                        // handle tabs
                        tokens.Add(new MarkdownToken(MarkdownTokenType.Tab, " ", _pos++));
                        break;
                    default:
                        if (char.IsSurrogate(c) || char.IsSymbol(c))
                        {
                            // detect emoji
                            var emoji = ParseEmoji();
                            if (!string.IsNullOrEmpty(emoji))
                            {
                                tokens.Add(new MarkdownToken(MarkdownTokenType.Emoji, emoji, _pos));
                                _pos += emoji.Length;
                                continue;
                            }
                        }

                        // collect text until the next special char
                        int start = _pos;
                        var sb = new StringBuilder();
                        while (_pos < _length && !IsSpecialMarkdownChar(_input, _pos))
                        {
                            sb.Append(_input[_pos]);
                            _pos++;
                        }
                        tokens.Add(new MarkdownToken(MarkdownTokenType.Text, sb.ToString(), start));
                        break;
                }
            }

            tokens.Add(new MarkdownToken(MarkdownTokenType.EOF, string.Empty, _pos));

            return tokens;
        }

        /// <summary>
        /// Returns true if the character at position pos is a special Markdown character
        /// or the start of a code block marker (three backticks), or a URL.
        /// </summary>
        /// <param name="input">The input string.</param>
        /// <param name="pos">Current position in the string.</param>
        /// <returns>True if a special character, code marker, or URL is found.</returns>
        private static bool IsSpecialMarkdownChar(string input, int pos)
        {
            // Check for code block marker
            if
            (
                input[pos] == '`' &&
                pos + 2 < input.Length &&
                input[pos + 1] == '`' &&
                input[pos + 2] == '`'
            )
            {
                return true;
            }

            // Multi-underscore, multi-star, multi-hash, multi-tilde, multi-hyphen, ...
            if
            (
                input[pos] == '_' ||
                input[pos] == '*' ||
                input[pos] == '#' ||
                input[pos] == '~' ||
                input[pos] == '-' ||
                input[pos] == '>'
            )
            {
                return true;
            }

            // other markdown specials
            if ("|<[=+`\r\n ".Contains(input[pos]))
            {
                return true;
            }

            // Check for URLs using regex (if the current position is at the start of a valid URL)
            var urlMatch = UrlRegex().Match(input, pos);
            if (urlMatch.Success && urlMatch.Index == pos)
            {
                return true;
            }

            return false;
        }

        /// <summary>
        /// Parses an emoji from the current position if possible.
        /// </summary>
        /// <returns>The emoji string if found; otherwise, an empty string.</returns>
        private string ParseEmoji()
        {
            // Check for Unicode emojis (surrogate pairs)
            if (char.IsSurrogate(_input[_pos]))
            {
                if (_pos + 1 < _length && char.IsSurrogatePair(_input[_pos], _input[_pos + 1]))
                {
                    return new string(new[] { _input[_pos], _input[_pos + 1] });
                }
            }

            // Check for ASCII-based emojis
            string[] asciiEmojis = { ":)", "(x)" };
            foreach (var emoji in asciiEmojis)
            {
                if (_pos + emoji.Length <= _length && _input.Substring(_pos, emoji.Length) == emoji)
                {
                    return emoji;
                }
            }

            return string.Empty;
        }
    }
}