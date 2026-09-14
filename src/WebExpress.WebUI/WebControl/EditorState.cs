using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Allows server-side readers and form validation to consume the editor's versioned JSON document.
    /// HTML is generated only as an interchange format, after schema and URL validation.
    /// </summary>
    public static class EditorState
    {
        private static readonly HashSet<string> Tags = new(StringComparer.Ordinal)
        {
            "p", "h1", "h2", "h3", "h4", "h5", "h6", "pre", "blockquote", "ul", "ol", "li",
            "table", "thead", "tbody", "tfoot", "tr", "td", "th", "br", "hr"
        };

        /// <summary>
        /// Distinguishes the persisted JSON representation from an explicit legacy HTML import.
        /// </summary>
        public static bool IsState(string value) => value?.TrimStart().StartsWith('{') == true;

        /// <summary>
        /// Converts a validated document for readers that require HTML, without trusting serialized markup.
        /// </summary>
        public static string ToHtml(string value)
        {
            using var json = Parse(value);
            var builder = new StringBuilder();
            var count = 0;
            foreach (var node in Read(Child(json.RootElement, "doc"), ref count))
            {
                node.ToString(builder, 0);
            }
            return builder.ToString();
        }

        /// <summary>
        /// Counts document text rather than JSON metadata when applying form length constraints.
        /// Atom content contributes one position, matching the editor's selection model.
        /// </summary>
        public static string ValidationText(string value)
        {
            using var json = Parse(value);
            var builder = new StringBuilder();
            AppendText(Child(json.RootElement, "doc"), builder);
            return builder.ToString();
        }

        private static JsonDocument Parse(string value)
        {
            if (value is null || value.Length > 8000000) throw new JsonException("Invalid editor document size.");
            var json = JsonDocument.Parse(value, new JsonDocumentOptions { MaxDepth = 100 });
            var version = Child(json.RootElement, "version");
            if (version.ValueKind != JsonValueKind.Number || !version.TryGetInt32(out var number) || number != 1 || Text(Child(json.RootElement, "doc"), "type") != "doc")
            {
                json.Dispose();
                throw new JsonException("Invalid editor state or unsupported version.");
            }
            return json;
        }

        private static JsonElement Child(JsonElement node, string name) => node.ValueKind == JsonValueKind.Object && node.TryGetProperty(name, out var value) ? value : default;
        private static string Text(JsonElement node, string name) => Child(node, name) is var value && value.ValueKind == JsonValueKind.String ? value.GetString() : "";
        private static bool Flag(JsonElement node, string name) => Child(node, name).ValueKind == JsonValueKind.True;
        private static IEnumerable<JsonElement> Children(JsonElement node) => Child(node, "children") is var value && value.ValueKind == JsonValueKind.Array ? value.EnumerateArray() : [];

        private static List<IHtmlNode> Read(JsonElement node, ref int count)
        {
            if (++count > 50000) throw new JsonException("Editor document exceeds its structural limit.");
            var type = Text(node, "type");
            var attrs = Child(node, "attrs");
            if (type == "text")
            {
                IHtmlNode text = new HtmlText(WebUtility.HtmlEncode(Text(node, "text")));
                var marks = Child(node, "marks");
                foreach (var (mark, tag) in new[] { ("code", "code"), ("superscript", "sup"), ("subscript", "sub"), ("strikethrough", "s"), ("underline", "u"), ("italic", "em"), ("bold", "strong") })
                {
                    if (Flag(marks, mark)) text = Element(tag, [text]);
                }
                var styles = new List<string>();
                foreach (var (mark, style) in new[] { ("color", "color"), ("background", "background-color") })
                {
                    var color = Color(Text(marks, mark));
                    if (color.Length > 0) styles.Add(style + ":" + color);
                }
                if (styles.Count > 0)
                {
                    var span = Element("span", [text]); span.Style = string.Join(";", styles); text = span;
                }
                var link = Child(marks, "link");
                var href = Url(Text(link, "href"));
                if (href.Length > 0)
                {
                    var anchor = Element("a", [text]); anchor.AddUserAttribute("href", href); text = anchor;
                }
                return [text];
            }
            if (type == "atom") return Text(attrs, "kind") == "instruction" ? [] : [new HtmlText(WebUtility.HtmlEncode(Text(attrs, "text")))];
            if (type == "image")
            {
                var source = Url(Text(attrs, "src"), true);
                if (source.Length == 0) return [];
                var image = new HtmlElement("img", false);
                image.AddUserAttribute("src", source).AddUserAttribute("alt", Text(attrs, "alt"));
                var href = Url(Text(Child(attrs, "link"), "href"));
                if (href.Length == 0) return [image];
                var link = Element("a", [image]); link.AddUserAttribute("href", href); return [link];
            }
            if (type != "doc" && type != "row" && type != "region" && type != "addon" && !Tags.Contains(type)) return [];
            var children = new List<IHtmlNode>();
            foreach (var child in Children(node)) children.AddRange(Read(child, ref count));
            if (type is "doc" or "row" or "region") return children;
            if (type == "addon")
            {
                if (Flag(attrs, "container")) return children;
                var label = Text(Child(attrs, "data"), "text");
                return label.Length > 0 ? [new HtmlText(WebUtility.HtmlEncode(label))] : [];
            }
            var element = Element(type, children);
            var align = Text(attrs, "align");
            if (new[] { "left", "right", "center", "justify", "start", "end" }.Contains(align)) element.Style = "text-align:" + align;
            foreach (var name in new[] { "colspan", "rowspan", "start" })
            {
                var attribute = Child(attrs, name);
                if (attribute.ValueKind == JsonValueKind.Number && attribute.TryGetInt32(out var size) && size > 0 && size <= 100000) element.AddUserAttribute(name, size.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }
            return [element];
        }

        private static HtmlElement Element(string tag, IEnumerable<IHtmlNode> children)
        {
            var element = new HtmlElement(tag, tag != "br" && tag != "hr") { Inline = true };
            element.Add(children.ToArray());
            return element;
        }

        private static string Url(string value, bool image = false)
        {
            if (string.IsNullOrWhiteSpace(value) || value.Any(c => char.IsControl(c) || char.IsWhiteSpace(c) || c == '\\') || value.StartsWith("//", StringComparison.Ordinal)) return "";
            if (Uri.TryCreate(value, UriKind.Absolute, out var uri)) return uri.Scheme is "http" or "https" || !image && uri.Scheme is "mailto" or "tel" ? value : "";
            return Regex.IsMatch(value, @"^[^/?#]*:") ? "" : value;
        }

        private static string Color(string value) => Regex.IsMatch(value, @"^(?:#[\da-f]{3,8}|[a-z]{1,24}|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+-]+\))$", RegexOptions.IgnoreCase) ? value : "";

        private static void AppendText(JsonElement node, StringBuilder builder)
        {
            var type = Text(node, "type");
            if (type == "text") builder.Append(Text(node, "text"));
            else if (type is "image" or "atom" or "hr" || type == "addon" && !Flag(Child(node, "attrs"), "container")) builder.Append('\uFFFC');
            else foreach (var child in Children(node)) AppendText(child, builder);
        }
    }
}
