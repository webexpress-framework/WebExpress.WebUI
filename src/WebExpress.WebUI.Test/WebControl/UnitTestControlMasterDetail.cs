using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the master-detail control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlMasterDetail
    {
        /// <summary>
        /// Tests the id property of the master-detail control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-master-detail"" data-breakpoint=""768"">*</div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-master-detail"" data-breakpoint=""768"">*</div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the control renders the split, the master pane and the detail pane,
        /// which is the structure the client-side controller binds to.
        /// </summary>
        [Fact]
        public void Structure()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail("md", new ControlText() { Text = _ => "master" });

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"<div id=""md"" class=""wx-webui-master-detail"" data-breakpoint=""768"">" +
                @"<div id=""md-split"" class=""wx-webui-split"" *>" +
                @"<div id=""md-split-p1"" class=""wx-side-pane""><div id=""md-master"" class=""wx-master"">*</div></div>" +
                @"<div id=""md-split-p2"" class=""wx-main-pane""><div id=""md-detail"" class=""wx-detail"">" +
                @"<div class=""wx-detail-body"">*</div></div></div></div></div>",
                html
            );
        }

        /// <summary>
        /// Tests that the master controls are rendered into the master pane.
        /// </summary>
        [Fact]
        public void Master()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail("md")
                .AddMaster(new ControlList(null, new ControlListItem() { Text = _ => "item" }) { Selectable = _ => true });

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"*<div id=""md-master"" class=""wx-master""><div class=""wx-webui-list"" data-selectable=""true""*>*item*</div></div>*",
                html
            );
        }

        /// <summary>
        /// Tests that the detail side carries the placeholder and the frame, so the
        /// client can swap them without another round trip.
        /// </summary>
        [Fact]
        public void Detail()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail("md");

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"*<div class=""wx-detail-body""><div class=""wx-empty-state"">*</div><div id=""md-frame"" class=""wx-webui-frame""></div></div>*",
                html
            );
        }

        /// <summary>
        /// Tests that an injected frame replaces the default one, which is the
        /// hook for a detail side that needs its own uri or selector.
        /// </summary>
        [Fact]
        public void InjectedDetail()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail("md")
            {
                Detail = new ControlFrame("custom")
                {
                    Uri = _ => new UriEndpoint("http://localhost:8080/detail"),
                    Selector = _ => "#wx-content-main"
                }
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"*<div id=""custom"" class=""wx-webui-frame"" data-uri=""http://localhost:8080/detail"" data-selector=""#wx-content-main""></div>*",
                html
            );
        }

        /// <summary>
        /// Tests that an injected placeholder replaces the default one.
        /// </summary>
        [Fact]
        public void InjectedEmptyState()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail("md")
            {
                EmptyState = new ControlEmptyState() { Title = _ => "Nothing here" }
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"*<div class=""wx-empty-state""><span class=""wx-empty-state-title"">Nothing here</span></div>*",
                html
            );
        }

        /// <summary>
        /// Tests the breakpoint property of the master-detail control.
        /// </summary>
        [Theory]
        [InlineData(768, @"<div * data-breakpoint=""768"">*</div>")]
        [InlineData(1024, @"<div * data-breakpoint=""1024"">*</div>")]
        [InlineData(0, @"<div class=""wx-webui-master-detail"">*</div>")]
        public void Breakpoint(int breakpoint, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail()
            {
                Breakpoint = _ => breakpoint
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the detail uri template property of the master-detail control.
        /// </summary>
        [Fact]
        public void DetailUriTemplate()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail()
            {
                DetailUriTemplate = _ => "/apps/details?id={id}"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div * data-detail-uri=""/apps/details?id={id}"">*</div>", html);
        }

        /// <summary>
        /// Tests the item selector property of the master-detail control.
        /// </summary>
        [Fact]
        public void ItemSelector()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail()
            {
                ItemSelector = _ => ".my-item"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div * data-item="".my-item""*>*</div>", html);
        }

        /// <summary>
        /// Tests the detail visible property of the master-detail control. Only the
        /// hidden state is emitted, because a visible detail side is the default.
        /// </summary>
        [Theory]
        [InlineData(true, @"<div class=""wx-webui-master-detail"" data-breakpoint=""768"">*</div>")]
        [InlineData(false, @"<div * data-detail-visible=""false"">*</div>")]
        public void DetailVisible(bool visible, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail()
            {
                DetailVisible = _ => visible
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the closable property of the master-detail control. Only the
        /// suppressed state is emitted, because the close button is the default.
        /// </summary>
        [Theory]
        [InlineData(true, @"<div class=""wx-webui-master-detail"" data-breakpoint=""768"">*</div>")]
        [InlineData(false, @"<div * data-closable=""false"">*</div>")]
        public void Closable(bool closable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail()
            {
                Closable = _ => closable
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the master sizes are handed to the split, which owns the
        /// splitter behaviour.
        /// </summary>
        [Fact]
        public void MasterSize()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail()
            {
                MasterInitialSize = _ => 40,
                MasterMinSize = _ => 180,
                MasterMaxSize = _ => 520,
                Unit = _ => TypeSizeUnit.Percent
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"*<div * class=""wx-webui-split"" * data-min-side=""180"" data-size=""40"" data-max-side=""520""*data-unit=""%"">*</div>*",
                html
            );
        }

        /// <summary>
        /// Tests that the master side keeps a minimum width and cannot be collapsed
        /// away by the splitter, because it carries the only navigation of the view.
        /// </summary>
        [Fact]
        public void MasterIsNotCollapsible()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlMasterDetail();

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"*<div * class=""wx-webui-split"" * data-min-side=""180""*data-collapsible=""false""*>*</div>*",
                html
            );
        }

        /// <summary>
        /// Tests that the master collection can be extended and reduced.
        /// </summary>
        [Fact]
        public void AddAndRemoveMaster()
        {
            // arrange
            var first = new ControlText() { Text = _ => "first" };
            var second = new ControlText() { Text = _ => "second" };
            var control = new ControlMasterDetail("md", first);

            // act
            control.AddMaster(second);
            control.RemoveMaster(first);

            // assert
            Assert.Single(control.Master);
            Assert.Equal(second, control.Master.First());
        }

        /// <summary>
        /// Tests that a master item carrying the selection action emits the attributes
        /// the client-side action registry reads.
        /// </summary>
        [Fact]
        public void SelectionAction()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var item = new ControlListItem()
            {
                Text = _ => "item",
                PrimaryAction = _ => new ActionMasterDetail("md", new UriEndpoint("http://localhost:8080/detail"), "42")
            };

            // act
            var html = item.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"<div class=""wx-list-item""*data-wx-primary-action=""master-detail"" data-wx-primary-target=""#md"" data-wx-primary-uri=""http://localhost:8080/detail"" data-wx-primary-item=""42"">*</div>",
                html
            );
        }

        /// <summary>
        /// Tests that the toggle action emits the attributes the client-side action
        /// registry reads.
        /// </summary>
        [Fact]
        public void ToggleAction()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var button = new ControlButton()
            {
                Text = _ => "Toggle",
                PrimaryAction = _ => new ActionMasterDetailToggle("md")
            };

            // act
            var html = button.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"<button*data-wx-primary-action=""master-detail-toggle"" data-wx-primary-target=""#md""*>*</button>",
                html
            );
        }
    }
}
