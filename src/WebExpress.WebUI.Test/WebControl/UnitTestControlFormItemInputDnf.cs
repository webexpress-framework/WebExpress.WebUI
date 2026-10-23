using WebExpress.WebCore.WebParameter;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form disjunctive normal form control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputDnf
    {
        /// <summary>
        /// Tests the id property of the form dnf control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-dnf""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-dnf"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDnf(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form dnf control.
        /// </summary>
        [Theory]
        [InlineData(@"<div id=""*"" class=""wx-webui-input-dnf"" name=""*""></div>")]
        public void AutoId(string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDnf()
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the form dnf control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-dnf""></div>")]
        [InlineData("abc", @"<div class=""wx-webui-input-dnf"" name=""abc""></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDnf(null)
            {
                Name = _ => name
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the placeholder property of the form dnf control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-dnf""></div>")]
        [InlineData("Select an option", @"<div class=""wx-webui-input-dnf"" placeholder=""Select an option""></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-input-dnf"" placeholder=""WebExpress.WebUI""></div>")]
        public void Placeholder(string placeholder, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDnf(null)
            {
                Placeholder = _ => placeholder
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the MaxGroups property of the form dnf control. An unlimited number
        /// of conjunctions is the default, so it is expressed by the absence of the
        /// attribute rather than by a sentinel the client would have to know.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<div class=""wx-webui-input-dnf""></div>")]
        [InlineData(0, @"<div class=""wx-webui-input-dnf""></div>")]
        [InlineData(3, @"<div class=""wx-webui-input-dnf"" data-max-groups=""3""></div>")]
        public void MaxGroups(int maxGroups, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDnf(null)
            {
                MaxGroups = _ => maxGroups
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the disabled property of the form dnf control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<div class=""wx-webui-input-dnf""></div>")]
        [InlineData(true, @"<div class=""wx-webui-input-dnf disabled""></div>")]
        public void Disabled(bool disabled, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDnf(null)
            {
                Disabled = _ => disabled
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the options are rendered as selection items, so both halves of
        /// the control family read the same markup.
        /// </summary>
        [Fact]
        public void Options()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputDnf(null);

            // act
            control.Add(new ControlFormItemInputSelectionItem("a") { Text = _ => "Amsterdam" });
            var html = control.Render(context, visualTree);

            // validation
            Assert.Single(control.Options);
            AssertExtensions.EqualWithPlaceholders
            (
                @"<div class=""wx-webui-input-dnf""><div id=""a"" class=""wx-selection-item"" data-label=""Amsterdam""></div></div>",
                html
            );
        }

        /// <summary>
        /// Tests that a submitted expression survives the round trip through the
        /// form, which is the only place where the C# and the JavaScript notation
        /// have to agree.
        /// </summary>
        [Theory]
        [InlineData(null, @"*<div id=""dnf"" class=""wx-webui-input-dnf"" name=""dnf""></div>*")]
        [InlineData("a;b|c", @"*<div id=""dnf"" class=""wx-webui-input-dnf"" name=""dnf"" data-value=""a;b|c""></div>*")]
        [InlineData("a; ;a|", @"*<div id=""dnf"" class=""wx-webui-input-dnf"" name=""dnf"" data-value=""a""></div>*")]
        public void Value(string value, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var control = new ControlFormItemInputDnf("dnf");
            var form = new ControlForm() { Name = _ => "form" }
                .Add(control);
            var context = UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("form", "", ParameterScope.Parameter)
            );
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("dnf", value, ParameterScope.Parameter));

            // act
            var html = form.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the validation sees the parsed expression rather than the
        /// string it arrived in, so a rule is written against the structure.
        /// </summary>
        [Fact]
        public void ValidateItem()
        {
            // arrange
            var validated = false;
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var control = new ControlFormItemInputDnf("dnf")
                .Validate
                (
                    x =>
                    {
                        x.Add(x.Value?.Groups.Count() == 2, "two conjunctions");
                        validated = true;
                    }
                );
            var form = new ControlForm() { Name = _ => "form" }
                .Add(control);
            var context = UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("form", "", ParameterScope.Parameter)
            );
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);

            context.Request.AddParameter(new Parameter(form.Id, context.Request?.Session.Id.ToString(), ParameterScope.Parameter));
            context.Request.AddParameter(new Parameter("dnf", "a;b|c", ParameterScope.Parameter));

            // act
            form.Render(context, visualTree);

            // validation
            Assert.True(validated);
        }
    }
}
