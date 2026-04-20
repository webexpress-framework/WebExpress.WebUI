using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the Bind property on form input controls.
    /// Verifies that binding attributes are applied to the enclosing
    /// fieldset.wx-form-group element rendered by the group layout controls.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputBind
    {
        /// <summary>
        /// Tests that a BindHide binding on ControlFormItemInputText causes the
        /// enclosing fieldset to carry the hide bind attributes.
        /// </summary>
        [Fact]
        public void BindHideAppliedToFieldsetInVerticalGroup()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var input = new ControlFormItemInputText("email")
            {
                Label = "E-Mail",
                Bind = new Binding().Add(new BindHide { Source = "type", Value = "internal" })
            };

            var group = new ControlFormItemGroupVertical();
            group.Add(input);

            // act
            var html = group.Render(context, visualTree).ToString();

            // assert — attributes must be on the fieldset, not only on the inner input
            Assert.Contains(@"data-wx-bind=""hide""", html);
            Assert.Contains(@"data-wx-source-hide=""#type""", html);
            Assert.Contains(@"data-wx-bind-value-hide=""internal""", html);
            // the fieldset class must remain intact
            Assert.Contains("wx-form-group", html);
        }

        /// <summary>
        /// Tests that a BindDisable binding on ControlFormItemInputText causes the
        /// enclosing fieldset to carry the disable bind attributes.
        /// </summary>
        [Fact]
        public void BindDisableAppliedToFieldsetInVerticalGroup()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var input = new ControlFormItemInputText("email")
            {
                Label = "E-Mail",
                Bind = new Binding().Add(new BindDisable { Source = "notify", Value = "no" })
            };

            var group = new ControlFormItemGroupVertical();
            group.Add(input);

            // act
            var html = group.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"data-wx-bind=""disable""", html);
            Assert.Contains(@"data-wx-source-disable=""#notify""", html);
            Assert.Contains(@"data-wx-bind-value-disable=""no""", html);
            Assert.Contains("wx-form-group", html);
        }

        /// <summary>
        /// Tests that combining BindHide and BindDisable on one input applies both
        /// bind attribute sets to the enclosing fieldset.
        /// </summary>
        [Fact]
        public void CombinedBindHideAndDisableAppliedToFieldsetInVerticalGroup()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var input = new ControlFormItemInputText("email")
            {
                Label = "E-Mail",
                Bind = new Binding()
                    .Add(new BindHide    { Source = "showEmail", Value = "false" })
                    .Add(new BindDisable { Source = "notify",    Value = "no" })
            };

            var group = new ControlFormItemGroupVertical();
            group.Add(input);

            // act
            var html = group.Render(context, visualTree).ToString();

            // assert — both bind names must appear
            Assert.Contains("hide", html);
            Assert.Contains("disable", html);
            Assert.Contains(@"data-wx-source-hide=""#showEmail""", html);
            Assert.Contains(@"data-wx-source-disable=""#notify""", html);
        }

        /// <summary>
        /// Tests that when no Bind is set, no bind attributes appear on the fieldset.
        /// </summary>
        [Fact]
        public void NullBindProducesNoBindAttributes()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var input = new ControlFormItemInputText("email")
            {
                Label = "E-Mail"
                // Bind intentionally not set
            };

            var group = new ControlFormItemGroupVertical();
            group.Add(input);

            // act
            var html = group.Render(context, visualTree).ToString();

            // assert
            Assert.DoesNotContain("data-wx-bind", html);
        }

        /// <summary>
        /// Tests that BindHide works correctly in a column layout group.
        /// </summary>
        [Fact]
        public void BindHideAppliedToFieldsetInColumnVerticalGroup()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            var input = new ControlFormItemInputText("url")
            {
                Label = "URL",
                Bind = new Binding().Add(new BindHide { Source = "type", Value = "internal" })
            };

            var group = new ControlFormItemGroupColumnVertical();
            group.Add(input);

            // act
            var html = group.Render(context, visualTree).ToString();

            // assert
            Assert.Contains(@"data-wx-bind=""hide""", html);
            Assert.Contains(@"data-wx-source-hide=""#type""", html);
            Assert.Contains(@"data-wx-bind-value-hide=""internal""", html);
            Assert.Contains("wx-form-group", html);
        }
    }
}
