using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the <see cref="BindFilter"/> binding class, which marks a data control as driven by
    /// the quickfilter registry.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestBindFilter
    {
        /// <summary>
        /// Verifies that the bind names no source. The quickfilter registry owns the active
        /// filters and writes them into the shared state itself, so the declaration exists only
        /// to mark the control as one that follows them.
        /// </summary>
        [Fact]
        public void DeclaresTheBindWithoutASource()
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var bind = new BindFilter();

            // act
            bind.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.Contains(@"data-wx-bind=""filter""", html);
            Assert.DoesNotContain("data-wx-source-filter", html);
        }

        /// <summary>
        /// Verifies that the bind name is 'filter', which is the name the client registry
        /// resolves the bind implementation by.
        /// </summary>
        [Fact]
        public void NameIsFilter()
        {
            Assert.Equal("filter", new BindFilter().Name);
        }
    }
}
