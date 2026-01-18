using System.Reflection;
using WebExpress.WebUI.WebMarkdown;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Tests a complex Markdown document loaded from an embedded resource.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestComplexMarkdown
    {
        /// <summary>
        /// Tests whether a complex markdown document containing various block and inline elements
        /// is correctly parsed into the expected structure. The test loads an embedded markdown file
        /// and checks the correct order and types of the top-level elements, as well as the presence
        /// of different inline elements in the first paragraph.
        /// </summary>
        [Theory]
        [InlineData("WebExpress.WebUI.Test.Data.ComplexExample1.md", 9)]
        [InlineData("WebExpress.WebUI.Test.Data.ComplexExample2.md", 9)]
        [InlineData("WebExpress.WebUI.Test.Data.ComplexExample3.md", 9)]
        public void ParsesComplexDocument(string fileName, int elementsCount)
        {
            // arrange
            var markdown = LoadEmbeddedResource(fileName);

            // act
            var doc = MarkdownParser.Parse(markdown);

            // validation
            Assert.Equal(elementsCount, doc.Elements.Count());
        }

        /// <summary>
        /// Loads an embedded resource as a string.
        /// </summary>
        /// <param name="resourceName">The fully qualified resource name.</param>
        /// <returns>The contents of the embedded resource.</returns>
        private static string LoadEmbeddedResource(string resourceName)
        {
            var assembly = Assembly.GetExecutingAssembly();
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream is null)
            {
                throw new FileNotFoundException("Resource not found: " + resourceName);
            }

            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
    }
}