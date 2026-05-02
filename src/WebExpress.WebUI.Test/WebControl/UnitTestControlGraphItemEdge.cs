using System.Drawing;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the graph edge item.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlGraphItemEdge
    {
        /// <summary>
        /// Tests the id property of the graph edge item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-graph-edge""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-graph-edge""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-graph-edge""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemEdge(id);

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label property of the graph edge item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-graph-edge""></div>")]
        [InlineData("abc", @"<div class=""wx-graph-edge"" data-label=""abc""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-graph-edge"" data-label=""WebExpress.WebUI""></div>")]
        public void Label(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemEdge()
            {
                Label = label
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the source property of the graph edge item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-graph-edge""></div>")]
        [InlineData("a", @"<div class=""wx-graph-edge"" data-from=""a""></div>")]
        public void Source(string source, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemEdge()
            {
                Source = source
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the target property of the graph edge item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-graph-edge""></div>")]
        [InlineData("a", @"<div class=""wx-graph-edge"" data-to=""a""></div>")]
        public void Target(string target, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemEdge()
            {
                Target = target
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the graph edge item.
        /// </summary>
        [Theory]
        [InlineData(TypeColorGraph.Default, @"<div class=""wx-graph-edge""></div>")]
        [InlineData(TypeColorGraph.Primary, @"<div class=""wx-graph-edge"" data-color-css=""primary""></div>")]
        [InlineData(TypeColorGraph.Secondary, @"<div class=""wx-graph-edge"" data-color-css=""secondary""></div>")]
        [InlineData(TypeColorGraph.Info, @"<div class=""wx-graph-edge"" data-color-css=""info""></div>")]
        [InlineData(TypeColorGraph.Warning, @"<div class=""wx-graph-edge"" data-color-css=""warning""></div>")]
        [InlineData(TypeColorGraph.Danger, @"<div class=""wx-graph-edge"" data-color-css=""danger""></div>")]
        [InlineData(TypeColorGraph.Dark, @"<div class=""wx-graph-edge"" data-color-css=""dark""></div>")]
        [InlineData(TypeColorGraph.Light, @"<div class=""wx-graph-edge"" data-color-css=""light""></div>")]
        [InlineData(TypeColorGraph.Highlight, @"<div class=""wx-graph-edge"" data-color-css=""highlight""></div>")]
        public void SystemColor(TypeColorGraph color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemEdge()
            {
                Color = new PropertyColorGraph(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the graph edge item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-graph-edge""></div>")]
        [InlineData("red", @"<div class=""wx-graph-edge"" data-color=""red""></div>")]
        [InlineData("#ffaabb", @"<div class=""wx-graph-edge"" data-color=""#ffaabb""></div>")]
        public void UserColor(string color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemEdge()
            {
                Color = new PropertyColorGraph(color)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the waypoints property of the graph edge item.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-graph-edge""></div>")]
        [InlineData("500,280;640,320", @"<div class=""wx-graph-edge"" data-waypoints=""[{""x"":500,""y"":280},{""x"":640,""y"":320}]""></div>")]
        [InlineData("100,100", @"<div class=""wx-graph-edge"" data-waypoints=""[{""x"":100,""y"":100}]""></div>")]
        public void Waypoints(string waypointString, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGraphItemEdge();

            if (!string.IsNullOrWhiteSpace(waypointString))
            {
                control.Add(waypointString
                    .Split(';')
                    .Select(s =>
                    {
                        var parts = s.Split(',');
                        return new Point(int.Parse(parts[0]), int.Parse(parts[1]));
                    }));
            }

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
