using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the list control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlList
    {
        /// <summary>
        /// Tests the id property of the list control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-list""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-list""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-webui-list""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlList(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the list control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div class=""wx-webui-list""></div>")]
        [InlineData(TypeColorBackground.Primary, @"<div class=""wx-webui-list bg-primary""></div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div class=""wx-webui-list bg-secondary""></div>")]
        [InlineData(TypeColorBackground.Warning, @"<div class=""wx-webui-list bg-warning""></div>")]
        [InlineData(TypeColorBackground.Danger, @"<div class=""wx-webui-list bg-danger""></div>")]
        [InlineData(TypeColorBackground.Dark, @"<div class=""wx-webui-list bg-dark""></div>")]
        [InlineData(TypeColorBackground.Light, @"<div class=""wx-webui-list bg-light""></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""wx-webui-list bg-transparent""></div>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlList()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the layout property of the list control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutList.Default, @"<div class=""wx-webui-list""></div>")]
        [InlineData(TypeLayoutList.Simple, @"<div class=""wx-webui-list"" data-layout=""list-unstyled""></div>")]
        [InlineData(TypeLayoutList.Group, @"<div class=""wx-webui-list"" data-layout=""list-group""></div>")]
        [InlineData(TypeLayoutList.Horizontal, @"<div class=""wx-webui-list"" data-layout=""list-group list-group-horizontal""></div>")]
        [InlineData(TypeLayoutList.Flush, @"<div class=""wx-webui-list"" data-layout=""list-group list-group-flush""></div>")]
        public void Layout(TypeLayoutList layout, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlList()
            {
                Layout = layout
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the Title property emits a data-title attribute.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-list""></div>")]
        [InlineData("", @"<div class=""wx-webui-list""></div>")]
        [InlineData("My List", @"<div class=""wx-webui-list"" data-title=""My List""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-list"" data-title=""WebExpress.WebUI""></div>")]
        public void Title(string title, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlList(null) { Title = title };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that Sortable=true emits data-sortable="true" and Sortable=false omits the attribute.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-list""></div>")]
        [InlineData(true, @"<div class=""wx-webui-list"" data-sortable=""true""></div>")]
        public void Sortable(bool sortable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlList(null) { Sortable = sortable };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that Title and Sortable can be combined on the same control.
        /// </summary>
        [Fact]
        public void TitleAndSortableTogetherEmitBothAttributes()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlList(null) { Title = "Characters", Sortable = true };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"data-title=""Characters""", html);
            Assert.Contains(@"data-sortable=""true""", html);
        }
    }
}
