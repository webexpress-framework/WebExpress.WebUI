using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace WebExpress.WebUI.WebSpreadsheet
{
    /// <summary>
    /// One cell of a sheet: a value or a formula, with its format, template, type, comment and
    /// free metadata.
    /// </summary>
    /// <remarks>
    /// A formula cell carries the result the client computed when the workbook was posted
    /// (<see cref="Result"/>), so a server reads values without a formula engine of its own. The
    /// result is informational: it is never written back, because the client recalculates.
    /// </remarks>
    public sealed class SpreadsheetCell
    {
        /// <summary>
        /// Gets or sets the value: a <see cref="double"/>, a <see cref="string"/>, a
        /// <see cref="bool"/>, null, or for a typed cell any JSON node.
        /// </summary>
        public object Value { get; set; }

        /// <summary>
        /// Gets or sets the formula, starting with "=". A formula replaces the value.
        /// </summary>
        public string Formula { get; set; }

        /// <summary>
        /// Gets the result of the formula as computed by the client, or null.
        /// </summary>
        public object Result { get; internal set; }

        /// <summary>
        /// Gets the error code of the result, such as "#DIV/0!", or null.
        /// </summary>
        public string Error { get; internal set; }

        /// <summary>
        /// Gets or sets the custom cell type, such as "checkbox", "link" or "list".
        /// </summary>
        public string Type { get; set; }

        /// <summary>
        /// Gets or sets the own format of the cell.
        /// </summary>
        public SpreadsheetStyle Style { get; set; }

        /// <summary>
        /// Gets or sets the name of the format template applied to the cell.
        /// </summary>
        public string StyleName { get; set; }

        /// <summary>
        /// Gets or sets the comment text.
        /// </summary>
        public string Comment { get; set; }

        /// <summary>
        /// Gets or sets the author of the comment.
        /// </summary>
        public string CommentAuthor { get; set; }

        /// <summary>
        /// Gets or sets free metadata, such as the options of a list cell ({ "options": [...] }).
        /// </summary>
        public JsonObject Meta { get; set; }

        /// <summary>
        /// Gets whether the cell holds neither a value nor a formula.
        /// </summary>
        public bool IsEmpty => string.IsNullOrEmpty(Formula) && (Value is null || Value is string { Length: 0 });

        /// <summary>
        /// Gets the value a reader sees: the result of a formula, or the value.
        /// </summary>
        public object EffectiveValue => Formula is not null ? Result : Value;

        /// <summary>
        /// Writes the cell as the JSON object the client reads.
        /// </summary>
        /// <param name="includeResult">Whether the formula result is written.</param>
        /// <returns>The object, or null for a cell without content.</returns>
        public JsonObject ToJson(bool includeResult = false)
        {
            var json = new JsonObject();

            if (!string.IsNullOrEmpty(Formula) && Formula.StartsWith('=') && Formula.Length > 1)
            {
                json["f"] = Formula;

                if (includeResult && Error is not null)
                {
                    json["r"] = new JsonObject { ["error"] = Error };
                }
                else if (includeResult && Result is not null)
                {
                    json["r"] = ToNode(Result);
                }
            }
            else if (Value is not null && Value is not string { Length: 0 })
            {
                json["v"] = ToNode(Value);
            }

            if (!string.IsNullOrEmpty(Type)) json["t"] = Type;
            if (Style?.ToJson() is { } style) json["s"] = style;
            if (!string.IsNullOrEmpty(StyleName)) json["st"] = StyleName;

            if (!string.IsNullOrWhiteSpace(Comment))
            {
                var comment = new JsonObject { ["text"] = Comment };

                if (!string.IsNullOrEmpty(CommentAuthor))
                {
                    comment["author"] = CommentAuthor;
                }

                json["c"] = comment;
            }

            if (Meta is { Count: > 0 }) json["m"] = Meta.DeepClone();

            return json.Count > 0 ? json : null;
        }

        /// <summary>
        /// Reads a cell from its JSON form; a bare value stands for { "v": value }.
        /// </summary>
        /// <param name="node">The node.</param>
        /// <returns>The cell, or null.</returns>
        public static SpreadsheetCell FromJson(JsonNode node)
        {
            if (node is null)
            {
                return null;
            }

            if (node is not JsonObject json)
            {
                return new SpreadsheetCell { Value = FromNode(node) };
            }

            var cell = new SpreadsheetCell
            {
                Type = json["t"] is JsonValue t && t.TryGetValue<string>(out var type) && type.Length <= 32 ? type : null,
                StyleName = json["st"] is JsonValue st && st.TryGetValue<string>(out var name) && name.Length <= 64 ? name : null,
                Style = SpreadsheetStyle.FromJson(json["s"]),
                Meta = json["m"] is JsonObject meta ? (JsonObject)meta.DeepClone() : null
            };

            if (json["f"] is JsonValue f && f.TryGetValue<string>(out var formula) && formula.StartsWith('=') && formula.Length is > 1 and <= 8192)
            {
                cell.Formula = formula;

                if (json["r"] is JsonObject error && error["error"] is JsonValue code && code.TryGetValue<string>(out var text))
                {
                    cell.Error = text;
                }
                else if (json["r"] is not null)
                {
                    cell.Result = FromNode(json["r"]);
                }
            }
            else if (json["v"] is { } value)
            {
                // only a typed cell may hold structured data, such as a link with text and address
                cell.Value = FromNode(value) ?? (cell.Type is not null ? value.DeepClone() : null);
            }

            switch (json["c"])
            {
                case JsonValue c when c.TryGetValue<string>(out var comment):
                    cell.Comment = comment;
                    break;
                case JsonObject c:
                    cell.Comment = c["text"] is JsonValue ct && ct.TryGetValue<string>(out var commentText) ? commentText : null;
                    cell.CommentAuthor = c["author"] is JsonValue ca && ca.TryGetValue<string>(out var author) ? author : null;
                    break;
            }

            return cell.IsEmpty && cell.Style is null && cell.StyleName is null && cell.Comment is null && cell.Type is null && cell.Meta is null ? null : cell;
        }

        /// <summary>
        /// Converts a value into a JSON node.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <returns>The node.</returns>
        internal static JsonNode ToNode(object value)
        {
            return value switch
            {
                null => null,
                JsonNode node => node.DeepClone(),
                bool b => JsonValue.Create(b),
                string s => JsonValue.Create(s),
                DateTime date => JsonValue.Create(SpreadsheetDate.ToSerial(date)),
                IConvertible convertible => JsonValue.Create(Convert.ToDouble(convertible, System.Globalization.CultureInfo.InvariantCulture)),
                _ => JsonValue.Create(value.ToString())
            };
        }

        /// <summary>
        /// Converts a JSON value into a plain value; objects and arrays yield null.
        /// </summary>
        /// <param name="node">The node.</param>
        /// <returns>The value.</returns>
        internal static object FromNode(JsonNode node)
        {
            if (node is not JsonValue value)
            {
                return null;
            }

            // the kind is asked rather than the CLR type, as a created value holds an int where a
            // parsed one holds a JSON element
            return value.GetValueKind() switch
            {
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Number => double.Parse(value.ToJsonString(), NumberStyles.Float, CultureInfo.InvariantCulture) is var d && double.IsFinite(d) ? d : null,
                JsonValueKind.String => value.GetValue<string>(),
                _ => null
            };
        }
    }
}
