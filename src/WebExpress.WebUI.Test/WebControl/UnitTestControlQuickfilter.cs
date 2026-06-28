using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the quickfilter control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlQuickfilter
    {
        /// <summary>
        /// Tests the id property of the quickfilter control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-quickfilter"" role=""filter""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-quickfilter"" role=""filter""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlQuickfilter(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a button to the quickfilter control.
        /// </summary>
        [Fact]
        public void AddButton()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlQuickfilter(null);

            // act
            control.Add(new ControlQuickfilterItemButton(null));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"<div class=""wx-webui-quickfilter"" role=""filter""><button type=""button"" class=""wx-quickfilter-button""></button></div>";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding an avatar filter item to the quickfilter control.
        /// </summary>
        [Fact]
        public void AddAvatar()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlQuickfilter(null);

            // act
            control.Add(new ControlQuickfilterItemAvatar("u1")
            {
                Text = _ => "Guybrush",
                Initials = _ => "GT",
                Color = _ => "#1d4ed8",
                PrimaryAction = _ => new ActionFilter() { Group = "assignee" }
            });

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"*<button id=""u1"" type=""button"" class=""wx-quickfilter-avatar"" data-name=""Guybrush"" data-initials=""GT"" data-color=""#1d4ed8"" data-wx-primary-action=""filter"" data-wx-primary-group=""assignee"">Guybrush</button>*";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding an option dropdown filter item to the quickfilter control.
        /// </summary>
        [Fact]
        public void AddDropdown()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlQuickfilter(null);

            // act
            control.Add(new ControlQuickfilterItemDropdown("d1")
            {
                Text = _ => "Sprint"
            }
                .Add(new ControlQuickfilterItemDropdownItem("o1")
                {
                    Text = _ => "Current",
                    PrimaryAction = _ => new ActionFilter() { Group = "sprint", Exclusive = true }
                }));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"*<div id=""d1"" class=""wx-quickfilter-dropdown"" data-text=""Sprint""><button id=""o1"" type=""button"" class=""wx-quickfilter-dropdown-option"" data-text=""Current"" data-wx-primary-action=""filter"" data-wx-primary-group=""sprint"" data-wx-primary-exclusive=""true"">Current</button></div>*";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests adding a multi-select filter item to the quickfilter control.
        /// </summary>
        [Fact]
        public void AddMultiSelect()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlQuickfilter(null);

            // act
            control.Add(new ControlQuickfilterItemMultiSelect("m1")
            {
                Text = _ => "Tags"
            }
                .Add(new ControlQuickfilterItemDropdownItem("o1")
                {
                    Text = _ => "Bug",
                    PrimaryAction = _ => new ActionFilter() { Group = "tags" }
                }));

            // validation
            var html = control.Render(context, visualTree);
            var expected = @"*<div id=""m1"" class=""wx-quickfilter-multiselect"" data-text=""Tags""><button id=""o1"" type=""button"" class=""wx-quickfilter-dropdown-option"" data-text=""Bug"" data-wx-primary-action=""filter"" data-wx-primary-group=""tags"">Bug</button></div>*";

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
