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
        [InlineData("WebExpress.WebUI.Test.Data.TableExample1.md", 5, 3, 0)]
        [InlineData("WebExpress.WebUI.Test.Data.TableExample2.md", 7, 3, 0)]
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