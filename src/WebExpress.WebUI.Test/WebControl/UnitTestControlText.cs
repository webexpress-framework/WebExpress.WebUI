using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the text control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlText
    {
        /// <summary>
        /// Tests the id property of the text control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div></div>")]
        [InlineData("id", @"<div id=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlText(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the text control.
        /// </summary>
        [Theory]
        [InlineData(null, TypeFormatText.Paragraph, @"<p></p>")]
        [InlineData("abc", TypeFormatText.Paragraph, @"<p>abc</p>")]
        [InlineData("abc", TypeFormatText.Default, @"<div>abc</div>")]
        [InlineData("webexpress.webui:plugin.name", TypeFormatText.H1, @"<h1>WebExpress.WebUI</h1>")]
        public void Text(string text, TypeFormatText format, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlText()
            {
                Text = text,
                Format = format
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text color property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""text-primary""></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""text-secondary""></div>")]
        [InlineData(TypeColorText.Info, @"<div class=""text-info""></div>")]
        [InlineData(TypeColorText.Success, @"<div class=""text-success""></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""text-warning""></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""text-danger""></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""text-light""></div>")]
        [InlineData(TypeColorText.Highlight, @"<div class=""text-highlight""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""text-dark""></div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""text-muted""></div>")]
        public void TextColor(TypeColorText color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlText()
            {
                TextColor = new PropertyColorText(color)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the marging property of the attribute control.
        /// </summary>
        [Theory]
        [InlineData(PropertySpacing.Space.Two, PropertySpacing.Space.Two, PropertySpacing.Space.Two, PropertySpacing.Space.Two, @"<div class=""m-2"">*</div>")]
        [InlineData(PropertySpacing.Space.One, PropertySpacing.Space.Two, PropertySpacing.Space.Three, PropertySpacing.Space.Four, @"<div class=""ms-1 me-2 mt-3 mb-4"">*</div>")]
        [InlineData(PropertySpacing.Space.One, PropertySpacing.Space.None, PropertySpacing.Space.None, PropertySpacing.Space.None, @"<div class=""ms-1"">*</div>")]
        [InlineData(PropertySpacing.Space.Two, PropertySpacing.Space.Auto, PropertySpacing.Space.Two, PropertySpacing.Space.None, @"<div class=""ms-2 me-auto mt-2"">*</div>")]
        public void Marging(PropertySpacing.Space spaceLeft, PropertySpacing.Space spaceRight, PropertySpacing.Space spaceTop, PropertySpacing.Space spaceBottom, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlText()
            {
                Margin = new PropertySpacingMargin(spaceLeft, spaceRight, spaceTop, spaceBottom)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
