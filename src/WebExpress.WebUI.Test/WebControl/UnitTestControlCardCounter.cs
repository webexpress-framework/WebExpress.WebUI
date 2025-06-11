using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the card counter control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlCardCounter
    {
        /// <summary>
        /// Tests the id property of the card counter control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""card-counter""><div><h4></h4><span class=""text-muted""></span></div></span>")]
        [InlineData("id", @"<span id=""id"" class=""card-counter""><div><h4 id=""id_header""></h4><span class=""text-muted""></span></div></span>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCardCounter(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text property of the card counter control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""card-counter""><div><h4></h4><span class=""text-muted""></span></div></span>")]
        [InlineData("abc", @"<span class=""card-counter""><div><h4></h4><span class=""text-muted"">abc</span></div></span>")]
        [InlineData("webexpress.webui:plugin.name", @"<span class=""card-counter""><div><h4></h4><span class=""text-muted"">WebExpress.WebUI</span></div></span>")]
        public void Text(string text, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCardCounter()
            {
                Text = text,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the card counter control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""card-counter""><div><h4></h4><span class=""text-muted""></span></div></span>")]
        [InlineData(-10, @"<span class=""card-counter""><div><h4>-10</h4><span class=""text-muted""></span></div></span>")]
        [InlineData(0, @"<span class=""card-counter""><div><h4>0</h4><span class=""text-muted""></span></div></span>")]
        [InlineData(10, @"<span class=""card-counter""><div><h4>10</h4><span class=""text-muted""></span></div></span>")]
        public void Value(int? value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCardCounter()
            {
                Value = value,
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the card counter control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""card-counter""><div><h4></h4><span class=""text-muted""></span></div></span>")]
        [InlineData(0u, @"<span class=""card-counter""><div><h4></h4><span class=""text-muted""></span></div><div class=""progress"" style=""height:10px;""><div role=""progressbar"" class=""progress-bar progress-bar progress-bar-striped"" style=""width: 0%;"" aria-valuenow=""0"" aria-valuemin=""0"" aria-valuemax=""100""></div></div></span>")]
        [InlineData(10u, @"<span class=""card-counter""><div><h4></h4><span class=""text-muted""></span></div><div class=""progress"" style=""height:10px;""><div role=""progressbar"" class=""progress-bar progress-bar progress-bar-striped"" style=""width: 10%;"" aria-valuenow=""10"" aria-valuemin=""0"" aria-valuemax=""100""></div></div></span>")]
        public void Progress(uint? value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCardCounter()
            {
                Progress = value
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the card counter control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""card-counter""><div><h4></h4><span class=""text-muted""></span></div></span>")]
        [InlineData(typeof(IconStar), @"<span class=""card-counter""><i class=""fas fa-star float-right""></i><div><h4></h4><span class=""text-muted""></span></div></span>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCardCounter()
            {
                Icon = icon != null ? Activator.CreateInstance(icon) as IIcon : null
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text color property of the card counter control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<span class=""card-counter"">*</span>")]
        [InlineData(TypeColorText.Primary, @"<span class=""card-counter text-primary"">*</span>")]
        [InlineData(TypeColorText.Secondary, @"<span class=""card-counter text-secondary"">*</span>")]
        [InlineData(TypeColorText.Info, @"<span class=""card-counter text-info"">*</span>")]
        [InlineData(TypeColorText.Success, @"<span class=""card-counter text-success"">*</span>")]
        [InlineData(TypeColorText.Warning, @"<span class=""card-counter text-warning"">*</span>")]
        [InlineData(TypeColorText.Danger, @"<span class=""card-counter text-danger"">*</span>")]
        [InlineData(TypeColorText.Light, @"<span class=""card-counter text-light"">*</span>")]
        [InlineData(TypeColorText.Dark, @"<span class=""card-counter text-dark"">*</span>")]
        [InlineData(TypeColorText.Muted, @"<span class=""card-counter text-muted"">*</span>")]
        public void TextColor(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCardCounter()
            {
                TextColor = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the card counter control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<span class=""card-counter"">*</span>")]
        [InlineData(TypeColorBackground.Primary, @"<span class=""card-counter bg-primary"">*</span>")]
        [InlineData(TypeColorBackground.Secondary, @"<span class=""card-counter bg-secondary"">*</span>")]
        [InlineData(TypeColorBackground.Warning, @"<span class=""card-counter bg-warning"">*</span>")]
        [InlineData(TypeColorBackground.Danger, @"<span class=""card-counter bg-danger"">*</span>")]
        [InlineData(TypeColorBackground.Dark, @"<span class=""card-counter bg-dark"">*</span>")]
        [InlineData(TypeColorBackground.Light, @"<span class=""card-counter bg-light""><*/span>")]
        [InlineData(TypeColorBackground.Transparent, @"<span class=""card-counter bg-transparent"">*</span>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCardCounter()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
