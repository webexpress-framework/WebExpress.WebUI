using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the read only disjunctive normal form control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlDnf
    {
        /// <summary>
        /// Tests the id property of the dnf control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-dnf""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-dnf""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDnf(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the dnf control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-dnf""></div>")]
        [InlineData("", @"<div class=""wx-webui-dnf""></div>")]
        [InlineData("a;b|c", @"<div class=""wx-webui-dnf"" data-value=""a;b|c""></div>")]
        public void Value(string value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDnf()
            {
                Value = _ => value is null ? null : new ControlFormInputValueDnf(value)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the compact property of the dnf control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-dnf""></div>")]
        [InlineData(true, @"<div class=""wx-webui-dnf"" data-compact=""true""></div>")]
        public void Compact(bool compact, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDnf()
            {
                Compact = _ => compact
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the empty text property of the dnf control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-dnf""></div>")]
        [InlineData("No filter", @"<div class=""wx-webui-dnf"" data-placeholder=""No filter""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-dnf"" data-placeholder=""WebExpress.WebUI""></div>")]
        public void EmptyText(string emptyText, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDnf()
            {
                EmptyText = _ => emptyText
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the control carries the options, because a term id only
        /// becomes a label through them - and because the smart edit turns exactly
        /// this markup into an editor.
        /// </summary>
        [Fact]
        public void Options()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlDnf()
            {
                Value = _ => new ControlFormInputValueDnf("a")
            };

            // act
            control.Add(new ControlFormItemInputSelectionItem("a") { Text = _ => "Amsterdam" });
            var html = control.Render(context, visualTree);

            // validation
            Assert.Single(control.Options);
            AssertExtensions.EqualWithPlaceholders
            (
                @"<div class=""wx-webui-dnf"" data-value=""a""><div id=""a"" class=""wx-selection-item"" data-label=""Amsterdam""></div></div>",
                html
            );
        }

        /// <summary>
        /// Tests that a term can be dropped from the options again.
        /// </summary>
        [Fact]
        public void Remove()
        {
            // arrange
            var item = new ControlFormItemInputSelectionItem("a") { Text = _ => "Amsterdam" };
            var control = new ControlDnf().Add(item);

            // act
            control.Remove(item);

            // validation
            Assert.Empty(control.Options);
        }
    }
}
