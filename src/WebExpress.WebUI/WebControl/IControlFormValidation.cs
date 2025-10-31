using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Interface for form validation, providing methods and properties to validate form inputs.
    /// </summary>
    public interface IControlFormValidation
    {
        /// <summary>
        /// Validates the input elements within a form for correctness of the data.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated, containing form data and state.</param>
        /// <returns>A collection of <see cref="ValidationResult"/> objects representing the validation 
        /// results for each input element. Each result indicates whether the input is valid or contains errors.
        /// </returns>
        IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext);
    }
}
