using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebUI.WebMarkdown.Element;

namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Implements the logic for parsing Markdown text into an abstract syntax tree (AST).
    /// </summary>
    public class MarkdownParser
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public MarkdownParser()
        {
        }

        /// <summary>
        /// Parses the specified Markdown string and returns a <see cref="MarkdownDocument"/> representing the parsed content.
        /// The method tokenizes the input, iterates through the tokens, and parses block elements until the end of the token stream is reached.
        /// Unrecognized tokens are skipped as a fallback.
        /// </summary>
        /// <param name="markdown">The Markdown source text to parse.</param>
        /// <returns>A <see cref="MarkdownDocument"/> containing the parsed elements.</returns>
        public static MarkdownDocument Parse(string markdown)
        {
            var tokenizer = new MarkdownTokenizer(markdown.TrimEnd());
            var tokenStream = new MarkdownTokenStream(tokenizer.Tokenize(), markdown);

            return Parse(tokenStream);
        }

        /// <summary>
        /// Parses the given Markdown token stream and returns a <see cref="MarkdownDocument"/> representing the parsed content.
        /// The method processes the tokens in the stream, iterates through them, and parses block elements until the end of the stream is reached.
        /// Unrecognized tokens are skipped as a fallback mechanism.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse.</param>
        /// <returns>A <see cref="MarkdownDocument"/> containing the parsed block elements.</returns>
        private static MarkdownDocument Parse(MarkdownTokenStream tokenStream)
        {
            var doc = new MarkdownDocument();

            while (!tokenStream.IsAtEnd())
            {
                var block = ParseBlockElement(tokenStream);
                if (block is not null)
                {
                    doc.Add(block);
                }
                else
                {
                    tokenStream.Skip(); // fallback: skip
                }
            }

            return doc;
        }

        /// <summary>
        /// Parses a single block element from the current position in the token stream.
        /// Determines the block type (heading, horizontal rule, quote, list, table, or paragraph)
        /// and invokes the corresponding parsing method.
        /// </summary>
        /// <param name="tokenStream">The stream of markdown tokens.</param>
        /// <returns>
        /// A block element representing the parsed block.
        /// </returns>
        private static IMarkdownElement ParseBlockElement(MarkdownTokenStream tokenStream)
        {
            if (tokenStream.Peek()?.Type == MarkdownTokenType.EOL)
            {
                return null;
            }

            if (IsHeading(tokenStream))
            {
                return ParseHeading(tokenStream);
            }

            if (IsHorizontalRule(tokenStream))
            {
                return ParseHorizontalRule(tokenStream);
            }

            if (IsIndent(tokenStream))
            {
                return ParseIndent(tokenStream);
            }

            if (IsQuote(tokenStream))
            {
                return ParseQuote(tokenStream);
            }

            if (IsCallout(tokenStream))
            {
                return ParseCallout(tokenStream);
            }

            if (IsCode(tokenStream))
            {
                return ParseCode(tokenStream);
            }

            if (IsList(tokenStream))
            {
                return ParseList(tokenStream);
            }

            if (IsTable(tokenStream))
            {
                return ParseTable(tokenStream);
            }

            return ParseParagraph(tokenStream);
        }

        /// <summary>
        /// Determines whether the current position in the token stream represents a Markdown heading.
        /// </summary>
        /// <param name="tokenStream">The stream of markdown tokens.</param>
        /// <returns>True if a heading is found; otherwise, false.</returns>
        private static bool IsHeading(MarkdownTokenStream tokenStream)
        {
            // Heading: count leading '#'
            return tokenStream.Peek(MarkdownTokenType.Hash) is not null;
        }

        /// <summary>
        /// Attempts to parse a Markdown heading at the current position in the token stream.
        /// Consumes a leading hash-token (indicating a heading) and collects the inline content for the header.
        /// Returns a MarkdownBlockElementHeader if a heading is found, otherwise null.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// Returns a MarkdownBlockElementHeader representing the heading if present at the current position; 
        /// otherwise, returns null.
        /// </returns>
        private static IMarkdownElement ParseHeading(MarkdownTokenStream tokenStream)
        {
            // Try to consume a leading hash token, which indicates a heading
            var hashToken = tokenStream.Consume(MarkdownTokenType.Hash); // #
            int level = hashToken?.Count ?? 1;

            tokenStream.Consume(MarkdownTokenType.Space);
            tokenStream.Consume(MarkdownTokenType.Tab);

            // Parse the collected inline tokens into a MarkdownInlineElement
            var inlineTokenStream = tokenStream.ConsumeLine();
            var inlineElements = ParseInlineElements(inlineTokenStream);

            return new MarkdownBlockElementHeader(level, inlineElements);
        }

        /// <summary>
        /// Checks if the current position in the token stream represents a horizontal rule (at least three hyphens).
        /// Advances the position if a horizontal rule is detected.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// True if a horizontal rule is found; otherwise, false.
        /// </returns>
        private static bool IsHorizontalRule(MarkdownTokenStream tokenStream)
        {
            var line = tokenStream.Preview(MarkdownTokenType.EOL, MarkdownTokenType.EOF);
            var currentToken = line?.Peek
                (
                    MarkdownTokenType.TripleUnderscore,
                    MarkdownTokenType.MultiUnderscore,
                    MarkdownTokenType.TripleHyphen,
                    MarkdownTokenType.MultiHyphen,
                    MarkdownTokenType.TripleStar,
                    MarkdownTokenType.MultiStar,
                    MarkdownTokenType.TripleTilde,
                    MarkdownTokenType.MultiTilde
                );

            if (currentToken is not null)
            {
                line.Skip();
                line.Skip
                (
                    MarkdownTokenType.Space,
                    MarkdownTokenType.Tab
                );

                return line.IsAtEnd();
            }

            return false;
        }

        /// <summary>
        /// Parses a horizontal rule from the current position in the token stream.
        /// Consumes consecutive lines that start with '>' and adds their content as paragraph elements to the blockquote.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// A <see cref="MarkdownBlockElementHorizontalRule"/> containing the parsed content.
        /// </returns>
        private static IMarkdownElement ParseHorizontalRule(MarkdownTokenStream tokenStream)
        {
            _ = tokenStream.ConsumeLine();

            return new MarkdownBlockElementHorizontalRule();
        }

        /// <summary>
        /// Determines whether the current position in the token stream represents a Markdown indentation.
        /// </summary>
        /// <param name="tokenStream">The stream of markdown tokens.</param>
        /// <returns>True if an indentation is found; otherwise, false.</returns>
        private static bool IsIndent(MarkdownTokenStream tokenStream)
        {
            return tokenStream.Peek(MarkdownTokenType.Tab) is not null;
        }

        /// <summary>
        /// Parses an indentation block from the current position in the token stream.
        /// Consumes consecutive lines that start with spaces or tabs and adds their content as paragraph elements.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// A <see cref="MarkdownBlockElementIndent"/> containing the parsed content.
        /// </returns>
        private static IMarkdownElement ParseIndent(MarkdownTokenStream tokenStream)
        {
            var indent = new MarkdownBlockElementIndent();
            var lines = new List<MarkdownTokenStream>();

            do
            {
                tokenStream.Skip(); // Tab
                lines.Add(tokenStream.ConsumeLine());
            } while (IsIndent(tokenStream));

            indent.Add(Parse(new MarkdownTokenStream(lines)).Elements);

            return indent;
        }

        /// <summary>
        /// Checks if the current token is a blockquote marker ('>').
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// True if the next token is of type <see cref="MarkdownTokenType.Greater"/>; otherwise, false.
        /// </returns>
        private static bool IsQuote(MarkdownTokenStream tokenStream)
        {
            return tokenStream.Peek(MarkdownTokenType.Greater) != null &&
                tokenStream.PeekNext(MarkdownTokenType.Space, MarkdownTokenType.Tab) is not null;
        }

        /// <summary>
        /// Parses a blockquote from the current position in the token stream.
        /// Consumes consecutive lines that start with '>' and adds their content as paragraph elements to the blockquote.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// A <see cref="MarkdownBlockElementQuote"/> containing the parsed content.
        /// </returns>
        private static IMarkdownElement ParseQuote(MarkdownTokenStream tokenStream)
        {
            var quote = new MarkdownBlockElementQuote();
            var lines = new List<MarkdownTokenStream>();

            do
            {
                tokenStream.Skip(2); // > + Space/ Tab
                var currentLine = tokenStream.ConsumeLine();
                lines.Add(currentLine);

                currentLine.Skip(MarkdownTokenType.Space, MarkdownTokenType.Tab);
                if (currentLine.IsAtEnd())
                {
                    // empty quotes entry
                    break;
                }
            } while (IsQuote(tokenStream));

            quote.Add(Parse(new MarkdownTokenStream(lines)).Elements);

            return quote;
        }

        /// <summary>
        /// Checks if the current token is a callout marker ('>!!').
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// True if the next token is of type callout otherwise, false.
        /// </returns>
        private static bool IsCallout(MarkdownTokenStream tokenStream)
        {
            return tokenStream.Peek
            (
                MarkdownTokenType.GratherHint,
                MarkdownTokenType.GratherWarning,
                MarkdownTokenType.GratherError,
                MarkdownTokenType.GratherSuccess
            ) is not null && tokenStream.PeekNext(MarkdownTokenType.Space, MarkdownTokenType.Tab) is not null;
        }

        /// <summary>
        /// Parses a callout from the current position in the token stream.
        /// Consumes consecutive lines that start with '>' and adds their content as paragraph elements to the callout.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// A <see cref="MarkdownBlockElementCallout"/> containing the parsed content.
        /// </returns>
        private static IMarkdownElement ParseCallout(MarkdownTokenStream tokenStream)
        {
            var callout = new MarkdownBlockElementCallout();
            var lines = new List<MarkdownTokenStream>();
            var token = tokenStream.Peek();

            callout.CalloutType = token?.Type switch
            {
                MarkdownTokenType.GratherWarning => MarkdownCalloutType.Warning,
                MarkdownTokenType.GratherError => MarkdownCalloutType.Danger,
                MarkdownTokenType.GratherSuccess => MarkdownCalloutType.Success,
                _ => MarkdownCalloutType.Hint
            };

            do
            {
                tokenStream.Skip(2); // > + Space/ Tab
                var currentLine = tokenStream.ConsumeLine();
                lines.Add(currentLine);

                currentLine.Skip(MarkdownTokenType.Space, MarkdownTokenType.Tab);
                if (currentLine.IsAtEnd())
                {
                    // empty quotes entry
                    break;
                }
            } while (IsQuote(tokenStream));

            callout.Add(Parse(new MarkdownTokenStream(lines)).Elements);

            return callout;
        }

        /// <summary>
        /// Checks if the current token is a code marker ('```').
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// True if the current token is of type <see cref="MarkdownTokenType.CodeMarker"/> and its value is exactly '```'; otherwise, false.
        /// </returns>
        private static bool IsCode(MarkdownTokenStream tokenStream)
        {
            // Returns true if the current token is a code marker ('```')
            return tokenStream.Peek(MarkdownTokenType.CodeMarker) is not null;
        }

        /// <summary>
        /// Parses a code from the current position in the token stream.
        /// Consumes consecutive lines that start with '````' and adds their content as code elements.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// A <see cref="MarkdownBlockElementCode"/> containing the parsed content.
        /// </returns>
        private static IMarkdownElement ParseCode(MarkdownTokenStream tokenStream)
        {
            tokenStream.Skip(1); // ```
            var languageToken = tokenStream.ConsumeLine();
            var position = tokenStream.Position;
            var codeBlockStart = tokenStream.Peek();
            var codeBlockEnd = codeBlockStart;

            do
            {
                var line = tokenStream.ConsumeLine();
                codeBlockEnd = line.Tokens.LastOrDefault() ?? codeBlockEnd;
            } while (!tokenStream.IsAtEnd() && !IsCode(tokenStream));

            if (IsCode(tokenStream))
            {
                var code = new MarkdownBlockElementCode();
                tokenStream.ConsumeLine();

                var language = languageToken.GetSource();
                var content = tokenStream.GetSource(codeBlockStart, codeBlockEnd);

                code.Language = !string.IsNullOrWhiteSpace(language) ? language.Trim() : null;
                code.Content = content.TrimEnd();

                return code;
            }
            else
            {
                tokenStream.Seek(position);
            }

            return new MarkdownBlockElementParagraph([new MarkdownInlineElementPlainText("```")]);
        }

        /// <summary>
        /// Determines whether the current token sequence represents the start of a unordered Markdown list.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>True if a unordered list is detected; otherwise, false.</returns>
        private static bool IsList(MarkdownTokenStream tokenStream)
        {
            var preview = tokenStream.Preview()
                .Skip(MarkdownTokenType.Tab, MarkdownTokenType.Space);

            var marker = preview.Peek();
            var next = preview.PeekNext(MarkdownTokenType.Space, MarkdownTokenType.Tab);

            // unordered list check: "*", "-", "+"
            if (marker is not null && next is not null &&
                (marker.Type == MarkdownTokenType.Star ||
                 marker.Type == MarkdownTokenType.Hyphen ||
                 marker.Type == MarkdownTokenType.Plus))
            {
                return true;
            }

            // ordered list check: e.g., "1.", "I.", "A."
            if (marker?.Type == MarkdownTokenType.Text && next is not null)
            {
                var value = marker.Value.TrimStart();

                if (value.Length >= 2 && value.EndsWith("."))
                {
                    var label = value.TrimEnd('.');

                    if (MarkdownListTypeExtensions.TryRomanOrDecimalToInt(label, out _))
                    {
                        return true;
                    }
                    else if (MarkdownListTypeExtensions.TryAlphaIndexToInt(label, out _))
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        /// <summary>
        /// Parses a unordered Markdown list block from the current position in the token stream.
        /// Iterates through the tokens and adds each list item to the list until a non-list item is encountered.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// A <see cref="MarkdownBlockElementList"/> containing the parsed list items.
        /// </returns>
        private static IMarkdownElement ParseList(MarkdownTokenStream tokenStream)
        {
            var lines = new List<(int, int, MarkdownListType, MarkdownTokenStream)>();

            do
            {
                var currentLine = tokenStream.ConsumeLine();
                var indent = currentLine.AsEnumerable()
                    .TakeWhile(token => token.Type == MarkdownTokenType.Tab)
                    .Count();

                currentLine.Skip(MarkdownTokenType.Tab, MarkdownTokenType.Space);
                var currrentToken = currentLine.Consume(); // Text | Star | Hyphen | Plus
                currentLine.Skip(1); //  Space | Tab


                if (currrentToken?.Type == MarkdownTokenType.Text)
                {
                    var orderedNumber = 1;
                    var type = MarkdownListTypeExtensions.ToListType(currrentToken?.Value);

                    switch (type)
                    {
                        case MarkdownListType.UpperAlpha:
                            MarkdownListTypeExtensions.TryAlphaIndexToInt
                            (
                                currrentToken?.Value,
                                out orderedNumber
                            );
                            break;
                        case MarkdownListType.LowerAlpha:
                            MarkdownListTypeExtensions.TryAlphaIndexToInt
                            (
                                currrentToken?.Value,
                                out orderedNumber
                            );
                            break;
                        default:
                            MarkdownListTypeExtensions.TryRomanOrDecimalToInt
                            (
                                currrentToken?.Value,
                                out orderedNumber
                            );
                            break;
                    }

                    // ordered list item
                    lines.Add((indent, orderedNumber, type, currentLine.Preview()));
                }
                else
                {
                    // unordered list item
                    lines.Add((indent, int.MinValue, MarkdownListType.Numeric, currentLine.Preview()));
                }

                currentLine.Skip(MarkdownTokenType.Space, MarkdownTokenType.Tab);
                if (currentLine.IsAtEnd())
                {
                    // empty list entry
                    break;
                }
            } while (IsList(tokenStream));

            var tree = BuildIndentedTree
                (
                    lines.Select
                    (
                        x =>
                        new MarkdownBlockElementListItem
                        (
                            x.Item1,
                            x.Item2,
                            x.Item3,
                            Parse(new MarkdownTokenStream([x.Item4])).Elements
                        )
                    )
                );

            return tree;
        }

        /// <summary>
        /// Checks if the current token represents the start of a Markdown table (pipe symbol).
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// True if the next token is of type <see cref="MarkdownTokenType.Pipe"/>; otherwise, false.
        /// </returns>
        private static bool IsTable(MarkdownTokenStream tokenStream)
        {
            // check for pipe at beginning
            return tokenStream.Peek(MarkdownTokenType.Pipe) is not null;
        }

        /// <summary>
        /// Parses a Markdown table block from the current position in the token stream.
        /// Extracts the header row, skips the divider, and parses all subsequent data rows.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// A <see cref="MarkdownBlockElementTable"/> containing the parsed table data.
        /// </returns>
        private static MarkdownBlockElementTable ParseTable(MarkdownTokenStream tokenStream)
        {
            var table = new MarkdownBlockElementTable();
            var lines = new List<MarkdownTokenStream>();
            var columns = new List<MarkdownTokenStream>();
            var rows = new List<MarkdownTokenStream>();
            var footers = new List<MarkdownTokenStream>();
            var delimiter = new List<MarkdownTokenStream>();
            var buf = new List<MarkdownTokenStream>();
            var columnCellTokens = new Dictionary<int, MarkdownTokenStream>();
            var rowCellTokens = new List<Dictionary<int, MarkdownTokenStream>>();
            var footerCellTokens = new Dictionary<int, MarkdownTokenStream>();

            do
            {
                tokenStream.Skip(); // "|"
                var currentLine = tokenStream.ConsumeLine();
                lines.Add(currentLine);

                currentLine.Skip(MarkdownTokenType.Space, MarkdownTokenType.Tab);
                if (currentLine.IsAtEnd())
                {
                    // empty table entry
                    break;
                }
            } while (IsTable(tokenStream));

            // split lines into columns, rows, and footer
            foreach (var line in lines)
            {
                var preview = line.Preview().Skip(MarkdownTokenType.Space, MarkdownTokenType.Tab);

                // detect header or footer delimiter
                if (preview.Peek
                (
                    MarkdownTokenType.Hyphen,
                    MarkdownTokenType.DoubleHyphen,
                    MarkdownTokenType.TripleHyphen,
                    MarkdownTokenType.MultiHyphen
                ) != null && preview.Skip
                (
                    MarkdownTokenType.Pipe,
                    MarkdownTokenType.DoubleHyphen,
                    MarkdownTokenType.TripleHyphen,
                    MarkdownTokenType.MultiHyphen,
                    MarkdownTokenType.Space
                ).IsAtEnd())
                {
                    if (delimiter.Count == 0)
                    {
                        columns.AddRange(buf);
                    }
                    else
                    {
                        rows.AddRange(buf);
                    }

                    delimiter.Add(line);
                    buf.Clear();
                }
                else
                {
                    buf.Add(line);
                }
            }

            rows = delimiter.Count <= 1 ? buf : rows;
            footers = delimiter.Count > 1 ? buf : footers;

            // process columns
            foreach (var column in columns)
            {
                // split the column into cells using the Pipe token as delimiter
                var columnCells = column.Split(MarkdownTokenType.Pipe);

                for (int i = 0; i < columnCells.Count; i++)
                {
                    if (!columnCellTokens.TryGetValue(i, out MarkdownTokenStream value))
                    {
                        value = new MarkdownTokenStream([], column.GetSource());
                        // initialize the token stream if it doesn't exist
                        columnCellTokens[i] = value;
                    }

                    // update the dictionary with the new merged token stream
                    columnCellTokens[i] = new MarkdownTokenStream([value, columnCells[i]]);
                }
            }

            // process rows
            foreach (var row in rows)
            {
                var followLine = row
                    .Reverse()
                    .Skip(MarkdownTokenType.Space, MarkdownTokenType.Tab, MarkdownTokenType.EOF)
                    .Peek(MarkdownTokenType.DoubleGreater) is not null;

                // split the row into cells using the Pipe token as delimiter
                var rowCells = row.Split(MarkdownTokenType.Pipe);

                // create a dictionary to store the cell tokens for the current row
                var rowTokenDictionary = new Dictionary<int, MarkdownTokenStream>();

                for (int i = 0; i < rowCells.Count; i++)
                {
                    if (!followLine)
                    {
                        // update the dictionary with the new merged token stream
                        rowTokenDictionary[i] = rowCells[i];
                    }
                    else
                    {
                        if (!rowTokenDictionary.TryGetValue(i, out MarkdownTokenStream value))
                        {
                            value = new MarkdownTokenStream([], row.GetSource());
                            // initialize the token stream for the current cell
                            rowTokenDictionary[i] = value;
                        }

                        // update the dictionary with the new merged token stream
                        columnCellTokens[i] = new MarkdownTokenStream([value, rowCells[i]]);
                    }
                }

                // Add the processed row to the list of row dictionaries
                rowCellTokens.Add(rowTokenDictionary);
            }

            // Process footer
            foreach (var footer in footers)
            {
                // Split the footer into cells using the Pipe token as delimiter
                var footerCells = footer.Split(MarkdownTokenType.Pipe);

                for (int i = 0; i < footerCells.Count; i++)
                {
                    // check if the token stream for the current footer cell already exists
                    if (!footerCellTokens.TryGetValue(i, out MarkdownTokenStream existingValue))
                    {
                        // initialize the token stream if it doesn't exist
                        existingValue = new MarkdownTokenStream([], footer.GetSource());
                        footerCellTokens[i] = existingValue;
                    }

                    // merge the existing tokens with the new cell tokens
                    var mergedTokens = new List<MarkdownToken>(existingValue.Tokens);
                    mergedTokens.AddRange(footerCells[i].Tokens);

                    // update the dictionary with the new merged token stream
                    footerCellTokens[i] = new MarkdownTokenStream(mergedTokens, footer.GetSource());
                }
            }

            // retrieve the maximum column count across columns, rows, and footers
            var maxColumnCount = Math.Max
            (
                Math.Max(columnCellTokens.Count, rowCellTokens.Max(row => row.Count)),
                footerCellTokens.Count
            );

            // add existing columns to the table
            foreach (var cell in columnCellTokens)
            {
                table.AddColumn(new MarkdownBlockElementTableCell(Parse(cell.Value)?.Elements));
            }

            // fill the table with empty columns if necessary to match the maximum column count
            for (int c = columnCellTokens.Count; c < maxColumnCount; c++)
            {
                table.AddColumn(new MarkdownBlockElementTableCell());
            }

            // add existing rows to the table
            foreach (var row in rowCellTokens)
            {
                var cells = new List<MarkdownBlockElementTableCell>();
                foreach (var cell in row)
                {
                    cells.Add(new MarkdownBlockElementTableCell(Parse(cell.Value)?.Elements));
                }

                // fill the row with empty cells if necessary to match the maximum column count
                for (int c = row.Count; c < maxColumnCount; c++)
                {
                    cells.Add(new MarkdownBlockElementTableCell());
                }

                table.AddRow(cells);
            }

            // add existing footer columns to the table
            foreach (var cell in footerCellTokens)
            {
                table.AddFooter(new MarkdownBlockElementTableCell(Parse(cell.Value)?.Elements));
            }

            if (delimiter.Count > 1)
            {
                // fill the table with empty footer columns if necessary to match the maximum column count
                for (int c = footerCellTokens.Count; c < maxColumnCount; c++)
                {
                    table.AddFooter(new MarkdownBlockElementTableCell());
                }
            }

            return table;
        }

        /// <summary>
        /// Parses a Markdown paragraph from the current position in the token stream.
        /// Collects all tokens until an end-of-line or end-of-file token is reached.
        /// </summary>
        /// <param name="tokenStream">The stream of Markdown tokens to parse from.</param>
        /// <returns>
        /// A <see cref="MarkdownBlockElementParagraph"/> containing the parsed inline elements of the paragraph.
        /// </returns>
        private static MarkdownBlockElementParagraph ParseParagraph(MarkdownTokenStream tokenStream)
        {
            var paragraph = new MarkdownBlockElementParagraph();
            var lines = new List<MarkdownTokenStream>();

            do
            {
                var currentLine = tokenStream.ConsumeLine();
                lines.Add(currentLine);

                currentLine.Skip(MarkdownTokenType.Space, MarkdownTokenType.Tab);
                if (currentLine.IsAtEnd())
                {
                    // empty paragraph
                    break;
                }
            } while
            (
                !tokenStream.IsAtEnd() &&
                !IsHeading(tokenStream) &&
                !IsHorizontalRule(tokenStream) &&
                !IsIndent(tokenStream) &&
                !IsQuote(tokenStream) &&
                !IsCallout(tokenStream) &&
                !IsCode(tokenStream) &&
                !IsList(tokenStream) &&
                !IsTable(tokenStream)
            );

            paragraph.Add(ParseInlineElements(new MarkdownTokenStream(lines)));

            return paragraph;
        }

        /// <summary>
        /// Parses the input string into a list of Markdown inline elements.
        /// Handles bold, underline, strikethrough, italics, images, links, autolinks, and plain text.
        /// Uses recursive parsing for nested inline elements.
        /// </summary>
        /// <param name="tokenStream">The stream of markdown tokens.</param>
        /// <returns>A list of <see cref="MarkdownInlineElement"/> representing the parsed inlines.</returns>
        private static IEnumerable<MarkdownInlineElement> ParseInlineElements(MarkdownTokenStream tokenStream)
        {
            var inlines = new List<MarkdownInlineElement>();

            MarkdownToken token;
            while ((token = tokenStream.Consume()) is not null)
            {
                switch (token.Type)
                {
                    // check for plain text
                    case MarkdownTokenType.Text:
                        {
                            inlines.Add(new MarkdownInlineElementPlainText(token.Value));
                            break;
                        }
                    // check for italic (*text*)
                    case MarkdownTokenType.Star:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.Star);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched
                                inlines.Add(new MarkdownInlineElementItalic(ParseInlineElements(innerTokens)));
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("*"));
                            }
                            break;
                        }
                    // check for bold (**text**)
                    case MarkdownTokenType.DoubleStar:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.DoubleStar);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched

                                inlines.Add(new MarkdownInlineElementBold(ParseInlineElements(innerTokens)));
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("**"));
                            }
                            break;
                        }
                    // check for bold+italic (***text***)
                    case MarkdownTokenType.TripleStar:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.TripleStar);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched

                                inlines.Add
                                (
                                    new MarkdownInlineElementBold
                                    (
                                        [
                                            new MarkdownInlineElementItalic(ParseInlineElements(innerTokens))
                                        ]
                                    )
                                );
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("***"));
                            }
                            break;
                        }
                    // check for underline (_text_)
                    case MarkdownTokenType.Underscore:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.Underscore);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched

                                inlines.Add(new MarkdownInlineElementUnderline(ParseInlineElements(innerTokens)));
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("_"));
                            }
                            break;
                        }
                    // check for underline+bold (__text__)
                    case MarkdownTokenType.DoubleUnderscore:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.DoubleUnderscore);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched

                                inlines.Add
                                (
                                    new MarkdownInlineElementUnderline
                                    (
                                        [new MarkdownInlineElementBold(ParseInlineElements(innerTokens))]
                                    )
                                );
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("__"));
                            }
                            break;
                        }
                    // check for underline+bold-italic (___text___)
                    case MarkdownTokenType.TripleUnderscore:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.TripleUnderscore);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched

                                inlines.Add
                                (
                                    new MarkdownInlineElementUnderline
                                    (
                                        [
                                            new MarkdownInlineElementBold
                                        (
                                            [new MarkdownInlineElementItalic(ParseInlineElements(innerTokens))]
                                        )
                                        ]
                                    )
                                );
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("___"));
                            }
                            break;
                        }
                    // check for strikethrough (~text~)
                    case MarkdownTokenType.Tilde:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.Tilde);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched

                                inlines.Add(new MarkdownInlineElementStrikethrough(ParseInlineElements(innerTokens)));
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("~"));
                            }
                            break;
                        }
                    // check for strikethrough (~~text~~)
                    case MarkdownTokenType.DoubleTilde:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.DoubleTilde);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched

                                inlines.Add(new MarkdownInlineElementStrikethrough(ParseInlineElements(innerTokens)));
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("~~"));
                            }
                            break;
                        }
                    // check for strikethrough+bold (~~~text~~~)
                    case MarkdownTokenType.TripleTilde:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.TripleTilde);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched

                                inlines.Add
                                (
                                    new MarkdownInlineElementStrikethrough
                                    (
                                        [
                                            new MarkdownInlineElementBold(ParseInlineElements(innerTokens))
                                        ]
                                    )
                                );
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("~~~"));
                            }
                            break;
                        }
                    // check for marked text (==highlight==)
                    case MarkdownTokenType.DoubleEqual:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.DoubleEqual);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched

                                inlines.Add
                                (
                                    new MarkdownInlineElementMarked(ParseInlineElements(innerTokens))
                                );
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("=="));
                            }
                            break;
                        }
                    // check for code (`code`)
                    case MarkdownTokenType.Backtick:
                        {
                            var innerTokens = tokenStream.Preview(MarkdownTokenType.Backtick);

                            if (innerTokens?.IsAtEnd() == false)
                            {
                                tokenStream.Skip(innerTokens.Count()); // skip matched

                                inlines.Add(new MarkdownInlineElementCode(innerTokens.GetSource()));
                            }
                            else
                            {
                                inlines.Add(new MarkdownInlineElementPlainText("`"));
                            }
                            break;
                        }
                    case MarkdownTokenType.Url:
                        {
                            inlines.Add(new MarkdownInlineElementUrl(token.Value));
                            break;
                        }
                    case MarkdownTokenType.Image:
                        {
                            inlines.Add(new MarkdownInlineElementImage(token.Parameter, token.Value));
                            break;
                        }
                    case MarkdownTokenType.Link:
                        {
                            inlines.Add(new MarkdownInlineElementLink(token.Parameter, token.Value));
                            break;
                        }
                    case MarkdownTokenType.Html:
                        {
                            inlines.Add(new MarkdownInlineElementHtml(token.Value));
                            break;
                        }
                    case MarkdownTokenType.Checkbox:
                        {
                            inlines.Add(new MarkdownInlineElementCheckbox(token.Value));
                            break;
                        }
                    case MarkdownTokenType.Footnote:
                        {
                            inlines.Add(new MarkdownInlineElementFootnote(token.Value));
                            break;
                        }
                    case MarkdownTokenType.Space:
                        {
                            inlines.Add(new MarkdownInlineElementPlainText(" "));
                            break;
                        }
                    case MarkdownTokenType.Tab:
                        {
                            inlines.Add(new MarkdownInlineElementPlainText("    "));
                            break;
                        }
                    case MarkdownTokenType.EOF:
                        {
                            break;
                        }
                    case MarkdownTokenType.EOL:
                        {
                            break;
                        }
                    default:
                        {
                            inlines.Add(new MarkdownInlineElementPlainText(token.Value));
                            break;
                        }
                }
            }

            return inlines;
        }

        /// <summary>
        /// Builds a hierarchical <see cref="MarkdownBlockElementList"/> from a flat, preorder list of items. 
        /// Each indentation level creates a nested list, unless there's only a single child.
        /// </summary>
        /// <param name="items">
        /// A preorder-sorted list of <see cref="MarkdownBlockElementListItem"/> elements, each with indentation metadata.
        /// </param>
        /// <returns>
        /// A fully nested <see cref="MarkdownBlockElementList"/> structure reflecting list hierarchy.
        /// </returns>
        private static MarkdownBlockElementList BuildIndentedTree(IEnumerable<MarkdownBlockElementListItem> items)
        {
            var itemList = items.ToList();
            int index = 0;

            Func<int, MarkdownBlockElementList> traverse = null!;
            traverse = currentIndent =>
            {
                var list = new MarkdownBlockElementList();

                while (index < itemList.Count && itemList[index].Indent >= currentIndent)
                {
                    var item = itemList[index++];
                    var child = traverse(item.Indent + 1);

                    if (child is null || child?.Items?.Any() == false)
                    {
                        list.Add(item);
                    }
                    else
                    {
                        list.Add(item);
                        list.Add(child);
                    }

                    list.Ordered = item.OrderedNumber >= 0;
                }

                return list;
            };

            return traverse(0);
        }
    }
}