using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the read-only heat map control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlHeatMap
    {
        /// <summary>
        /// Tests the id property of the heat map control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-heatmap""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-heatmap""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHeatMap(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that an absent grid emits no data attribute.
        /// </summary>
        [Fact]
        public void Values_Null_RendersNoData()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHeatMap();

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-heatmap""></div>", html);
        }

        /// <summary>
        /// Tests that the grid serializes with rows joined by a semicolon and cells by a comma,
        /// culture independently.
        /// </summary>
        [Fact]
        public void Values_Grid_SerializesRowsAndColumns()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHeatMap()
            {
                Values = _ => new[] { new[] { 1.0, 2.0, 3.5 }, new[] { 4.0, 5.0, 6.0 } }
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-heatmap"" data-values=""1,2,3.5;4,5,6""></div>", html);
        }

        /// <summary>
        /// Tests the min and max bounds of the heat map control.
        /// </summary>
        [Theory]
        [InlineData(0, 100, @"<div class=""wx-webui-heatmap"" data-min=""0"" data-max=""100""></div>")]
        [InlineData(-5, 2.5, @"<div class=""wx-webui-heatmap"" data-min=""-5"" data-max=""2.5""></div>")]
        public void MinMax(double min, double max, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHeatMap()
            {
                Min = _ => min,
                Max = _ => max
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the axis labels serialize as comma separated tokens.
        /// </summary>
        [Fact]
        public void Labels_SerializeCommaSeparated()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHeatMap()
            {
                RowLabels = _ => ["Mon", "Tue"],
                ColumnLabels = _ => ["A", "B", "C"]
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-heatmap"" data-row-labels=""Mon,Tue"" data-col-labels=""A,B,C""></div>", html);
        }

        /// <summary>
        /// Tests that the gradient colours are emitted as data attributes.
        /// </summary>
        [Theory]
        [InlineData(null, null, @"<div class=""wx-webui-heatmap""></div>")]
        [InlineData("#deebf7", "#08306b", @"<div class=""wx-webui-heatmap"" data-low-color=""#deebf7"" data-high-color=""#08306b""></div>")]
        public void Colors(string low, string high, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHeatMap()
            {
                LowColor = low is not null ? _ => low : null,
                HighColor = high is not null ? _ => high : null
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests every data attribute rendering together, in order.
        /// </summary>
        [Fact]
        public void AllAttributes()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlHeatMap("h1")
            {
                Values = _ => new[] { new[] { 1.0, 2.0 }, new[] { 3.0, 4.0 } },
                Min = _ => 0,
                Max = _ => 4,
                RowLabels = _ => ["r1", "r2"],
                ColumnLabels = _ => ["c1", "c2"],
                LowColor = _ => "#deebf7",
                HighColor = _ => "#08306b"
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div id=""h1"" class=""wx-webui-heatmap"" data-values=""1,2;3,4"" data-min=""0"" data-max=""4"" data-row-labels=""r1,r2"" data-col-labels=""c1,c2"" data-low-color=""#deebf7"" data-high-color=""#08306b""></div>", html);
        }
    }
}
