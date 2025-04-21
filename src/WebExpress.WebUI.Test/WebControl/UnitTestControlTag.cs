using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the tag control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTag
    {
        /// <summary>
        /// Tests the id property of the tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""badge rounded-pill""></span>")]
        [InlineData("id", @"<span id=""id"" class=""badge rounded-pill""></span>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTag(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""badge rounded-pill""></span>")]
        [InlineData("abc", @"<span class=""badge rounded-pill"">abc</span>")]
        [InlineData("webexpress.webui:plugin.name", @"<span class=""badge rounded-pill"">WebExpress.WebUI</span>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTag()
            {
                Text = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the pill property of the tag control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<span class=""badge""></span>")]
        [InlineData(true, @"<span class=""badge rounded-pill""></span>")]
        public void Pill(bool pill, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTag()
            {
                Pill = pill
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the layout property of the tag control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackgroundBadge.Default, @"<span class=""badge rounded-pill""></span>")]
        [InlineData(TypeColorBackgroundBadge.Primary, @"<span class=""badge rounded-pill text-bg-primary""></span>")]
        [InlineData(TypeColorBackgroundBadge.Secondary, @"<span class=""badge rounded-pill text-bg-secondary""></span>")]
        [InlineData(TypeColorBackgroundBadge.Info, @"<span class=""badge rounded-pill text-bg-info""></span>")]
        [InlineData(TypeColorBackgroundBadge.Success, @"<span class=""badge rounded-pill text-bg-success""></span>")]
        [InlineData(TypeColorBackgroundBadge.Warning, @"<span class=""badge rounded-pill text-bg-warning""></span>")]
        [InlineData(TypeColorBackgroundBadge.Danger, @"<span class=""badge rounded-pill text-bg-danger""></span>")]
        [InlineData(TypeColorBackgroundBadge.Light, @"<span class=""badge rounded-pill text-bg-light""></span>")]
        [InlineData(TypeColorBackgroundBadge.Dark, @"<span class=""badge rounded-pill text-bg-dark""></span>")]
        public void Layout(TypeColorBackgroundBadge layout, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTag()
            {
                Layout = new PropertyColorBackgroundBadge(layout)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
