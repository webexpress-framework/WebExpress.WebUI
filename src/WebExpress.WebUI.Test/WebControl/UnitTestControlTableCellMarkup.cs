using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the table cell with formatted content.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableCellMarkup
    {
        /// <summary>
        /// Tests that the content is wrapped in one inline container inside the marked cell,
        /// and that a cell without content still renders the container.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-table-cell-markup""><span class=""wx-table-cell-text""></span></div>")]
        [InlineData(true, @"<div class=""wx-table-cell-markup""><span class=""wx-table-cell-text"">x<strong>b<em>i</em></strong>y</span></div>")]
        public void Content(bool withContent, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCellMarkup()
            {
                Content = withContent
                    ? _ => new HtmlList
                    (
                        new HtmlText("x"),
                        new HtmlElementTextSemanticsStrong(new HtmlText("b"), new HtmlElementTextSemanticsEm(new HtmlText("i"))),
                        new HtmlText("y")
                    )
                    : null
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the id, class, style and color of the cell reach its element.
        /// </summary>
        [Fact]
        public void Attributes()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableCellMarkup("id")
            {
                Class = _ => "extra",
                Style = _ => "color: red;",
                Color = _ => TypeColorTable.Primary
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div id=""id"" class=""wx-table-cell-markup extra"" style=""color: red;"" data-color=""table-primary""><span class=""wx-table-cell-text""></span></div>", html);
        }
    }
}
