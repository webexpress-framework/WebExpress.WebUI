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
        [InlineData(null, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
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
        [InlineData(null, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
        [InlineData("abc", @"<div class=""wx-tag wx-tag-pill"" role=""tag"">abc</div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-tag wx-tag-pill"" role=""tag"">WebExpress.WebUI</div>")]
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
        [InlineData(false, @"<div class=""wx-tag"" role=""tag""></div>")]
        [InlineData(true, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
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
        [InlineData(TypeColorBackgroundBadge.Default, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
        [InlineData(TypeColorBackgroundBadge.Primary, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
        [InlineData(TypeColorBackgroundBadge.Secondary, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
        [InlineData(TypeColorBackgroundBadge.Info, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
        [InlineData(TypeColorBackgroundBadge.Success, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
        [InlineData(TypeColorBackgroundBadge.Warning, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
        [InlineData(TypeColorBackgroundBadge.Danger, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
        [InlineData(TypeColorBackgroundBadge.Light, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
        [InlineData(TypeColorBackgroundBadge.Dark, @"<div class=""wx-tag wx-tag-pill"" role=""tag""></div>")]
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
