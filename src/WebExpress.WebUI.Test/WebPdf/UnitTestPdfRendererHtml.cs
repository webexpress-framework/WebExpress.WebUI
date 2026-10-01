using WebExpress.WebUI.WebPdf;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.Test.WebPdf
{
    /// <summary>
    /// Tests converting HTML into the PDF model (PdfRendererHtml), the way a stored value of
    /// the editor is converted once its scaffolding is gone.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestPdfRendererHtml
    {
        /// <summary>
        /// Tests the block elements.
        /// </summary>
        [Theory]
        [InlineData("<h2>Title</h2>", typeof(PdfBlockElementHeading))]
        [InlineData("<p>text</p>", typeof(PdfBlockElementParagraph))]
        [InlineData("<pre>code</pre>", typeof(PdfBlockElementCode))]
        [InlineData("<blockquote><p>quoted</p></blockquote>", typeof(PdfBlockElementQuote))]
        [InlineData("<ul><li>item</li></ul>", typeof(PdfBlockElementList))]
        [InlineData("<table><tr><td>cell</td></tr></table>", typeof(PdfBlockElementTable))]
        [InlineData("<hr>", typeof(PdfBlockElementRule))]
        [InlineData("loose text", typeof(PdfBlockElementParagraph))]
        public void Block(string html, Type expected)
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf(html);

            // validation
            Assert.IsType(expected, Assert.Single(document.Elements));
        }

        /// <summary>
        /// Tests the inline elements that imply a style.
        /// </summary>
        [Theory]
        [InlineData("<strong>x</strong>", nameof(PdfTextStyle.Bold))]
        [InlineData("<b>x</b>", nameof(PdfTextStyle.Bold))]
        [InlineData("<em>x</em>", nameof(PdfTextStyle.Italic))]
        [InlineData("<i>x</i>", nameof(PdfTextStyle.Italic))]
        [InlineData("<u>x</u>", nameof(PdfTextStyle.Underline))]
        [InlineData("<s>x</s>", nameof(PdfTextStyle.Strikethrough))]
        [InlineData("<del>x</del>", nameof(PdfTextStyle.Strikethrough))]
        [InlineData("<sup>x</sup>", nameof(PdfTextStyle.Superscript))]
        [InlineData("<sub>x</sub>", nameof(PdfTextStyle.Subscript))]
        [InlineData("<span style=\"font-weight: 700\">x</span>", nameof(PdfTextStyle.Bold))]
        [InlineData("<span style=\"font-style: italic\">x</span>", nameof(PdfTextStyle.Italic))]
        [InlineData("<span style=\"text-decoration: underline\">x</span>", nameof(PdfTextStyle.Underline))]
        public void InlineStyle(string html, string property)
        {
            // act
            var run = Run($"<p>{html}</p>", "x");

            // validation
            Assert.True((bool)typeof(PdfTextStyle).GetProperty(property).GetValue(run.Style));
        }

        /// <summary>
        /// Tests the colors and sizes the editor writes into spans.
        /// </summary>
        [Fact]
        public void SpanStyle()
        {
            // act
            var run = Run("<p><span style=\"color: rgb(214, 51, 132); background-color: #fff3cd; font-size: 24px; font-family: monospace\">x</span></p>", "x");

            // validation
            Assert.Equal(new PdfColor(214, 51, 132), run.Style.Color);
            Assert.Equal(new PdfColor(255, 243, 205), run.Style.Background);
            Assert.Equal(1.5f, run.Style.Scale);
            Assert.Equal(PdfFontFamily.Courier, run.Style.FontFamily);
        }

        /// <summary>
        /// Tests that a link keeps its decoded address.
        /// </summary>
        [Fact]
        public void Link()
        {
            // act
            var run = Run("<p><a href=\"https://example.com/?a=1&amp;b=2\">x</a></p>", "x");

            // validation
            Assert.Equal("https://example.com/?a=1&b=2", run.Style.Link);
        }

        /// <summary>
        /// Tests that entities are decoded.
        /// </summary>
        [Fact]
        public void Entities()
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf("<p>M&#234;l&#233;e &amp; Co &lt;3</p>");

            // validation
            Assert.Equal("M\u00EAl\u00E9e & Co <3", document.PlainText);
        }

        /// <summary>
        /// Tests the alignment and indentation the editor writes on blocks.
        /// </summary>
        [Fact]
        public void BlockStyle()
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf("<p style=\"text-align: center; margin-left: 80px; background-color: #eee\">x</p>");
            var paragraph = Assert.IsType<PdfBlockElementParagraph>(Assert.Single(document.Elements));

            // validation
            Assert.Equal(PdfTextAlign.Center, paragraph.Align);
            Assert.Equal(60f, paragraph.Indent);
            Assert.Equal(new PdfColor(238, 238, 238), paragraph.Background);
        }

        /// <summary>
        /// Tests that a forced line break stays one.
        /// </summary>
        [Fact]
        public void LineBreak()
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf("<p>a<br>b</p>");
            var paragraph = Assert.IsType<PdfBlockElementParagraph>(Assert.Single(document.Elements));

            // validation
            Assert.IsType<PdfInlineElementLineBreak>(paragraph.Content.ElementAt(1));
        }

        /// <summary>
        /// Tests that a picture inside a paragraph splits it.
        /// </summary>
        [Fact]
        public void Image()
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf("<p>before <img src=\"a.png\" alt=\"A\" style=\"width: 200px\"> after</p>");
            var blocks = document.Elements.ToList();

            // validation
            Assert.Equal(3, blocks.Count);
            var image = Assert.IsType<PdfBlockElementImage>(blocks[1]);
            Assert.Equal("a.png", image.Source);
            Assert.Equal(150f, image.Width);
            Assert.Equal("before", blocks[0].PlainText.Trim());
            Assert.Equal("after", blocks[2].PlainText.Trim());
        }

        /// <summary>
        /// Tests that a centered picture of the editor keeps its position.
        /// </summary>
        [Fact]
        public void ImageCentered()
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf("<img src=\"a.png\" style=\"display: block; margin-left: auto; margin-right: auto\">");

            // validation
            Assert.Equal(PdfTextAlign.Center, Assert.IsType<PdfBlockElementImage>(Assert.Single(document.Elements)).Align);
        }

        /// <summary>
        /// Tests that a table keeps its header, spans and the column widths the editor stores.
        /// </summary>
        [Fact]
        public void Table()
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf(
                "<table class=\"table table-striped\"><colgroup><col style=\"width: 100px\"><col style=\"width: 300px\"></colgroup>"
                + "<thead><tr><th>A</th><th>B</th></tr></thead>"
                + "<tbody><tr><td colspan=\"2\" style=\"text-align: right\">wide</td></tr></tbody></table>");
            var table = Assert.IsType<PdfBlockElementTable>(Assert.Single(document.Elements));
            var rows = table.Rows.ToList();

            // validation
            Assert.True(table.Striped);
            Assert.Equal([75f, 225f], table.ColumnWidths);
            Assert.True(rows[0].Header);
            Assert.Equal(2, rows[1].Cells.Single().ColSpan);
            Assert.Equal(PdfTextAlign.Right, rows[1].Cells.Single().Align);
        }

        /// <summary>
        /// Tests that the regions of an editor row become columns weighted like the regions.
        /// </summary>
        [Fact]
        public void EditorRow()
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf(
                "<div class=\"wx-editor-row\"><div class=\"wx-editor-region\" data-weight=\"2\"><p>left</p></div>"
                + "<div class=\"wx-editor-region\" data-weight=\"1\"><p>right</p></div></div>");
            var table = Assert.IsType<PdfBlockElementTable>(Assert.Single(document.Elements));

            // validation
            Assert.False(table.Bordered);
            Assert.Equal([2f, 1f], table.ColumnWidths);
            Assert.Equal(["left", "right"], table.Rows.Single().Cells.Select(c => c.PlainText));
        }

        /// <summary>
        /// Tests that alerts and callouts become callouts of the matching kind.
        /// </summary>
        [Theory]
        [InlineData("<div class=\"alert alert-warning\">x</div>", PdfCalloutType.Warning)]
        [InlineData("<div class=\"alert alert-danger\">x</div>", PdfCalloutType.Danger)]
        [InlineData("<div class=\"alert alert-info\">x</div>", PdfCalloutType.Hint)]
        [InlineData("<div class=\"wx-callout wx-callout-success\"><div class=\"wx-callout-body\">x</div></div>", PdfCalloutType.Success)]
        public void Callout(string html, PdfCalloutType expected)
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf(html);
            var callout = Assert.IsType<PdfBlockElementCallout>(Assert.Single(document.Elements));

            // validation
            Assert.Equal(expected, callout.CalloutType);
            Assert.Equal("x", callout.PlainText);
        }

        /// <summary>
        /// Tests the list attributes.
        /// </summary>
        [Theory]
        [InlineData("<ol type=\"a\" start=\"3\"><li>x</li></ol>", PdfListType.LowerAlpha, 3)]
        [InlineData("<ol type=\"I\"><li>x</li></ol>", PdfListType.UpperRoman, 1)]
        [InlineData("<ul><li>x</li></ul>", PdfListType.Bullet, 1)]
        public void List(string html, PdfListType type, int start)
        {
            // act
            var list = Assert.IsType<PdfBlockElementList>(Assert.Single(PdfRendererHtml.ConvertHtmlToPdf(html).Elements));

            // validation
            Assert.Equal(type, list.Type);
            Assert.Equal(start, list.Start);
        }

        /// <summary>
        /// Tests that content a reader never sees is dropped.
        /// </summary>
        [Theory]
        [InlineData("<p>a</p><script>alert(1)</script>")]
        [InlineData("<p>a</p><style>p { color: red }</style>")]
        [InlineData("<p>a<button>click</button></p>")]
        public void Hidden(string html)
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf(html);

            // validation
            Assert.Equal("a", document.PlainText.Trim());
        }

        /// <summary>
        /// Tests that a checkbox in a list item keeps its state.
        /// </summary>
        [Fact]
        public void Checkbox()
        {
            // act
            var document = PdfRendererHtml.ConvertHtmlToPdf("<ul><li><input type=\"checkbox\" checked> done</li></ul>");
            var checkbox = document.Elements.OfType<PdfBlockElementList>().Single().Items.Single().Content
                .OfType<PdfBlockElementParagraph>().Single().Content.OfType<PdfInlineElementCheckbox>().Single();

            // validation
            Assert.True(checkbox.Checked);
        }

        /// <summary>
        /// Returns the text run of a converted fragment that carries a text.
        /// </summary>
        private static PdfInlineElementText Run(string html, string text)
        {
            var document = PdfRendererHtml.ConvertHtmlToPdf(html);

            return document.Elements.OfType<PdfBlockElementParagraph>()
                .SelectMany(p => p.Content)
                .OfType<PdfInlineElementText>()
                .Single(r => r.Text == text);
        }
    }
}
