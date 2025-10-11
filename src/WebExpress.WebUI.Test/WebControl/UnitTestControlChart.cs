using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the chart control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlChart
    {
        /// <summary>
        /// Tests the id property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-chart"" data-type=""line""></div>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the text color property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorText.Default, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Primary, @"<div class=""wx-webui-chart text-primary"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Secondary, @"<div class=""wx-webui-chart text-secondary"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Info, @"<div class=""wx-webui-chart text-info"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Success, @"<div class=""wx-webui-chart text-success"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Warning, @"<div class=""wx-webui-chart text-warning"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Danger, @"<div class=""wx-webui-chart text-danger"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Light, @"<div class=""wx-webui-chart text-light"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""wx-webui-chart text-dark"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""wx-webui-chart text-muted"" data-type=""line""></div>")]
        public void TextColor(TypeColorText color, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                TextColor = new PropertyColorText(color)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the background color property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(TypeColorBackground.Default, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(TypeColorBackground.Primary, @"<div class=""wx-webui-chart bg-primary"" data-type=""line""></div>")]
        [InlineData(TypeColorBackground.Secondary, @"<div class=""wx-webui-chart bg-secondary"" data-type=""line""></div>")]
        [InlineData(TypeColorBackground.Warning, @"<div class=""wx-webui-chart bg-warning"" data-type=""line""></div>")]
        [InlineData(TypeColorBackground.Danger, @"<div class=""wx-webui-chart bg-danger"" data-type=""line""></div>")]
        [InlineData(TypeColorBackground.Dark, @"<div class=""wx-webui-chart bg-dark"" data-type=""line""></div>")]
        [InlineData(TypeColorBackground.Light, @"<div class=""wx-webui-chart bg-light"" data-type=""line""></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""wx-webui-chart bg-transparent"" data-type=""line""></div>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                BackgroundColor = new PropertyColorBackground(backgroundColor)
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the type property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(TypeChart.Line, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(TypeChart.Bar, @"<div class=""wx-webui-chart"" data-type=""bar""></div>")]
        [InlineData(TypeChart.Pie, @"<div class=""wx-webui-chart"" data-type=""pie""></div>")]
        [InlineData(TypeChart.Radar, @"<div class=""wx-webui-chart"" data-type=""radar""></div>")]
        [InlineData(TypeChart.PolarArea, @"<div class=""wx-webui-chart"" data-type=""polarArea""></div>")]
        [InlineData(TypeChart.Bubble, @"<div class=""wx-webui-chart"" data-type=""bubble""></div>")]
        [InlineData(TypeChart.Scatter, @"<div class=""wx-webui-chart"" data-type=""scatter""></div>")]
        public void Type(TypeChart type, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Type = type
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData("Chart Title", @"<div class=""wx-webui-chart"" data-type=""line"" data-title-text=""Chart Title""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-chart"" data-type=""line"" data-title-text=""WebExpress.WebUI""></div>")]
        public void Title(string title, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Title = title
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title of the x-axis property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData("X-Axis Title", @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-x-title=""X-Axis Title""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-x-title=""WebExpress.WebUI""></div>")]
        public void TitleX(string titleX, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                TitleX = titleX
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title of the y-axis property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData("Y-Axis Title", @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-y-title=""Y-Axis Title""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-y-title=""WebExpress.WebUI""></div>")]
        public void TitleY(string titleY, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                TitleY = titleY
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the width property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(500, @"<div class=""wx-webui-chart"" data-type=""line"" data-width=""500""></div>")]
        public void Width(int width, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Width = width
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the height property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(0, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(300, @"<div class=""wx-webui-chart"" data-type=""line"" data-height=""300""></div>")]
        public void Height(int height, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Height = height
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the minimum property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(float.MinValue, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(0f, @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-y-min=""0""></div>")]
        public void Minimum(float minimum, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Minimum = minimum
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the maximum property of the chart control.
        /// </summary>
        [Theory]
        [InlineData(float.MaxValue, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(100f, @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-y-max=""100""></div>")]
        public void Maximum(float maximum, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Maximum = maximum
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the labels data-attribute (JSON array).
        /// </summary>
        [Fact]
        public void Labels()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var labels = new List<string> { "Jan", "Feb" };
            var control = new ControlChart()
            {
            }
                .AddLabel(labels);

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            // expected: data-labels with a compact json array
            var expected = @"<div class=""wx-webui-chart"" data-type=""line"" data-labels=""[&quot;Jan&quot;,&quot;Feb&quot;]""></div>";
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the responsive data-attribute.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(true, @"<div class=""wx-webui-chart"" data-type=""line"" data-responsive=""true""></div>")]
        public void Responsive(bool value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Responsive = value
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the maintain-aspect-ratio data-attribute.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(true, @"<div class=""wx-webui-chart"" data-type=""line"" data-maintain-aspect-ratio=""true""></div>")]
        public void MaintainAspectRatio(bool value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                MaintainAspectRatio = value
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the legend-display data-attribute.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(true, @"<div class=""wx-webui-chart"" data-type=""line"" data-legend-display=""true""></div>")]
        public void LegendDisplay(bool value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                LegendDisplay = value
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title-display data-attribute.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(true, @"<div class=""wx-webui-chart"" data-type=""line"" data-title-display=""true""></div>")]
        public void TitleDisplay(bool value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                TitleDisplay = value
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the y-axis begin-at-zero data-attribute.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(true, @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-y-begin-at-zero=""true""></div>")]
        public void YBeginAtZero(bool value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                YBeginAtZero = value
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the x-axis begin-at-zero data-attribute.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(true, @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-x-begin-at-zero=""true""></div>")]
        public void XBeginAtZero(bool value, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                XBeginAtZero = value
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests dataset data-attributes for a single dataset.
        /// </summary>
        [Fact]
        public void DatasetSingle()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var ds = new ControlChartDataset
            {
                Title = "Series A",
                Data = new ControlChartDatasetPointCollection(1f, 2f, 3f),
                BackgroundColor = "#ff00ff",
                BorderColor = "#ff00ff",
                BorderWidth = 2
            };
            var control = new ControlChart()
                .AddDataset(ds);

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            var expected =
                @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" " +
                @"data-dataset0-label=""Series A"" " +
                @"data-dataset0-data=""[1,2,3]"" " +
                @"data-dataset0-background-color=""#ff00ff"" " +
                @"data-dataset0-border-color=""#ff00ff"" " +
                @"data-dataset0-border-width=""2""></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests dataset data-attributes for multiple datasets.
        /// </summary>
        [Fact]
        public void DatasetsMultiple()
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var control = new ControlChart()
                .AddDataset(new ControlChartDataset
                {
                    Title = "Alpha",
                    Data = new ControlChartDatasetPointCollection(1f, 2f),
                    BackgroundColor = "#ff00ff",
                    BorderColor = "#ff00ff",
                    BorderWidth = 1
                })
                .AddDataset(new ControlChartDataset
                {
                    Title = "Beta",
                    Data = new ControlChartDatasetPointCollection(3f, 4f),
                    BackgroundColor = "#ff00ff",
                    BorderColor = "#ff00ff",
                    BorderWidth = 2
                });

            // test execution
            var html = control.Render(context, visualTree);

            // validation 
            var expected =
                @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""2"" " +
                @"data-dataset0-label=""Alpha"" " +
                @"data-dataset0-data=""[1,2]"" " +
                @"data-dataset0-background-color=""#ff00ff"" " +
                @"data-dataset0-border-color=""#ff00ff"" " +
                @"data-dataset0-border-width=""1"" " +
                @"data-dataset1-label=""Beta"" " +
                @"data-dataset1-data=""[3,4]"" " +
                @"data-dataset1-background-color=""#ff00ff"" " +
                @"data-dataset1-border-color=""#ff00ff"" " +
                @"data-dataset1-border-width=""2""></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}