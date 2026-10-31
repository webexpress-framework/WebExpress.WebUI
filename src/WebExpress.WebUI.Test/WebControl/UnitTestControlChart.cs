using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the chart control.
    /// </summary>
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart(id)
            {
            };

            // act
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
        [InlineData(TypeColorText.Highlight, @"<div class=""wx-webui-chart text-highlight"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Dark, @"<div class=""wx-webui-chart text-dark"" data-type=""line""></div>")]
        [InlineData(TypeColorText.Muted, @"<div class=""wx-webui-chart text-muted"" data-type=""line""></div>")]
        public void TextColor(TypeColorText color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                TextColor = _ => new PropertyColorText(color)
            };

            // act
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
        [InlineData(TypeColorBackground.Highlight, @"<div class=""wx-webui-chart bg-highlight"" data-type=""line""></div>")]
        [InlineData(TypeColorBackground.Transparent, @"<div class=""wx-webui-chart bg-transparent"" data-type=""line""></div>")]
        public void BackgroundColor(TypeColorBackground backgroundColor, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                BackgroundColor = _ => new PropertyColorBackground(backgroundColor)
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Type = _ => type
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Title = _ => title
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                TitleX = _ => titleX
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                TitleY = _ => titleY
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the title of the second value axis, which is translated like the other titles.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData("EUR", @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-y1-title=""EUR""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-y1-title=""WebExpress.WebUI""></div>")]
        public void TitleY1(string titleY1, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                TitleY1 = _ => titleY1
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the range and the zero baseline of the second value axis, which stay off the
        /// markup until they are set.
        /// </summary>
        [Theory]
        [InlineData(float.MinValue, float.MaxValue, false, @"<div class=""wx-webui-chart"" data-type=""line""></div>")]
        [InlineData(0f, float.MaxValue, false, @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-y1-min=""0""></div>")]
        [InlineData(float.MinValue, 2000f, false, @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-y1-max=""2000""></div>")]
        [InlineData(float.MinValue, float.MaxValue, true, @"<div class=""wx-webui-chart"" data-type=""line"" data-scale-y1-begin-at-zero=""true""></div>")]
        public void ScaleY1(float minimum, float maximum, bool beginAtZero, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                MinimumY1 = _ => minimum,
                MaximumY1 = _ => maximum,
                Y1BeginAtZero = _ => beginAtZero
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Width = _ => width
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Height = _ => height
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Minimum = _ => minimum
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Maximum = _ => maximum
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var labels = new List<string> { "Jan", "Feb" };
            var control = new ControlChart()
            {
            }
                .AddLabel(labels);

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Responsive = _ => value
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                MaintainAspectRatio = _ => value
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                LegendDisplay = _ => value
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                TitleDisplay = _ => value
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                YBeginAtZero = _ => value
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                XBeginAtZero = _ => value
            };

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
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

            // act
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
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
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

            // act
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

        /// <summary>
        /// Tests that the fill and the point style of a dataset reach the client, and that the
        /// defaults stay off the markup.
        /// </summary>
        [Theory]
        [InlineData(TypeFillChart.None, TypePointChart.Circle, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]""></div>")]
        [InlineData(TypeFillChart.Origin, TypePointChart.Circle, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-fill=""origin""></div>")]
        [InlineData(TypeFillChart.End, TypePointChart.Rhombus, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-fill=""end"" data-dataset0-point-style=""rectRot""></div>")]
        [InlineData(TypeFillChart.None, TypePointChart.Triangle, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-point-style=""triangle""></div>")]
        public void DatasetFillAndPoint(TypeFillChart fill, TypePointChart point, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
                .AddDataset(new ControlChartDataset
                {
                    Data = new ControlChartDatasetPointCollection(1f),
                    Fill = fill,
                    Point = point
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the trendline of a dataset reaches the client, the period only with a
        /// moving average, and that no trendline stays off the markup.
        /// </summary>
        [Theory]
        [InlineData(TypeTrendlineChart.None, 0, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]""></div>")]
        [InlineData(TypeTrendlineChart.Linear, 5, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-trendline=""linear""></div>")]
        [InlineData(TypeTrendlineChart.MovingAverage, 0, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-trendline=""moving-average""></div>")]
        [InlineData(TypeTrendlineChart.MovingAverage, 4, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-trendline=""moving-average"" data-dataset0-trendline-period=""4""></div>")]
        public void DatasetTrendline(TypeTrendlineChart trendline, int period, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
                .AddDataset(new ControlChartDataset
                {
                    Data = new ControlChartDatasetPointCollection(1f),
                    Trendline = trendline,
                    TrendlinePeriod = period
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the curve of a line dataset reaches the client, the tension only with a
        /// Bezier curve, and that straight segments stay off the markup.
        /// </summary>
        [Theory]
        [InlineData(TypeCurveChart.Straight, 0.4f, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]""></div>")]
        [InlineData(TypeCurveChart.Bezier, 0.4f, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-curve=""bezier"" data-dataset0-tension=""0.4""></div>")]
        [InlineData(TypeCurveChart.Bezier, 3f, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-curve=""bezier"" data-dataset0-tension=""1""></div>")]
        [InlineData(TypeCurveChart.Monotone, 0.4f, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-curve=""monotone""></div>")]
        public void DatasetCurve(TypeCurveChart curve, float tension, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
                .AddDataset(new ControlChartDataset
                {
                    Data = new ControlChartDatasetPointCollection(1f),
                    Curve = curve,
                    Tension = tension
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that a dataset drawn in another form than its chart names that form to the
        /// client, and that the form of the chart stays off the markup.
        /// </summary>
        [Theory]
        [InlineData(TypeDatasetChart.Default, @"<div class=""wx-webui-chart"" data-type=""bar"" data-dataset-count=""1"" data-dataset0-data=""[1]""></div>")]
        [InlineData(TypeDatasetChart.Bar, @"<div class=""wx-webui-chart"" data-type=""bar"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-type=""bar""></div>")]
        [InlineData(TypeDatasetChart.Line, @"<div class=""wx-webui-chart"" data-type=""bar"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-type=""line""></div>")]
        public void DatasetType(TypeDatasetChart type, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
            {
                Type = _ => TypeChart.Bar
            }
                .AddDataset(new ControlChartDataset
                {
                    Data = new ControlChartDatasetPointCollection(1f),
                    Type = type
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that a dataset on a second value axis names that axis to the client, and that
        /// the default axis stays off the markup.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]""></div>")]
        [InlineData("y", @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]""></div>")]
        [InlineData("y1", @"<div class=""wx-webui-chart"" data-type=""line"" data-dataset-count=""1"" data-dataset0-data=""[1]"" data-dataset0-y-axis-id=""y1""></div>")]
        public void DatasetYAxisId(string yAxisId, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart()
                .AddDataset(new ControlChartDataset
                {
                    Data = new ControlChartDatasetPointCollection(1f),
                    YAxisId = yAxisId
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that every dataset is rendered, not only the first ten.
        /// </summary>
        [Fact]
        public void DatasetsBeyondTen()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlChart();
            for (var i = 0; i < 12; i++)
            {
                control.AddDataset(new ControlChartDataset { Title = "S" + i });
            }

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"data-dataset-count=""12""", html);
            Assert.Contains(@"data-dataset11-label=""S11""", html);
        }
    }
}