using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the offcanvas control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlOffcanvas
    {
        /// <summary>
        /// Tests the id and the default placement of the offcanvas control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<dialog id=""*"" class=""offcanvas offcanvas-start"" closedby=""any""><div class=""offcanvas-header""><span class=""offcanvas-title""></span>*</div><div class=""offcanvas-body""></div></dialog>")]
        [InlineData("id", @"<dialog id=""id"" class=""offcanvas offcanvas-start"" closedby=""any""><div class=""offcanvas-header""><span class=""offcanvas-title""></span>*</div><div class=""offcanvas-body""></div></dialog>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlOffcanvas(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title of the offcanvas control.
        /// </summary>
        [Fact]
        public void Title()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlOffcanvas("oc")
            {
                Title = _ => "Filter"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<dialog id=""oc"" class=""offcanvas offcanvas-start"" closedby=""any""><div class=""offcanvas-header""><span class=""offcanvas-title"">Filter</span>*</div><div class=""offcanvas-body""></div></dialog>", html);
        }

        /// <summary>
        /// Tests the placement of the offcanvas control.
        /// </summary>
        [Theory]
        [InlineData(TypeOffcanvasPlacement.Start, "offcanvas offcanvas-start")]
        [InlineData(TypeOffcanvasPlacement.End, "offcanvas offcanvas-end")]
        [InlineData(TypeOffcanvasPlacement.Top, "offcanvas offcanvas-top")]
        [InlineData(TypeOffcanvasPlacement.Bottom, "offcanvas offcanvas-bottom")]
        public void Placement(TypeOffcanvasPlacement placement, string expectedClass)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlOffcanvas("oc")
            {
                Placement = _ => placement
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders($@"<dialog id=""oc"" class=""{expectedClass}"" closedby=""any""><div class=""offcanvas-header""><span class=""offcanvas-title""></span>*</div><div class=""offcanvas-body""></div></dialog>", html);
        }

        /// <summary>
        /// Tests the scroll and backdrop options of the offcanvas control.
        /// </summary>
        [Fact]
        public void ScrollAndBackdrop()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlOffcanvas("oc")
            {
                Scroll = _ => true,
                Backdrop = _ => false
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<dialog id=""oc"" class=""offcanvas offcanvas-start"" closedby=""closerequest"" data-wx-scroll=""true"" data-wx-backdrop=""false""><div class=""offcanvas-header""><span class=""offcanvas-title""></span>*</div><div class=""offcanvas-body""></div></dialog>", html);
        }
    }
}
