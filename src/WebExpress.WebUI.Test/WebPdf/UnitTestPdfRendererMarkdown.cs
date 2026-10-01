using System.Reflection;
using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebMarkdown.Element;
using WebExpress.WebUI.WebPdf;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.Test.WebPdf
{
    /// <summary>
    /// Tests converting markdown into the PDF model (PdfRendererMarkdown), the counterpart of
    /// the HTML renderer of the same AST.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestPdfRendererMarkdown
    {
        /// <summary>
        /// Tests that headings keep their level.
        /// </summary>
        [Theory]
        [InlineData("# Title", 1)]
        [InlineData("### Title", 3)]
        [InlineData("###### Title", 6)]
        public void Heading(string markdown, int level)
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf(markdown);

            // validation
            var heading = Assert.IsType<PdfBlockElementHeading>(Assert.Single(document.Elements));
            Assert.Equal(level, heading.Level);
            Assert.Equal("Title", heading.PlainText);
        }

        /// <summary>
        /// Tests that the inline notations become styles of the text runs.
        /// </summary>
        [Fact]
        public void InlineStyles()
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("**bold** *italic* ~~strike~~ ==mark== `code` ***both***");
            var runs = Assert.IsType<PdfBlockElementParagraph>(Assert.Single(document.Elements)).Content.OfType<PdfInlineElementText>().ToList();

            // validation
            Assert.True(runs.Single(r => r.Text == "bold").Style.Bold);
            Assert.True(runs.Single(r => r.Text == "italic").Style.Italic);
            Assert.True(runs.Single(r => r.Text == "strike").Style.Strikethrough);
            Assert.NotNull(runs.Single(r => r.Text == "mark").Style.Background);
            Assert.Equal(PdfFontFamily.Courier, runs.Single(r => r.Text == "code").Style.FontFamily);
            Assert.True(runs.Single(r => r.Text == "both").Style is { Bold: true, Italic: true });
        }

        /// <summary>
        /// Tests that links keep their address and plain addresses become links.
        /// </summary>
        [Theory]
        [InlineData("[WebExpress](https://github.com/webexpress-framework)", "WebExpress", "https://github.com/webexpress-framework")]
        [InlineData("see https://example.com", "https://example.com", "https://example.com")]
        public void Link(string markdown, string text, string href)
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf(markdown);
            var runs = document.Elements.OfType<PdfBlockElementParagraph>().SelectMany(p => p.Content).OfType<PdfInlineElementText>();

            // validation
            Assert.Equal(href, runs.Single(r => r.Text == text).Style.Link);
        }

        /// <summary>
        /// Tests the list types and that a nested list becomes a block of the item before it.
        /// </summary>
        [Fact]
        public void List()
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("1. one\n2. two\n   - nested");

            // validation
            var list = Assert.IsType<PdfBlockElementList>(Assert.Single(document.Elements));
            Assert.Equal(PdfListType.Numeric, list.Type);
            Assert.Equal(2, list.Items.Count());
            var nested = Assert.IsType<PdfBlockElementList>(list.Items.Last().Content.Last());
            Assert.Equal(PdfListType.Bullet, nested.Type);
            Assert.Equal("nested", nested.PlainText);
        }

        /// <summary>
        /// Tests that the start number of an ordered list is kept.
        /// </summary>
        [Fact]
        public void ListStart()
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("3. three\n4. four");

            // validation
            Assert.Equal(3, Assert.IsType<PdfBlockElementList>(Assert.Single(document.Elements)).Start);
        }

        /// <summary>
        /// Tests that a task item becomes a checkbox in its state.
        /// </summary>
        [Theory]
        [InlineData("- [x] done", true)]
        [InlineData("- [ ] open", false)]
        public void Task(string markdown, bool isChecked)
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf(markdown);
            var checkbox = document.Elements.OfType<PdfBlockElementList>().Single().Items.Single().Content
                .OfType<PdfBlockElementParagraph>().SelectMany(p => p.Content).OfType<PdfInlineElementCheckbox>().Single();

            // validation
            Assert.Equal(isChecked, checkbox.Checked);
        }

        /// <summary>
        /// Tests that a table gets a header row, keeps the formatting inside its cells and
        /// loses the empty column the parser reads after the closing pipe.
        /// </summary>
        [Fact]
        public void Table()
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("| Name | Count |\n|------|-------|\n| a | **1** |\n| b | 2 |");

            // validation
            var table = Assert.IsType<PdfBlockElementTable>(Assert.Single(document.Elements));
            var rows = table.Rows.ToList();
            Assert.Equal(3, rows.Count);
            Assert.All(rows, r => Assert.Equal(2, r.Cells.Count()));
            Assert.True(rows[0].Header);
            Assert.False(rows[1].Header);
            Assert.Equal("Name", rows[0].Cells.First().PlainText);
            var bold = rows[1].Cells.Last().Content.OfType<PdfBlockElementParagraph>().Single().Content.OfType<PdfInlineElementText>().Single(r => r.Text == "1");
            Assert.True(bold.Style.Bold);
        }

        /// <summary>
        /// Tests that the alignment of a column, which markdown declares in its header, is
        /// carried to every cell of the column.
        /// </summary>
        [Fact]
        public void TableAlignment()
        {
            // arrange
            var markdown = new MarkdownDocument().Add(new MarkdownBlockElementTable()
                .AddColumn(new MarkdownBlockElementTableCell(MarkdownCellAlign.Left, [new MarkdownInlineElementPlainText("Name")]))
                .AddColumn(new MarkdownBlockElementTableCell(MarkdownCellAlign.Right, [new MarkdownInlineElementPlainText("Count")]))
                .AddRow([new MarkdownBlockElementTableCell([new MarkdownInlineElementPlainText("a")]), new MarkdownBlockElementTableCell([new MarkdownInlineElementPlainText("1")])]));

            // act
            var table = Assert.IsType<PdfBlockElementTable>(Assert.Single(markdown.ConvertToPdf().Elements));
            var body = table.Rows.Last();

            // validation
            Assert.Equal(PdfTextAlign.Left, body.Cells.First().Align);
            Assert.Equal(PdfTextAlign.Right, body.Cells.Last().Align);
        }

        /// <summary>
        /// Tests code blocks, quotes, callouts and rules.
        /// </summary>
        [Fact]
        public void Blocks()
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("```csharp\nvar x = 1;\n```\n\n> quoted\n\n>! careful\n\n---");
            var blocks = document.Elements.ToList();

            // validation
            var code = Assert.IsType<PdfBlockElementCode>(blocks[0]);
            Assert.Equal("var x = 1;", code.Code);
            Assert.Equal("csharp", code.Language);
            Assert.Equal("quoted", Assert.IsType<PdfBlockElementQuote>(blocks[1]).PlainText);
            Assert.Equal(PdfCalloutType.Warning, Assert.IsType<PdfBlockElementCallout>(blocks[2]).CalloutType);
            Assert.IsType<PdfBlockElementRule>(blocks[3]);
        }

        /// <summary>
        /// Tests that a picture in a paragraph becomes a block of its own between the text
        /// before and after it.
        /// </summary>
        [Fact]
        public void Image()
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("before ![logo](https://example.com/logo.png) after");
            var blocks = document.Elements.ToList();

            // validation
            Assert.Equal(3, blocks.Count);
            var image = Assert.IsType<PdfBlockElementImage>(blocks[1]);
            Assert.Equal("https://example.com/logo.png", image.Source);
            Assert.Equal("logo", image.AltText);
        }

        /// <summary>
        /// Tests that raw HTML inside the text is formatted rather than printed as markup.
        /// </summary>
        [Fact]
        public void InlineHtml()
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("a <b>bold</b> word");
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.DoesNotContain("<b>", pdf.Text);
            Assert.Contains("bold", pdf.Text);
        }

        /// <summary>
        /// Tests that the complex sample documents convert into valid files that show their
        /// text.
        /// </summary>
        [Theory]
        [InlineData("WebExpress.WebUI.Test.Data.ComplexExample1.md")]
        [InlineData("WebExpress.WebUI.Test.Data.ComplexExample2.md")]
        [InlineData("WebExpress.WebUI.Test.Data.ComplexExample3.md")]
        [InlineData("WebExpress.WebUI.Test.Data.TableExample1.md")]
        [InlineData("WebExpress.WebUI.Test.Data.TableExample2.md")]
        [InlineData("WebExpress.WebUI.Test.Data.TableExample3.md")]
        public void ComplexDocument(string resource)
        {
            // arrange
            using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(resource);
            using var reader = new StreamReader(stream);
            var markdown = MarkdownParser.Parse(reader.ReadToEnd());

            // act
            var document = markdown.ConvertToPdf();
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.NotEmpty(document.Elements);
            Assert.False(string.IsNullOrWhiteSpace(pdf.Text));
        }

        /// <summary>
        /// Tests that no input yields an empty document rather than an error.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void Empty(string markdown)
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf(markdown);

            // validation
            Assert.Empty(document.Elements);
        }
    }
}
