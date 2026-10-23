using System;
using System.Linq;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace WebExpress.WebUI.WebSpreadsheet
{
    /// <summary>
    /// The formatting of a cell, a row, a column or a format template.
    /// </summary>
    /// <remarks>
    /// The client turns styles into inline css, so reading a style accepts only values that match
    /// a strict pattern - the same rules as SpreadsheetModel.sanitizeStyle on the client. A value
    /// that does not match is dropped, never passed through.
    /// </remarks>
    public sealed partial class SpreadsheetStyle
    {
        private static readonly string[] _borderStyles = ["thin", "medium", "thick", "dashed", "dotted", "double"];

        [GeneratedRegex("^(#[0-9a-fA-F]{3,8}|rgba?\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*(,\\s*(0|1|0?\\.\\d+)\\s*)?\\)|[a-zA-Z]{3,20})$", RegexOptions.CultureInvariant)]
        private static partial Regex ColorPattern();

        [GeneratedRegex("^[A-Za-z0-9 ,'\"_-]{1,100}$", RegexOptions.CultureInvariant)]
        private static partial Regex FontPattern();

        /// <summary>
        /// Gets or sets the font family.
        /// </summary>
        public string Font { get; set; }

        /// <summary>
        /// Gets or sets the font size in points.
        /// </summary>
        public double? Size { get; set; }

        /// <summary>
        /// Gets or sets whether the text is bold.
        /// </summary>
        public bool Bold { get; set; }

        /// <summary>
        /// Gets or sets whether the text is italic.
        /// </summary>
        public bool Italic { get; set; }

        /// <summary>
        /// Gets or sets whether the text is underlined.
        /// </summary>
        public bool Underline { get; set; }

        /// <summary>
        /// Gets or sets whether the text is struck through.
        /// </summary>
        public bool Strike { get; set; }

        /// <summary>
        /// Gets or sets whether long text wraps inside the cell.
        /// </summary>
        public bool Wrap { get; set; }

        /// <summary>
        /// Gets or sets the text color.
        /// </summary>
        public string Color { get; set; }

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        public string Fill { get; set; }

        /// <summary>
        /// Gets or sets the horizontal alignment: left, center, right or justify.
        /// </summary>
        public string Align { get; set; }

        /// <summary>
        /// Gets or sets the vertical alignment: top, middle or bottom.
        /// </summary>
        public string VerticalAlign { get; set; }

        /// <summary>
        /// Gets or sets the number format code, such as "#,##0.00" or "dd.mm.yyyy".
        /// </summary>
        public string NumberFormat { get; set; }

        /// <summary>
        /// Gets or sets the indentation level (0 to 15).
        /// </summary>
        public int? Indent { get; set; }

        /// <summary>
        /// Gets or sets the top border, such as "thin" or "thick #ff0000".
        /// </summary>
        public string BorderTop { get; set; }

        /// <summary>
        /// Gets or sets the right border.
        /// </summary>
        public string BorderRight { get; set; }

        /// <summary>
        /// Gets or sets the bottom border.
        /// </summary>
        public string BorderBottom { get; set; }

        /// <summary>
        /// Gets or sets the left border.
        /// </summary>
        public string BorderLeft { get; set; }

        /// <summary>
        /// Determines whether a text is a color a style may carry.
        /// </summary>
        /// <param name="value">The candidate.</param>
        /// <returns>True for hex, rgb(a) or a plain color name.</returns>
        public static bool IsColor(string value) => value is not null && ColorPattern().IsMatch(value);

        /// <summary>
        /// Determines whether a text is a border edge, such as "thin #000000".
        /// </summary>
        /// <param name="value">The candidate.</param>
        /// <returns>True if valid.</returns>
        public static bool IsBorder(string value)
        {
            var parts = value?.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries) ?? [];

            return parts.Length is 1 or 2 && _borderStyles.Contains(parts[0]) && (parts.Length == 1 || IsColor(parts[1]));
        }

        /// <summary>
        /// Writes the style as the JSON object the client reads; invalid values are left out.
        /// </summary>
        /// <returns>The object, or null when nothing remains.</returns>
        public JsonObject ToJson()
        {
            var json = new JsonObject();

            if (Font is not null && FontPattern().IsMatch(Font)) json["font"] = Font;
            if (Size is >= 4 and <= 200) json["size"] = Math.Round(Size.Value * 2) / 2;
            if (Bold) json["bold"] = true;
            if (Italic) json["italic"] = true;
            if (Underline) json["underline"] = true;
            if (Strike) json["strike"] = true;
            if (Wrap) json["wrap"] = true;
            if (IsColor(Color)) json["color"] = Color;
            if (IsColor(Fill)) json["fill"] = Fill;
            if (Align is "left" or "center" or "right" or "justify") json["align"] = Align;
            if (VerticalAlign is "top" or "middle" or "bottom") json["valign"] = VerticalAlign;
            if (!string.IsNullOrEmpty(NumberFormat) && NumberFormat.Length <= 200) json["nf"] = NumberFormat;
            if (Indent is > 0 and <= 15) json["indent"] = Indent.Value;

            var border = new JsonObject();

            foreach (var (side, edge) in new[] { ("top", BorderTop), ("right", BorderRight), ("bottom", BorderBottom), ("left", BorderLeft) })
            {
                if (IsBorder(edge))
                {
                    border[side] = edge.Trim();
                }
            }

            if (border.Count > 0)
            {
                json["border"] = border;
            }

            return json.Count > 0 ? json : null;
        }

        /// <summary>
        /// Reads a style from its JSON form; unknown and invalid values are dropped.
        /// </summary>
        /// <param name="node">The JSON object.</param>
        /// <returns>The style, or null if nothing valid remains.</returns>
        public static SpreadsheetStyle FromJson(JsonNode node)
        {
            if (node is not JsonObject json)
            {
                return null;
            }

            static string Text(JsonObject o, string key) => SpreadsheetCell.FromNode(o[key]) as string;
            static bool Flag(JsonObject o, string key) => SpreadsheetCell.FromNode(o[key]) is true;
            static double? Number(JsonObject o, string key) => SpreadsheetCell.FromNode(o[key]) is double d ? d : null;

            var border = json["border"] as JsonObject;
            var style = new SpreadsheetStyle
            {
                Font = Text(json, "font"),
                Size = Number(json, "size"),
                Bold = Flag(json, "bold"),
                Italic = Flag(json, "italic"),
                Underline = Flag(json, "underline"),
                Strike = Flag(json, "strike"),
                Wrap = Flag(json, "wrap"),
                Color = Text(json, "color"),
                Fill = Text(json, "fill"),
                Align = Text(json, "align"),
                VerticalAlign = Text(json, "valign"),
                NumberFormat = Text(json, "nf"),
                Indent = Number(json, "indent") is { } indent ? (int)indent : null,
                BorderTop = border is null ? null : Text(border, "top"),
                BorderRight = border is null ? null : Text(border, "right"),
                BorderBottom = border is null ? null : Text(border, "bottom"),
                BorderLeft = border is null ? null : Text(border, "left")
            };

            // reading through the writer drops whatever did not validate
            return style.ToJson() is { } clean ? FromValidJson(clean) : null;
        }

        /// <summary>
        /// Reads a style already known to be valid.
        /// </summary>
        /// <param name="json">The validated JSON object.</param>
        /// <returns>The style.</returns>
        private static SpreadsheetStyle FromValidJson(JsonObject json)
        {
            var border = json["border"] as JsonObject;

            return new SpreadsheetStyle
            {
                Font = (string)json["font"],
                Size = json["size"] is { } size ? (double)size : null,
                Bold = json["bold"] is not null,
                Italic = json["italic"] is not null,
                Underline = json["underline"] is not null,
                Strike = json["strike"] is not null,
                Wrap = json["wrap"] is not null,
                Color = (string)json["color"],
                Fill = (string)json["fill"],
                Align = (string)json["align"],
                VerticalAlign = (string)json["valign"],
                NumberFormat = (string)json["nf"],
                Indent = json["indent"] is { } indent ? (int)indent : null,
                BorderTop = (string)border?["top"],
                BorderRight = (string)border?["right"],
                BorderBottom = (string)border?["bottom"],
                BorderLeft = (string)border?["left"]
            };
        }

        /// <summary>
        /// Returns a readable description for logs.
        /// </summary>
        /// <returns>The style as JSON.</returns>
        public override string ToString() => ToJson()?.ToJsonString() ?? "{}";
    }
}
