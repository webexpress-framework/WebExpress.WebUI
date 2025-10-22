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
        [InlineData(typeof(IconHome), @"<i class=""fas fa-home""></i>")]
        public void Id(Type iconType, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var renderContext = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, renderContext.PageContext);
            var icon = Activator.CreateInstance(iconType) as IIcon;

            // test execution
            var html = icon.Render(renderContext, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
