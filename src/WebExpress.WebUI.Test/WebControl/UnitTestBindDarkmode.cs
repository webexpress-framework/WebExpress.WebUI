using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Verifies that <see cref="BindDarkmode"/> emits the data attributes the
    /// JavaScript bind handler (<c>bind/default.js</c>) needs to swap the
    /// label text when the dark mode is toggled.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestBindDarkmode
    {
        [Fact]
        public void RendersTextLightAndTextDarkAttributes()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDropdownItemLink()
            {
                Text = _ => "label",
                Bind = _ => new Binding().Add(new BindDarkmode
                {
                    TextLight = "Activate dark mode",
                    TextDark = "Activate light mode"
                })
            };

            // act
            var html = control.Render(context, visualTree)?.ToString() ?? "";

            // assert
            Assert.Contains("data-wx-bind=\"darkmode\"", html);
            Assert.Contains("data-wx-bind-text-light=\"Activate dark mode\"", html);
            Assert.Contains("data-wx-bind-text-dark=\"Activate light mode\"", html);
        }
    }
}
