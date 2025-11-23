using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the panel split control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelSplit
    {
        /// <summary>
        /// Tests the id property of the panel split control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-split"" data-orientation=""horizontal"">*</div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-split"" data-orientation=""horizontal"">*</div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelSplit(id);
            control.AddSidePanel(new ControlText() { Text = "p1" });
            control.AddMainPanel(new ControlText() { Text = "p2" });

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the orientation property of the panel split control.
        /// </summary>
        [Theory]
        [InlineData(TypeOrientationSplit.Horizontal, @"<div class=""wx-webui-split"" data-orientation=""horizontal"">*</div>")]
        [InlineData(TypeOrientationSplit.Vertical, @"<div class=""wx-webui-split"" data-orientation=""vertical"">*</div>")]
        public void Orientation(TypeOrientationSplit orientation, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelSplit()
            {
                Orientation = orientation,
            };
            control.AddSidePanel(new ControlText() { Text = "p1" });
            control.AddMainPanel(new ControlText() { Text = "p2" });

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the splitter color property of the panel split control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div class=""wx-webui-split"" *>*</div>")]
        [InlineData(TypeColorBackground.Primary, @"<div * data-splitter-class=""bg-primary"">*</div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div * data-splitter-class=""bg-secondary"">*</div>")]
        [InlineData(TypeColorBackground.Warning, @"<div * data-splitter-class=""bg-warning"">*</div>")]
        [InlineData(TypeColorBackground.Danger, @"<div * data-splitter-class=""bg-danger"">*</div>")]
        [InlineData(TypeColorBackground.Dark, @"<div * data-splitter-class=""bg-dark"">*</div>")]
        [InlineData(TypeColorBackground.Light, @"<div * data-splitter-class=""bg-light"">*</div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div * data-splitter-class=""bg-transparent"">*</div>")]
        public void SplitterColor(TypeColorBackground splitterColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelSplit()
            {
                SplitterColor = new PropertyColorBackground(splitterColor),
            };
            control.AddSidePanel(new ControlText() { Text = "p1" });
            control.AddMainPanel(new ControlText() { Text = "p2" });

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the panel split control.
        /// </summary>
        [Theory]
        [InlineData(null, null, null)]
        [InlineData(typeof(ControlText), null, @"<div></div>")]
        [InlineData(null, typeof(ControlText), @"<div></div>")]
        [InlineData(typeof(ControlText), typeof(ControlText), @"<div class=""wx-webui-split"" data-orientation=""horizontal""><div id=""-p1"" class=""wx-side-pane""><div></div></div><div id=""-p2"" class=""wx-main-pane""><div></div></div></div>")]
        [InlineData(typeof(ControlLink), typeof(ControlLink), @"<div class=""wx-webui-split"" data-orientation=""horizontal""><div id=""-p1"" class=""wx-side-pane""><a class=""wx-link""></a></div><div id=""-p2"" class=""wx-main-pane""><a class=""wx-link""></a></div></div>")]
        [InlineData(typeof(ControlImage), typeof(ControlImage), @"<div class=""wx-webui-split"" data-orientation=""horizontal""><div id=""-p1"" class=""wx-side-pane""><img></div><div id=""-p2"" class=""wx-main-pane""><img></div></div>")]
        public void Add(Type child1, Type child2, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var childInstance1 = child1 is not null ? Activator.CreateInstance(child1, [null]) as IControl : null;
            var childInstance2 = child2 is not null ? Activator.CreateInstance(child2, [null]) as IControl : null;
            var control = new ControlPanelSplit();

            // test execution
            if (childInstance1 is not null)
            {
                control.AddSidePanel(childInstance1);
            }

            if (childInstance2 is not null)
            {
                control.AddMainPanel(childInstance2);
            }

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the SidePanelMinSize property of the panel split control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<div class=""wx-webui-split"" *>*</div>")]
        [InlineData(0, @"<div * data-min-side=""0"">*</div>")]
        [InlineData(100, @"<div * data-min-side=""100"">*</div>")]
        public void SidePanelMinSize(int size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelSplit()
            {
                SidePanelMinSize = size,
            };
            control.AddSidePanel(new ControlText() { Text = "p1" });
            control.AddMainPanel(new ControlText() { Text = "p2" });

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the SidePanelMaxSize property of the panel split control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<div class=""wx-webui-split"" *>*</div>")]
        [InlineData(0, @"<div * data-max-side=""0"">*</div>")]
        [InlineData(100, @"<div * data-max-side=""100"">*</div>")]
        public void SidePanelMaxSize(int size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelSplit()
            {
                SidePanelMaxSize = size,
            };
            control.AddSidePanel(new ControlText() { Text = "p1" });
            control.AddMainPanel(new ControlText() { Text = "p2" });

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the SidePanelInitialSize property of the panel split control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<div class=""wx-webui-split"" *>*</div>")]
        [InlineData(0, @"<div * data-size=""0"">*</div>")]
        [InlineData(100, @"<div * data-size=""100"">*</div>")]
        public void SidePanelInitialSize(int size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelSplit()
            {
                SidePanelInitialSize = size,
            };
            control.AddSidePanel(new ControlText() { Text = "p1" });
            control.AddMainPanel(new ControlText() { Text = "p2" });

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the SplitterSize property of the panel split control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<div class=""wx-webui-split"" *>*</div>")]
        [InlineData(0, @"<div * data-splitter-size=""0"">*</div>")]
        [InlineData(100, @"<div * data-splitter-size=""100"">*</div>")]
        public void SplitterSize(int size, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelSplit()
            {
                SplitterSize = size,
            };
            control.AddSidePanel(new ControlText() { Text = "p1" });
            control.AddMainPanel(new ControlText() { Text = "p2" });

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Order property of the panel split control.
        /// </summary>
        [Theory]
        [InlineData(TypeSplitOrder.Default, @"<div class=""wx-webui-split"" *>*</div>")]
        [InlineData(TypeSplitOrder.SideMain, @"<div * data-order=""side-main"">*</div>")]
        [InlineData(TypeSplitOrder.MainSide, @"<div * data-order=""main-side"">*</div>")]
        public void Order(TypeSplitOrder order, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelSplit()
            {
                Order = order,
            };
            control.AddSidePanel(new ControlText() { Text = "p1" });
            control.AddMainPanel(new ControlText() { Text = "p2" });

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the Unit property of the panel split control.
        /// </summary>
        [Theory]
        [InlineData(TypeSizeUnit.Default, @"<div class=""wx-webui-split"" *>*</div>")]
        [InlineData(TypeSizeUnit.Pixel, @"<div * data-unit=""px"">*</div>")]
        [InlineData(TypeSizeUnit.Percent, @"<div * data-unit=""%"">*</div>")]
        [InlineData(TypeSizeUnit.Em, @"<div * data-unit=""em"">*</div>")]
        [InlineData(TypeSizeUnit.Rem, @"<div * data-unit=""rem"">*</div>")]
        public void Unit(TypeSizeUnit unit, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelSplit()
            {
                Unit = unit,
            };
            control.AddSidePanel(new ControlText() { Text = "p1" });
            control.AddMainPanel(new ControlText() { Text = "p2" });

            // test execution
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
