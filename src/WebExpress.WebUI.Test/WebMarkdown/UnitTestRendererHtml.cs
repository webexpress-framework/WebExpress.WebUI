using System.Text.RegularExpressions;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebMarkdown;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Unit tests for convert markdown to html.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestRendererHtml
    {
        /// <summary>
        /// Converts a Markdown string to its equivalent HTML representation.
        /// </summary>
        [Theory]
        [InlineData("*italic*", "<p><i>italic</i></p>")]
        [InlineData("**bold**", "<p><strong>bold</strong></p>")]
        [InlineData("***bold & italic***", "<p><strong><i>bold & italic</i></strong></p>")]
        [InlineData("**Welcome**!", @"<p><strong>Welcome</strong>!</p>")]
        [InlineData("_underline_", "<p><u>underline</u></p>")]
        [InlineData("__underline & bold__", "<p><u><strong>underline & bold</strong></u></p>")]
        [InlineData("___underline & bold & italic___", "<p><u><strong><i>underline & bold & italic</i></strong></u></p>")]
        [InlineData("~strikethrough~", "<p><s>strikethrough</s></p>")]
        [InlineData("~~strikethrough~~", "<p><s>strikethrough</s></p>")]
        [InlineData("~~~strikethrough & bolt~~~", "<p><s><strong>strikethrough & bolt</strong></s></p>")]
        [InlineData("==highlighted==", "<p><mark>highlighted</mark></p>")]
        [InlineData("`code`", "<p><code>code</code></p>")]
        [InlineData("an `<object>` element", "<p>an <code>&lt;object&gt;</code> element</p>")]
        [InlineData("`a && b`", "<p><code>a &amp;&amp; b</code></p>")]
        [InlineData("`&lt;`", "<p><code>&amp;lt;</code></p>")]
        [InlineData("http://example.com", @"<p><a href=""http://example.com"">http://example.com</a></p>")]
        [InlineData("![alt](http://example.com)", @"<p><img src=""http://example.com"" alt=""alt"" style=""max-width: 100%;""></p>")]
        [InlineData("[text](http://example.com)", @"<p><a href=""http://example.com"">text</a></p>")]
        [InlineData("<span style=\"color: red;\">red text</span>", @"<p><span style=""color: red;"">red text</span></p>")]
        [InlineData("[X]", @"<p><input type=""checkbox"" class=""form-check-input"" checked disabled></p>")]
        [InlineData("[ ]", @"<p><input type=""checkbox"" class=""form-check-input"" disabled></p>")]
        [InlineData("[x] Learn markdown", @"<p><input type=""checkbox"" class=""form-check-input"" checked disabled aria-label=""Learn markdown""> Learn markdown</p>")]
        [InlineData("Text[^1]", @"<p>Text<sup>1</sup></p>")]
        public void ConvertInlineElements(string markdown, string expectedHtml)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var document = MarkdownParser.Parse(markdown);

            // act
            var html = document.ConvertToHtml(renderContext);

            // validation
            var htmlString = html.ToString()
                .Replace("\r", "")
                .Replace("\n", "")
                .Replace("\t", "");

            var cleaned = Regex.Replace(htmlString, @">\s+<", "><");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, cleaned);
        }

        /// <summary>
        /// Tests that formatted text is written without any blank the source does not have.
        /// The output is compared as written, because a browser reads a line break between
        /// a word and its formatted part as a blank and the other tests normalize it away.
        /// </summary>
        [Theory]
        [InlineData("x**b**y", "<p>x<strong>b</strong>y</p>")]
        [InlineData("**a**_b_", "<p><strong>a</strong><u>b</u></p>")]
        [InlineData("x***i***.", "<p>x<strong><i>i</i></strong>.</p>")]
        [InlineData("see [map](/m), `c`[^1]", @"<p>see <a href=""/m"">map</a>, <code>c</code><sup>1</sup></p>")]
        public void ConvertInlineElementsWithoutBlanks(string markdown, string expectedHtml)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();

            // act
            var html = MarkdownParser.Parse(markdown).ConvertToHtml(renderContext).ToString().Trim();

            // validation - the break before the closing tag of a block ends no text and stays
            Assert.Equal(expectedHtml, Regex.Replace(html, @"\s+</p>$", "</p>"));
        }

        /// <summary>
        /// Tests that a document placed under the headings of a page speaks its own headings from
        /// the level it was given, keeping its steps, while the tags keep their look.
        /// </summary>
        [Theory]
        [InlineData("# Title\n## Part", 4, @"<h1 role=""heading"" aria-level=""4"">Title</h1><h2 role=""heading"" aria-level=""5"">Part</h2>")]
        [InlineData("# Title\n###### Deep", 3, @"<h1 role=""heading"" aria-level=""3"">Title</h1><h6 role=""heading"" aria-level=""6"">Deep</h6>")]
        [InlineData("# Title", 1, @"<h1>Title</h1>")]
        public void ConvertHeadingsAtLevel(string markdown, int level, string expectedHtml)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var document = MarkdownParser.Parse(markdown);

            // act
            var html = document.ConvertToHtml(renderContext, level);

            // validation
            var cleaned = Regex.Replace(html.ToString().Replace("\r", "").Replace("\n", "").Replace("\t", ""), @">\s+<", "><");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, cleaned);
        }

        /// <summary>
        /// Converts a Markdown string to its equivalent HTML representation.
        /// </summary>
        [Theory]
        [InlineData("This is a paragraph.", "<p>This is a paragraph.</p>")]
        [InlineData("This is a paragraph.\n\nThis is another paragraph.", @"<p>This is a paragraph.</p><p>This is another paragraph.</p>")]
        [InlineData("Welcome to **WebExpress**! Build your own `WebExpress` application.", @"<p>Welcome to <strong>WebExpress</strong>! Build your own <code>WebExpress</code> application.</p>")]
        public void ConvertParagraph(string markdown, string expectedHtml)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var document = MarkdownParser.Parse(markdown);

            // act
            var html = document.ConvertToHtml(renderContext);

            // validation
            var htmlString = html.ToString()
                .Replace("\r", "")
                .Replace("\n", "")
                .Replace("\t", "");

            var cleaned = Regex.Replace(htmlString, @">\s+<", "><");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, cleaned);
        }

        /// <summary>
        /// Converts a Markdown string to its equivalent HTML representation.
        /// </summary>
        [Theory]
        [InlineData("# Title 1", @"<h1>Title 1</h1>")]
        [InlineData("## Title 2", @"<h2>Title 2</h2>")]
        [InlineData("### Title 3", @"<h3>Title 3</h3>")]
        [InlineData("#### Title 4", @"<h4>Title 4</h4>")]
        [InlineData("##### Title 5", @"<h5>Title 5</h5>")]
        [InlineData("###### Title 6", @"<h6>Title 6</h6>")]
        public void ConvertHeader(string markdown, string expectedHtml)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var document = MarkdownParser.Parse(markdown);

            // act
            var html = document.ConvertToHtml(renderContext);

            // validation
            var htmlString = html.ToString()
                .Replace("\r", "")
                .Replace("\n", "")
                .Replace("\t", "");

            var cleaned = Regex.Replace(htmlString, @">\s+<", "><");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, cleaned);
        }

        /// <summary>
        /// Converts a Markdown string to its equivalent HTML representation.
        /// </summary>
        [Theory]
        [InlineData("---", @"<hr>")]
        [InlineData("----", @"<hr>")]
        [InlineData("------------", @"<hr>")]
        public void ConvertHorizontalLine(string markdown, string expectedHtml)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var document = MarkdownParser.Parse(markdown);

            // act
            var html = document.ConvertToHtml(renderContext);

            // validation
            var htmlString = html.ToString()
                .Replace("\r", "")
                .Replace("\n", "")
                .Replace("\t", "");

            var cleaned = Regex.Replace(htmlString, @">\s+<", "><");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, cleaned);
        }

        /// <summary>
        /// Tests that a code block is written as text: the markup and the entities it holds
        /// are shown as written instead of being laid out by the browser.
        /// </summary>
        [Theory]
        [InlineData("```\nvar a = 1;\n```", @"<pre class=""wx-webui-code""*>var a = 1;</pre>")]
        [InlineData("```html\n<div>a & b</div>\n```", @"<pre class=""wx-webui-code""*data-language=""html"">&lt;div&gt;a &amp; b&lt;/div&gt;</pre>")]
        [InlineData("```\n&copy;\n```", @"<pre class=""wx-webui-code""*>&amp;copy;</pre>")]
        public void ConvertCodeBlock(string markdown, string expectedHtml)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var document = MarkdownParser.Parse(markdown);

            // act
            var html = document.ConvertToHtml(renderContext);

            // validation
            var htmlString = html.ToString()
                .Replace("\r", "")
                .Replace("\n", "")
                .Replace("\t", "");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, htmlString.Trim());
        }

        /// <summary>
        /// Converts a Markdown string to its equivalent HTML representation.
        /// </summary>
        [Theory]
        [InlineData("> This is a simple quote.", @"<blockquote><p>This is a simple quote.</p></blockquote>")]
        [InlineData("> > This is a nested quote.", @"<blockquote><blockquote><p>This is a nested quote.</p></blockquote></blockquote>")]
        public void ConvertQuote(string markdown, string expectedHtml)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var document = MarkdownParser.Parse(markdown);

            // act
            var html = document.ConvertToHtml(renderContext);

            // validation
            var htmlString = html.ToString()
                .Replace("\r", "")
                .Replace("\n", "")
                .Replace("\t", "");

            var cleaned = Regex.Replace(htmlString, @">\s+<", "><");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, cleaned);
        }

        /// <summary>
        /// Converts a Markdown string to its equivalent HTML representation.
        /// </summary>
        [Theory]
        [InlineData("  This is a simple indent.", @"<div style=""text-indent: 2em;""><p>This is a simple indent.</p></div>")]
        [InlineData("\tThis is a simple indent.", @"<div style=""text-indent: 2em;""><p>This is a simple indent.</p></div>")]
        public void ConvertIndent(string markdown, string expectedHtml)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var document = MarkdownParser.Parse(markdown);

            // act
            var html = document.ConvertToHtml(renderContext);

            // validation
            var htmlString = html.ToString()
                .Replace("\r", "")
                .Replace("\n", "")
                .Replace("\t", "");

            var cleaned = Regex.Replace(htmlString, @">\s+<", "><");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, cleaned);
        }

        /// <summary>
        /// Converts a Markdown string to its equivalent HTML representation.
        /// </summary>
        [Theory]
        [InlineData(">? Tip", @"<div class=""wx-callout wx-callout-primary""><div class=""wx-callout-body""><p>Tip</p></div></div>")]
        [InlineData(">! Warning", @"<div class=""wx-callout wx-callout-warning""><div class=""wx-callout-body""><p>Warning</p></div></div>")]
        [InlineData(">!! Danger", @"<div class=""wx-callout wx-callout-danger""><div class=""wx-callout-body""><p>Danger</p></div></div>")]
        [InlineData(">* Success", @"<div class=""wx-callout wx-callout-success""><div class=""wx-callout-body""><p>Success</p></div></div>")]
        public void ConvertCallout(string markdown, string expectedHtml)
        {
            // arrange
            var document = MarkdownParser.Parse(markdown);

            // act
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var html = document.ConvertToHtml(renderContext);

            // validation
            var htmlString = html.ToString()
                .Replace("\r", "")
                .Replace("\n", "")
                .Replace("\t", "");

            var cleaned = Regex.Replace(htmlString, @">\s+<", "><");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, cleaned);
        }

        /// <summary>
        /// Converts a Markdown string to its equivalent HTML representation.
        /// </summary>
        [Theory]
        [InlineData("- Point A", @"<ul><li><p>Point A</p></li></ul>")]
        [InlineData("- Point A\n  - Sub", @"<ul><li><p>Point A</p><ul><li><p>Sub</p></li></ul></li></ul>")]
        [InlineData("* Point A", @"<ul><li><p>Point A</p></li></ul>")]
        [InlineData("+ Point A", @"<ul><li><p>Point A</p></li></ul>")]
        [InlineData("- Point A\n  1. Sub", @"<ul><li><p>Point A</p><ol><li><p>Sub</p></li></ol></li></ul>")]
        [InlineData("1. First", @"<ol><li><p>First</p></li></ol>")]
        [InlineData("2. Second", @"<ol start=""2""><li><p>Second</p></li></ol>")]
        [InlineData("1. First\n  1. Sub", @"<ol><li><p>First</p><ol><li><p>Sub</p></li></ol></li></ol>")]
        [InlineData("I. First\n  - Sub", @"<ol type=""I""><li><p>First</p><ul><li><p>Sub</p></li></ul></li></ol>")]
        [InlineData("i. First\n  - Sub", @"<ol type=""i""><li><p>First</p><ul><li><p>Sub</p></li></ul></li></ol>")]
        [InlineData("A. First\n  - Sub", @"<ol type=""A""><li><p>First</p><ul><li><p>Sub</p></li></ul></li></ol>")]
        [InlineData("a. First\n  - Sub", @"<ol type=""a""><li><p>First</p><ul><li><p>Sub</p></li></ul></li></ol>")]
        public void ConvertList(string markdown, string expectedHtml)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var document = MarkdownParser.Parse(markdown);

            // act
            var html = document.ConvertToHtml(renderContext);

            // validation
            var htmlString = html.ToString()
                .Replace("\r", "")
                .Replace("\n", "")
                .Replace("\t", "");

            var cleaned = Regex.Replace(htmlString, @">\s+<", "><");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, cleaned);
        }

        /// <summary>
        /// Converts a Markdown string to its equivalent HTML representation.
        /// </summary>
        [Theory]
        [InlineData("|Name|City\r\n|---|---|---|\r\n|Mario|Mushroom", @"<div class=""wx-webui-table""><div class=""wx-table-columns""><div data-label=""Name""></div><div data-label=""City""></div></div><div class=""wx-table-row""><div>Mario</div><div>Mushroom</div></div></div>")]
        [InlineData("| Name | City |\r\n|:---|---:|\r\n| Mario | Mushroom |", @"<div class=""wx-webui-table""><div class=""wx-table-columns""><div data-label=""Name""></div><div data-label=""City"" data-align=""right""></div></div><div class=""wx-table-row""><div>Mario</div><div>Mushroom</div></div></div>")]
        [InlineData("| Item | Count |\r\n|---|---:|\r\n| Screws | 120 |\r\n|---|---|\r\n| Total | 120 |", @"<div class=""wx-webui-table""><div class=""wx-table-columns""><div data-label=""Item""></div><div data-label=""Count"" data-align=""right""></div></div><div class=""wx-table-row""><div>Screws</div><div>120</div></div><div class=""wx-table-footer""><div>Total</div><div>120</div></div></div>")]
        [InlineData("| Name | Note |\r\n|---|---|\r\n| **Mario** Bros | see [map](/m) |\r\n|---|---|\r\n| `total` | 1 |", @"<div class=""wx-webui-table""><div class=""wx-table-columns""><div data-label=""Name""></div><div data-label=""Note""></div></div><div class=""wx-table-row""><div class=""wx-table-cell-markup""><span class=""wx-table-cell-text""><strong>Mario</strong> Bros</span></div><div class=""wx-table-cell-markup""><span class=""wx-table-cell-text"">see <a href=""/m"">map</a></span></div></div><div class=""wx-table-footer""><div class=""wx-table-cell-markup""><span class=""wx-table-cell-text""><code>total</code></span></div><div>1</div></div></div>")]
        [InlineData("| **Name** | [Docs](/d) |\r\n|---|---:|\r\n| a | b |", @"<div class=""wx-webui-table""><div class=""wx-table-columns""><div><span class=""wx-table-column-label""><strong>Name</strong></span></div><div data-align=""right""><span class=""wx-table-column-label""><a href=""/d"">Docs</a></span></div></div><div class=""wx-table-row""><div>a</div><div>b</div></div></div>")]
        [InlineData("| Name | City |\r\n|:---:|---|\r\n| Mario | Mushroom |>>\r\n| | Kingdom |",@"<div class=""wx-webui-table""><div class=""wx-table-columns""><div data-label=""Name"" data-align=""center""></div><div data-label=""City""></div></div><div class=""wx-table-row""><div>Mario</div><div>Mushroom Kingdom</div></div></div>")]
        public void ConvertTable(string markdown, string expectedHtml)
        {
            // arrange
            var document = MarkdownParser.Parse(markdown);

            // act
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var html = document.ConvertToHtml(renderContext);

            // validation
            var htmlString = html.ToString()
                .Replace("\r", "")
                .Replace("\n", "")
                .Replace("\t", "");

            var cleaned = Regex.Replace(htmlString, @">\s+<", "><");

            AssertExtensions.EqualWithPlaceholders(expectedHtml, cleaned);
        }
    }
}