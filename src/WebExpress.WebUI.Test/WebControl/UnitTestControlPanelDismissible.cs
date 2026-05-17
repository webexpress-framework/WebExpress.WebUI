using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the <see cref="ControlPanelDismissible"/> control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlPanelDismissible
    {
        /// <summary>
        /// Verifies the host element id and base css class.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-panel-dismissible""></div>")]
        [InlineData("my-panel", @"<div id=""my-panel"" class=""wx-webui-panel-dismissible""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelDismissible(id);

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Verifies that the title is emitted as the data-title attribute.
        /// </summary>
        [Fact]
        public void TitleIsEmittedAsDataAttribute()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelDismissible("p")
            {
                Title = _ => "Details"
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"id=""p""", html);
            Assert.Contains(@"class=""wx-webui-panel-dismissible""", html);
            Assert.Contains(@"data-title=""Details""", html);
        }

        /// <summary>
        /// Verifies that the initial-hidden flag is only emitted when true.
        /// </summary>
        [Theory]
        [InlineData(false, false)]
        [InlineData(true, true)]
        public void InitialHiddenIsEmittedOnlyWhenTrue(bool initialHidden, bool expectAttribute)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelDismissible("p")
            {
                InitialHidden = _ => initialHidden
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            if (expectAttribute)
            {
                Assert.Contains(@"data-initial-hidden=""true""", html);
            }
            else
            {
                Assert.DoesNotContain("data-initial-hidden", html);
            }
        }

        /// <summary>
        /// Verifies that arbitrary content controls are rendered inside the panel.
        /// </summary>
        [Fact]
        public void ContentIsRendered()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelDismissible("p")
                .Add(new ControlText { Text = _ => "hello" });

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains("hello", html);
        }

        /// <summary>
        /// Verifies that a <see cref="BindShow"/> attached through Bind emits
        /// the data-wx-* attributes the JavaScript side consumes.
        /// </summary>
        [Fact]
        public void BindShowEmitsBindAttributes()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlPanelDismissible("p")
            {
                Title = _ => "Details",
                Bind = _ => new Binding().Add(new BindShow { Source = "characters" })
            };

            // act
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.Contains(@"data-wx-bind=""show""", html);
            Assert.Contains(@"data-wx-source-show=""#characters""", html);
        }

        /// <summary>
        /// Verifies that Remove drops a previously added control from the body.
        /// </summary>
        [Fact]
        public void RemoveDropsControl()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var text = new ControlText { Text = _ => "drop-me" };
            var control = new ControlPanelDismissible("p").Add(text);

            // act
            control.Remove(text);
            var html = control.Render(context, visualTree).ToString();

            // validation
            Assert.DoesNotContain("drop-me", html);
        }
    }
}
