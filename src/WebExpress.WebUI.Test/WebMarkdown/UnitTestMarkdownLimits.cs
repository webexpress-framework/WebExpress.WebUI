using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebMarkdown.Element;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Tests that Markdown nested beyond the limit is kept as text instead of being parsed. Every
    /// nesting level is a recursive call in the parser and in the renderers, and a stack overflow
    /// cannot be caught in .NET: it ended the whole server process.
    /// </summary>
    public class UnitTestMarkdownLimits
    {
        /// <summary>
        /// Verifies that deeply nested blocks parse and render without exhausting the stack.
        /// </summary>
        /// <param name="prefix">The marker of one nesting level.</param>
        [Theory]
        [InlineData("> ")]
        [InlineData(">")]
        [InlineData("- ")]
        [InlineData("* ")]
        [InlineData("1. ")]
        [InlineData("\t")]
        [InlineData("> - ")]
        public void DeepBlocksAreBounded(string prefix)
        {
            // arrange
            _ = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var markdown = string.Concat(Enumerable.Repeat(prefix, 20_000)) + "deep";

            // act
            var document = MarkdownParser.Parse(markdown);
            var html = document.ConvertToHtml(renderContext).ToString();

            // validation
            Assert.True(Depth(document.Elements) <= 2 * MarkdownParser.MaxNestingDepth + 2);
            Assert.Contains("deep", html);
        }

        /// <summary>
        /// Verifies that a list whose items step one tab deeper each line stays a bounded tree.
        /// </summary>
        [Fact]
        public void DeepListIndentIsBounded()
        {
            // arrange
            _ = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var lines = Enumerable.Range(0, 2_000).Select(i => new string('\t', i) + "- item " + i);
            var markdown = string.Join("\n", lines);

            // act
            var document = MarkdownParser.Parse(markdown);
            var html = document.ConvertToHtml(renderContext).ToString();

            // validation
            Assert.True(Depth(document.Elements) <= 4 * MarkdownParser.MaxNestingDepth + 4);
            Assert.Contains("item 1999", html);
        }

        /// <summary>
        /// Verifies that deeply nested emphasis parses and renders without exhausting the stack.
        /// </summary>
        /// <param name="open">The opening marker of one level.</param>
        /// <param name="close">The closing marker of one level.</param>
        [Theory]
        [InlineData("*_", "_*")]
        [InlineData("**~", "~**")]
        [InlineData("==_", "_==")]
        public void DeepEmphasisIsBounded(string open, string close)
        {
            // arrange
            _ = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var markdown = string.Concat(Enumerable.Repeat(open, 10_000)) + "x"
                + string.Concat(Enumerable.Repeat(close, 10_000));

            // act
            var document = MarkdownParser.Parse(markdown);
            var html = document.ConvertToHtml(renderContext).ToString();

            // validation
            Assert.True(Depth(document.Elements) <= 2 * MarkdownParser.MaxNestingDepth + 2);
            Assert.Contains("x", html);
        }

        /// <summary>
        /// Verifies that nesting below the limit is still parsed as structure.
        /// </summary>
        [Fact]
        public void ShallowNestingIsStructure()
        {
            // act
            var document = MarkdownParser.Parse("> > > quoted");

            // validation
            Assert.Equal(5, Depth(document.Elements)); // three quotes, the paragraph and its text
        }

        /// <summary>
        /// Verifies that long lists and paragraphs full of unclosed markers parse in linear time.
        /// Each line of a list copied the rest of the document, and each unclosed "*" scanned it,
        /// so a megabyte took about a minute.
        /// </summary>
        /// <param name="unit">The text repeated to make up the document.</param>
        [Theory]
        [InlineData("- item item item\n")]
        [InlineData("a * ")]
        [InlineData("a ~ ")]
        public void LongDocumentParsesInLinearTime(string unit)
        {
            // arrange: the growth between two sizes is compared instead of an absolute time, which
            // depends on the load of the machine running the tests
            const int factor = 4;
            var small = string.Concat(Enumerable.Repeat(unit, 300_000 / unit.Length));
            var large = string.Concat(Enumerable.Repeat(unit, factor * 300_000 / unit.Length));

            // warm up, so that the JIT does not distort the first measurement
            _ = MarkdownParser.Parse(small);

            // act
            var smallTime = Measure(small);
            var largeTime = Measure(large, out var document);

            // validation: linear growth is about 4, quadratic growth about 16
            Assert.NotEmpty(document.Elements);
            Assert.True
            (
                largeTime.TotalMilliseconds < Math.Max(smallTime.TotalMilliseconds, 20) * factor * 2.5,
                $"{small.Length} characters took {smallTime}, {large.Length} characters took {largeTime}"
            );
        }

        /// <summary>
        /// Measures the time needed to parse a document.
        /// </summary>
        /// <param name="markdown">The document.</param>
        /// <returns>The time needed to parse.</returns>
        private static TimeSpan Measure(string markdown)
        {
            return Measure(markdown, out _);
        }

        /// <summary>
        /// Measures the time needed to parse a document.
        /// </summary>
        /// <param name="markdown">The document.</param>
        /// <param name="document">The parsed document.</param>
        /// <returns>The time needed to parse.</returns>
        private static TimeSpan Measure(string markdown, out MarkdownDocument document)
        {
            var watch = System.Diagnostics.Stopwatch.StartNew();
            document = MarkdownParser.Parse(markdown);

            return watch.Elapsed;
        }

        /// <summary>
        /// Measures the depth of an element tree.
        /// </summary>
        /// <param name="elements">The elements of one level.</param>
        /// <returns>The number of levels.</returns>
        private static int Depth(IEnumerable<IMarkdownElement> elements)
        {
            var depth = 0;
            var level = elements?.ToList() ?? [];

            while (level.Count > 0)
            {
                depth++;
                level = level.SelectMany(Children).ToList();
            }

            return depth;
        }

        /// <summary>
        /// Reads the child elements of an element, whichever collection holds them.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <returns>The child elements.</returns>
        private static IEnumerable<IMarkdownElement> Children(IMarkdownElement element)
        {
            return element.GetType().GetProperties()
                .Where(property => typeof(IEnumerable<IMarkdownElement>).IsAssignableFrom(property.PropertyType)
                    && property.GetIndexParameters().Length == 0)
                .SelectMany(property => (property.GetValue(element) as IEnumerable<IMarkdownElement>) ?? []);
        }
    }
}
