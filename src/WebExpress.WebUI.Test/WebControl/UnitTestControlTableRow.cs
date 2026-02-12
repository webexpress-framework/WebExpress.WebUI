using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the table row.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlTableRow
    {
        /// <summary>
        /// Tests the id property of the table row.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-table-row""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-table-row""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableRow(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the color property of the table row.
        /// </summary>
        [Theory]
        [InlineData(TypeColorTable.Default, @"<div class=""wx-table-row""></div>")]
        [InlineData(TypeColorTable.Primary, @"<div class=""wx-table-row"" data-color=""table-primary""></div>")]
        [InlineData(TypeColorTable.Secondary, @"<div class=""wx-table-row"" data-color=""table-secondary""></div>")]
        [InlineData(TypeColorTable.Info, @"<div class=""wx-table-row"" data-color=""table-info""></div>")]
        [InlineData(TypeColorTable.Success, @"<div class=""wx-table-row"" data-color=""table-success""></div>")]
        [InlineData(TypeColorTable.Warning, @"<div class=""wx-table-row"" data-color=""table-warning""></div>")]
        [InlineData(TypeColorTable.Danger, @"<div class=""wx-table-row"" data-color=""table-danger""></div>")]
        [InlineData(TypeColorTable.Light, @"<div class=""wx-table-row"" data-color=""table-light""></div>")]
        [InlineData(TypeColorTable.Dark, @"<div class=""wx-table-row"" data-color=""table-dark""></div>")]
        public void Color(TypeColorTable color, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableRow()
            {
                Color = color
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the expand state property of the table row.
        /// </summary>
        [Theory]
        [InlineData(TypeExpandState.None, @"<div class=""wx-table-row""></div>")]
        [InlineData(TypeExpandState.Visible, @"<div class=""wx-table-row""></div>")]
        [InlineData(TypeExpandState.Collapsed, @"<div class=""wx-table-row"" data-collapsed=""true""></div>")]
        public void ExpandState(TypeExpandState state, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableRow(null)
            {
                ExpandState = state
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the primary action property of the table row.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-table-row""></div>")]
        [InlineData("modal", @"<div class=""wx-table-row"" data-wx-primary-action=""modal"" data-wx-primary-target=""#modal""></div>")]
        public void PrimaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableRow(null)
            {
                PrimaryAction = new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the secondary action property of the table row.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-table-row""></div>")]
        [InlineData("modal", @"<div class=""wx-table-row"" data-wx-secondary-action=""modal"" data-wx-secondary-target=""#modal""></div>")]
        public void SecondaryAction(string modal, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableRow(null)
            {
                SecondaryAction = new ActionModal(modal)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the add function of the table row.
        /// </summary>
        [Fact]
        public void Add()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableRow();

            // act
            control.Add(new ControlTableCell() { Text = "abc" });

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-table-row""><div>abc</div></div>", html);
        }

        /// <summary>
        /// Tests the add function of the table row.
        /// </summary>
        [Fact]
        public void AddChild()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableRow();

            // act
            control.Add(new ControlTableRow());

            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-table-row""><div class=""wx-table-row""></div></div>", html);
        }
    }
}
