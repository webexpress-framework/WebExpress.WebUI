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
        [InlineData(null, @"<div class=""wx-webui-tag"" role=""tag""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-tag"" role=""tag""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTag(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tag"" role=""tag""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-tag"" role=""tag"" data-value=""abc""></div>")]
        public void Value(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTag()
            {
                Value = text
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the tag control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorTag.Default, @"<div class=""wx-webui-tag"" role=""tag""></div>")]
        [InlineData(TypeColorTag.Primary, @"<div class=""wx-webui-tag"" role=""tag"" data-color-css=""wx-tag-primary""></div>")]
        [InlineData(TypeColorTag.Secondary, @"<div class=""wx-webui-tag"" role=""tag"" data-color-css=""wx-tag-secondary""></div>")]
        [InlineData(TypeColorTag.Info, @"<div class=""wx-webui-tag"" role=""tag"" data-color-css=""wx-tag-info""></div>")]
        [InlineData(TypeColorTag.Success, @"<div class=""wx-webui-tag"" role=""tag"" data-color-css=""wx-tag-success""></div>")]
        [InlineData(TypeColorTag.Warning, @"<div class=""wx-webui-tag"" role=""tag"" data-color-css=""wx-tag-warning""></div>")]
        [InlineData(TypeColorTag.Danger, @"<div class=""wx-webui-tag"" role=""tag"" data-color-css=""wx-tag-danger""></div>")]
        [InlineData(TypeColorTag.Light, @"<div class=""wx-webui-tag"" role=""tag"" data-color-css=""wx-tag-light""></div>")]
        [InlineData(TypeColorTag.Dark, @"<div class=""wx-webui-tag"" role=""tag"" data-color-css=""wx-tag-dark""></div>")]
        public void SystemColor(TypeColorTag color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTag()
            {
                Color = new PropertyColorTag(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the tag control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-tag"" role=""tag""></div>")]
        [InlineData("", @"<div class=""wx-webui-tag"" role=""tag""></div>")]
        [InlineData(" ", @"<div class=""wx-webui-tag"" role=""tag""></div>")]
        [InlineData("gold", @"<div class=""wx-webui-tag"" role=""tag"" data-color-style=""background: gold;""></div>")]
        public void UserColor(string color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTag()
            {
                Color = new PropertyColorTag(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
