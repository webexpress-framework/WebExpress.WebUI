using System.Linq;
using System.Xml.Linq;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Protects the server-to-browser wiring of independently rendered native menus.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestNativeFrontend
    {
        /// <summary>
        /// Prevents repeated unnamed controls from opening or positioning another control's menu.
        /// </summary>
        [Theory]
        [InlineData(false, null)]
        [InlineData(false, "")]
        [InlineData(true, null)]
        [InlineData(true, "")]
        public void SplitMenusHaveIndependentTargets(bool link, string id)
        {
            var hub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var tree = new VisualTreeControl(hub, context.PageContext);
            var menus = Enumerable.Range(0, 2).Select(_ =>
            {
                Control control = link ? new ControlSplitButtonLink(id) : new ControlSplitButton(id);
                var root = XElement.Parse(control.Render(context, tree).ToString());
                var invoker = root.Elements("button").Single(x => x.Attribute("popovertarget") != null);
                var menu = root.Element("ul");
                Assert.Equal("button", invoker.Attribute("type")?.Value);
                Assert.Equal(menu.Attribute("id")?.Value, invoker.Attribute("popovertarget")?.Value);
                Assert.Equal("auto", menu.Attribute("popover")?.Value);
                var anchor = invoker.Attribute("style").Value.Split("anchor-name:")[1];
                Assert.Equal("position-anchor:" + anchor, menu.Attribute("style").Value);
                return menu;
            }).ToArray();
            Assert.NotEqual(menus[0].Attribute("id").Value, menus[1].Attribute("id").Value);
            Assert.NotEqual(menus[0].Attribute("style").Value, menus[1].Attribute("style").Value);
        }
    }
}
