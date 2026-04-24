using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
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
        [InlineData(null, @"<div class=""wx-list-item-button""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-list-item-button""></div>")]
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

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        ///// <summary>
        ///// Tests the Active property of the list item button control.
        ///// </summary>
        //[Theory]
        //[InlineData(TypeActive.None, @"<button class=""list-group-item-action""></button>")]
        //[InlineData(TypeActive.Active, @"<button class=""list-group-item-action active""></button>")]
        //public void Active(TypeActive active, string expected)
        //{
        //    // arrange
        //    var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
        //    var context = UnitTestControlFixture.CreateRenderContextMock();
        //    var visualTree = new VisualTreeControl(componentHub, context.PageContext);
        //    var control = new ControlListItemButton(null)
        //    {
        //        Active = active
        //    };

        //    // act
        //    var html = control.Render(context, visualTree);

        //    // validation
        //    AssertExtensions.EqualWithPlaceholders(expected, html);
        //}

        /// <summary>
        /// Tests the primary action property of the list item button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-list-item-button""></div>")]
        [InlineData("modal", @"<div class=""wx-list-item-button"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal""></div>")]
        public void PrimaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemButton()
            {
                PrimaryAction = string.IsNullOrWhiteSpace(modal) ? null : new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the secondary action property of the list item button control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-list-item-button""></div>")]
        [InlineData("modal", @"<div class=""wx-list-item-button"" data-wx-secondary-action=""modal"" data-wx-secondary-target=""#modal""></div>")]
        public void SecondaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlListItemButton()
            {
                SecondaryAction = string.IsNullOrWhiteSpace(modal) ? null : new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
