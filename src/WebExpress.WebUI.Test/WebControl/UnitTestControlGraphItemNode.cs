using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the graph node item.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlGraphItemNode
    {
        /// <summary>
        /// Tests the id property of the graph node item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-graph-node"" data-x=""0"" data-y=""0""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-graph-node"" data-x=""0"" data-y=""0""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemNode(id);

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label property of the graph node item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0""></div>")]
        [InlineData("abc", @"<div class=""wx-graph-node"" data-label=""abc"" data-x=""0"" data-y=""0""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-graph-node"" data-label=""WebExpress.WebUI"" data-x=""0"" data-y=""0""></div>")]
        public void Label(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemNode()
            {
                Label = label
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the point property of the graph node item.
        /// </summary>
        [Theory]
        [InlineData(0, 0, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0""></div>")]
        [InlineData(10, 20, @"<div class=""wx-graph-node"" data-x=""10"" data-y=""20""></div>")]
        public void Point(int x, int y, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemNode()
            {
                Point = new System.Drawing.Point(x, y)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the graph node item.
        /// </summary>
        [Theory]
        [InlineData(TypeColorGraph.Default, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0""></div>")]
        [InlineData(TypeColorGraph.Primary, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-foreground-css=""primary""></div>")]
        [InlineData(TypeColorGraph.Secondary, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-foreground-css=""secondary""></div>")]
        [InlineData(TypeColorGraph.Info, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-foreground-css=""info""></div>")]
        [InlineData(TypeColorGraph.Warning, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-foreground-css=""warning""></div>")]
        [InlineData(TypeColorGraph.Danger, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-foreground-css=""danger""></div>")]
        [InlineData(TypeColorGraph.Dark, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-foreground-css=""dark""></div>")]
        [InlineData(TypeColorGraph.Light, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-foreground-css=""light""></div>")]
        public void SystemColor(TypeColorGraph color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemNode()
            {
                Color = new PropertyColorGraph(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the graph node item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0""></div>")]
        [InlineData("red", @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-foreground-color=""red""></div>")]
        [InlineData("#ffaaff", @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-foreground-color=""#ffaaff""></div>")]
        public void UserColor(string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemNode()
            {
                Color = new PropertyColorGraph(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the graph node item.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackgroundGraph.Default, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0""></div>")]
        [InlineData(TypeColorBackgroundGraph.Primary, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-background-css=""bg-primary""></div>")]
        [InlineData(TypeColorBackgroundGraph.Secondary, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-background-css=""bg-secondary""></div>")]
        [InlineData(TypeColorBackgroundGraph.Info, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-background-css=""bg-info""></div>")]
        [InlineData(TypeColorBackgroundGraph.Warning, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-background-css=""bg-warning""></div>")]
        [InlineData(TypeColorBackgroundGraph.Danger, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-background-css=""bg-danger""></div>")]
        [InlineData(TypeColorBackgroundGraph.Dark, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-background-css=""bg-dark""></div>")]
        [InlineData(TypeColorBackgroundGraph.White, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-background-css=""bg-white""></div>")]
        [InlineData(TypeColorBackgroundGraph.Transparent, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-background-css=""bg-transparent""></div>")]
        public void SystemBackgroundColor(TypeColorBackgroundGraph color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemNode()
            {
                BackgroundColor = new PropertyColorBackgroundGraph(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the backgroundcolor property of the graph node item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0""></div>")]
        [InlineData("red", @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-background-color=""red""></div>")]
        [InlineData("#ffaaff", @"<div class=""wx-graph-node"" data-x=""0"" data-y=""0"" data-background-color=""#ffaaff""></div>")]
        public void UserBackgroundColor(string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemNode()
            {
                BackgroundColor = new PropertyColorBackgroundGraph(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
