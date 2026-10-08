using System.Text.Json;
using WebExpress.WebUI.WebEditor;

namespace WebExpress.WebUI.Test.WebEditor
{
    /// <summary>
    /// Protects annotation metadata when a stored document crosses the server-side HTML boundary.
    /// </summary>
    public class UnitTestEditorState
    {
        /// <summary>
        /// Ensures that comments survive export without changing document text or introducing attributes.
        /// </summary>
        [Fact]
        public void ToHtmlPreservesCommentsAsEncodedMetadata()
        {
            // arrange
            var value = Document("comment-1", "\" onmouseover=\"alert(1) <script> & note");

            // act
            var html = EditorState.ToHtml(value);
            var text = EditorState.ValidationText(value);

            // validation
            Assert.Contains("class=\"wx-editor-comment\"", html);
            Assert.Contains("data-comment-id=\"comment-1\"", html);
            Assert.Contains("&quot; onmouseover=&quot;", html);
            Assert.DoesNotContain(" onmouseover=\"", html);
            Assert.Contains("<strong>Existing text</strong>", html);
            Assert.Equal("Existing text", text.Trim());
        }

        /// <summary>
        /// Rejects malformed comment marks while retaining the text they attempted to annotate.
        /// </summary>
        /// <param name="id">The untrusted annotation identifier.</param>
        /// <param name="text">The untrusted annotation text.</param>
        [Theory]
        [InlineData("<invalid>", "Note")]
        [InlineData("", "Note")]
        [InlineData("valid", "   ")]
        public void ToHtmlIgnoresInvalidComments(string id, string text)
        {
            // arrange
            var value = Document(id, text);

            // act
            var html = EditorState.ToHtml(value);

            // validation
            Assert.DoesNotContain("data-comment", html);
            Assert.Contains("<strong>Existing text</strong>", html);
        }

        /// <summary>
        /// Creates a stored document with annotation data independent of HTML escaping.
        /// </summary>
        /// <param name="id">The annotation identity to persist.</param>
        /// <param name="text">The annotation text to persist.</param>
        /// <returns>The JSON document consumed by the server-side reader.</returns>
        private static string Document(string id, string text)
        {
            return JsonSerializer.Serialize(new
            {
                version = 1,
                doc = new
                {
                    type = "doc",
                    children = new[]
                    {
                        new
                        {
                            type = "p",
                            children = new[]
                            {
                                new { type = "text", text = "Existing text", marks = new { bold = true, comment = new { id, text } } }
                            }
                        }
                    }
                }
            });
        }
    }
}
