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
        [InlineData("http://example.com", @"<p><a href=""http://example.com"">http://example.com</a></p>")]
        [InlineData("![alt](http://example.com)", @"<p><img src=""http://example.com"" alt=""alt"" style=""max-width: 100%;""></p>")]
        [InlineData("[text](http://example.com)", @"<p><a href=""http://example.com"">text</a></p>")]
        [InlineData("<span style=\"color: red;\">red text</span>", @"<p><span style=""color: red;"">red text</span></p>")]
        [InlineData("[X]", @"<p><input type=""checkbox"" class=""form-check-input"" checked></p>")]
        [InlineData("[ ]", @"<p><input type=""checkbox"" class=""form-check-input""></p>")]
        [InlineData("Text[^1]", @"<p>Text <sup>1</sup></p>")]
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
        /// Converts a Markdown string to its equivalent HTML representation.
        /// </summary>
        [Theory]
        [InlineData("This is a paragraph.", "<p>This is a paragraph.</p>")]
        [InlineData("This is a paragraph.\n\nThis is another paragraph.", @"<p>This is a paragraph.</p><p>This is another paragraph.</p>")]
        [InlineData("Welcome to **WebExpress**! Build your own `WebExpress` application.", @"<p>Welcome to  <strong>WebExpress</strong>! Build your own  <code>WebExpress</code> application.</p>")]
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
        [InlineData("- Point A\n  - Sub", @"<ul><li><p>Point A</p></li><ul><li><p>Sub</p></li></ul></ul>")]
        [InlineData("* Point A", @"<ul><li><p>Point A</p></li></ul>")]
        [InlineData("+ Point A", @"<ul><li><p>Point A</p></li></ul>")]
        [InlineData("- Point A\n  1. Sub", @"<ul><li><p>Point A</p></li><ol><li><p>Sub</p></li></ol></ul>")]
        [InlineData("1. First", @"<ol><li><p>First</p></li></ol>")]
        [InlineData("2. Second", @"<ol start=""2""><li><p>Second</p></li></ol>")]
        [InlineData("1. First\n  1. Sub", @"<ol><li><p>First</p></li><ol><li><p>Sub</p></li></ol></ol>")]
        [InlineData("I. First\n  - Sub", @"<ol type=""I""><li><p>First</p></li><ul><li><p>Sub</p></li></ul></ol>")]
        [InlineData("i. First\n  - Sub", @"<ol type=""i""><li><p>First</p></li><ul><li><p>Sub</p></li></ul></ol>")]
        [InlineData("A. First\n  - Sub", @"<ol type=""A""><li><p>First</p></li><ul><li><p>Sub</p></li></ul></ol>")]
        [InlineData("a. First\n  - Sub", @"<ol type=""a""><li><p>First</p></li><ul><li><p>Sub</p></li></ul></ol>")]
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