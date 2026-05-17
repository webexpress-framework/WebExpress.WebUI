using System;
using WebExpress.WebCore.WebMessage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form input value of type file.
    /// </summary>
    public class ControlFormInputValueFile : IControlFormInputValue
    {
        /// <summary>
        /// Gets or sets the file name value.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the content type.
        /// </summary>
        public ContentType ContentType { get; set; }

        /// <summary>
        /// Gets or sets the file data.
        /// </summary>
        public byte[] Data { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueFile()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="name">The file name to assign.</param>
        public ControlFormInputValueFile(string name)
        {
            Name = name;
        }

        /// <summary>
        /// Returns a formatted string representation of the value.
        /// </summary>
        /// <param name="format">The format string.</param>
        /// <param name="formatProvider">The format provider.</param>
        /// <returns>A formatted string.</returns>
        public virtual string ToString(string format = null, IFormatProvider formatProvider = null)
        {
            return Name;
        }
    }
}
