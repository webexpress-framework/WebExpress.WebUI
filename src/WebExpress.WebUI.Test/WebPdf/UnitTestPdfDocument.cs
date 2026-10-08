using System.IO.Compression;
using WebExpress.WebUI.WebPdf;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.Test.WebPdf
{
    /// <summary>
    /// Tests writing a <see cref="PdfDocument"/> as a file: the structure a reader relies on,
    /// the metadata, the encoding of text and the breaking of lines and pages.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestPdfDocument
    {
        /// <summary>
        /// Tests that an empty document still is a valid file with one empty page, which is
        /// what a reader expects rather than a file without pages.
        /// </summary>
        [Fact]
        public void EmptyDocument()
        {
            // act
            var pdf = new PdfInspector(new PdfDocument().ToArray());

            // validation
            Assert.Equal(1, pdf.PageCount);
            Assert.Single(pdf.Find("/Type /Catalog"));
            Assert.Empty(pdf.Text);
        }

        /// <summary>
        /// Tests that the document properties are written into the information dictionary,
        /// in UTF-16 where they leave ASCII.
        /// </summary>
        [Theory]
        [InlineData("Release notes", "/Title (Release notes)")]
        [InlineData("Gr\u00FC\u00DFe", "/Title <FEFF0047007200FC00DF0065>")]
        [InlineData("a (b)", @"/Title (a \(b\))")]
        public void Title(string title, string expected)
        {
            // arrange
            var document = new PdfDocument { Title = title, Compress = false };

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Contains(expected, pdf.Find("/Producer").Single());
        }

        /// <summary>
        /// Tests the remaining document properties.
        /// </summary>
        [Fact]
        public void Metadata()
        {
            // arrange
            var document = new PdfDocument
            {
                Author = "Guybrush",
                Subject = "Pirates",
                Keywords = "grog",
                Language = "de-DE",
                CreationDate = new DateTimeOffset(2026, 10, 1, 12, 30, 0, TimeSpan.FromHours(2))
            };

            // act
            var pdf = new PdfInspector(document.ToArray());
            var info = pdf.Find("/Producer").Single();

            // validation
            Assert.Contains("/Author (Guybrush)", info);
            Assert.Contains("/Subject (Pirates)", info);
            Assert.Contains("/Keywords (grog)", info);
            Assert.Contains("/CreationDate (D:20261001123000+02'00')", info);
            Assert.Contains("/Lang (de-DE)", pdf.Find("/Type /Catalog").Single());
        }

        /// <summary>
        /// Tests that a fixed creation date makes the output reproducible byte for byte.
        /// </summary>
        [Fact]
        public void Reproducible()
        {
            // arrange
            PdfDocument Create() => new PdfDocument { CreationDate = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero) }
                .Add(new PdfBlockElementHeading(1, "Title"), new PdfBlockElementParagraph("Text"));

            // act
            var first = Create().ToArray();
            var second = Create().ToArray();

            // validation
            Assert.Equal(first, second);
        }

        /// <summary>
        /// Tests that compression shrinks the content but keeps what it shows.
        /// </summary>
        [Fact]
        public void Compress()
        {
            // arrange
            PdfDocument Create(bool compress) => new PdfDocument { Compress = compress }
                .Add(Enumerable.Range(0, 50).Select(i => new PdfBlockElementParagraph($"Paragraph number {i} of the document.")));

            // act
            var compressed = Create(true).ToArray();
            var plain = Create(false).ToArray();

            // validation
            Assert.True(compressed.Length < plain.Length);
            Assert.Contains("/Filter /FlateDecode", new PdfInspector(compressed).Raw);
            Assert.DoesNotContain("/Filter /FlateDecode", new PdfInspector(plain).Raw);
            Assert.Equal(new PdfInspector(plain).Text, new PdfInspector(compressed).Text);
        }

        /// <summary>
        /// Tests that the page size becomes the media box of every page.
        /// </summary>
        [Fact]
        public void PageSize()
        {
            // arrange
            var portrait = new PdfDocument { PageSize = PdfPageSize.Letter };
            var landscape = new PdfDocument { PageSize = PdfPageSize.A4.Landscape() };

            // act
            var portraitPdf = new PdfInspector(portrait.ToArray());
            var landscapePdf = new PdfInspector(landscape.ToArray());

            // validation
            Assert.Contains("/MediaBox [0 0 612 792]", portraitPdf.Find("/Type /Page ").Single());
            Assert.Contains("/MediaBox [0 0 841.89 595.28]", landscapePdf.Find("/Type /Page ").Single());
        }

        /// <summary>
        /// Tests that text is written in the WinAnsi encoding, which carries the umlauts and
        /// the typographic punctuation of western languages, and that a character outside of
        /// it is shown as a question mark rather than garbled.
        /// </summary>
        [Theory]
        [InlineData("Gr\u00FC\u00DFe aus M\u00EAl\u00E9e", "Gr\u00FC\u00DFe aus M\u00EAl\u00E9e")]
        [InlineData("10 \u20AC \u2013 \u201Equoted\u201C", "10 \u20AC \u2013 \u201Equoted\u201C")]
        [InlineData("a \u2192 b", "a -> b")]
        [InlineData("check \u2713", "check ?")]
        [InlineData("tab\there", "tab here")]
        [InlineData("(parens) and \\", "(parens) and \\")]
        public void Encoding(string text, string expected)
        {
            // arrange
            var document = new PdfDocument { Compress = false }.Add(new PdfBlockElementParagraph(text));

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Equal(expected, pdf.Text);
        }

        /// <summary>
        /// Tests that a paragraph wider than the page is broken into several lines, each
        /// within the content width, and that a narrower page needs more of them.
        /// </summary>
        [Fact]
        public void LineBreaking()
        {
            // arrange
            var text = string.Join(" ", Enumerable.Repeat("The quick brown fox jumps over the lazy dog.", 12));
            PdfDocument Create(PdfPageSize size) => new PdfDocument { PageSize = size, Margin = new PdfMargin(50) }
                .Add(new PdfBlockElementParagraph(text));

            // act
            var wide = new PdfInspector(Create(PdfPageSize.A4.Landscape()).ToArray());
            var narrow = new PdfInspector(Create(PdfPageSize.A5).ToArray());
            var runs = narrow.TextRuns(0).ToList();

            // validation
            Assert.True(wide.TextRuns(0).Count() > 1);
            Assert.True(runs.Count > wide.TextRuns(0).Count());
            Assert.Equal(text, string.Join(" ", runs.Select(r => r.Text)));
            Assert.All(runs, r => Assert.True(r.X >= 50 && r.X + PdfFont.Measure(PdfFontFace.Helvetica, r.Text, r.Size) <= PdfPageSize.A5.Width - 50 + 0.01f));
            Assert.Equal(runs.Count, runs.Select(r => r.Y).Distinct().Count());
        }

        /// <summary>
        /// Tests that a word wider than the line is broken between characters instead of
        /// running off the page.
        /// </summary>
        [Fact]
        public void LongWord()
        {
            // arrange
            var word = new string('W', 200);
            var document = new PdfDocument { Margin = new PdfMargin(50) }.Add(new PdfBlockElementParagraph(word));

            // act
            var pdf = new PdfInspector(document.ToArray());
            var runs = pdf.TextRuns(0).ToList();

            // validation
            Assert.True(runs.Count > 1);
            Assert.Equal(word, string.Concat(runs.Select(r => r.Text)));
            Assert.All(runs, r => Assert.True(r.X + PdfFont.Measure(PdfFontFace.Helvetica, r.Text, r.Size) <= PdfPageSize.A4.Width - 50 + 0.01f));
        }

        /// <summary>
        /// Tests that content longer than a page continues on further pages, without losing
        /// or repeating a paragraph.
        /// </summary>
        [Fact]
        public void PageBreaking()
        {
            // arrange
            var document = new PdfDocument()
                .Add(Enumerable.Range(1, 150).Select(i => new PdfBlockElementParagraph($"Paragraph {i}")));

            // act
            var pdf = new PdfInspector(document.ToArray());
            var texts = pdf.PageTexts.SelectMany(t => t).ToList();

            // validation
            Assert.True(pdf.PageCount > 2);
            Assert.Equal(Enumerable.Range(1, 150).Select(i => $"Paragraph {i}"), texts);
            Assert.All(Enumerable.Range(0, pdf.PageCount), p => Assert.All(pdf.TextRuns(p), r => Assert.True(r.Y >= document.Margin.Bottom)));
        }

        /// <summary>
        /// Tests that a forced page break starts a new page, and that a break at the top of
        /// a page does not leave an empty page behind.
        /// </summary>
        [Fact]
        public void PageBreak()
        {
            // arrange
            var document = new PdfDocument().Add(
                new PdfBlockElementParagraph("one"),
                new PdfBlockElementPageBreak(),
                new PdfBlockElementPageBreak(),
                new PdfBlockElementParagraph("two"));

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Equal(2, pdf.PageCount);
            Assert.Equal(["one"], pdf.PageTexts[0]);
            Assert.Equal(["two"], pdf.PageTexts[1]);
        }

        /// <summary>
        /// Tests the running header and footer with their placeholders.
        /// </summary>
        [Fact]
        public void HeaderAndFooter()
        {
            // arrange
            var document = new PdfDocument { Header = "Release notes", Footer = "Page {page} of {pages}" }.Add(
                new PdfBlockElementParagraph("one"),
                new PdfBlockElementPageBreak(),
                new PdfBlockElementParagraph("two"));

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Contains("Page 1 of 2", pdf.PageTexts[0]);
            Assert.Contains("Page 2 of 2", pdf.PageTexts[1]);
            Assert.All(pdf.PageTexts, t => Assert.Contains("Release notes", t));
        }

        /// <summary>
        /// Tests that the headings become nested bookmarks pointing at their pages.
        /// </summary>
        [Fact]
        public void Outline()
        {
            // arrange
            var document = new PdfDocument { Compress = false }.Add(
                new PdfBlockElementHeading(1, "Chapter"),
                new PdfBlockElementHeading(2, "Section A"),
                new PdfBlockElementHeading(2, "Section B"),
                new PdfBlockElementHeading(1, "Appendix"));

            // act
            var pdf = new PdfInspector(document.ToArray());
            var root = pdf.Find("/Type /Outlines").Single();
            var chapter = pdf.Find("/Title (Chapter)").Single();

            // validation
            Assert.Contains("/PageMode /UseOutlines", pdf.Find("/Type /Catalog").Single());
            Assert.Contains("/Count 4", root);
            Assert.Contains("/Count 2", chapter);
            Assert.Contains("/Next", chapter);
            Assert.Single(pdf.Find("/Title (Section A)"), o => o.Contains("/Next") && !o.Contains("/Prev"));
            Assert.Single(pdf.Find("/Title (Section B)"), o => o.Contains("/Prev") && !o.Contains("/Next"));
        }

        /// <summary>
        /// Tests that the bookmarks can be switched off.
        /// </summary>
        [Fact]
        public void OutlineDisabled()
        {
            // arrange
            var document = new PdfDocument { Outline = false }.Add(new PdfBlockElementHeading(1, "Chapter"));

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Empty(pdf.Find("/Type /Outlines"));
        }

        /// <summary>
        /// Tests that only addresses a reader can safely open become link annotations.
        /// </summary>
        [Theory]
        [InlineData("https://example.com/a", true)]
        [InlineData("mailto:guybrush@example.com", true)]
        [InlineData("javascript:alert(1)", false)]
        [InlineData("/relative/path", false)]
        [InlineData("file:///etc/passwd", false)]
        public void Link(string href, bool annotated)
        {
            // arrange
            var document = new PdfDocument().Add(new PdfBlockElementParagraph()
                .Add(new PdfInlineElementText("see "), new PdfInlineElementText("here", new PdfTextStyle { Link = href })));

            // act
            var pdf = new PdfInspector(document.ToArray());
            var page = pdf.Find("/Type /Page ").Single();

            // validation
            Assert.Equal(annotated, page.Contains("/Subtype /Link"));
            Assert.Equal("see here", pdf.Text);

            if (annotated)
            {
                Assert.Contains($"/URI ({href})", page);
            }
        }

        /// <summary>
        /// Tests that a centered line sits in the middle of the content width and a right
        /// aligned line ends at its right edge.
        /// </summary>
        [Fact]
        public void Alignment()
        {
            // arrange
            var document = new PdfDocument { Margin = new PdfMargin(50) }.Add(
                new PdfBlockElementParagraph("left"),
                new PdfBlockElementParagraph("center") { Align = PdfTextAlign.Center },
                new PdfBlockElementParagraph("right") { Align = PdfTextAlign.Right });
            var contentWidth = PdfPageSize.A4.Width - 100;

            // act
            var runs = new PdfInspector(document.ToArray()).TextRuns(0).ToList();
            float Width((string Text, float X, float Y, float Size) r) => PdfFont.Measure(PdfFontFace.Helvetica, r.Text, r.Size);

            // validation
            Assert.Equal(50, runs[0].X, 0.01f);
            Assert.Equal(50 + contentWidth / 2, runs[1].X + Width(runs[1]) / 2, 0.01f);
            Assert.Equal(50 + contentWidth, runs[2].X + Width(runs[2]), 0.01f);
        }

        /// <summary>
        /// Tests that a justified paragraph fills the line except for its last line.
        /// </summary>
        [Fact]
        public void Justify()
        {
            // arrange
            var text = string.Join(" ", Enumerable.Repeat("justified words fill the line", 10));
            var document = new PdfDocument { Margin = new PdfMargin(50) }
                .Add(new PdfBlockElementParagraph(text) { Align = PdfTextAlign.Justify });

            // act
            var runs = new PdfInspector(document.ToArray()).TextRuns(0).ToList();
            var lines = runs.GroupBy(r => r.Y).ToList();
            var right = lines.Select(l => l.Max(r => r.X + PdfFont.Measure(PdfFontFace.Helvetica, r.Text, r.Size))).ToList();

            // validation
            Assert.True(lines.Count > 1);
            Assert.All(right.Take(right.Count - 1), r => Assert.Equal(PdfPageSize.A4.Width - 50, r, 0.05f));
            Assert.True(right[^1] < PdfPageSize.A4.Width - 60);
        }

        /// <summary>
        /// Tests that a heading is not left alone at the bottom of a page.
        /// </summary>
        [Fact]
        public void HeadingKeptWithNext()
        {
            // arrange
            var document = new PdfDocument();

            // fill the page up to a few lines above the bottom
            document.Add(Enumerable.Range(0, 200).Select(i => new PdfBlockElementParagraph($"filler {i}")).ToArray());
            var probe = new PdfInspector(document.ToArray());
            var onFirstPage = probe.PageTexts[0].Count;

            var tight = new PdfDocument()
                .Add(Enumerable.Range(0, onFirstPage - 1).Select(i => new PdfBlockElementParagraph($"filler {i}")))
                .Add(new PdfBlockElementHeading(2, "Heading"), new PdfBlockElementParagraph("body"));

            // act
            var pdf = new PdfInspector(tight.ToArray());

            // validation
            Assert.DoesNotContain("Heading", pdf.PageTexts[0]);
            Assert.Equal("Heading", pdf.PageTexts[1][0]);
        }

        /// <summary>
        /// Tests that the header rows of a table are repeated on every page it continues on.
        /// </summary>
        [Fact]
        public void TableHeaderRepeated()
        {
            // arrange
            var table = new PdfBlockElementTable()
                .Add(new PdfBlockElementTableRow([new PdfBlockElementTableCell("Name"), new PdfBlockElementTableCell("Value")]) { Header = true })
                .Add(Enumerable.Range(1, 120).Select(i => new PdfBlockElementTableRow([new PdfBlockElementTableCell($"row {i}"), new PdfBlockElementTableCell(i.ToString())])));
            var document = new PdfDocument().Add(table);

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.True(pdf.PageCount > 1);
            Assert.All(pdf.PageTexts, t => Assert.Equal("Name", t[0]));
            Assert.Equal(Enumerable.Range(1, 120).Select(i => $"row {i}"), pdf.PageTexts.SelectMany(t => t).Where(t => t.StartsWith("row ")));
        }

        /// <summary>
        /// Tests that a row taller than a page is split across pages instead of being cut off.
        /// </summary>
        [Fact]
        public void TableRowTallerThanPage()
        {
            // arrange
            var tall = new PdfBlockElementTableCell(Enumerable.Range(1, 120).Select(i => new PdfBlockElementParagraph($"line {i}")));
            var document = new PdfDocument().Add(new PdfBlockElementTable()
                .Add(new PdfBlockElementTableRow([new PdfBlockElementTableCell("short"), tall])));

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.True(pdf.PageCount > 1);
            Assert.Equal(Enumerable.Range(1, 120).Select(i => $"line {i}"), pdf.PageTexts.SelectMany(t => t).Where(t => t.StartsWith("line ")));
        }

        /// <summary>
        /// Tests that columns are sized by their content: a column of long text gets more
        /// room than a column of short numbers.
        /// </summary>
        [Fact]
        public void TableColumnWidths()
        {
            // arrange
            var text = "a long description that needs considerably more room than the number beside it";
            var document = new PdfDocument { Margin = new PdfMargin(50) }.Add(new PdfBlockElementTable()
                .Add(new PdfBlockElementTableRow([new PdfBlockElementTableCell("1"), new PdfBlockElementTableCell(text)])));

            // act
            var runs = new PdfInspector(document.ToArray()).TextRuns(0).ToList();

            // validation
            var number = runs.Single(r => r.Text == "1");
            var description = runs.First(r => r.Text != "1");
            Assert.True(description.X - number.X < (PdfPageSize.A4.Width - 100) / 3);
        }

        /// <summary>
        /// Tests that fixed column widths are kept as proportions.
        /// </summary>
        [Fact]
        public void TableFixedColumnWidths()
        {
            // arrange
            var document = new PdfDocument { Margin = new PdfMargin(50) }.Add(new PdfBlockElementTable { Bordered = false }
                .SetColumnWidths([1, 3])
                .Add(new PdfBlockElementTableRow([new PdfBlockElementTableCell("left"), new PdfBlockElementTableCell("right")])));

            // act
            var runs = new PdfInspector(document.ToArray()).TextRuns(0).ToList();

            // validation
            Assert.Equal(50 + (PdfPageSize.A4.Width - 100) / 4, runs.Single(r => r.Text == "right").X - 10.5f * 0.5f, 0.05f);
        }

        /// <summary>
        /// Tests that a column without a width takes what the columns with one leave, as a
        /// column group in a table of full width does.
        /// </summary>
        [Fact]
        public void TableOpenColumnWidth()
        {
            // arrange
            var document = new PdfDocument { Margin = new PdfMargin(50) }.Add(new PdfBlockElementTable { Bordered = false }
                .SetColumnWidths([60, 0, 100])
                .Add(new PdfBlockElementTableRow([new PdfBlockElementTableCell("a"), new PdfBlockElementTableCell("b"), new PdfBlockElementTableCell("c")])));
            var width = PdfPageSize.A4.Width - 100;

            // act
            var runs = new PdfInspector(document.ToArray()).TextRuns(0).ToList();

            // validation
            Assert.Equal(50 + 60, runs.Single(r => r.Text == "b").X - 10.5f * 0.5f, 0.05f);
            Assert.Equal(50 + width - 100, runs.Single(r => r.Text == "c").X - 10.5f * 0.5f, 0.05f);
        }

        /// <summary>
        /// Tests that a heading followed by a picture moves to the next page with the picture
        /// when the picture does not fit below it.
        /// </summary>
        [Fact]
        public void HeadingKeptWithImage()
        {
            // arrange
            var document = new PdfDocument { Compress = false }
                .Add(Enumerable.Range(0, 30).Select(i => new PdfBlockElementParagraph($"filler {i}")))
                .Add(new PdfBlockElementHeading(3, "Picture"), new PdfBlockElementImage { Data = TestImages.Jpeg(400, 300) });

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Equal(2, pdf.PageCount);
            Assert.DoesNotContain("Picture", pdf.PageTexts[0]);
            Assert.Equal(["Picture"], pdf.PageTexts[1]);
            Assert.Contains("/Im1 Do", pdf.PageContents[1]);
        }

        /// <summary>
        /// Tests the markers of the list types.
        /// </summary>
        [Theory]
        [InlineData(PdfListType.Bullet, 1, "\u2022")]
        [InlineData(PdfListType.Numeric, 1, "1.")]
        [InlineData(PdfListType.Numeric, 7, "7.")]
        [InlineData(PdfListType.LowerAlpha, 1, "a.")]
        [InlineData(PdfListType.UpperAlpha, 28, "AB.")]
        [InlineData(PdfListType.LowerRoman, 4, "iv.")]
        [InlineData(PdfListType.UpperRoman, 1994, "MCMXCIV.")]
        public void ListMarker(PdfListType type, int start, string expected)
        {
            // arrange
            var document = new PdfDocument().Add(new PdfBlockElementList(type) { Start = start }.Add(new PdfBlockElementListItem("item")));

            // act
            var pdf = new PdfInspector(document.ToArray());
            var runs = pdf.TextRuns(0).ToList();

            // validation
            Assert.Equal([expected, "item"], runs.Select(r => r.Text).OrderBy(t => t == "item"));
            Assert.Equal(runs[0].Y, runs[1].Y);
        }

        /// <summary>
        /// Tests that the bullet of a nested list changes with its depth.
        /// </summary>
        [Fact]
        public void NestedList()
        {
            // arrange
            var document = new PdfDocument().Add(new PdfBlockElementList().Add(
                new PdfBlockElementListItem("outer").Add(new PdfBlockElementList().Add(new PdfBlockElementListItem("inner")))));

            // act
            var texts = new PdfInspector(document.ToArray()).Text;

            // validation
            Assert.Equal("\u2022 outer \u2013 inner", texts);
        }

        /// <summary>
        /// Tests that a checkbox is drawn as a box and a tick, not as text.
        /// </summary>
        [Theory]
        [InlineData(true, 2)]
        [InlineData(false, 1)]
        public void Checkbox(bool isChecked, int strokes)
        {
            // arrange
            var document = new PdfDocument { Compress = false }.Add(new PdfBlockElementParagraph()
                .Add(new PdfInlineElementCheckbox(isChecked), new PdfInlineElementText(" task")));

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Equal("task", pdf.Text);
            Assert.Equal(strokes, pdf.PageContents[0].Split('\n').Count(l => l.EndsWith(" S")));
        }

        /// <summary>
        /// Tests that the backgrounds of nested containers are painted in the right order:
        /// the callout first, the code block inside it on top.
        /// </summary>
        [Fact]
        public void NestedBackgrounds()
        {
            // arrange
            var document = new PdfDocument { Compress = false }.Add(new PdfBlockElementCallout(PdfCalloutType.Warning)
                .Add(new PdfBlockElementCode("var x = 1;")));

            // act
            var content = new PdfInspector(document.ToArray()).PageContents[0];

            // validation
            var tint = content.IndexOf("1 0.973 0.882 rg", StringComparison.Ordinal);
            var code = content.IndexOf("0.965 0.973 0.98 rg", StringComparison.Ordinal);
            Assert.True(tint >= 0 && code > tint);
        }

        /// <summary>
        /// Tests that a code block keeps its whitespace and wraps lines that do not fit.
        /// </summary>
        [Fact]
        public void Code()
        {
            // arrange
            var code = "if (a)\n{\n    return b;\n}\n" + new string('x', 200);
            var document = new PdfDocument().Add(new PdfBlockElementCode(code, "csharp"));

            // act
            var runs = new PdfInspector(document.ToArray()).TextRuns(0).ToList();

            // validation
            Assert.Equal("if (a)", runs[0].Text);
            Assert.Equal("    return b;", runs[2].Text);
            Assert.True(runs.Count > 5);
            Assert.Equal(new string('x', 200), string.Concat(runs.Skip(4).Select(r => r.Text)));
            Assert.Contains("/BaseFont /Courier ", new PdfInspector(document.ToArray()).Raw);
        }

        /// <summary>
        /// Tests that the faces a document uses are the only fonts it references.
        /// </summary>
        [Fact]
        public void Fonts()
        {
            // arrange
            var document = new PdfDocument { FontFamily = PdfFontFamily.Times }.Add(new PdfBlockElementParagraph()
                .Add(new PdfInlineElementText("plain "), new PdfInlineElementText("bold", new PdfTextStyle { Bold = true })));

            // act
            var pdf = new PdfInspector(document.ToArray());
            var fonts = pdf.Find("/Type /Font").ToList();

            // validation
            Assert.Equal(2, fonts.Count);
            Assert.Contains(fonts, f => f.Contains("/BaseFont /Times-Roman "));
            Assert.Contains(fonts, f => f.Contains("/BaseFont /Times-Bold "));
            Assert.All(fonts, f => Assert.Contains("/Encoding /WinAnsiEncoding", f));
        }

        /// <summary>
        /// Tests that a PNG with transparency is embedded with a soft mask.
        /// </summary>
        [Fact]
        public void ImagePngWithAlpha()
        {
            // arrange
            var png = TestImages.Png(4, 3, 6, (x, y) => [255, 0, 0, (byte)(x * 60)]);
            var document = new PdfDocument().Add(new PdfBlockElementImage { Data = png, Width = 120 });

            // act
            var pdf = new PdfInspector(document.ToArray());
            var image = pdf.Find("/Subtype /Image /Width 4 /Height 3 /ColorSpace /DeviceRGB").Single();

            // validation
            Assert.Contains("/SMask", image);
            Assert.Single(pdf.Find("/ColorSpace /DeviceGray"));
            Assert.Contains("q 120 0 0 90 ", pdf.PageContents[0]);
            Assert.Contains("/Im1 Do Q", pdf.PageContents[0]);
        }

        /// <summary>
        /// Tests that an opaque PNG is passed through with its row filters declared rather
        /// than decoded.
        /// </summary>
        [Fact]
        public void ImagePngOpaque()
        {
            // arrange
            var png = TestImages.Png(2, 2, 2, (x, y) => [10, 20, 30]);
            var document = new PdfDocument().Add(new PdfBlockElementImage { Data = png });

            // act
            var pdf = new PdfInspector(document.ToArray());
            var image = pdf.Find("/Subtype /Image").Single();

            // validation
            Assert.Contains("/DecodeParms << /Predictor 15 /Colors 3 /BitsPerComponent 8 /Columns 2 >>", image);
            Assert.DoesNotContain("/SMask", image);
        }

        /// <summary>
        /// Tests that a JPEG is embedded as it is.
        /// </summary>
        [Fact]
        public void ImageJpeg()
        {
            // arrange
            var jpeg = TestImages.Jpeg(640, 480);
            var document = new PdfDocument().Add(new PdfBlockElementImage { Data = jpeg });

            // act
            var pdf = new PdfInspector(document.ToArray());
            var image = pdf.Find("/Subtype /Image").Single();

            // validation
            Assert.Contains("/Width 640 /Height 480 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode", image);
            Assert.EndsWith(System.Text.Encoding.Latin1.GetString(jpeg), image);
        }

        /// <summary>
        /// Tests that a picture is scaled down to the content width, keeping its proportions.
        /// </summary>
        [Fact]
        public void ImageScaledToWidth()
        {
            // arrange
            var document = new PdfDocument { Margin = new PdfMargin(50) }.Add(new PdfBlockElementImage { Data = TestImages.Jpeg(2000, 1000) });
            var width = PdfPageSize.A4.Width - 100;

            // act
            var content = new PdfInspector(document.ToArray()).PageContents[0];

            // validation
            Assert.Contains($"q {PdfLayout.F(width)} 0 0 {PdfLayout.F(width / 2)} 50 ", content);
        }

        /// <summary>
        /// Tests where a picture is loaded from: the data, a data address, or the resolver -
        /// and that without a resolver nothing outside the document is fetched.
        /// </summary>
        [Fact]
        public void ImageSources()
        {
            // arrange
            var png = TestImages.Png(1, 1, 2, (x, y) => [0, 0, 0]);
            var requested = new List<string>();
            var document = new PdfDocument
            {
                ImageResolver = source =>
                {
                    requested.Add(source);
                    return source == "/assets/logo.png" ? png : null;
                }
            }.Add(
                new PdfBlockElementImage("data:image/png;base64," + Convert.ToBase64String(png), "inline"),
                new PdfBlockElementImage("/assets/logo.png", "resolved"),
                new PdfBlockElementImage("https://example.com/missing.png", "Missing"));

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Equal(["/assets/logo.png", "https://example.com/missing.png"], requested);
            Assert.Equal(2, pdf.Find("/Subtype /Image").Count());
            Assert.Equal("[Missing]", pdf.Text);
        }

        /// <summary>
        /// Tests that a picture that cannot be read is replaced by its alternative text.
        /// </summary>
        [Theory]
        [InlineData(new byte[] { 1, 2, 3 }, "Logo", "[Logo]")]
        [InlineData(new byte[] { 0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0 }, "", "[Image]")]
        public void ImageUnreadable(byte[] data, string alt, string expected)
        {
            // arrange
            var document = new PdfDocument().Add(new PdfBlockElementImage { Data = data, AltText = alt });

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Equal(expected, pdf.Text);
            Assert.Empty(pdf.Find("/Subtype /Image"));
        }
    }

    /// <summary>
    /// Builds minimal pictures for the tests.
    /// </summary>
    internal static class TestImages
    {
        /// <summary>
        /// Builds a non-interlaced 8 bit PNG.
        /// </summary>
        /// <param name="width">The width.</param>
        /// <param name="height">The height.</param>
        /// <param name="colorType">The PNG color type (2 for RGB, 6 for RGBA).</param>
        /// <param name="pixel">Returns the samples of a pixel.</param>
        /// <returns>The file.</returns>
        public static byte[] Png(int width, int height, byte colorType, Func<int, int, byte[]> pixel)
        {
            var raw = new MemoryStream();

            for (var y = 0; y < height; y++)
            {
                raw.WriteByte(0);

                for (var x = 0; x < width; x++)
                {
                    raw.Write(pixel(x, y));
                }
            }

            var compressed = new MemoryStream();

            using (var zlib = new ZLibStream(compressed, CompressionLevel.Optimal, true))
            {
                zlib.Write(raw.ToArray());
            }

            var file = new MemoryStream();
            file.Write([137, 80, 78, 71, 13, 10, 26, 10]);
            Chunk(file, "IHDR", [.. BigEndian(width), .. BigEndian(height), 8, colorType, 0, 0, 0]);
            Chunk(file, "IDAT", compressed.ToArray());
            Chunk(file, "IEND", []);

            return file.ToArray();
        }

        /// <summary>
        /// Builds the frame header of a baseline JPEG, which is all the writer reads.
        /// </summary>
        /// <param name="width">The width.</param>
        /// <param name="height">The height.</param>
        /// <returns>The file.</returns>
        public static byte[] Jpeg(int width, int height)
        {
            return
            [
                0xFF, 0xD8,
                0xFF, 0xE0, 0x00, 0x10, (byte)'J', (byte)'F', (byte)'I', (byte)'F', 0, 1, 1, 0, 0, 1, 0, 1, 0, 0,
                0xFF, 0xC0, 0x00, 0x11, 8, (byte)(height >> 8), (byte)height, (byte)(width >> 8), (byte)width, 3,
                1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1,
                0xFF, 0xD9
            ];
        }

        /// <summary>
        /// Writes a PNG chunk; the checksum is not verified by the reader and left zero.
        /// </summary>
        private static void Chunk(Stream stream, string type, byte[] data)
        {
            stream.Write(BigEndian(data.Length));
            stream.Write(System.Text.Encoding.ASCII.GetBytes(type));
            stream.Write(data);
            stream.Write([0, 0, 0, 0]);
        }

        /// <summary>
        /// Returns a 32 bit number in network order.
        /// </summary>
        private static byte[] BigEndian(int value)
        {
            return [(byte)(value >> 24), (byte)(value >> 16), (byte)(value >> 8), (byte)value];
        }
    }
}
