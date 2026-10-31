using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebParameter;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests that every custom form input tells the client when a value is required. Such an
    /// input submits through a hidden field the browser's constraint validation does not reach,
    /// so the data-required mark on its host is the only way the client side of the control
    /// contract learns of the requirement.
    /// </summary>
    public class UnitTestControlFormItemInputRequired
    {
        /// <summary>
        /// Tests that a required custom input marks its host and an optional one does not.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlFormItemInputAvatar))]
        [InlineData(typeof(ControlFormItemInputBarcode))]
        [InlineData(typeof(ControlFormItemInputCalendar))]
        [InlineData(typeof(ControlFormItemInputCalendarRange))]
        [InlineData(typeof(ControlFormItemInputCascading))]
        [InlineData(typeof(ControlFormItemInputChoice))]
        [InlineData(typeof(ControlFormItemInputColor))]
        [InlineData(typeof(ControlFormItemInputCountry))]
        [InlineData(typeof(ControlFormItemInputDomain))]
        [InlineData(typeof(ControlFormItemInputPhone))]
        [InlineData(typeof(ControlFormItemInputDate))]
        [InlineData(typeof(ControlFormItemInputDateRange))]
        [InlineData(typeof(ControlFormItemInputDnf))]
        [InlineData(typeof(ControlFormItemInputEstimate))]
        [InlineData(typeof(ControlFormItemInputMove))]
        [InlineData(typeof(ControlFormItemInputRating))]
        [InlineData(typeof(ControlFormItemInputSelection))]
        [InlineData(typeof(ControlFormItemInputSlider))]
        [InlineData(typeof(ControlFormItemInputSpreadsheet))]
        [InlineData(typeof(ControlFormItemInputTag))]
        [InlineData(typeof(ControlFormItemInputTile))]
        [InlineData(typeof(ControlFormItemInputTrafficLight))]
        public void RequiredMarksTheHost(Type inputType)
        {
            Assert.Contains("data-required=\"true\"", Render(inputType, true));
            Assert.DoesNotContain("data-required", Render(inputType, false));
        }

        /// <summary>
        /// Tests the required rule on the server: a required input that was submitted empty is
        /// refused, a filled one, an optional one and a disabled one are not. The raw values are
        /// what the browser posts for the input.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlFormItemInputAvatar), "", "file:a.png;data:image/png;base64,AAAA")]
        [InlineData(typeof(ControlFormItemInputBarcode), "", "4006381333931")]
        [InlineData(typeof(ControlFormItemInputCalendar), "", "2026-10-20")]
        [InlineData(typeof(ControlFormItemInputCalendarRange), "", "2026-10-01 - 2026-10-20")]
        [InlineData(typeof(ControlFormItemInputCascading), "", "europe;germany")]
        [InlineData(typeof(ControlFormItemInputCheck), "", "on")]
        [InlineData(typeof(ControlFormItemInputChoice), "", "a")]
        [InlineData(typeof(ControlFormItemInputColor), "", "#ff0000")]
        [InlineData(typeof(ControlFormItemInputCountry), "", "DE")]
        [InlineData(typeof(ControlFormItemInputDomain), "", "CONTOSO\\jdoe")]
        [InlineData(typeof(ControlFormItemInputEmail), "", "grace@example.com")]
        [InlineData(typeof(ControlFormItemInputFqdn), "", "server.example.com")]
        [InlineData(typeof(ControlFormItemInputIp), "", "192.0.2.10")]
        [InlineData(typeof(ControlFormItemInputPhone), "", "+4930123456")]
        [InlineData(typeof(ControlFormItemInputCombo), "", "a")]
        [InlineData(typeof(ControlFormItemInputDate), "", "2026-10-20")]
        [InlineData(typeof(ControlFormItemInputDateRange), "", "2026-10-01 - 2026-10-20")]
        [InlineData(typeof(ControlFormItemInputDnf), "", "a")]
        [InlineData(typeof(ControlFormItemInputEstimate), "", "0")]
        [InlineData(typeof(ControlFormItemInputFile), "", "a.txt")]
        [InlineData(typeof(ControlFormItemInputMove), "", "a;b")]
        [InlineData(typeof(ControlFormItemInputPassword), "", "secret")]
        [InlineData(typeof(ControlFormItemInputRadio), "", "a")]
        [InlineData(typeof(ControlFormItemInputRating), "0", "3")]
        [InlineData(typeof(ControlFormItemInputSelection), "", "a")]
        [InlineData(typeof(ControlFormItemInputSpreadsheet), "", "{\"sheets\":[{\"cells\":{\"A1\":1}}]}")]
        [InlineData(typeof(ControlFormItemInputTag), "", "a;b")]
        [InlineData(typeof(ControlFormItemInputText), "", "abc")]
        [InlineData(typeof(ControlFormItemInputTile), "", "a")]
        [InlineData(typeof(ControlFormItemInputTrafficLight), "", "red")]
        public void RequiredRefusesAnEmptySubmission(Type inputType, string empty, string filled)
        {
            Assert.Single(Validate(inputType, empty, required: true, disabled: false));
            Assert.Empty(Validate(inputType, filled, required: true, disabled: false));
            Assert.Empty(Validate(inputType, empty, required: false, disabled: false));
            Assert.Empty(Validate(inputType, empty, required: true, disabled: true));
        }

        /// <summary>
        /// Tests that an input whose value always holds something is never refused as empty.
        /// </summary>
        [Theory]
        [InlineData(typeof(ControlFormItemInputRange))]
        [InlineData(typeof(ControlFormItemInputSlider))]
        public void RequiredAcceptsAValueThatIsAlwaysThere(Type inputType)
        {
            Assert.Empty(Validate(inputType, "", required: true, disabled: false));
        }

        /// <summary>
        /// Tests that the general message names the field it is about.
        /// </summary>
        [Fact]
        public void RequiredMessageNamesTheField()
        {
            var result = Assert.Single(Validate(typeof(ControlFormItemInputSelection), "", required: true, disabled: false, label: "Ship"));

            Assert.Equal(TypeInputValidity.Error, result.Type);
            Assert.Contains("Ship", result.Text);
        }

        /// <summary>
        /// Validates an input of the given type after the browser posted the given raw value.
        /// </summary>
        /// <param name="inputType">The type of the input.</param>
        /// <param name="raw">The posted value.</param>
        /// <param name="required">Whether the input is required.</param>
        /// <param name="disabled">Whether the input is disabled.</param>
        /// <param name="label">The label of the input.</param>
        /// <returns>The validation results.</returns>
        private static List<ValidationResult> Validate(Type inputType, string raw, bool required, bool disabled, string label = null)
        {
            // arrange
            UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter("input", raw, ParameterScope.Parameter)
            ), form);
            var control = (ControlFormItem)Activator.CreateInstance(inputType, "input");
            Func<IRenderControlContext, bool> requirement = _ => required;
            Func<IRenderControlContext, bool> disabling = _ => disabled;
            Func<IRenderControlContext, string> labeling = _ => label;
            inputType.GetProperty(nameof(IControlFormItemInput.Required)).SetValue(control, requirement);
            inputType.GetProperty(nameof(IControlFormItemInput.Disabled)).SetValue(control, disabling);
            inputType.GetProperty(nameof(IControlFormItemInput.Label)).SetValue(control, labeling);
            control.Initialize(context);

            // act
            return ((IControlFormValidation)control).Validate(context).ToList();
        }

        /// <summary>
        /// Renders an input of the given type.
        /// </summary>
        /// <param name="inputType">The type of the input.</param>
        /// <param name="required">Whether the input is required.</param>
        /// <returns>The rendered markup.</returns>
        private static string Render(Type inputType, bool required)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = (ControlFormItem)Activator.CreateInstance(inputType, "input");
            Func<IRenderControlContext, bool> requirement = _ => required;
            inputType.GetProperty(nameof(IControlFormItemInput.Required)).SetValue(control, requirement);

            // act
            return control.Render(context, visualTree)?.ToString();
        }
    }
}
