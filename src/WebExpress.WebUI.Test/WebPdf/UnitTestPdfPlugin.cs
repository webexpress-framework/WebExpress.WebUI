using System.Text.RegularExpressions;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebPdf;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.Test.WebPdf
{
    /// <summary>
    /// Tests the plugin elements of the PDF model: how markdown and HTML carry a plugin into
    /// the model, how a registered <see cref="IPdfPlugin"/> replaces it when the document is
    /// written, and what a document shows when no plugin is registered.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestPdfPlugin
    {
        /// <summary>
        /// Tests that a markdown block plugin keeps its name, parameters and content.
        /// </summary>
        [Fact]
        public void MarkdownBlock()
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("{{% note type=\"warning\" %}}\nBe **careful**.\n{{% /note %}}");

            // validation
            var plugin = Assert.IsType<PdfBlockElementPlugin>(Assert.Single(document.Elements));
            Assert.Equal("note", plugin.Name);
            Assert.Equal("warning", plugin.Parameters["type"]);
            Assert.Equal("Be careful.", Assert.IsType<PdfBlockElementParagraph>(Assert.Single(plugin.Content)).PlainText);
        }

        /// <summary>
        /// Tests that a markdown inline plugin keeps its parameters and the style of the text
        /// it stands in.
        /// </summary>
        [Fact]
        public void MarkdownInline()
        {
            // act
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("see **{{ticket id=\"42\"}}** now");
            var paragraph = Assert.IsType<PdfBlockElementParagraph>(Assert.Single(document.Elements));

            // validation
            var plugin = Assert.Single(paragraph.Content.OfType<PdfInlineElementPlugin>());
            Assert.Equal("ticket", plugin.Name);
            Assert.Equal("42", plugin.Parameters["ID"]);
            Assert.True(plugin.Style.Bold);
        }

        /// <summary>
        /// Tests that the plugin markup of the markdown HTML renderer becomes plugin elements,
        /// in block and in inline position.
        /// </summary>
        [Fact]
        public void Html()
        {
            // arrange
            var html = "<div class=\"wx-plugin wx-plugin-block\" data-plugin=\"note\" data-plugin-type=\"warning\"><p>inside</p></div>"
                + "<p>see <i><div class=\"wx-plugin wx-plugin-inline\" data-plugin=\"ticket\" data-plugin-id=\"4&amp;2\"></div></i></p>";

            // act
            var elements = PdfRendererHtml.ConvertHtmlToPdf(html).Elements.ToList();

            // validation
            var block = Assert.IsType<PdfBlockElementPlugin>(elements[0]);
            Assert.Equal("note", block.Name);
            Assert.Equal("warning", block.Parameters["type"]);
            Assert.Equal("inside", Assert.Single(block.Content).PlainText);

            var inline = elements.Skip(1).OfType<PdfBlockElementParagraph>().SelectMany(p => p.Content).OfType<PdfInlineElementPlugin>().ToList();
            Assert.Equal("ticket", Assert.Single(inline).Name);
            Assert.Equal("4&2", inline[0].Parameters["id"]);
        }

        /// <summary>
        /// Tests that a document stays readable without the plugins it names: a block shows
        /// its content, an inline element is left out, and a line that only named a plugin
        /// leaves nothing behind.
        /// </summary>
        [Fact]
        public void Unregistered()
        {
            // arrange
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("before {{unregistered_inline}} after\n\n{{unregistered_line}}\n\n{{% unregistered_block %}}\ninside\n{{% /unregistered_block %}}");
            document.Compress = false;

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Equal("before after inside", Regex.Replace(pdf.Text, @"\s+", " "));
        }

        /// <summary>
        /// Tests that a registered plugin replaces its elements in the written file and that
        /// an inline result is set in the surrounding style.
        /// </summary>
        [Fact]
        public void Registered()
        {
            // arrange
            var plugin = new Plugin
            {
                Block = e => [new PdfBlockElementHeading(2, $"Box {e.Parameters["title"]}")],
                Inline = e => [new PdfInlineElementText($"#{e.Parameters["id"]}", e.Style)]
            };
            using var registration = new Registration("pdftest_registered", plugin);
            var document = PdfRendererMarkdown.ConvertMarkdownToPdf("# Release {{pdftest_registered id=\"7\"}}\n\nsee *{{pdftest_registered id=\"42\"}}*\n\n{{% pdftest_registered title=\"one\" %}}\nhidden\n{{% /pdftest_registered %}}");
            document.Compress = false;

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Contains("#42", pdf.PageTexts[0]);
            Assert.Contains("Box one", pdf.PageTexts[0]);
            Assert.DoesNotContain("hidden", pdf.Text);
            Assert.Contains("/Title (Release #7)", pdf.Raw);
            Assert.Contains("/Title (Box one)", pdf.Raw);
        }

        /// <summary>
        /// Tests that a plugin is asked once per element, although an element in a table cell
        /// is measured several times before it is drawn.
        /// </summary>
        [Fact]
        public void AskedOnce()
        {
            // arrange
            var calls = 0;
            var plugin = new Plugin { Block = e => { calls++; return [new PdfBlockElementParagraph("cell")]; } };
            using var registration = new Registration("pdftest_once", plugin);
            var document = new PdfDocument().Add(new PdfBlockElementTable()
                .Add(new PdfBlockElementTableRow([new PdfBlockElementTableCell([new PdfBlockElementPlugin("pdftest_once")]), new PdfBlockElementTableCell("x")])));

            // act
            document.ToArray();

            // validation
            Assert.Equal(1, calls);
        }

        /// <summary>
        /// Tests that a plugin that keeps answering with itself ends in its content rather
        /// than in an endless recursion.
        /// </summary>
        [Fact]
        public void SelfReference()
        {
            // arrange
            var plugin = new Plugin { Block = e => [new PdfBlockElementPlugin(e.Name, e.Parameters, e.Content)] };
            using var registration = new Registration("pdftest_self", plugin);
            var document = new PdfDocument { Compress = false }.Add(new PdfBlockElementPlugin("pdftest_self").Add(new PdfBlockElementParagraph("end")));

            // act
            var pdf = new PdfInspector(document.ToArray());

            // validation
            Assert.Equal(["end"], pdf.PageTexts[0]);
        }

        /// <summary>
        /// Tests that a name is held by the first plugin registered under it, regardless of
        /// case, until that plugin is removed.
        /// </summary>
        [Fact]
        public void Registry()
        {
            // arrange
            var first = new Plugin();
            var second = new Plugin();
            using var registration = new Registration("pdftest_registry", first);

            // act & validation
            Assert.False(PdfPluginRegistry.Register("PDFTEST_REGISTRY", second));
            Assert.Same(first, PdfPluginRegistry.Get("PdfTest_Registry"));
            Assert.True(PdfPluginRegistry.Remove("pdftest_registry"));
            Assert.Null(PdfPluginRegistry.Get("pdftest_registry"));
        }

        /// <summary>
        /// Tests that the manager registers the PDF plugins of a loaded plugin under the name
        /// of their attribute, and removes them again.
        /// </summary>
        [Fact]
        public void Manager()
        {
            // arrange
            PdfPluginRegistry.Remove("testpdf");

            // act
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var manager = componentHub.GetComponentManager<PdfPluginManager>();

            // validation
            Assert.NotNull(manager);
            Assert.IsType<TestPdfPlugin>(PdfPluginRegistry.Get("testpdf"));

            manager.Dispose();
            Assert.Null(PdfPluginRegistry.Get("testpdf"));
        }

        /// <summary>
        /// A plugin whose results are given by the test.
        /// </summary>
        private sealed class Plugin : IPdfPlugin
        {
            public Func<PdfBlockElementPlugin, IEnumerable<PdfBlockElement>> Block { get; init; }

            public Func<PdfInlineElementPlugin, IEnumerable<PdfInlineElement>> Inline { get; init; }

            public IEnumerable<PdfBlockElement> ConvertBlock(PdfBlockElementPlugin element)
            {
                return Block?.Invoke(element) ?? element.Content;
            }

            public IEnumerable<PdfInlineElement> ConvertInline(PdfInlineElementPlugin element)
            {
                return Inline?.Invoke(element) ?? [];
            }
        }

        /// <summary>
        /// Registers a plugin for the duration of a test.
        /// </summary>
        private sealed class Registration : IDisposable
        {
            private readonly string _name;

            public Registration(string name, IPdfPlugin plugin)
            {
                _name = name;
                Assert.True(PdfPluginRegistry.Register(name, plugin));
            }

            public void Dispose()
            {
                PdfPluginRegistry.Remove(_name);
            }
        }
    }
}
