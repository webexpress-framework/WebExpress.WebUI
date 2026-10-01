using System.Reflection;
using System.Text.Json;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPdf;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.Test.WebPdf
{
    /// <summary>
    /// Tests converting the content of a <see cref="ControlContent"/> into a PDF document
    /// (PdfRendererContent): the same value, in the same two formats, that the reading view
    /// shows on a page.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestPdfRendererContent
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
        /// A case of the fixture shared with the reading view.
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
        /// Tests that the file shows the document and none of the scaffolding, by the rules
        /// the reading view and the server side reader share.
        /// </summary>
        /// <param name="name">The name of the case in the shared fixture.</param>
        [Theory]
        [MemberData(nameof(Cases))]
        public void SharedFixture(string name)
        {
            // arrange
            var fixture = Load().Single(x => x.Name == name);

            // act
            var pdf = new PdfInspector(PdfRendererContent.ConvertToPdf(fixture.Html).ToArray());
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
        /// Tests a rich text value with everything the editor adds to make it editable.
        /// </summary>
        [Fact]
        public void RichText()
        {
            // act
            var document = PdfRendererContent.ConvertToPdf(EditorValue, TypeFormatContent.RichText);
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
        /// Tests that a value converted to markdown with EditorContent renders the same text
        /// as the rich text value it came from.
        /// </summary>
        [Fact]
        public void MarkdownMatchesRichText()
        {
            // arrange
            var markdown = EditorContent.ConvertToMarkdown(EditorValue);

            // act
            var fromRichText = new PdfInspector(PdfRendererContent.ConvertToPdf(EditorValue, TypeFormatContent.RichText).ToArray());
            var fromMarkdown = new PdfInspector(PdfRendererContent.ConvertToPdf(markdown, TypeFormatContent.Markdown).ToArray());

            // validation
            foreach (var text in new[] { "Release notes", "The interface changes.", "2.0.0", "The reading view arrives." })
            {
                Assert.Contains(text, fromRichText.Text);
                Assert.Contains(text, fromMarkdown.Text);
            }
        }

        /// <summary>
        /// Tests that the state format the editor may store is read as well.
        /// </summary>
        [Fact]
        public void EditorStateValue()
        {
            // arrange
            var nodes = EditorContent.ReadDocument("<p>plain value</p>");

            // act
            var document = PdfRendererContent.ConvertToPdf("<p>plain value</p>");

            // validation
            Assert.Single(nodes);
            Assert.Equal("plain value", document.PlainText);
        }

        /// <summary>
        /// Tests the content of a control, evaluated in a render context.
        /// </summary>
        [Fact]
        public void Control()
        {
            // arrange
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var control = new ControlContent
            {
                Content = _ => "# Title\n\nSome **text**.",
                Format = _ => TypeFormatContent.Markdown
            };

            // act
            var document = control.ConvertToPdf(context);

            // validation
            Assert.IsType<PdfBlockElementHeading>(document.Elements.First());
            Assert.Equal("Some text.", document.Elements.Last().PlainText);
        }

        /// <summary>
        /// Tests that an empty control yields its placeholder, as on the page.
        /// </summary>
        [Theory]
        [InlineData(null, 0)]
        [InlineData("No description yet", 1)]
        public void ControlPlaceholder(string placeholder, int count)
        {
            // arrange
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var control = new ControlContent
            {
                Content = _ => "",
                Placeholder = _ => placeholder
            };

            // act
            var document = control.ConvertToPdf(context);

            // validation
            Assert.Equal(count, document.Elements.Count());

            if (count > 0)
            {
                Assert.True(document.Elements.OfType<PdfBlockElementParagraph>().Single().Content.OfType<PdfInlineElementText>().Single().Style.Italic);
            }
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
