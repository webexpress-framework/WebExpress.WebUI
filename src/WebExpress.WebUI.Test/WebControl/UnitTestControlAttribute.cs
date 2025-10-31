using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
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
        [InlineData(null, @"<div><span>:</span><span></span></div>")]
        [InlineData("id", @"<div id=""id""><span id=""id_name"">:</span><span id=""id_value""></span></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the key property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div><span>:</span><span></span></div>")]
        [InlineData("abc", @"<div><span>abc:</span><span></span></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div><span>WebExpress.WebUI:</span><span></span></div>")]
        public void Key(string title, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                Key = title,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div><span>:</span><span></span></div>")]
        [InlineData(typeof(IconStar), @"<div><i class=""fas fa-star""></i><span>:</span><span></span></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div><span>:</span><span></span></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""text-primary""><span>:</span><span></span></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""text-secondary""><span>:</span><span></span></div>")]
        [InlineData(TypeColorText.Info, @"<div class=""text-info""><span>:</span><span></span></div>")]
        [InlineData(TypeColorText.Success, @"<div class=""text-success""><span>:</span><span></span></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""text-warning""><span>:</span><span></span></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""text-danger""><span>:</span><span></span></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""text-light""><span>:</span><span></span></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""text-dark""><span>:</span><span></span></div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""text-muted""><span>:</span><span></span></div>")]
        public void Color(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                Color = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the key color property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div><span>:</span><span></span></div>")]
        [InlineData(TypeColorText.Primary, @"<div><span class=""text-primary"">:</span><span></span></div>")]
        [InlineData(TypeColorText.Secondary, @"<div><span class=""text-secondary"">:</span><span></span></div>")]
        [InlineData(TypeColorText.Info, @"<div><span class=""text-info"">:</span><span></span></div>")]
        [InlineData(TypeColorText.Success, @"<div><span class=""text-success"">:</span><span></span></div>")]
        [InlineData(TypeColorText.Warning, @"<div><span class=""text-warning"">:</span><span></span></div>")]
        [InlineData(TypeColorText.Danger, @"<div><span class=""text-danger"">:</span><span></span></div>")]
        [InlineData(TypeColorText.Light, @"<div><span class=""text-light"">:</span><span></span></div>")]
        [InlineData(TypeColorText.Dark, @"<div><span class=""text-dark"">:</span><span></span></div>")]
        [InlineData(TypeColorText.Muted, @"<div><span class=""text-muted"">:</span><span></span></div>")]
        public void KeyColor(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                KeyColor = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the button control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div><span>:</span><span></span></div>")]
        [InlineData(TypeColorBackground.Primary, @"<div class=""bg-primary""><span>:</span><span></span></div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div class=""bg-secondary""><span>:</span><span></span></div>")]
        [InlineData(TypeColorBackground.Info, @"<div class=""bg-info""><span>:</span><span></span></div>")]
        [InlineData(TypeColorBackground.Warning, @"<div class=""bg-warning""><span>:</span><span></span></div>")]
        [InlineData(TypeColorBackground.Danger, @"<div class=""bg-danger""><span>:</span><span></span></div>")]
        [InlineData(TypeColorBackground.Dark, @"<div class=""bg-dark""><span>:</span><span></span></div>")]
        [InlineData(TypeColorBackground.Light, @"<div class=""bg-light""><span>:</span><span></span></div>")]
        [InlineData(TypeColorBackground.White, @"<div class=""bg-white""><span>:</span><span></span></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""bg-transparent""><span>:</span><span></span></div>")]
        public void BackgroundColor(TypeColorBackground color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                BackgroundColor = new PropertyColorBackground(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div><span>:</span><span></span></div>")]
        [InlineData("value", @"<div><span>:</span><span>value</span></div>")]
        public void Value(string value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                Value = value
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the separator property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData('=', @"<div><span>=</span><span></span></div>")]
        [InlineData(';', @"<div><span>;</span><span></span></div>")]
        public void Separator(char value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                Separator = value
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div><span>:</span><span></span></div>")]
        [InlineData("http://example.com", @"<div><span>:</span><a href=""http://example.com/"" class=""wx-link""><span></span></a></div>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAttribute()
            {
                Uri = uri != null ? new UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
