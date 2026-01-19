using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the graph view control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlGraphViewer
    {
        /// <summary>
        /// Tests the id property of the graph view control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-graph-viewer"" role=""region""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-graph-viewer"" role=""region""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-webui-graph-viewer"" role=""region""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphViewer(id);

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Adds nodes or edges to the control graph viewer for visualization and 
        /// interaction in the UI.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphViewer("id");
            var node1 = new ControlGraphItemNode("node1");
            var node2 = new ControlGraphItemNode("node2");
            var edge1 = new ControlGraphItemEdge("edge1");

            // act
            control.Add(node1, node2);
            control.Add(edge1);
            var html = control.Render(context, visualTree);

            // validation
            Assert.Contains(node1, control.Nodes);
            Assert.Contains(node2, control.Nodes);
            Assert.Contains(edge1, control.Edges);

            var expected = @"<div id=""id"" class=""wx-webui-graph-viewer"" role=""region""><div id=""node1"" class=""wx-graph-node"" data-x=""0"" data-y=""0""></div><div id=""node2"" class=""wx-graph-node"" data-x=""0"" data-y=""0""></div><div id=""edge1"" class=""wx-graph-edge""></div></div>";
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
