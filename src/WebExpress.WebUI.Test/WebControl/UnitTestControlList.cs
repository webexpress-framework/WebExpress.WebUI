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
        [InlineData(null, @"<ul></ul>")]
        [InlineData("id", @"<ul id=""id""></ul>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<ul id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C""></ul>")]
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

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the list control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<ul></ul>")]
        [InlineData(TypeColorBackground.Primary, @"<ul class=""bg-primary""></ul>")]
        [InlineData(TypeColorBackground.Secondary, @"<ul class=""bg-secondary""></ul>")]
        [InlineData(TypeColorBackground.Warning, @"<ul class=""bg-warning""></ul>")]
        [InlineData(TypeColorBackground.Danger, @"<ul class=""bg-danger""></ul>")]
        [InlineData(TypeColorBackground.Dark, @"<ul class=""bg-dark""></ul>")]
        [InlineData(TypeColorBackground.Light, @"<ul class=""bg-light""></ul>")]
        [InlineData(TypeColorBackground.Transparent, @"<ul class=""bg-transparent""></ul>")]
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

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the layout property of the list control.
        /// </summary>
        [Theory]
        [InlineData(TypeLayoutList.Default, @"<ul></ul>")]
        [InlineData(TypeLayoutList.Simple, @"<ul class=""list-unstyled""></ul>")]
        [InlineData(TypeLayoutList.Group, @"<ul class=""list-group""></ul>")]
        [InlineData(TypeLayoutList.Horizontal, @"<ul class=""list-group list-group-horizontal""></ul>")]
        [InlineData(TypeLayoutList.Flush, @"<ul class=""list-group list-group-flush""></ul>")]
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

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the list control.
        /// </summary>
        [Theory]
        [MemberData(nameof(GetControlListItemsData))]
        public void Add(IEnumerable<ControlListItem> items, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlList(null, items.ToArray());

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Provides test data for the Add method of the UnitTestControlList class.
        /// </summary>
        /// <returns>An enumerable collection of object arrays, each containing test data.</returns>
        public static TheoryData<IEnumerable<ControlListItem>, string> GetControlListItemsData()
        {
            return new TheoryData<IEnumerable<ControlListItem>, string>
            {
                { new List<ControlListItem> { new(null, new ControlText() { Text = "Item 1" }) }, @"<ul><li><div>Item 1</div></li></ul>" },
                { new List<ControlListItem> { new("id") }, @"<ul><li id=""id""></li></ul>" },
                { new List<ControlListItem> { }, "<ul></ul>" }
            };
        }
    }
}
