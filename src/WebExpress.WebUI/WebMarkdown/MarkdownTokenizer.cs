using System;
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
        private static readonly Regex _htmlOpenRegex = HtmlOpenRegex();
        private static readonly Regex _checkboxRegex = CheckboxRegex();
        private static readonly Regex _footnoteRegex = FootnoteRegex();
        private static readonly Regex _inlinePluginRegex = InlinePluginRegex();
        private static readonly Regex _pluginBlockRegex = PluginBlockRegex();
        private static readonly Regex _pluginBlockEndRegex = PluginBlockEndRegex();

        // every pattern is only asked whether it matches at the current position. Without the \G
        // anchor a failed attempt searched the whole rest of the input for a later match, once per
        // character. Within a pattern no two quantifiers may compete for the same characters, or a
        // failed attempt tries every way of splitting them; and a bracketed text stops at the next
        // '[', so a run of unclosed brackets is scanned once rather than once per bracket. The
        // captured texts are trimmed where they are used, so they need no whitespace of their own

        [GeneratedRegex(@"\G(?<url>((https?|ftp|ftps|ldap|ldaps|file):\/\/[^\s\)\]\}]+[^\.\s\)\]\}])|(mailto:[^\s\)\]\}]+[^\.\s\)\]\}]))", RegexOptions.IgnoreCase)]
        private static partial Regex UrlRegex();

        [GeneratedRegex(@"\G\[(?<text>[^\[\]]*)\]\(\s*(?<url>[^\s\)\]\}]+)\s*\)")]
        private static partial Regex LinkRegex();

        [GeneratedRegex(@"\G!\s*(?:\[(?<alt>[^\[\]]*)\]\s*)?\(\s*(?<url>[^\s\)\]\}]+)\s*\)")]
        private static partial Regex ImageRegex();

        // only the opening tag; the closing one is looked up in an index, because searching for it
        // from every opening tag that is never closed is quadratic
        [GeneratedRegex(@"\G<(?<tag>(?>[a-zA-Z][^\s<>]*))[^<>]*>")]
        private static partial Regex HtmlOpenRegex();

        [GeneratedRegex(@"\G\[\s*(?:(?<checkbox>[xX])\s*)?\]")]
        private static partial Regex CheckboxRegex();

        [GeneratedRegex(@"\G\[\^(?<footnote>[^\[\]]+)\]")]
        private static partial Regex FootnoteRegex();

        [GeneratedRegex(@"\G\{\{(?!%)(?<name>[a-zA-Z_][a-zA-Z0-9_]*)(?<params>(?:\s+[a-zA-Z_][a-zA-Z0-9_]*=""[^""]*"")*)\s*\}\}")]
        private static partial Regex InlinePluginRegex();

        [GeneratedRegex(@"\G\{\{%\s*(?<name>[a-zA-Z_][a-zA-Z0-9_]*)(?<params>(?:\s+[a-zA-Z_][a-zA-Z0-9_]*=""[^""]*"")*)\s*%\}\}")]
        private static partial Regex PluginBlockRegex();

        [GeneratedRegex(@"\G\{\{%\s*/(?<name>[a-zA-Z_][a-zA-Z0-9_]*)\s*%\}\}")]
        private static partial Regex PluginBlockEndRegex();

        private readonly string _input;
        private int _pos;
        private readonly int _length;
        private Dictionary<string, List<int>> _closingTags;
        private List<int> _lineBreaks;

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
                // Check for block plugin end tag {{% /name %}}
                var pluginBlockEndMatch = _pluginBlockEndRegex.Match(_input, _pos);
                if (pluginBlockEndMatch.Success)
                {
                    string pluginName = pluginBlockEndMatch.Groups["name"].Value;
                    tokens.Add(new MarkdownToken(MarkdownTokenType.PluginBlockEnd, pluginName, _pos, pluginBlockEndMatch.Length));
                    _pos += pluginBlockEndMatch.Length;
                    continue;
                }

                // Check for block plugin opening tag {{% name params %}}
                var pluginBlockMatch = _pluginBlockRegex.Match(_input, _pos);
                if (pluginBlockMatch.Success)
                {
                    string pluginName = pluginBlockMatch.Groups["name"].Value;
                    string pluginParams = pluginBlockMatch.Groups["params"].Value.Trim();
                    tokens.Add(new MarkdownToken(MarkdownTokenType.PluginBlock, pluginName, pluginParams, _pos, pluginBlockMatch.Length));
                    _pos += pluginBlockMatch.Length;
                    continue;
                }

                // Check for inline plugin {{name params}}
                var inlinePluginMatch = _inlinePluginRegex.Match(_input, _pos);
                if (inlinePluginMatch.Success)
                {
                    string pluginName = inlinePluginMatch.Groups["name"].Value;
                    string pluginParams = inlinePluginMatch.Groups["params"].Value.Trim();
                    tokens.Add(new MarkdownToken(MarkdownTokenType.InlinePlugin, pluginName, pluginParams, _pos, inlinePluginMatch.Length));
                    _pos += inlinePluginMatch.Length;
                    continue;
                }

                // Check for HTML tags
                var htmlLength = MatchHtml();
                if (htmlLength > 0)
                {
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Html, _input.Substring(_pos, htmlLength), _pos, htmlLength));
                    _pos += htmlLength;
                    continue;
                }

                // Check for images in the format ![alt](URL)
                var imageMatch = _imageRegex.Match(_input, _pos);
                if (imageMatch.Success)
                {
                    string altText = imageMatch.Groups["alt"].Value;
                    string imageUrl = imageMatch.Groups["url"].Value;
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Image, imageUrl?.Trim(), altText?.Trim(), _pos, imageMatch.Length));
                    _pos += imageMatch.Length;
                    continue;
                }

                // Check for links in the format [text](URL)
                var linkMatch = _linkRegex.Match(_input, _pos);
                if (linkMatch.Success)
                {
                    string linkText = linkMatch.Groups["text"].Value;
                    string linkUrl = linkMatch.Groups["url"].Value;
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Link, linkUrl?.Trim(), linkText?.Trim(), _pos, linkMatch.Length));
                    _pos += linkMatch.Length;
                    continue;
                }

                // Check for URLs using the regex
                var urlMatch = _urlRegex.Match(_input, _pos);
                if (urlMatch.Success)
                {
                    string url = urlMatch.Groups["url"].Value;
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Url, url, _pos, url.Length));
                    _pos += url.Length;
                    continue;
                }

                // Check for checkboxes in the format [ ], [x], [X], etc.
                var checkboxMatch = _checkboxRegex.Match(_input, _pos);
                if (checkboxMatch.Success)
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
                if (footnoteMatch.Success)
                {
                    string footnoteContent = footnoteMatch.Groups["footnote"].Value.Trim();
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Footnote, footnoteContent, _pos, footnoteMatch.Length));
                    _pos += footnoteMatch.Length;
                    continue;
                }

                // an escaped pipe is text, so a table cell can hold a pipe without being split
                if (IsEscapedPipe(_input, _pos))
                {
                    tokens.Add(new MarkdownToken(MarkdownTokenType.Text, "|", _pos, 2));
                    _pos += 2;
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
        /// Matches an HTML element that is opened and closed on the same line, as in
        /// <c>&lt;kbd&gt;Ctrl&lt;/kbd&gt;</c>, at the current position.
        /// </summary>
        /// <returns>The length of the element, or 0 when none starts here.</returns>
        private int MatchHtml()
        {
            var open = _htmlOpenRegex.Match(_input, _pos);
            if (!open.Success)
            {
                return 0;
            }

            if (_closingTags is null)
            {
                IndexHtml();
            }

            var tag = open.Groups["tag"].Value;
            if (!_closingTags.TryGetValue(tag, out var closings))
            {
                return 0;
            }

            var contentStart = _pos + open.Length;
            var close = FirstAtOrAfter(closings, contentStart);
            if (close < 0)
            {
                return 0;
            }

            // the content may not span lines; the closing tag that follows a line break belongs
            // to an element opened on that later line
            var lineBreak = FirstAtOrAfter(_lineBreaks, contentStart);
            if (lineBreak >= 0 && lineBreak < close)
            {
                return 0;
            }

            return close + tag.Length + 3 - _pos;
        }

        /// <summary>
        /// Records where each closing tag and each line break is, in one pass over the input,
        /// so that matching an element costs a lookup instead of a search.
        /// </summary>
        private void IndexHtml()
        {
            _closingTags = new Dictionary<string, List<int>>(StringComparer.OrdinalIgnoreCase);
            _lineBreaks = [];

            for (var i = 0; i < _length; i++)
            {
                if (_input[i] == '\n')
                {
                    _lineBreaks.Add(i);
                }
            }

            var at = _input.IndexOf("</", StringComparison.Ordinal);
            while (at >= 0)
            {
                // the name allows the same characters as the name of an opening tag, and stops at
                // '<' so that the scans of two closing tags never overlap
                var end = at + 2;
                if (end < _length && char.IsAsciiLetter(_input[end]))
                {
                    while (end < _length && !char.IsWhiteSpace(_input[end]) && _input[end] != '<' && _input[end] != '>')
                    {
                        end++;
                    }

                    if (end < _length && _input[end] == '>')
                    {
                        var name = _input.Substring(at + 2, end - at - 2);
                        if (!_closingTags.TryGetValue(name, out var positions))
                        {
                            positions = [];
                            _closingTags.Add(name, positions);
                        }

                        positions.Add(at);
                    }
                }

                at = _input.IndexOf("</", end, StringComparison.Ordinal);
            }
        }

        /// <summary>
        /// Returns the first of the ascending positions that is not before the given one.
        /// </summary>
        /// <param name="positions">The positions, in ascending order.</param>
        /// <param name="from">The position to start at.</param>
        /// <returns>The position, or -1 when there is none.</returns>
        private static int FirstAtOrAfter(List<int> positions, int from)
        {
            var index = positions.BinarySearch(from);
            if (index < 0)
            {
                index = ~index;
            }

            return index < positions.Count ? positions[index] : -1;
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
            if (IsEscapedPipe(input, pos))
            {
                return true;
            }

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

            // Check for plugin syntax start {{ only if it's a valid plugin pattern
            if (input[pos] == '{' && pos + 1 < input.Length && input[pos + 1] == '{')
            {
                var inlinePluginMatch = _inlinePluginRegex.Match(input, pos);
                if (inlinePluginMatch.Success)
                {
                    return true;
                }

                var pluginBlockMatch = _pluginBlockRegex.Match(input, pos);
                if (pluginBlockMatch.Success)
                {
                    return true;
                }

                var pluginBlockEndMatch = _pluginBlockEndRegex.Match(input, pos);
                if (pluginBlockEndMatch.Success)
                {
                    return true;
                }
            }

            // Check for URLs using regex (if the current position is at the start of a valid URL)
            var urlMatch = _urlRegex.Match(input, pos);
            if (urlMatch.Success)
            {
                return true;
            }

            return false;
        }

        /// <summary>
        /// Determines whether a backslash-escaped pipe (<c>\|</c>) starts at the position.
        /// </summary>
        /// <param name="input">The input string.</param>
        /// <param name="pos">Current position in the string.</param>
        /// <returns>True if an escaped pipe starts at the position; otherwise, false.</returns>
        private static bool IsEscapedPipe(string input, int pos)
        {
            return input[pos] == '\\' && pos + 1 < input.Length && input[pos + 1] == '|';
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