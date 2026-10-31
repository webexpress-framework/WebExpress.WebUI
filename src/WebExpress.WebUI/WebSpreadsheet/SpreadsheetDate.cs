using System;

namespace WebExpress.WebUI.WebSpreadsheet
{
    /// <summary>
    /// Converts between dates and the serial numbers the spreadsheet stores dates as: days since
    /// 1899-12-30, the fraction being the time of day. Dates stay numbers, so date arithmetic in
    /// formulas is plain arithmetic, as in the common spreadsheets.
    /// </summary>
    public static class SpreadsheetDate
    {
        private static readonly DateTime _epoch = new(1899, 12, 30, 0, 0, 0, DateTimeKind.Unspecified);

        /// <summary>
        /// Converts a date to its serial number. The date is taken as wall-clock time, without
        /// any time zone conversion.
        /// </summary>
        /// <param name="date">The date.</param>
        /// <returns>The serial number.</returns>
        public static double ToSerial(DateTime date) => (DateTime.SpecifyKind(date, DateTimeKind.Unspecified) - _epoch).TotalDays;

        /// <summary>
        /// Converts a serial number to a date, rounded to the millisecond.
        /// </summary>
        /// <param name="serial">The serial number.</param>
        /// <returns>The date.</returns>
        public static DateTime FromSerial(double serial) => _epoch.AddMilliseconds(Math.Round(serial * 86400000d));
    }
}
