using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the attribute control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlAttribute
    {
        /// <summary>
        /// Tests the id property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div><span></span><span></span></div>")]
        [InlineData("id", @"<div id=""id""><span id=""id_name""></span><span id=""id_value""></span></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div><span></span><span></span></div>")]
        [InlineData("abc", @"<div><span>abc</span><span></span></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div><span>WebExpress.WebUI</span><span></span></div>")]
        public void Name(string title, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                Name = title,
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div><span></span><span></span></div>")]
        [InlineData(typeof(IconStar), @"<div><i class=""fas fa-star""></i><span></span><span></span></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name color property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div><span></span><span></span></div>")]
        [InlineData(TypeColorText.Primary, @"<div><span class=""text-primary""></span><span class=""text-primary""></span></div>")]
        [InlineData(TypeColorText.Secondary, @"<div><span class=""text-secondary""></span><span class=""text-secondary""></span></div>")]
        [InlineData(TypeColorText.Info, @"<div><span class=""text-info""></span><span class=""text-info""></span></div>")]
        [InlineData(TypeColorText.Success, @"<div><span class=""text-success""></span><span class=""text-success""></span></div>")]
        [InlineData(TypeColorText.Warning, @"<div><span class=""text-warning""></span><span class=""text-warning""></span></div>")]
        [InlineData(TypeColorText.Danger, @"<div><span class=""text-danger""></span><span class=""text-danger""></span></div>")]
        [InlineData(TypeColorText.Light, @"<div><span class=""text-light""></span><span class=""text-light""></span></div>")]
        [InlineData(TypeColorText.Dark, @"<div><span class=""text-dark""></span><span class=""text-dark""></span></div>")]
        [InlineData(TypeColorText.Muted, @"<div><span class=""text-muted""></span><span class=""text-muted""></span></div>")]
        public void NameColor(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                NameColor = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div><span></span><span></span></div>")]
        [InlineData("value", @"<div><span></span><span>value</span></div>")]
        public void Value(string value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                Value = value
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div><span></span><span></span></div>")]
        [InlineData("http://example.com", @"<div><span></span><a href=""http://example.com/""><span></span></a></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                Uri = uri != null ? new Uri(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
