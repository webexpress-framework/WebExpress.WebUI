using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the <see cref="ActionDismiss"/> action, which leaves the fullscreen mode of a
    /// target element.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestActionDismiss
    {
        /// <summary>
        /// Verifies that the attributes name what is dismissed and on which element, with the
        /// id normalised to a selector.
        /// </summary>
        [Fact]
        public void ApplyUserAttributesEmitsDismissAndTarget()
        {
            // arrange
            var input = new HtmlElementTextContentDiv();
            var action = new ActionDismiss("editor");

            // act
            action.ApplyUserAttributes(input);

            // validation
            var html = input.ToString();
            Assert.Contains(@"data-wx-dismiss=""fullscreen""", html);
            Assert.Contains(@"data-wx-target=""#editor""", html);
        }

        /// <summary>
        /// Verifies that the JSON representation carries the same facts as the attributes, so
        /// an action delivered through a JSON island says what the rendered one says.
        /// </summary>
        [Fact]
        public void ToJsonMirrorsTheAttributes()
        {
            // act
            var json = new ActionDismiss("editor").ToJson();
            var withoutTarget = new ActionDismiss(null).ToJson();

            // validation
            Assert.Equal("dismiss", json["action"]);
            Assert.Equal("fullscreen", json["dismiss"]);
            Assert.Equal("#editor", json["target"]);
            Assert.False(withoutTarget.ContainsKey("target"));
        }
    }
}
