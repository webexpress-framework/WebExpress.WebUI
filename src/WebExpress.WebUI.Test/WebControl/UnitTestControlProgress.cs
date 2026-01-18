using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the progress bar control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlProgress
    {
        /// <summary>
        /// Tests the id property of the progress bar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<progress min=""0"" max=""100"" value=""0"">0%</progress>")]
        [InlineData("id", @"<progress id=""id"" min=""0"" max=""100"" value=""0"">0%</progress>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlProgress(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the format property of the progress bar control.
        /// </summary>
        [Theory]
        [InlineData(TypeFormatProgress.Default, @"<progress min=""0"" max=""100"" value=""0"">0%</progress>")]
        [InlineData(TypeFormatProgress.Colored, @"<div class=""progress""><div role=""progressbar"" class=""progress-bar"" style=""width: 0%;"" aria-valuenow=""0"" aria-valuemin=""0"" aria-valuemax=""100""></div></div>")]
        [InlineData(TypeFormatProgress.Striped, @"<div class=""progress""><div role=""progressbar"" class=""progress-bar progress-bar progress-bar-striped"" style=""width: 0%;"" aria-valuenow=""0"" aria-valuemin=""0"" aria-valuemax=""100""></div></div>")]
        [InlineData(TypeFormatProgress.Animated, @"<div class=""progress""><div role=""progressbar"" class=""progress-bar progress-bar progress-bar-striped progress-bar-animated"" style=""width: 0%;"" aria-valuenow=""0"" aria-valuemin=""0"" aria-valuemax=""100""></div></div>")]
        public void Format(TypeFormatProgress format, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlProgress()
            {
                Format = format
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the progress bar control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeProgress.Default, @"<div class=""progress"">*</div>")]
        [InlineData(TypeSizeProgress.ExtraSmall, @"<div class=""progress"" style=""height:2px;"">*</div>")]
        [InlineData(TypeSizeProgress.Small, @"<div class=""progress"" style=""height:10px;"">*</div>")]
        [InlineData(TypeSizeProgress.Large, @"<div class=""progress"" style=""height:27px;"">*</div>")]
        [InlineData(TypeSizeProgress.ExtraLarge, @"<div class=""progress"" style=""height:40px;"">*</div>")]
        public void Size(TypeSizeProgress size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlProgress()
            {
                Size = size,
                Format = TypeFormatProgress.Colored
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the progress bar control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""progress""><div role=""progressbar"" class=""progress-bar"" style=""width: 0%;"" aria-valuenow=""0"" aria-valuemin=""0"" aria-valuemax=""100""></div></div>")]
        [InlineData("abc", @"<div class=""progress""><div role=""progressbar"" class=""progress-bar"" style=""width: 0%;"" aria-valuenow=""0"" aria-valuemin=""0"" aria-valuemax=""100"">abc</div></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""progress""><div role=""progressbar"" class=""progress-bar"" style=""width: 0%;"" aria-valuenow=""0"" aria-valuemin=""0"" aria-valuemax=""100"">WebExpress.WebUI</div></div>")]
        public void Text(string text, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlProgress()
            {
                Text = text,
                Format = TypeFormatProgress.Colored
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the progress bar control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorProgress.Default, @"<div class=""progress"">*</div>")]
        [InlineData(TypeColorProgress.Primary, @"<div class=""progress""><* class=""progress-bar bg-primary"" */div>")]
        [InlineData(TypeColorProgress.Secondary, @"<div class=""progress""><* class=""progress-bar bg-secondary"" */div>")]
        [InlineData(TypeColorProgress.Info, @"<div class=""progress""><* class=""progress-bar bg-info"" */div>")]
        [InlineData(TypeColorProgress.Warning, @"<div class=""progress""><* class=""progress-bar bg-warning"" */div>")]
        [InlineData(TypeColorProgress.Danger, @"<div class=""progress""><* class=""progress-bar bg-danger"" */div>")]
        [InlineData(TypeColorProgress.Light, @"<div class=""progress""><* class=""progress-bar bg-light"" */div>")]
        [InlineData(TypeColorProgress.White, @"<div class=""progress""><* class=""progress-bar bg-white"" */div>")]
        public void Color(TypeColorProgress color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlProgress()
            {
                Color = new PropertyColorProgress(color),
                Format = TypeFormatProgress.Colored
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text color property of the progress bar control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""progress"">*</div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""progress""><* class=""progress-bar text-primary"" */div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""progress""><* class=""progress-bar text-secondary"" */div>")]
        [InlineData(TypeColorText.Info, @"<div class=""progress""><* class=""progress-bar text-info"" */div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""progress""><* class=""progress-bar text-warning"" */div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""progress""><* class=""progress-bar text-danger"" */div>")]
        [InlineData(TypeColorText.Light, @"<div class=""progress""><* class=""progress-bar text-light"" */div>")]
        [InlineData(TypeColorText.White, @"<div class=""progress""><* class=""progress-bar text-white"" */div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""progress""><* class=""progress-bar text-muted"" */div>")]
        public void TextColor(TypeColorText textColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlProgress()
            {
                TextColor = new PropertyColorText(textColor),
                Format = TypeFormatProgress.Colored
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the min property of the form progress bar control.
        /// </summary>
        [Theory]
        [InlineData(0u, @"<progress min=""0"" max=""100"" value=""0"">0%</progress>")]
        [InlineData(100u, @"<progress min=""100"" max=""100"" value=""0"">0%</progress>")]
        public void Min(uint min, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlProgress()
            {
                Min = min
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the max property of the form progress bar control.
        /// </summary>
        [Theory]
        [InlineData(0u, @"<progress min=""0"" max=""0"" value=""0"">0%</progress>")]
        [InlineData(100u, @"<progress min=""0"" max=""100"" value=""0"">0%</progress>")]
        public void Max(uint max, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlProgress()
            {
                Max = max
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the form progress bar control.
        /// </summary>
        [Theory]
        [InlineData(0u, @"<progress min=""0"" max=""100"" value=""0"">0%</progress>")]
        [InlineData(100u, @"<progress min=""0"" max=""100"" value=""100"">100%</progress>")]
        public void Value(uint value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlProgress()
            {
                Value = value
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
