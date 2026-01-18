using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the list item button control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlListItemButton
    {
        /// <summary>
        /// Tests the id property of the list item button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<button class=""list-group-item-action""></button>")]
        [InlineData("id", @"<button id=""id"" class=""list-group-item-action""></button>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemButton(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Active property of the list item button control.
        /// </summary>
        [Theory]
        [InlineData(TypeActive.None, @"<button class=""list-group-item-action""></button>")]
        [InlineData(TypeActive.Active, @"<button class=""list-group-item-action active""></button>")]
        public void Active(TypeActive active, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemButton(null)
            {
                Active = active
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the list item button control.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control1 = new ControlListItemButton(null, new ControlIcon() { Icon = new IconStar() });
            var control2 = new ControlListItemButton(null, [new ControlIcon() { Icon = new IconStar() }]);
            var control3 = new ControlListItemButton(null, new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]).ToArray());
            var control4 = new ControlListItemButton(null);
            var control5 = new ControlListItemButton(null);
            var control6 = new ControlListItemButton(null);

            // act
            control4.Add(new ControlIcon() { Icon = new IconStar() });
            control5.Add([new ControlIcon() { Icon = new IconStar() }]);
            control6.Add(new List<ControlIcon>([new ControlIcon() { Icon = new IconStar() }]).ToArray());

            var html1 = control1.Render(context, visualTree);
            var html2 = control2.Render(context, visualTree);
            var html3 = control3.Render(context, visualTree);
            var html4 = control4.Render(context, visualTree);
            var html5 = control5.Render(context, visualTree);
            var html6 = control6.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<button class=""list-group-item-action""><i class=""fas fa-star""></i></button>", html1);
            AssertExtensions.EqualWithPlaceholders(@"<button class=""list-group-item-action""><i class=""fas fa-star""></i></button>", html2);
            AssertExtensions.EqualWithPlaceholders(@"<button class=""list-group-item-action""><i class=""fas fa-star""></i></button>", html3);
            AssertExtensions.EqualWithPlaceholders(@"<button class=""list-group-item-action""><i class=""fas fa-star""></i></button>", html4);
            AssertExtensions.EqualWithPlaceholders(@"<button class=""list-group-item-action""><i class=""fas fa-star""></i></button>", html5);
            AssertExtensions.EqualWithPlaceholders(@"<button class=""list-group-item-action""><i class=""fas fa-star""></i></button>", html6);
        }
    }
}
