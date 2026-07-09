using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
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

        /// <summary>
        /// Tests adding a card with an assignee to the kanban control.
        /// </summary>
        [Fact]
        public void AddCardWithAssignee()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlKanban(null);

            // act
            control.Add(new ControlKanbanCard(null)
            {
                AssigneeId = _ => "guybrush",
                AssigneeName = _ => "Guybrush Threepwood",
                AssigneeInitials = _ => "GT",
                AssigneeColor = _ => "#1d4ed8"
            });

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-kanban""><div class=""wx-kanban-card"" data-assignee-id=""guybrush"" data-assignee-name=""Guybrush Threepwood"" data-assignee-initials=""GT"" data-assignee-color=""#1d4ed8""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a card with footer chips to the kanban control. A system
        /// color collapses into a CSS class, a user-defined color into an inline
        /// style declaration.
        /// </summary>
        [Fact]
        public void AddCardWithFooter()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlKanban(null);

            // act
            control.Add(new ControlKanbanCard(null).Add
            (
                new ControlKanbanCardChip { Label = _ => "P1", Color = _ => new PropertyColorBackgroundBadge(TypeColorBackgroundBadge.Danger), Title = _ => "Priority" },
                new ControlKanbanCardChip { Label = _ => "8", Icon = _ => new IconStar() },
                new ControlKanbanCardChip { Label = _ => "5", Color = _ => new PropertyColorBackgroundBadge("#ff8800") }
            ));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-kanban""><div class=""wx-kanban-card"" data-footer=""[{&quot;label&quot;:&quot;P1&quot;,&quot;colorCss&quot;:&quot;text-bg-danger&quot;,&quot;title&quot;:&quot;Priority&quot;},{&quot;label&quot;:&quot;8&quot;,&quot;icon&quot;:&quot;fas fa-star&quot;},{&quot;label&quot;:&quot;5&quot;,&quot;colorStyle&quot;:&quot;background:#ff8800;&quot;}]""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a card whose assignee carries an avatar image.
        /// </summary>
        [Fact]
        public void AddCardWithAssigneeImage()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlKanban(null);

            // act
            control.Add(new ControlKanbanCard(null)
            {
                AssigneeName = _ => "Guybrush Threepwood",
                AssigneeImage = _ => new ImageIcon(new UriEndpoint("/assets/img/guybrush.png"))
            });

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-kanban""><div class=""wx-kanban-card"" data-assignee-name=""Guybrush Threepwood"" data-assignee-image=""/assets/img/guybrush.png""></div></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
