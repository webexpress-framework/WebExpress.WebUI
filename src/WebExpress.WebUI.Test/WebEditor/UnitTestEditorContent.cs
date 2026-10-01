using System.Linq;
using System.Reflection;
using System.Text.Json;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.Test.WebPdf;
using WebExpress.WebUI.WebEditor;
using WebExpress.WebUI.WebPdf;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.Test.WebEditor
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
        /// A value as the editor stores it, with an instruction text, an add-on frame and a
        /// framed table with column resizers.
        /// </summary>
        private const string EditorValue =
            "<h4>Release notes</h4>"
            + "<p>The release date is fixed <span class=\"wx-editor-instruction\" contenteditable=\"false\">check the wording with legal</span> and cannot be moved.</p>"
            + "<p><br></p>"
            + "<div class=\"wx-addon-frame card my-3 shadow-sm\" contenteditable=\"false\" data-addon-id=\"warning-box\">"
            + "<div class=\"card-header\"><span class=\"wx-addon-drag-handle\">GRIP</span><span>Warning Widget</span><span class=\"wx-addon-settings-btn\">COG</span></div>"
            + "<div class=\"card-body wx-addon-body-widget\"><div class=\"alert alert-warning mb-0\"><strong>Warning:</strong> The interface changes.</div></div></div>"
            + "<p><br></p>"
            + "<div class=\"wx-addon-frame card\" data-type=\"table\"><div class=\"card-header\"><span>Table</span></div>"
            + "<div class=\"card-body wx-addon-body-container\"><table class=\"table table-striped table-bordered\">"
            + "<thead><tr><th>Version<span class=\"wx-col-resizer\"></span></th><th>Change</th></tr></thead>"
            + "<tbody><tr><td>2.0.0</td><td>The reading view arrives.</td></tr></tbody></table></div></div>"
            + "<p><br></p>";

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
        /// Tests that the file shows the document and none of the scaffolding, by the rules
        /// the reading view and the server side reader share.
        /// </summary>
        /// <param name="name">The name of the case in the shared fixture.</param>
        [Theory]
        [MemberData(nameof(Cases))]
        public void ConvertToPdf(string name)
        {
            // arrange
            var fixture = Load().Single(x => x.Name == name);

            // act
            var pdf = new PdfInspector(EditorContent.ConvertToPdf(fixture.Html).ToArray());
            var text = string.Concat(pdf.PageTexts.SelectMany(t => t));

            // validation
            foreach (var expected in fixture.Keeps)
            {
                Assert.Contains(expected.Replace(" ", ""), text.Replace(" ", ""));
            }

            foreach (var unexpected in fixture.Drops)
            {
                Assert.DoesNotContain(unexpected, text);
            }
        }

        /// <summary>
        /// Tests that a value with everything the editor adds to make it editable becomes a
        /// document of headings, callouts and tables, without the scaffolding.
        /// </summary>
        [Fact]
        public void ConvertToPdfStructure()
        {
            // act
            var document = EditorContent.ConvertToPdf(EditorValue);
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.IsType<PdfBlockElementHeading>(document.Elements.First());
            Assert.Contains(document.Elements, e => e is PdfBlockElementCallout { CalloutType: PdfCalloutType.Warning });
            Assert.Contains(document.Elements, e => e is PdfBlockElementTable);
            Assert.Contains("The interface changes.", pdf.Text);
            Assert.Contains("2.0.0", pdf.Text);
            Assert.DoesNotContain("Warning Widget", pdf.Text);
            Assert.DoesNotContain("check the wording", pdf.Text);
            Assert.DoesNotContain("GRIP", pdf.Text);
        }

        /// <summary>
        /// Tests that the value and its Markdown conversion render the same text, so either
        /// stored form yields the same file.
        /// </summary>
        [Fact]
        public void ConvertToPdfMatchesMarkdown()
        {
            // arrange
            var markdown = EditorContent.ConvertToMarkdown(EditorValue);

            // act
            var fromRichText = new PdfInspector(EditorContent.ConvertToPdf(EditorValue).ToArray());
            var fromMarkdown = new PdfInspector(PdfRendererMarkdown.ConvertMarkdownToPdf(markdown).ToArray());

            // validation
            foreach (var text in new[] { "Release notes", "The interface changes.", "2.0.0", "The reading view arrives." })
            {
                Assert.Contains(text, fromRichText.Text);
                Assert.Contains(text, fromMarkdown.Text);
            }
        }

        /// <summary>
        /// Tests that a container add-on keeps the presentation its body declares, as the
        /// reading view does, while the classes of the editing frame are dropped.
        /// </summary>
        [Fact]
        public void ReadDocumentKeepsAddOnPresentation()
        {
            // arrange
            var html = "<p><br></p>"
                + "<div class=\"wx-addon-frame card my-3 shadow-sm\" contenteditable=\"false\" data-addon-id=\"warning-box\">"
                + "<div class=\"card-header\"><span>Warning Box</span></div>"
                + "<div class=\"card-body p-2 wx-addon-body-container alert alert-warning\" contenteditable=\"true\">"
                + "<p><strong>Warning:</strong> The interface changes.</p></div></div>"
                + "<p><br></p>";

            // act
            var nodes = EditorContent.ReadDocument(html);
            var document = EditorContent.ConvertToPdf(html);

            // validation
            var block = Assert.IsAssignableFrom<HtmlElement>(Assert.Single(nodes));
            Assert.Equal("alert alert-warning", block.Class);
            Assert.IsType<HtmlElementTextContentP>(Assert.Single(block.Elements));
            var callout = Assert.IsType<PdfBlockElementCallout>(Assert.Single(document.Elements));
            Assert.Equal(PdfCalloutType.Warning, callout.CalloutType);
            Assert.DoesNotContain("Warning Box", document.PlainText);
        }

        /// <summary>
        /// Tests that the versioned state document the editor may store is read as well, with
        /// its instruction atoms dropped like the instruction spans of the markup format.
        /// </summary>
        [Fact]
        public void ConvertToPdfFromState()
        {
            // arrange
            var state = "{\"version\":1,\"doc\":{\"type\":\"doc\",\"children\":["
                + "{\"type\":\"h2\",\"children\":[{\"type\":\"text\",\"text\":\"State title\"}]},"
                + "{\"type\":\"p\",\"children\":[{\"type\":\"text\",\"text\":\"before \"},"
                + "{\"type\":\"atom\",\"attrs\":{\"kind\":\"instruction\",\"text\":\"for the author\"}},"
                + "{\"type\":\"text\",\"text\":\"after\"}]}]}}";

            // act
            var document = EditorContent.ConvertToPdf(state);

            // validation
            Assert.IsType<PdfBlockElementHeading>(document.Elements.First());
            Assert.Contains("State title", document.PlainText);
            Assert.Contains("before after", document.PlainText);
            Assert.DoesNotContain("for the author", document.PlainText);
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
            Assert.Empty(EditorContent.ConvertToPdf(html).Elements);
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
