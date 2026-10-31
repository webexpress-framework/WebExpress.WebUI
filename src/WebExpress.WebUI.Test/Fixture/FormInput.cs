using WebExpress.WebCore.WebParameter;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.Fixture
{
    /// <summary>
    /// Posts a value to a form input and returns what the server makes of it, the way a form
    /// round trip would: the input reads the parameter on initialization, then validates.
    /// </summary>
    public static class FormInput
    {
        /// <summary>
        /// Validates an input after the browser posted the given value under the input's id.
        /// </summary>
        /// <param name="control">The input, created with an id.</param>
        /// <param name="posted">The posted value.</param>
        /// <returns>The validation results.</returns>
        public static List<ValidationResult> Validate(ControlFormItemInput<ControlFormInputValueString> control, string posted)
        {
            var context = Post(control, posted);

            return control.Validate(context).ToList();
        }

        /// <summary>
        /// Returns the value the page receives after the browser posted the given value.
        /// </summary>
        /// <param name="control">The input, created with an id.</param>
        /// <param name="posted">The posted value.</param>
        /// <returns>The text of the value.</returns>
        public static string Value(ControlFormItemInput<ControlFormInputValueString> control, string posted)
        {
            var context = Post(control, posted);

            return context.GetValue<ControlFormInputValueString>(control)?.Text;
        }

        /// <summary>
        /// Initializes an input from a request carrying the posted value.
        /// </summary>
        /// <param name="control">The input.</param>
        /// <param name="posted">The posted value.</param>
        /// <returns>The form context the input was initialized in.</returns>
        private static RenderControlFormContext Post(ControlFormItemInput<ControlFormInputValueString> control, string posted)
        {
            UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock
            (
                null,
                null,
                new Parameter(control.Id, posted, ParameterScope.Parameter)
            ), new ControlForm());
            control.Initialize(context);

            return context;
        }
    }
}
