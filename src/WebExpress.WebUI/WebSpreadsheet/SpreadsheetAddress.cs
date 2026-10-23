using System;
using System.Globalization;
using System.Text.RegularExpressions;

namespace WebExpress.WebUI.WebSpreadsheet
{
    /// <summary>
    /// Converts between zero-based cell positions and the A1 notation the spreadsheet stores and
    /// shows, so server code addresses cells the way users read them.
    /// </summary>
    /// <remarks>
    /// The limits are those of the common spreadsheet file formats; the client
    /// (webexpress.webui.spreadsheet.model.js) applies the same ones.
    /// </remarks>
    public static partial class SpreadsheetAddress
    {
        /// <summary>
        /// The largest number of rows of a sheet.
        /// </summary>
        public const int MaxRows = 1048576;

        /// <summary>
        /// The largest number of columns of a sheet (XFD).
        /// </summary>
        public const int MaxColumns = 16384;

        [GeneratedRegex("^\\$?([A-Za-z]{1,3})\\$?([0-9]{1,7})$", RegexOptions.CultureInvariant)]
        private static partial Regex CellPattern();

        /// <summary>
        /// Returns the letters of a column.
        /// </summary>
        /// <param name="column">The zero-based column.</param>
        /// <returns>The letters, such as "A" or "AB".</returns>
        public static string ColumnName(int column)
        {
            ArgumentOutOfRangeException.ThrowIfNegative(column);

            var name = string.Empty;

            for (var n = column + 1; n > 0; n = (n - 1) / 26)
            {
                name = (char)('A' + (n - 1) % 26) + name;
            }

            return name;
        }

        /// <summary>
        /// Returns the zero-based index of column letters.
        /// </summary>
        /// <param name="letters">The letters, case-insensitive.</param>
        /// <returns>The index.</returns>
        public static int ColumnIndex(string letters)
        {
            ArgumentException.ThrowIfNullOrEmpty(letters);

            var n = 0;

            foreach (var ch in letters.ToUpperInvariant())
            {
                if (ch < 'A' || ch > 'Z')
                {
                    throw new ArgumentException("Column letters expected.", nameof(letters));
                }

                n = n * 26 + (ch - 'A' + 1);
            }

            return n - 1;
        }

        /// <summary>
        /// Returns the A1 name of a cell.
        /// </summary>
        /// <param name="row">The zero-based row.</param>
        /// <param name="column">The zero-based column.</param>
        /// <returns>The name, such as "B2".</returns>
        public static string CellName(int row, int column)
        {
            ArgumentOutOfRangeException.ThrowIfNegative(row);

            return ColumnName(column) + (row + 1).ToString(CultureInfo.InvariantCulture);
        }

        /// <summary>
        /// Reads the A1 name of a cell.
        /// </summary>
        /// <param name="reference">The name, optionally with $ markers.</param>
        /// <param name="row">Receives the zero-based row.</param>
        /// <param name="column">Receives the zero-based column.</param>
        /// <returns>True if the text names a cell within the limits.</returns>
        public static bool TryParseCell(string reference, out int row, out int column)
        {
            row = column = -1;

            var match = CellPattern().Match(reference?.Trim() ?? string.Empty);

            if (!match.Success)
            {
                return false;
            }

            column = ColumnIndex(match.Groups[1].Value);
            row = int.Parse(match.Groups[2].Value, CultureInfo.InvariantCulture) - 1;

            if (row >= 0 && row < MaxRows && column < MaxColumns)
            {
                return true;
            }

            row = column = -1;

            return false;
        }

        /// <summary>
        /// Reads a range such as "A1:C3" or a single cell.
        /// </summary>
        /// <param name="reference">The range, without a sheet prefix.</param>
        /// <param name="first">Receives the top-left cell (row, column).</param>
        /// <param name="last">Receives the bottom-right cell (row, column).</param>
        /// <returns>True if the text names a range.</returns>
        public static bool TryParseRange(string reference, out (int Row, int Column) first, out (int Row, int Column) last)
        {
            first = last = (-1, -1);

            var parts = (reference ?? string.Empty).Split(':');

            if (parts.Length > 2 || !TryParseCell(parts[0], out var r1, out var c1))
            {
                return false;
            }

            var r2 = r1;
            var c2 = c1;

            if (parts.Length == 2 && !TryParseCell(parts[1], out r2, out c2))
            {
                return false;
            }

            first = (Math.Min(r1, r2), Math.Min(c1, c2));
            last = (Math.Max(r1, r2), Math.Max(c1, c2));

            return true;
        }
    }
}
