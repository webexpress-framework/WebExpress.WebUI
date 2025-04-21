using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the badge control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlBadge
    {
        /// <summary>
        /// Tests the id property of the badge control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""badge""></span>")]
        [InlineData("id", @"<span id=""id"" class=""badge""></span>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBadge(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the badge control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""badge""></span>")]
        [InlineData(-10, @"<span class=""badge"">-10</span>")]
        [InlineData(0, @"<span class=""badge"">0</span>")]
        [InlineData(10, @"<span class=""badge"">10</span>")]
        public void Value(int? value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBadge()
            {
                Value = value?.ToString()
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the badge control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""badge""></span>")]
        [InlineData("http://example.com", @"<a class=""badge"" href=""http://example.com/""></a>")]
        public void Uri(string uri, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBadge()
            {
                Uri = uri != null ? new UriEndpoint(uri) : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text color property of the badge control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<span class=""badge""></span>")]
        [InlineData(TypeColorText.Primary, @"<span class=""badge text-primary""></span>")]
        [InlineData(TypeColorText.Secondary, @"<span class=""badge text-secondary""></span>")]
        [InlineData(TypeColorText.Info, @"<span class=""badge text-info""></span>")]
        [InlineData(TypeColorText.Success, @"<span class=""badge text-success""></span>")]
        [InlineData(TypeColorText.Warning, @"<span class=""badge text-warning""></span>")]
        [InlineData(TypeColorText.Danger, @"<span class=""badge text-danger""></span>")]
        [InlineData(TypeColorText.Light, @"<span class=""badge text-light""></span>")]
        [InlineData(TypeColorText.Dark, @"<span class=""badge text-dark""></span>")]
        [InlineData(TypeColorText.Muted, @"<span class=""badge text-muted""></span>")]
        public void TextColor(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBadge()
            {
                TextColor = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the badge control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackgroundBadge.Default, @"<span class=""badge""></span>")]
        [InlineData(TypeColorBackgroundBadge.Primary, @"<span class=""badge bg-primary""></span>")]
        [InlineData(TypeColorBackgroundBadge.Secondary, @"<span class=""badge bg-secondary""></span>")]
        [InlineData(TypeColorBackgroundBadge.Warning, @"<span class=""badge bg-warning""></span>")]
        [InlineData(TypeColorBackgroundBadge.Danger, @"<span class=""badge bg-danger""></span>")]
        [InlineData(TypeColorBackgroundBadge.Dark, @"<span class=""badge bg-dark""></span>")]
        [InlineData(TypeColorBackgroundBadge.Light, @"<span class=""badge bg-light""></span>")]
        [InlineData(TypeColorBackgroundBadge.Transparent, @"<span class=""badge bg-transparent""></span>")]
        public void BackgroundColor(TypeColorBackgroundBadge backgroundColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBadge()
            {
                BackgroundColor = new PropertyColorBackgroundBadge(backgroundColor)
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the pill property of the badge control.
        /// </summary>
        [Theory]
        [InlineData(TypePillBadge.None, @"<span class=""badge""></span>")]
        [InlineData(TypePillBadge.Pill, @"<span class=""badge badge-pill""></span>")]
        public void Pill(TypePillBadge pill, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBadge()
            {
                Pill = pill
            };

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
