using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace WebExpress.WebUI.WebSpreadsheet
{
    /// <summary>
    /// A workbook of the spreadsheet control: sheets, named ranges, format templates and metadata.
    /// It is the server side of the JSON value the control is initialized with and posts back,
    /// so an application builds workbooks in C# and reads submitted ones without touching JSON.
    /// </summary>
    /// <remarks>
    /// Reading validates and sanitizes, because a posted value comes from the client. The format
    /// is versioned; the client (SpreadsheetModel.fromJSON) accepts the same documents.
    /// </remarks>
    public sealed partial class SpreadsheetWorkbook
    {
        /// <summary>
        /// The version of the JSON format.
        /// </summary>
        public const int Version = 1;

        /// <summary>
        /// The largest JSON text accepted, in characters.
        /// </summary>
        public const int MaxLength = 64 * 1024 * 1024;

        [GeneratedRegex("^[A-Za-z_\\\\][A-Za-z0-9_.\\\\]{0,254}$", RegexOptions.CultureInvariant)]
        private static partial Regex NamePattern();

        /// <summary>
        /// Gets the sheets in tab order.
        /// </summary>
        public IList<SpreadsheetSheet> Sheets { get; } = [];

        /// <summary>
        /// Gets the named ranges, such as "Revenue" = "Sheet1!$B$2:$B$13".
        /// </summary>
        public IDictionary<string, string> Names { get; } = new Dictionary<string, string>(StringComparer.Ordinal);

        /// <summary>
        /// Gets the named format templates.
        /// </summary>
        public IDictionary<string, SpreadsheetStyle> Styles { get; } = new Dictionary<string, SpreadsheetStyle>(StringComparer.Ordinal);

        /// <summary>
        /// Gets or sets free metadata of the workbook, such as a title or an author.
        /// </summary>
        public JsonObject Meta { get; set; } = [];

        /// <summary>
        /// Gets or sets the name or id of the sheet shown first.
        /// </summary>
        public string ActiveSheet { get; set; }

        /// <summary>
        /// Gets whether no sheet holds a value or a formula.
        /// </summary>
        public bool IsEmpty => Sheets.All(sheet => sheet.EnumerateCells().All(c => c.Cell.IsEmpty));

        /// <summary>
        /// Gets a sheet by name (case-insensitive) or id.
        /// </summary>
        /// <param name="name">The name or id.</param>
        /// <returns>The sheet, or null.</returns>
        public SpreadsheetSheet this[string name] => GetSheet(name);

        /// <summary>
        /// Adds a sheet.
        /// </summary>
        /// <param name="name">The name; it must be unique, at most 100 characters and free of [ ] : * ? / \.</param>
        /// <param name="rowCount">The number of rows.</param>
        /// <param name="columnCount">The number of columns.</param>
        /// <returns>The sheet.</returns>
        public SpreadsheetSheet AddSheet(string name, int rowCount = 1000, int columnCount = 26)
        {
            if (!IsValidSheetName(name))
            {
                throw new ArgumentException("Invalid or duplicate sheet name: " + name, nameof(name));
            }

            var sheet = new SpreadsheetSheet(name)
            {
                RowCount = Math.Clamp(rowCount, 1, SpreadsheetAddress.MaxRows),
                ColumnCount = Math.Clamp(columnCount, 1, SpreadsheetAddress.MaxColumns)
            };

            Sheets.Add(sheet);

            return sheet;
        }

        /// <summary>
        /// Gets a sheet by name (case-insensitive) or id.
        /// </summary>
        /// <param name="name">The name or id.</param>
        /// <returns>The sheet, or null.</returns>
        public SpreadsheetSheet GetSheet(string name)
        {
            return Sheets.FirstOrDefault(s => s.Id == name)
                ?? Sheets.FirstOrDefault(s => string.Equals(s.Name, name, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Defines a named range.
        /// </summary>
        /// <param name="name">The name; letters, digits, dots and underscores, not a cell name.</param>
        /// <param name="reference">The range including its sheet, such as "Sheet1!$B$2:$B$13".</param>
        /// <returns>The workbook, for chaining.</returns>
        public SpreadsheetWorkbook DefineName(string name, string reference)
        {
            if (!IsValidName(name))
            {
                throw new ArgumentException("Invalid name: " + name, nameof(name));
            }

            ArgumentException.ThrowIfNullOrWhiteSpace(reference);
            Names[name] = reference.TrimStart('=');

            return this;
        }

        /// <summary>
        /// Determines whether a name may be used for a new sheet.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <returns>True if valid and not taken.</returns>
        public bool IsValidSheetName(string name)
        {
            return !string.IsNullOrWhiteSpace(name) && name.Length <= 100 && name.IndexOfAny(['[', ']', ':', '*', '?', '/', '\\']) < 0
                && !name.StartsWith('\'') && !name.EndsWith('\'')
                && !Sheets.Any(s => string.Equals(s.Name, name, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Determines whether a text may name a range.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <returns>True if valid.</returns>
        public static bool IsValidName(string name)
        {
            return name is not null && NamePattern().IsMatch(name) && !SpreadsheetAddress.TryParseCell(name, out _, out _)
                && !string.Equals(name, "TRUE", StringComparison.OrdinalIgnoreCase) && !string.Equals(name, "FALSE", StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Determines whether a text looks like a workbook rather than anything else.
        /// </summary>
        /// <param name="value">The text.</param>
        /// <returns>True only for a supported workbook document.</returns>
        public static bool IsWorkbook(string value) => !string.IsNullOrWhiteSpace(value) && TryParse(value, out _);

        /// <summary>
        /// Extracts cell captions and effective values in sheet and row order.
        /// </summary>
        /// <returns>Plain text, or an empty string for an empty workbook.</returns>
        public string ToPlainText()
        {
            return string.Join(" ", Sheets.SelectMany(sheet => sheet.EnumerateCells())
                .Select(cell => PlainValue(cell.Cell.EffectiveValue))
                .Where(text => !string.IsNullOrWhiteSpace(text)).Select(text => text.Trim()));
        }

        /// <summary>
        /// Extracts text only after validating the serialized workbook.
        /// </summary>
        /// <param name="value">The serialized workbook. Blank input creates an empty workbook.</param>
        /// <returns>The cell text.</returns>
        /// <exception cref="JsonException">The value is not a workbook.</exception>
        public static string ToPlainText(string value) => Parse(value).ToPlainText();

        /// <summary>
        /// Uses captions for structured cells and invariant formatting for scalar values.
        /// </summary>
        /// <param name="value">The effective cell value.</param>
        /// <returns>The readable cell text.</returns>
        private static string PlainValue(object value) => value switch
        {
            null => null,
            JsonObject node => node["text"] is JsonValue caption && caption.TryGetValue<string>(out var text) ? text : null,
            IFormattable number => number.ToString(null, System.Globalization.CultureInfo.InvariantCulture),
            _ => value.ToString()
        };

        /// <summary>
        /// Writes the workbook as the JSON object the control reads.
        /// </summary>
        /// <param name="includeResults">Whether formula results read from a posted workbook are written.</param>
        /// <returns>The object.</returns>
        public JsonObject ToJsonObject(bool includeResults = false)
        {
            var json = new JsonObject { ["version"] = Version };

            if (!string.IsNullOrEmpty(ActiveSheet))
            {
                json["activeSheet"] = ActiveSheet;
            }

            json["sheets"] = new JsonArray([.. Sheets.Select(s => (JsonNode)s.ToJson(includeResults))]);

            if (Names.Count > 0)
            {
                json["names"] = new JsonObject(Names.Where(n => IsValidName(n.Key)).Select(n => KeyValuePair.Create(n.Key, (JsonNode)n.Value)));
            }

            var styles = Styles.Select(s => (s.Key, Json: s.Value?.ToJson())).Where(s => s.Json is not null).ToList();

            if (styles.Count > 0)
            {
                json["styles"] = new JsonObject(styles.Select(s => KeyValuePair.Create(s.Key, (JsonNode)s.Json)));
            }

            if (Meta is { Count: > 0 })
            {
                json["meta"] = Meta.DeepClone();
            }

            return json;
        }

        /// <summary>
        /// Writes the workbook as JSON text.
        /// </summary>
        /// <param name="indented">Whether the text is indented.</param>
        /// <returns>The JSON text.</returns>
        public string ToJson(bool indented = false)
        {
            return ToJsonObject().ToJsonString(new JsonSerializerOptions { WriteIndented = indented });
        }

        /// <summary>
        /// Returns the JSON text.
        /// </summary>
        /// <returns>The JSON text.</returns>
        public override string ToString() => ToJson();

        /// <summary>
        /// Reads a workbook from JSON text, validating everything on the way in.
        /// </summary>
        /// <param name="json">The JSON text; empty text gives a workbook with one empty sheet.</param>
        /// <returns>The workbook.</returns>
        /// <exception cref="JsonException">If the text is no workbook.</exception>
        public static SpreadsheetWorkbook Parse(string json)
        {
            var workbook = new SpreadsheetWorkbook();

            if (string.IsNullOrWhiteSpace(json))
            {
                workbook.AddSheet("Sheet1");
                return workbook;
            }

            if (json.Length > MaxLength)
            {
                throw new JsonException("The workbook is too large.");
            }

            var root = JsonNode.Parse(json, documentOptions: new JsonDocumentOptions { MaxDepth = 64 }) as JsonObject
                ?? throw new JsonException("A workbook must be a JSON object.");

            if (root.ContainsKey("doc") || root["sheets"] is not JsonArray ||
                (root.ContainsKey("version") && (root["version"] is not JsonValue v || !v.TryGetValue<int>(out var version) || version != Version)))
            {
                throw new JsonException("Unsupported workbook version.");
            }

            if (root["sheets"] is JsonArray sheets)
            {
                foreach (var node in sheets)
                {
                    if (node is not JsonObject sheetJson)
                    {
                        throw new JsonException("A sheet must be a JSON object.");
                    }

                    var sheet = SpreadsheetSheet.FromJson(sheetJson);

                    // a duplicate or invalid name becomes the next free "SheetN", as the client
                    // names it, so server and client agree on the names formulas refer to
                    for (var n = workbook.Sheets.Count + 1; !workbook.IsValidSheetName(sheet.Name); n++)
                    {
                        sheet.Name = "Sheet" + n;
                    }

                    workbook.Sheets.Add(sheet);
                }
            }

            if (workbook.Sheets.Count == 0)
            {
                workbook.AddSheet("Sheet1");
            }

            if (root["names"] is JsonObject names)
            {
                foreach (var (name, value) in names)
                {
                    if (IsValidName(name) && value is JsonValue text && text.TryGetValue<string>(out var reference) && reference.Length <= 1000)
                    {
                        workbook.Names[name] = reference.TrimStart('=');
                    }
                }
            }

            if (root["styles"] is JsonObject styles)
            {
                foreach (var (name, value) in styles)
                {
                    if (name.Length is > 0 and <= 64 && SpreadsheetStyle.FromJson(value) is { } style)
                    {
                        workbook.Styles[name] = style;
                    }
                }
            }

            workbook.Meta = root["meta"] is JsonObject meta ? (JsonObject)meta.DeepClone() : [];
            workbook.ActiveSheet = root["activeSheet"] is JsonValue a && a.TryGetValue<string>(out var active) ? active : null;

            return workbook;
        }

        /// <summary>
        /// Reads a workbook from JSON text without throwing.
        /// </summary>
        /// <param name="json">The JSON text.</param>
        /// <param name="workbook">Receives the workbook.</param>
        /// <returns>True if the text was a workbook.</returns>
        public static bool TryParse(string json, out SpreadsheetWorkbook workbook)
        {
            try
            {
                workbook = Parse(json);
                return true;
            }
            catch (JsonException)
            {
                workbook = null;
                return false;
            }
        }
    }
}
