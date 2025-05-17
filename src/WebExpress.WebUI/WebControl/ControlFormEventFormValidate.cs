using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument for validating form inputs.
    /// </summary>
    public class ControlFormEventFormValidate : ControlFormEvent
    {
        private readonly List<ValidationResult> _results = new();

        /// <summary>
        /// Gets the collection of validation results.
        /// </summary>
        public IEnumerable<ValidationResult> Results => _results;

        /// <summary>
        /// Initializes a new instance of the <see cref="ControlFormEventFormValidate"/> class.
        /// </summary>
        public ControlFormEventFormValidate()
        {
        }

        /// <summary>
        /// Adds a validation result to the collection if the specified predicate is true.
        /// </summary>
        /// <param name="predicate">A boolean value indicating whether the validation result should be added.</param>
        /// <param name="text">The validation message to be added.</param>
        /// <param name="type">The type of the validation result. Defaults to <see cref="TypeInputValidity.Error"/>.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlFormEventFormValidate Add(bool predicate, string text, TypeInputValidity type = TypeInputValidity.Error)
        {
            if (predicate)
            {
                _results.Add(new ValidationResult(type, text));
            }

            return this;
        }
    }
}
