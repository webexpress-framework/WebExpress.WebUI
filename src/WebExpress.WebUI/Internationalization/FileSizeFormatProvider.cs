using System;
using System.Globalization;

namespace WebExpress.WebUI.Internationalization
{
    /// <summary>
    /// Credit: http://blog.flimflan.com/FileSizeFormatProvider.html
    /// </summary>
    public class FileSizeFormatProvider : IFormatProvider, ICustomFormatter
    {
        private const string fileSizeFormat = "fs";
        private const decimal OneKiloByte = 1024M;
        private const decimal OneMegaByte = OneKiloByte * 1024M;
        private const decimal OneGigaByte = OneMegaByte * 1024M;

        /// <summary>
        /// Returns or sets the culture.
        /// </summary>
        public CultureInfo Culture { get; set; }

        /// <summary>
        /// Retrieves an object that provides formatting services for the specified type.
        /// </summary>
        /// <param name="formatType">The type of format object to return.</param>
        /// <returns>An object that provides formatting services for the specified type.</returns>
        public object GetFormat(Type formatType)
        {
            if (formatType == typeof(ICustomFormatter))
            {
                return this;
            }

            return null;

        }

        /// <summary>
        /// Formats the specified argument as a human-readable file size string.
        /// </summary>
        /// <param name="format">
        /// A format string that specifies the desired output format. The format must start 
        /// with a specific prefix (e.g., "fs") to indicate file size formatting. 
        /// If the format does not match this prefix, the method falls back to the default 
        /// formatting behavior.
        /// </param>
        /// <param name="arg">
        /// The object to format. This is expected to be a numeric value representing the 
        /// file size in bytes. If the argument is not numeric, the method falls back to 
        /// the default formatting behavior.</param>
        /// <param name="formatProvider">
        /// An format provider that supplies culture-specific formatting information. If null, 
        /// the current culture is used.
        /// </param>
        /// <returns>
        /// A string representing the formatted file size, including an appropriate unit 
        /// (e.g., "kB", "MB", "GB"). If the input format is invalid or the argument cannot
        /// be converted to a numeric value, the method returns the result of the default 
        /// formatting behavior.
        /// </returns>
        public string Format(string format, object arg, IFormatProvider formatProvider)
        {
            if (format == null || !format.StartsWith(fileSizeFormat))
            {
                return DefaultFormat(format, arg, formatProvider);
            }

            if (arg is string)
            {
                return DefaultFormat(format, arg, formatProvider);
            }

            decimal size;
            try
            {
                size = Convert.ToDecimal(arg);
            }
            catch (InvalidCastException)
            {
                return DefaultFormat(format, arg, formatProvider);
            }

            string suffix;

            if (size > OneGigaByte)
            {
                size /= OneGigaByte;
                suffix = "GB";
            }
            else if (size > OneMegaByte)
            {
                size /= OneMegaByte;
                suffix = "MB";
            }
            else if (size > OneKiloByte)
            {
                size /= OneKiloByte;
                suffix = "kB";
            }
            else
            {
                suffix = " B";
            }

            var precision = format.Substring(2);
            if (string.IsNullOrEmpty(precision))
            {
                precision = "2";
            }

            return string.Format("{0} {1}", size.ToString("#,0.0", Culture), suffix);
        }

        /// <summary>
        /// Provides a default formatting implementation for an object, using the specified 
        /// format string and format provider.
        /// </summary>
        /// <param name="format">A format string that specifies the desired format.</param>
        /// <param name="arg">The object to format.</param>
        /// <param name="formatProvider">
        /// An format provider that supplies culture-specific formatting information.
        /// </param>
        /// <returns>
        /// A string representation of the arg object, formatted according to the specified 
        /// format and format provider.
        /// </returns>
        private static string DefaultFormat(string format, object arg, IFormatProvider formatProvider)
        {
            var formattableArg = arg as IFormattable;

            if (formattableArg != null)
            {
                return formattableArg.ToString(format, formatProvider);
            }

            return arg.ToString();
        }
    }
}
