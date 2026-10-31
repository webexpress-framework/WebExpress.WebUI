using System.Text.RegularExpressions;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebMarkdown.Element;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Tests how a registered <see cref="IMarkdownPlugin"/> replaces a plugin element when a
    /// document is rendered as HTML, and what a page shows when no plugin is registered.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestMarkdownPlugin
    {
        /// <summary>
        /// Tests that a plugin nobody has registered keeps its placeholder for a script on the
        /// page, with its parameters and the enclosed content.
        /// </summary>
        [Fact]
        public void Unregistered()
        {
            // act
            var html = Render("see {{mdtest_unregistered id=\"42\"}}\n\n{{% mdtest_unregistered type=\"warning\" %}}\ninside\n{{% /mdtest_unregistered %}}");

            // validation
            Assert.Contains("<div class=\"wx-plugin wx-plugin-inline\" data-plugin=\"mdtest_unregistered\" data-plugin-id=\"42\"></div>", html);
            Assert.Contains("<div class=\"wx-plugin wx-plugin-block\" data-plugin=\"mdtest_unregistered\" data-plugin-type=\"warning\"><p>inside</p></div>", html);
        }

        /// <summary>
        /// Tests that a registered plugin replaces its elements and that a block plugin gets
        /// its content already rendered.
        /// </summary>
        [Fact]
        public void Registered()
        {
            // arrange
            var plugin = new Plugin
            {
                Block = (e, content) => new HtmlElementTextContentDiv(content) { Class = $"box-{e.Parameters["type"]}" },
                Inline = e => new HtmlElementTextSemanticsA($"#{e.Parameters["id"]}") { Href = $"/ticket/{e.Parameters["id"]}" }
            };
            using var registration = new Registration("mdtest_registered", plugin);

            // act
            var html = Render("see {{mdtest_registered id=\"42\"}}\n\n{{% mdtest_registered type=\"warning\" %}}\n**inside**\n{{% /mdtest_registered %}}");

            // validation
            Assert.Contains("<p>see <a href=\"/ticket/42\">#42</a></p>", html);
            Assert.Contains("<div class=\"box-warning\"><p><strong>inside</strong></p></div>", html);
            Assert.DoesNotContain("data-plugin", html);
        }

        /// <summary>
        /// Tests that a plugin with only one form keeps the placeholder for the other.
        /// </summary>
        [Fact]
        public void PartialForm()
        {
            // arrange
            var plugin = new Plugin { Inline = e => new HtmlText("inline") };
            using var registration = new Registration("mdtest_partial", plugin);

            // act
            var html = Render("{{% mdtest_partial %}}\ninside\n{{% /mdtest_partial %}}");

            // validation
            Assert.Contains("<div class=\"wx-plugin wx-plugin-block\" data-plugin=\"mdtest_partial\"><p>inside</p></div>", html);
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
            using var registration = new Registration("mdtest_registry", first);

            // act & validation
            Assert.False(MarkdownPluginRegistry.Register("MDTEST_REGISTRY", second));
            Assert.Same(first, MarkdownPluginRegistry.Get("MdTest_Registry"));
            Assert.True(MarkdownPluginRegistry.Remove("mdtest_registry"));
            Assert.Null(MarkdownPluginRegistry.Get("mdtest_registry"));
        }

        /// <summary>
        /// Tests that the manager registers the markdown plugins of a loaded plugin under the
        /// name of their attribute, and removes them again.
        /// </summary>
        [Fact]
        public void Manager()
        {
            // arrange
            MarkdownPluginRegistry.Remove("testmarkdown");

            // act
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var manager = componentHub.GetComponentManager<MarkdownPluginManager>();

            // validation
            Assert.NotNull(manager);
            Assert.IsType<TestMarkdownPlugin>(MarkdownPluginRegistry.Get("testmarkdown"));
            Assert.Contains("<p>a b</p>", Render("a {{testmarkdown text=\"b\"}}"));

            manager.Dispose();
            Assert.Null(MarkdownPluginRegistry.Get("testmarkdown"));
        }

        /// <summary>
        /// Renders a markdown text as HTML, with whitespace runs collapsed and none between
        /// tags, as the serializer indents nested elements.
        /// </summary>
        /// <param name="markdown">The markdown text.</param>
        /// <returns>The HTML.</returns>
        private static string Render(string markdown)
        {
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var html = MarkdownParser.Parse(markdown).ConvertToHtml(renderContext).ToString();

            return Regex.Replace(Regex.Replace(html, @"\s+", " "), @">\s+<", "><");
        }

        /// <summary>
        /// A plugin whose results are given by the test.
        /// </summary>
        private sealed class Plugin : IMarkdownPlugin
        {
            public Func<MarkdownBlockElementPlugin, IHtmlNode, IHtmlNode> Block { get; init; }

            public Func<MarkdownInlineElementPlugin, IHtmlNode> Inline { get; init; }

            public IHtmlNode ConvertBlock(MarkdownBlockElementPlugin element, IHtmlNode content, IRenderControlContext renderContext)
            {
                return Block?.Invoke(element, content);
            }

            public IHtmlNode ConvertInline(MarkdownInlineElementPlugin element, IRenderControlContext renderContext)
            {
                return Inline?.Invoke(element);
            }
        }

        /// <summary>
        /// Registers a plugin for the duration of a test.
        /// </summary>
        private sealed class Registration : IDisposable
        {
            private readonly string _name;

            public Registration(string name, IMarkdownPlugin plugin)
            {
                _name = name;
                Assert.True(MarkdownPluginRegistry.Register(name, plugin));
            }

            public void Dispose()
            {
                MarkdownPluginRegistry.Remove(_name);
            }
        }
    }
}
