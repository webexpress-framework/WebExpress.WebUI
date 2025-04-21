using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebIcon
{
    /// <summary>
    /// Tests the web icon.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestIcon
    {
        /// <summary>
        /// Tests the web icon.
        /// </summary>
        [Theory]
        [InlineData(typeof(IconHome), @"<span class=""fas fa-home""></span>")]
        public void Id(Type iconType, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);
            var icon = Activator.CreateInstance(iconType) as IIcon;

            // test execution
            var html = icon.Render(renderContext, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
