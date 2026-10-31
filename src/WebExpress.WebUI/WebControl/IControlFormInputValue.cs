using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a typed value assigned to a form input control.
    /// </summary>
    public interface IControlFormInputValue : IFormattable
    {
        /// <summary>
        /// Gets a value indicating whether nothing was entered, which is what the required rule of
        /// an input checks on the server. A value that always holds something - a number, a range -
        /// keeps the default and is never empty; an input whose empty state is a particular value
        /// (a rating of zero) decides it on the input instead.
        /// </summary>
        bool IsEmpty => false;
    }
}
