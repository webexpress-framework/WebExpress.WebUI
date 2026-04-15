using System;
using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Event argument, which is created after a complete validation of the form with all controls.
    /// </summary>
    public class ValidationResultEventArgs : EventArgs
    {
        /// <summary>
        /// Gets whether validation has completed successfully.
        /// </summary>
        public bool Valid { get; private set; }

        /// <summary>
        /// Gets the validation results.
        /// </summary>
        public List<ValidationResult> Results { get; private set; } = new List<ValidationResult>();

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ValidationResultEventArgs()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="valid">True if validation is successful, false otherwise.</param>
        public ValidationResultEventArgs(bool valid)
        {
            Valid = valid;
        }
    }
}
