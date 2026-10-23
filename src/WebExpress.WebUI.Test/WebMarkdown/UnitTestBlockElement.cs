using System.Reflection;
using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebMarkdown.Element;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Unit tests for block-level elements in Markdown.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestBlockElement
    {
        /// <summary>
        /// Tests whether the parser returns an empty document when provided with an empty input string.
        /// The test verifies that no block elements are created for empty input.
        /// </summary>
        [Fact]
        public void EmptyInput()
        {
            // act
            var doc = MarkdownParser.Parse("");

            // validation
            Assert.Empty(doc.Elements);
        }

        /// <summary>
        /// Tests whether the parser returns an empty document when provided with input containing only whitespace or blank lines.
        /// The test verifies that no block elements are created for such input.
        /// </summary>
        [Theory]
        [InlineData("   ")]
        [InlineData("\n\n\n")]
        [InlineData(" \n \n")]
        [InlineData(" \t \n")]
        public void WhitespaceOnly(string input)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.Empty(doc.GetPlainText().Trim());
        }

        /// <summary>
        /// Tests if headings with varying numbers of hash characters are correctly recognized and parsed as MarkdownBlockElementHeader.
        /// The test checks both the heading level and the extracted text content.
        /// </summary>
        [Theory]
        [InlineData("# Header One", 1, "Header One")]
        [InlineData("## Header Two", 2, "Header Two")]
        [InlineData("### Header Three", 3, "Header Three")]
        [InlineData("### Header *Three*", 3, "Header Three")]
        [InlineData("### Header **Three**", 3, "Header Three")]
        [InlineData("### Header __Three__", 3, "Header Three")]
        [InlineData("#### Header Four", 4, "Header Four")]
        [InlineData("##### Header Five", 5, "Header Five")]
        [InlineData("###### Header Six", 6, "Header Six")]
        [InlineData("####### Header Over", 6, "Header Over")] // Level 7 should also be parsed as level 6
        public void Header(string input, int expectedLevel, string expectedText)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.Single(doc.Elements);
            var header = Assert.IsType<MarkdownBlockElementHeader>(doc.Elements.FirstOrDefault());
            Assert.Equal(expectedLevel, header.Level);
            Assert.Equal(expectedText, header.PlainText.Trim());
        }

        /// <summary>
        /// Tests if indent (starting with '\t or spaces') are correctly recognized and parsed,
        /// even when preceded by tabs or spaces as indentation. The test ensures that the indentation is handled
        /// and does not interfere with the recognition of the Markdown element.
        /// </summary>
        [Theory]
        [InlineData("\tIndent One", "Indent One", 1)]
        [InlineData("\t\tIndent Two", "Indent Two", 2)]
        [InlineData("\t\t\tIndent Three", "Indent Three", 3)]
        [InlineData("\t\t\t\tIndent Four", "Indent Four", 4)]
        [InlineData("\t\t\t\t\tIndent Five", "Indent Five", 5)]
        [InlineData("\t\t\t\t\t\tIndent Six", "Indent Six", 6)]
        [InlineData("\tMultiline\n\tIndent", "Multiline Indent", 1)]
        public void Indent(string input, string expected, int count)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.Single(doc.Elements);
            var element = doc.Elements.FirstOrDefault();
            Assert.IsType<MarkdownBlockElementIndent>(element);

            for (int i = 0; i < count - 1; i++)
            {
                element = (element as MarkdownBlockElementIndent).Content.FirstOrDefault();
                Assert.IsType<MarkdownBlockElementIndent>(element);
            }

            Assert.Equal(expected, element.PlainText);
        }

        /// <summary>
        /// Tests whether simple paragraphs are correctly recognized and parsed as MarkdownBlockElementParagraph.
        /// The test verifies that the paragraph contains exactly one inline element of type MarkdownInlineElementPlainText
        /// and that the plain text matches the expected value.
        /// </summary>
        [Theory]
        [InlineData("A paragraph.", "A paragraph.")]
        [InlineData("Another paragraph.", "Another paragraph.")]
        [InlineData("A paragraph.\n\nAnother paragraph.", "A paragraph.")]
        [InlineData("A multiline\n paragraph.\n\nAnother paragraph.", "A multiline paragraph.")]
        public void Paragraph(string input, string expected)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.NotEmpty(doc.Elements);
            var text = doc.Elements.FirstOrDefault().PlainText;
            Assert.Equal(expected, text);
        }

        /// <summary>
        /// Tests whether blockquotes (lines starting with '>') are correctly recognized and parsed as MarkdownBlockElementQuote.
        /// The test checks that the blockquote is parsed as a single element and that its content matches the expected text.
        /// </summary>
        [Theory]
        [InlineData("> Quote", "Quote")]
        [InlineData("> Another quote", "Another quote")]
        [InlineData("> Multiline\n> quote", "Multiline quote")]
        [InlineData("> *Multiline*\n> **quote**", "Multiline quote")]
        [InlineData("> Multiline\n> quote\n\nAnother", "Multiline quote")]
        [InlineData("> Multiline\n> quote\n> \n> Another quote", "Multiline quote")]
        public void Quote(string input, string expected)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.NotEmpty(doc.Elements);
            var quote = Assert.IsType<MarkdownBlockElementQuote>(doc.Elements.FirstOrDefault());
            var content = quote.PlainText;
            Assert.Equal(expected, content);
        }

        /// <summary>
        /// Tests the tokenization of nested blockquotes in the format >>>.
        /// </summary>
        [Theory]
        [InlineData("> > Nested blockquote content.")]
        public void Quote_Nested(string input)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.NotEmpty(doc.Elements);
            Assert.IsType<MarkdownBlockElementQuote>(doc.Elements.FirstOrDefault());
        }

        /// <summary>
        /// Tests the tokenization of invalid nested blockquotes.
        /// </summary>
        [Theory]
        [InlineData(">> Nested blockquote content.")]
        public void Quote_Nested_Invalid(string input)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.NotEmpty(doc.Elements);
            Assert.IsNotType<MarkdownBlockElementQuote>(doc.Elements.FirstOrDefault());
        }

        /// <summary>
        /// Tests whether callout (lines starting with '>...') are correctly recognized and parsed as MarkdownBlockElementQuote.
        /// The test checks that the blockquote is parsed as a single element and that its content matches the expected text.
        /// </summary>
        [Theory]
        [InlineData(">? Hint", "Hint", MarkdownCalloutType.Hint)]
        [InlineData(">! Warning", "Warning", MarkdownCalloutType.Warning)]
        [InlineData(">!! Error", "Error", MarkdownCalloutType.Danger)]
        [InlineData(">* Success", "Success", MarkdownCalloutType.Success)]
        [InlineData(">? Another hint", "Another hint", MarkdownCalloutType.Hint)]
        [InlineData(">? Multiline\n> hint", "Multiline hint", MarkdownCalloutType.Hint)]
        [InlineData(">! *Multiline*\n> **warning**", "Multiline warning", MarkdownCalloutType.Warning)]
        [InlineData(">! Multiline\n> warning\n\nAnother", "Multiline warning", MarkdownCalloutType.Warning)]
        [InlineData(">!! Multiline\n> error\n> \n>!! Another error", "Multiline error", MarkdownCalloutType.Danger)]
        public void Callout(string input, string expected, MarkdownCalloutType expectedType)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.NotEmpty(doc.Elements);
            var callout = Assert.IsType<MarkdownBlockElementCallout>(doc.Elements.FirstOrDefault());
            var content = callout.PlainText;
            Assert.Equal(expected, content);
            Assert.Equal(expectedType, callout.CalloutType);
        }

        /// <summary>
        /// Tests whether horizontal rules (e.g. "---", "***") are correctly recognized and parsed as MarkdownBlockElementHorizontalRule.
        /// The test checks that the Markdown input is parsed into a single block element of the expected type.
        /// </summary>
        [Theory]
        [InlineData("___")]
        [InlineData("_______")]
        [InlineData("---")]
        [InlineData("-------")]
        [InlineData("***")]
        [InlineData("*******")]
        [InlineData("~~~")]
        [InlineData("~~~~~~~")]
        public void HorizontalRule(string input)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.Single(doc.Elements);
            Assert.IsType<MarkdownBlockElementHorizontalRule>(doc.Elements.FirstOrDefault());
        }

        /// <summary>
        /// Tests whether input strings that do not represent valid horizontal rules
        /// are not recognized as MarkdownBlockElementHorizontalRule.
        /// The test ensures that invalid Markdown input does not produce a block element of the expected type.
        /// </summary>
        [Theory]
        [InlineData("--")]
        [InlineData("**")]
        [InlineData("-*-")]
        [InlineData("*-*-*")]
        [InlineData("*** Text")]
        [InlineData("~~~***___---")]
        public void HorizontalRule_Invalid(string input)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.Single(doc.Elements); // Ensure there is only one block element
            Assert.IsNotType<MarkdownBlockElementHorizontalRule>(doc.Elements.FirstOrDefault());
        }

        /// <summary>
        /// Tests whether fenced code blocks are correctly recognized and parsed as MarkdownBlockElementCode.
        /// The test verifies that the code content and the optional language (e.g. "csharp") are correctly extracted.
        /// It checks both code blocks with and without a specified language.
        /// </summary>
        [Theory]
        [InlineData("```csharp\nConsole.WriteLine(\"Hello\");\n```", "Console.WriteLine(\"Hello\");", "csharp")]
        [InlineData("```\nplain code\n```", "plain code", null)]
        [InlineData("```csharp\nConsole.WriteLine(\"Hello\");\n```extra", "Console.WriteLine(\"Hello\");", "csharp")] // closing fence with extra characters
        [InlineData("```csharp\nnested```\n```", "nested```", "csharp")] // nested fence
        public void CodeBlock(string input, string expectedCode, string expectedLang)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.Single(doc.Elements);
            var code = Assert.IsType<MarkdownBlockElementCode>(doc.Elements.FirstOrDefault());
            Assert.Equal(expectedCode, code.Content.Trim());
            Assert.Equal(expectedLang, code.Language);
        }

        /// <summary>
        /// Tests whether invalid fenced code blocks are correctly detected and rejected.
        /// The test checks that in case of invalid syntax (e.g. missing closing backticks, nested blocks, inconsistent fence length)
        /// no valid MarkdownBlockElementCode is created.
        /// </summary>
        [Theory]
        [InlineData("```csharp\nConsole.WriteLine(\"Hello\");\n``")] // fence too short
        [InlineData("``csharp\nConsole.WriteLine(\"Hello\");\n```")] // opening fence too short
        [InlineData("```csharp\nConsole.WriteLine(\"Hello\");")] // no closing fence
        public void CodeBlock_Invalid(string input)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation: No code elements should be created
            Assert.DoesNotContain(doc.Elements, e => e is MarkdownBlockElementCode);
        }

        /// <summary>
        /// Tests whether unordered lists (with '-' or '*') are correctly recognized and parsed as MarkdownBlockElementList.
        /// The test checks that the number of list items matches the expected count
        /// and that the first item contains the expected text as a MarkdownInlineElementPlainText.
        /// </summary>
        [Theory]
        [InlineData("- Item 1\n- Item 2", "Item 1", 1, 2, 0)]
        [InlineData("+ Item 1\n+ Item 2", "Item 1", 1, 2, 0)]
        [InlineData("* Point A\n* Point B\n* Point C", "Point A", 1, 3, 0)]
        [InlineData("* Point A\n\n* Point B\n\n* Point C", "Point A", 3, 1, 0)]
        [InlineData("- Point A\n\n* Point B\n\n+ Point C", "Point A", 3, 1, 0)]
        [InlineData("Features:\n* Feature A\n* Feature B\n* Feature C", "Feature A", 2, 3, 1)]
        [InlineData("- **Feature**: A", "Feature : A", 1, 1, 0)]
        public void List(string input, string firstItemText, int expectedCount, int listCount, int skipCount)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.Equal(expectedCount, doc.Elements.Count());
            var list = Assert.IsType<MarkdownBlockElementList>(doc.Elements.Skip(skipCount).FirstOrDefault());
            Assert.Equal(listCount, list.Items.Count());
            var item = list.Items.FirstOrDefault();
            var paragraph = Assert.IsType<MarkdownBlockElementParagraph>(item.Content.FirstOrDefault());
            Assert.Equal(firstItemText, paragraph.PlainText);
        }

        /// <summary>
        /// Tests whether ordered lists are correctly recognized and parsed as MarkdownBlockElementList.
        /// The test checks that the number of list items matches the expected count
        /// and that the first item contains the expected text as a MarkdownInlineElementPlainText.
        /// </summary>
        [Theory]
        [InlineData("1. Item 1\n2. Item 2", 2, "Item 1", 1)]
        [InlineData("1. Item 1\n\n1. Item 2", 1, "Item 1", 2)]
        public void OrderedList(string input, int expectedCount, string firstItemText, int listCount)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.Equal(listCount, doc.Elements.Count());
            var list = Assert.IsType<MarkdownBlockElementList>(doc.Elements.FirstOrDefault());
            Assert.Equal(expectedCount, list.Items.Count());
            var item = list.Items.FirstOrDefault();
            var paragraph = Assert.IsType<MarkdownBlockElementParagraph>(item.Content.FirstOrDefault());
            Assert.Equal(firstItemText, paragraph.PlainText);
        }

        /// <summary>
        /// Tests whether multiple paragraphs separated by blank lines are correctly recognized and parsed as individual MarkdownBlockElementParagraph elements.
        /// The test verifies that the number of paragraph blocks matches the expected value and that each block is of type MarkdownBlockElementParagraph.
        /// </summary>
        [Theory]
        [InlineData("Paragraph one.\n\nParagraph two.", 2)]
        [InlineData("Paragraph A.\n\nParagraph B.\n\nParagraph C.", 3)]
        public void MultiParagraphs(string input, int expected)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.Equal(expected, doc.Elements.Count());
            Assert.All(doc.Elements, e => Assert.IsType<MarkdownBlockElementParagraph>(e));
        }

        /// <summary>
        /// Tests whether a markdown table is correctly parsed, verifying the number of headers, their values,
        /// the number of rows, and the flattened cell values in reading order.
        /// </summary>
        [Theory]
        [InlineData("WebExpress.WebUI.Test.Data.TableExample1.md", 4, 3, 0)]
        [InlineData("WebExpress.WebUI.Test.Data.TableExample2.md", 6, 3, 0)]
        [InlineData("WebExpress.WebUI.Test.Data.TableExample3.md", 4, 3, 0)]
        public void Table(string fileName, int expectedColumnCount, int expectedRowCount, int expectedFooterCount)
        {
            // arrange
            var markdown = LoadEmbeddedResource(fileName);

            // act
            var doc = MarkdownParser.Parse(markdown);

            // validation
            Assert.Equal(3, doc.Elements.Count());
            var table = Assert.IsType<MarkdownBlockElementTable>(doc.Elements.Skip(1).FirstOrDefault());
            Assert.Equal(expectedColumnCount, table.Columns.Count());
            Assert.Equal(expectedRowCount, table.Rows.Count());
            Assert.Equal(expectedFooterCount, table.Footers.Count());
            Assert.All(table.Rows, row => Assert.Equal(expectedColumnCount, row.Count()));
        }

        /// <summary>
        /// Tests that the closing pipe of a row ends its last cell instead of opening a
        /// further, empty one, while a cell that is empty on purpose is kept.
        /// </summary>
        [Theory]
        [InlineData("| a | b |\n|---|---|\n| 1 | 2 |", 2)]
        [InlineData("| a | b |  \n|---|---|  \n| 1 | 2 |  ", 2)]
        [InlineData("| a | b\n|---|---\n| 1 | 2", 2)]
        [InlineData("| a | b | |\n|---|---|---|\n| 1 | 2 | |", 3)]
        public void TableClosingPipe(string markdown, int expectedColumnCount)
        {
            // act
            var table = Assert.IsType<MarkdownBlockElementTable>(Assert.Single(MarkdownParser.Parse(markdown).Elements));

            // validation
            Assert.Equal(expectedColumnCount, table.Columns.Count());
            var row = Assert.Single(table.Rows).ToList();
            Assert.Equal(expectedColumnCount, row.Count);
            Assert.Equal("2", row[1].PlainText);
        }

        /// <summary>
        /// Tests that the delimiter row declares the alignment of its columns and that it
        /// is carried to the header, the body and the footer cells of each column.
        /// </summary>
        [Theory]
        [InlineData("|:---|---:|:---:|---|")]
        [InlineData("| :--- | ---: | :---: | --- |")]
        [InlineData("|:-|-:|:-:|--|")]
        public void TableAlignment(string delimiter)
        {
            // arrange
            var markdown = $"| a | b | c | d |\n{delimiter}\n| 1 | 2 | 3 | 4 |\n|---|---|---|---|\n| x | y | z | w |";
            MarkdownCellAlign[] expected = [MarkdownCellAlign.Left, MarkdownCellAlign.Right, MarkdownCellAlign.Center, MarkdownCellAlign.Left];

            // act
            var table = Assert.IsType<MarkdownBlockElementTable>(Assert.Single(MarkdownParser.Parse(markdown).Elements));

            // validation
            Assert.Equal(new[] { "a", "b", "c", "d" }, table.Columns.Select(c => c.PlainText));
            Assert.Equal(new[] { "1", "2", "3", "4" }, Assert.Single(table.Rows).Select(c => c.PlainText));
            Assert.Equal(new[] { "x", "y", "z", "w" }, table.Footers.Select(c => c.PlainText));
            Assert.Equal(expected, table.Columns.Select(c => c.Align));
            Assert.Equal(expected, Assert.Single(table.Rows).Select(c => c.Align));
            Assert.Equal(expected, table.Footers.Select(c => c.Align));
        }

        /// <summary>
        /// Tests that a row ending in <c>&gt;&gt;</c> continues on the next line: the cells of
        /// both lines are joined column by column into one row, and the marker is no cell.
        /// </summary>
        [Theory]
        [InlineData("| Name | City |\n|---|---|\n| Mario | Mushroom |>>\n| | Kingdom |\n| Peach | Royal Castle |")]
        [InlineData("| Name | City |\n|---|---|\n| Mario | Mushroom | >>  \n|  | Kingdom\n| Peach | Royal Castle")]
        [InlineData("| Name | City |\n|---|---|\n| Mario | Mushroom >>\n| | Kingdom |\n| Peach | Royal Castle |")]
        public void TableContinuation(string markdown)
        {
            // act
            var table = Assert.IsType<MarkdownBlockElementTable>(Assert.Single(MarkdownParser.Parse(markdown).Elements));
            var rows = table.Rows.Select(r => r.Select(c => c.PlainText).ToArray()).ToList();

            // validation
            Assert.Equal(2, table.Columns.Count());
            Assert.Equal(2, rows.Count);
            Assert.Equal(new[] { "Mario", "Mushroom Kingdom" }, rows[0]);
            Assert.Equal(new[] { "Peach", "Royal Castle" }, rows[1]);
        }

        /// <summary>
        /// Tests that continued lines can span more than two lines and that a marker on
        /// the last line of the table, with nothing to continue into, is dropped.
        /// </summary>
        [Fact]
        public void TableContinuationChain()
        {
            // act
            var table = Assert.IsType<MarkdownBlockElementTable>(Assert.Single(MarkdownParser.Parse("| a | b |\n|---|---|\n| 1 | x |>>\n| | y |>>\n| | z |>>").Elements));

            // validation
            Assert.Equal(new[] { "1", "x y z" }, Assert.Single(table.Rows).Select(c => c.PlainText));
        }

        /// <summary>
        /// Tests that inline code survives in every part of a table; a code span is cut
        /// from the source text, so a cell must keep the source its tokens point into.
        /// </summary>
        [Fact]
        public void TableInlineCode()
        {
            // act
            var table = Assert.IsType<MarkdownBlockElementTable>(Assert.Single(MarkdownParser.Parse("| `h` | b |\n|---|---|\n| `r` | 2 |>>\n| | `c` |\n|---|---|\n| `f` | 3 |").Elements));

            // validation
            Assert.Equal("h", table.Columns.First().PlainText);
            Assert.Equal(new[] { "r", "2 c" }, Assert.Single(table.Rows).Select(c => c.PlainText));
            Assert.Equal("f", table.Footers.First().PlainText);
        }

        /// <summary>
        /// Tests that a cell holds inline content in one paragraph, so text that would open
        /// a block at the start of a line stays text inside a cell.
        /// </summary>
        [Theory]
        [InlineData("#12")]
        [InlineData("- open")]
        [InlineData("1. first")]
        [InlineData("> quoted")]
        public void TableCellIsInline(string text)
        {
            // act
            var table = Assert.IsType<MarkdownBlockElementTable>(Assert.Single(MarkdownParser.Parse($"| a | b |\n|---|---|\n| {text} | **bold** and `code` |").Elements));
            var row = Assert.Single(table.Rows).ToList();

            // validation
            var plain = Assert.IsType<MarkdownBlockElementParagraph>(Assert.Single(row[0].Content));
            Assert.Equal(text, string.Concat(plain.Content.Select(x => x.PlainText)));
            var formatted = Assert.IsType<MarkdownBlockElementParagraph>(Assert.Single(row[1].Content));
            Assert.IsType<MarkdownInlineElementBold>(formatted.Content.First());
            Assert.IsType<MarkdownInlineElementCode>(formatted.Content.Last());
        }

        /// <summary>
        /// Tests that a table that has a header but no body yet is read as such.
        /// </summary>
        [Fact]
        public void TableWithoutBody()
        {
            // act
            var table = Assert.IsType<MarkdownBlockElementTable>(Assert.Single(MarkdownParser.Parse("| a | b |\n|:---|---:|").Elements));

            // validation
            Assert.Equal(new[] { "a", "b" }, table.Columns.Select(c => c.PlainText));
            Assert.Equal(new[] { MarkdownCellAlign.Left, MarkdownCellAlign.Right }, table.Columns.Select(c => c.Align));
            Assert.Empty(table.Rows);
        }

        /// <summary>
        /// Tests that a body row of lone hyphens - the usual "not available" - stays a row
        /// instead of being taken for a footer delimiter.
        /// </summary>
        [Fact]
        public void TableHyphenRow()
        {
            // act
            var table = Assert.IsType<MarkdownBlockElementTable>(Assert.Single(MarkdownParser.Parse("| a | b |\n|---|---|\n| - | - |\n| 1 | 2 |").Elements));

            // validation
            Assert.Equal(2, table.Rows.Count());
            Assert.Empty(table.Footers);
            Assert.Equal(new[] { "-", "-" }, table.Rows.First().Select(c => c.PlainText));
            Assert.Equal(new[] { "1", "2" }, table.Rows.Last().Select(c => c.PlainText));
        }

        /// <summary>
        /// Loads an embedded resource as a string.
        /// </summary>
        /// <param name="resourceName">The fully qualified resource name.</param>
        /// <returns>The contents of the embedded resource.</returns>
        private static string LoadEmbeddedResource(string resourceName)
        {
            var assembly = Assembly.GetExecutingAssembly();
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream is null)
            {
                throw new FileNotFoundException("Resource not found: " + resourceName);
            }

            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
    }
}