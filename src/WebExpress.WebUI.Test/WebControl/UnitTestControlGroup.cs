using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the group control - items laid out as fields of one surface.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlGroup
    {
        /// <summary>
        /// Tests the id property of the group control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-group""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-group""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGroup(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that any control can be a field - the group does not care what it holds.
        /// </summary>
        [Fact]
        public void TakesAnyControl()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGroup
            (
                null,
                new ControlStat() { Value = _ => "112" },
                new ControlText() { Text = _ => "plain text" },
                new ControlPanel(null, new ControlText() { Text = _ => "nested" })
            );

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains("112", html);
            Assert.Contains("plain text", html);
            Assert.Contains("nested", html);
        }

        /// <summary>
        /// Tests that the items are emitted as the children of the host - the fields that carry
        /// the dividers are built by the client controller, which is the only side that can see
        /// where a row wraps.
        /// </summary>
        [Fact]
        public void ItemsAreTheChildren()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGroup
            (
                null,
                new ControlStat() { Value = _ => "first" },
                new ControlStat() { Value = _ => "second" }
            );

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.DoesNotContain("wx-group-field", html);
            Assert.True(html.IndexOf("first") < html.IndexOf("second"), "the reading order is kept");
        }

        /// <summary>
        /// Tests that items added after construction are rendered in the order they were added.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGroup();

            control.Add(new ControlText() { Text = _ => "first" });
            control.Add([new ControlText() { Text = _ => "second" }]);

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.True(html.IndexOf("first") < html.IndexOf("second"));
        }

        /// <summary>
        /// Tests that a removed item is gone from the group.
        /// </summary>
        [Fact]
        public void Remove()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var dropped = new ControlText() { Text = _ => "dropped" };
            var control = new ControlGroup(null, dropped, new ControlText() { Text = _ => "kept" });

            // act
            control.Remove(dropped);
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.DoesNotContain("dropped", html);
            Assert.Contains("kept", html);
        }

        /// <summary>
        /// Tests that a group inside another frame declares that it drops its own surface.
        /// </summary>
        [Fact]
        public void Bare()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGroup() { Framed = _ => false };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"data-framed=""false""", html);
        }

        /// <summary>
        /// Tests that a fixed column count is declared for the client controller, and that the
        /// default leaves the fields to divide the width between them.
        /// </summary>
        [Theory]
        [InlineData(3, true)]
        [InlineData(0, false)]
        public void Columns(int columns, bool expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGroup() { Columns = _ => columns };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Equal(expected, html.Contains(@"data-columns=""" + columns + @""""));
        }

        /// <summary>
        /// Tests that the spacing of a field is declared, and that the default says nothing -
        /// a field holding a control needs no padding of its own.
        /// </summary>
        [Theory]
        [InlineData(TypeSpacingGroup.Default, null)]
        [InlineData(TypeSpacingGroup.None, "none")]
        [InlineData(TypeSpacingGroup.Narrow, "narrow")]
        [InlineData(TypeSpacingGroup.Wide, "wide")]
        public void Spacing(TypeSpacingGroup spacing, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlGroup() { Spacing = _ => spacing };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            if (expected is null)
            {
                Assert.DoesNotContain("data-spacing", html);
            }
            else
            {
                Assert.Contains(@"data-spacing=""" + expected + @"""", html);
            }
        }
    }
}
