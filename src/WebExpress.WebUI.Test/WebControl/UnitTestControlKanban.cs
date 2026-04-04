using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the kanban control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlKanban
    {
        /// <summary>
        /// Tests the id property of the kanban control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-kanban""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-kanban""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlKanban(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a column to the kanban control.
        /// </summary>
        [Fact]
        public void AddColumn()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlKanban(null);

            // act
            control.Add(new ControlKanbanColumn("a", "A", "10%"));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-kanban""><div id=""a"" class=""wx-column"" data-label=""A"" data-size=""10%""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a column to the kanban control.
        /// </summary>
        [Fact]
        public void AddColumns()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlKanban(null);

            // act
            control.Add(new ControlKanbanColumn("a", "A", "10%"));
            control.Add(new ControlKanbanColumn("b", "B", "*"));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-kanban""><div id=""a"" class=""wx-column"" data-label=""A"" data-size=""10%""></div><div id=""b"" class=""wx-column"" data-label=""B"" data-size=""*""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a swimlane to the kanban control.
        /// </summary>
        [Theory]
        [InlineData(false, "<div class=\"wx-webui-kanban\"><div id=\"a\" class=\"wx-swimlane\" data-label=\"A\" data-expanded=\"false\"></div></div>")]
        [InlineData(true, "<div class=\"wx-webui-kanban\"><div id=\"a\" class=\"wx-swimlane\" data-label=\"A\"></div></div>")]
        public void AddSwimlane(bool expanded, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlKanban(null);

            // act
            control.Add(new ControlKanbanSwimlane("a", "A", expanded));

            // validation
            var html = control.Render(context, visualTree);
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a card to the kanban control.
        /// </summary>
        [Fact]
        public void AddCard()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlKanban(null);

            // act
            control.Add(new ControlKanbanCard(null));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-kanban""><div class=""wx-kanban-card""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
