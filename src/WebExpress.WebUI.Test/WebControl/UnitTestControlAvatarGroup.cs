using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the avatar group control and its items.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlAvatarGroup
    {
        /// <summary>
        /// Tests the id property of the avatar group control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-avatar-group""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-avatar-group""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarGroup(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that an item without an image shows the derived initials.
        /// </summary>
        [Theory]
        [InlineData(null, @"<span class=""wx-avatar-group-avatar"" title=""Guybrush Threepwood"">GT</span>")]
        [InlineData("id", @"<span id=""id"" class=""wx-avatar-group-avatar"" title=""Guybrush Threepwood"">GT</span>")]
        public void ItemInitials(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarGroupItem(id)
            {
                Name = _ => "Guybrush Threepwood"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the item color, emitted as a class or an inline style.
        /// </summary>
        [Theory]
        [InlineData(true, @"<span class=""wx-avatar-group-avatar"" style=""background:#ff8800;"" title=""Stan"">S</span>")]
        [InlineData(false, @"<span class=""wx-avatar-group-avatar bg-primary"" title=""Stan"">S</span>")]
        public void ItemColor(bool userColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarGroupItem()
            {
                Name = _ => "Stan",
                Color = _ => userColor ? new PropertyColorBackground("#ff8800") : new PropertyColorBackground(TypeColorBackground.Primary)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the overflow chip when more avatars are present than shown.
        /// </summary>
        [Fact]
        public void Overflow()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAvatarGroup
            (
                null,
                new ControlAvatarGroupItem() { Name = _ => "Ann" },
                new ControlAvatarGroupItem() { Name = _ => "Bob" },
                new ControlAvatarGroupItem() { Name = _ => "Cleo" }
            )
            {
                MaxVisible = _ => 2
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-avatar-group""><span class=""wx-avatar-group-avatar"" title=""Ann"">A</span><span class=""wx-avatar-group-avatar"" title=""Bob"">B</span><span class=""wx-avatar-group-more"" title=""Cleo"">+1</span></div>", html);
        }
    }
}
