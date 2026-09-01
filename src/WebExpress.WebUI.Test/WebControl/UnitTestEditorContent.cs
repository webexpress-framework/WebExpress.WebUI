using System.Linq;
using System.Reflection;
using System.Text.Json;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests reading the working surface of the editor as a document.
    /// <para>
    /// The cases come from Data/editor-content.fixture.json, which the JavaScript side reads
    /// as well (content.scaffolding.test.mjs). The two implementations cannot share code -
    /// they work on different trees and produce different output - so they share the cases:
    /// a rule added on one side and forgotten on the other fails on the other side.
    /// </para>
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestEditorContent
    {
        /// <summary>
        /// A case of the shared fixture.
        /// </summary>
        public class Fixture
        {
            /// <summary>
            /// Gets or sets what the case is about.
            /// </summary>
            public string Name { get; set; }

            /// <summary>
            /// Gets or sets the value as the editor stores it.
            /// </summary>
            public string Html { get; set; }

            /// <summary>
            /// Gets or sets the text that has to survive.
            /// </summary>
            public string[] Keeps { get; set; } = [];

            /// <summary>
            /// Gets or sets the text that must not reach the reader.
            /// </summary>
            public string[] Drops { get; set; } = [];

            /// <summary>
            /// Gets or sets the expected number of paragraphs, where the case is about them.
            /// </summary>
            public int? Paragraphs { get; set; }
        }

        /// <summary>
        /// Returns the cases of the shared fixture.
        /// </summary>
        /// <returns>The cases, one per test run.</returns>
        public static TheoryData<string> Cases()
        {
            var data = new TheoryData<string>();

            foreach (var fixture in Load())
            {
                data.Add(fixture.Name);
            }

            return data;
        }

        /// <summary>
        /// Tests that reading a stored value keeps the document and drops the scaffolding.
        /// </summary>
        /// <param name="name">The name of the case in the shared fixture.</param>
        [Theory]
        [MemberData(nameof(Cases))]
        public void ReadDocument(string name)
        {
            // arrange
            var fixture = Load().Single(x => x.Name == name);

            // act
            var nodes = EditorContent.ReadDocument(fixture.Html);
            var text = string.Concat(nodes.Select(PlainText));

            // validation
            foreach (var expected in fixture.Keeps)
            {
                Assert.Contains(expected, text);
            }

            foreach (var unexpected in fixture.Drops)
            {
                Assert.DoesNotContain(unexpected, text);
            }

            if (fixture.Paragraphs.HasValue)
            {
                Assert.Equal(fixture.Paragraphs.Value, nodes.OfType<HtmlElementTextContentP>().Count());
            }
        }

        /// <summary>
        /// Tests that a caret marker written with an empty value cannot be seen on the server,
        /// because the html element model treats an empty attribute value as unset. Markers
        /// are transient in the editor and are not part of a stored value, so this records the
        /// difference to the client rather than papering over it.
        /// </summary>
        [Fact]
        public void ReadDocumentWithValuedMarker()
        {
            // act
            var visible = EditorContent.ReadDocument("<p>a<span data-wx-caret>M</span>b</p>");
            var invisible = EditorContent.ReadDocument("<p>a<span data-wx-caret=\"\">M</span>b</p>");

            // validation
            Assert.DoesNotContain("M", string.Concat(visible.Select(PlainText)));
            Assert.Contains("M", string.Concat(invisible.Select(PlainText)));
        }

        /// <summary>
        /// Returns the concatenated text of a node and its descendants.
        /// </summary>
        /// <param name="node">The node.</param>
        /// <returns>The text.</returns>
        private static string PlainText(IHtmlNode node)
        {
            return node switch
            {
                HtmlText text => text.Value ?? "",
                HtmlElement element => string.Concat(element.Elements.Select(PlainText)),
                _ => ""
            };
        }

        /// <summary>
        /// Tests that the same holds once the document is converted to Markdown, which is the
        /// one-liner the whole pre-stage exists for.
        /// </summary>
        /// <param name="name">The name of the case in the shared fixture.</param>
        [Theory]
        [MemberData(nameof(Cases))]
        public void ConvertToMarkdown(string name)
        {
            // arrange
            var fixture = Load().Single(x => x.Name == name);

            // act
            var markdown = EditorContent.ConvertToMarkdown(fixture.Html);

            // validation
            foreach (var text in fixture.Keeps)
            {
                Assert.Contains(text, markdown);
            }

            foreach (var text in fixture.Drops)
            {
                Assert.DoesNotContain(text, markdown);
            }
        }

        /// <summary>
        /// Tests that a stored editor value becomes a document in Markdown notation, not just
        /// stripped markup.
        /// </summary>
        [Fact]
        public void ConvertToMarkdownNotation()
        {
            // arrange
            var html = "<h2>Release notes</h2><p>A <b>bold</b> word.</p>"
                + "<p><br></p>"
                + "<div class=\"wx-addon-frame card\" contenteditable=\"false\">"
                + "<div class=\"card-header\"><span>Warning Widget</span></div>"
                + "<div class=\"card-body wx-addon-body-widget\"><div class=\"alert\">Careful.</div></div></div>"
                + "<p><br></p>"
                + "<ul><li>first</li><li>second</li></ul>";

            // act
            var markdown = EditorContent.ConvertToMarkdown(html);

            // validation
            Assert.Contains("## Release notes", markdown);
            Assert.Contains("A **bold** word.", markdown);
            Assert.Contains("Careful.", markdown);
            Assert.Contains("- first", markdown);
            Assert.DoesNotContain("Warning Widget", markdown);
            Assert.DoesNotContain("<", markdown);
        }

        /// <summary>
        /// Tests that no input yields no output rather than an exception.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void ConvertWithoutContent(string html)
        {
            Assert.Equal(string.Empty, EditorContent.ConvertToMarkdown(html));
            Assert.Empty(EditorContent.ReadDocument(html));
        }

        /// <summary>
        /// Reads the shared fixture from the embedded resource.
        /// </summary>
        /// <returns>The cases.</returns>
        private static List<Fixture> Load()
        {
            var assembly = Assembly.GetExecutingAssembly();
            using var stream = assembly.GetManifestResourceStream("WebExpress.WebUI.Test.Data.editor-content.fixture.json");
            using var reader = new StreamReader(stream);
            var document = JsonDocument.Parse(reader.ReadToEnd());

            return document.RootElement.GetProperty("cases").Deserialize<List<Fixture>>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
    }
}
