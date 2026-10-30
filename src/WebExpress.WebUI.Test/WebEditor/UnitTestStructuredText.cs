using System.Text.Json;
using System.Linq;
using WebExpress.WebUI.WebEditor;
using WebExpress.WebUI.WebSpreadsheet;

namespace WebExpress.WebUI.Test.WebEditor
{
    /// <summary>
    /// Protects format discrimination and public text extraction.
    /// </summary>
    public class UnitTestStructuredText
    {
        /// <summary>
        /// Rejects arbitrary, ambiguous and malformed JSON.
        /// </summary>
        /// <param name="value">The invalid input.</param>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("{")]
        [InlineData("{}")]
        [InlineData("[]")]
        [InlineData("{\"version\":1,\"doc\":{\"type\":\"doc\",\"children\":42}}")]
        [InlineData("{\"version\":1,\"doc\":{\"type\":\"doc\",\"children\":[{\"type\":\"text\",\"text\":42}]}}")]
        [InlineData("{\"version\":1,\"doc\":{\"type\":\"doc\",\"children\":[null]}}")]
        [InlineData("{\"version\":1,\"sheets\":[null]}")]
        [InlineData("{\"version\":1,\"doc\":{\"type\":\"doc\"},\"sheets\":[]}")]
        [InlineData("{\"version\":9,\"sheets\":[]}")]
        public void InvalidDocumentsAreNotRecognized(string value)
        {
            // arrange
            var input = value;
            // act
            var editor = EditorState.IsState(input);
            var workbook = SpreadsheetWorkbook.IsWorkbook(input);
            // validation
            Assert.False(editor);
            Assert.False(workbook);
        }

        /// <summary>
        /// Keeps inline words intact and separates paragraphs.
        /// </summary>
        [Fact]
        public void EditorTextPreservesInlineWords()
        {
            // arrange
            var input = """{"version":1,"doc":{"type":"doc","children":[{"type":"p","children":[{"type":"text","text":"Hel"},{"type":"text","text":"lo <&>","marks":{"bold":true}}]},{"type":"p","children":[{"type":"text","text":"world"}]}]}}""";
            // act
            var text = EditorState.ToPlainText(input);
            // validation
            Assert.True(EditorState.IsState(input));
            Assert.False(SpreadsheetWorkbook.IsWorkbook(input));
            Assert.Equal("Hello <&> world", text);
            Assert.False(EditorState.IsEmpty(input));
            Assert.Throws<JsonException>(() => EditorState.ToPlainText("{}"));
        }

        /// <summary>
        /// Separates valid empty documents from invalid content.
        /// </summary>
        [Fact]
        public void EmptyDocumentsHaveEmptyText()
        {
            // arrange
            var editor = """{"version":1,"doc":{"type":"doc","children":[]}}""";
            var workbook = SpreadsheetWorkbook.Parse(null);
            // act
            var editorText = EditorState.ToPlainText(editor);
            var workbookText = workbook.ToPlainText();
            // validation
            Assert.True(EditorState.IsEmpty(editor));
            Assert.Equal("", editorText);
            Assert.Equal("", workbookText);
            Assert.True(SpreadsheetWorkbook.IsWorkbook(workbook.ToJson()));
            Assert.False(EditorState.IsState(workbook.ToJson()));
            Assert.Throws<JsonException>(() => SpreadsheetWorkbook.Parse("{}"));
        }

        /// <summary>
        /// Extracts scalar cell values in row order without exposing workbook JSON.
        /// </summary>
        [Fact]
        public void WorkbookTextUsesCellOrder()
        {
            // arrange
            var workbook = SpreadsheetWorkbook.Parse(null);
            workbook.Sheets[0].SetCell(1, 0, new SpreadsheetCell { Value = "second" });
            workbook.Sheets[0].SetCell(0, 0, new SpreadsheetCell { Value = "first" });
            // act
            var text = SpreadsheetWorkbook.ToPlainText(workbook.ToJson());
            // validation
            Assert.Equal("first second", text);
        }
        /// <summary>
        /// Keeps multiple ordinary contents widgets available with safely encoded shared captions.
        /// </summary>
        [Fact]
        public void ServerHtmlRepeatsBoundedContents()
        {
            // arrange
            var value = """{"version":1,"doc":{"type":"doc","children":[{"type":"h2","children":[{"type":"text","text":"A < B"}]},{"type":"addon","attrs":{"name":"toc"}},{"type":"addon","attrs":{"name":"toc"}}]}}""";

            // act
            var html = EditorState.ToHtml(value);

            // validation
            Assert.Equal(2, html.Split("<li>A &lt; B</li>").Length - 1);
        }

        /// <summary>
        /// Bounds generated contents entries and repeated captions independently of input size.
        /// </summary>
        /// <param name="headingCount">The number of headings in the document.</param>
        /// <param name="tocCount">The number of contents widgets.</param>
        /// <param name="captionLength">The size of each heading caption.</param>
        [Theory]
        [InlineData(230, 230, 7)]
        [InlineData(1, 81, 100000)]
        public void ServerHtmlLimitsContentsExpansion(int headingCount, int tocCount, int captionLength)
        {
            // arrange
            var headings = Enumerable.Range(0, headingCount).Select(_ => (object)new
            {
                type = "h2", children = new[] { new { type = "text", text = new string('x', captionLength) } }
            });
            var widgets = Enumerable.Range(0, tocCount).Select(_ => (object)new { type = "addon", attrs = new { name = "toc" } });
            var value = JsonSerializer.Serialize(new { version = 1, doc = new { type = "doc", children = headings.Concat(widgets) } });

            // act
            var exception = Record.Exception(() => EditorState.ToHtml(value));

            // validation
            Assert.True(EditorState.IsState(value));
            Assert.IsType<JsonException>(exception);
        }

        /// <summary>
        /// Renders general add-ons as safe structured server markup.
        /// </summary>
        [Fact]
        public void ServerHtmlSupportsDocumentAddons()
        {
            // arrange
            var value = """{"version":1,"doc":{"type":"doc","children":[{"type":"h2","children":[{"type":"text","text":"Heading"}]},{"type":"addon","attrs":{"name":"toc"}},{"type":"addon","attrs":{"name":"callout","container":true,"data":{"title":"Notice <&>","tone":"warning"}},"children":[{"type":"p","children":[{"type":"text","text":"Body"}]}]},{"type":"addon","attrs":{"name":"status","inline":true,"data":{"text":"<script>unsafe</script>","tone":"success"}}}]}}""";
            // act
            var html = EditorState.ToHtml(value);
            // validation
            Assert.Contains("wx-document-toc", html);
            Assert.Contains("<li>Heading</li>", html);
            Assert.Contains("wx-editor-callout", html);
            Assert.Contains("badge bg-success", html);
            Assert.DoesNotContain("<script>", html);
            Assert.Contains("&lt;script&gt;unsafe&lt;/script&gt;", html);
        }
    }
}
