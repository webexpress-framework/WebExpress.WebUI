using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebEditor
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
        /// <param name="value">The candidate serialized document.</param>
        /// <returns>True only for a supported editor document.</returns>
        public static bool IsState(string value)
        {
            try
            {
                using var document = Parse(value);
                return true;
            }
            catch (JsonException)
            {
                return false;
            }
        }

        /// <summary>
        /// Extracts readable text with block boundaries preserved as spaces.
        /// </summary>
        /// <param name="value">The serialized editor document.</param>
        /// <returns>Plain text, or an empty string for an empty document.</returns>
        /// <exception cref="JsonException">The value is not a supported document.</exception>
        public static string ToPlainText(string value)
        {
            using var json = Parse(value);
            var builder = new StringBuilder();
            AppendPlainText(Child(json.RootElement, "doc"), builder);
            return Regex.Replace(builder.ToString(), @"\s+", " ").Trim();
        }

        /// <summary>
        /// Distinguishes an empty valid document from invalid serialized input.
        /// </summary>
        /// <param name="value">The serialized editor document.</param>
        /// <returns>True when no text or atomic content exists.</returns>
        /// <exception cref="JsonException">The value is not a supported document.</exception>
        public static bool IsEmpty(string value) => string.IsNullOrWhiteSpace(ValidationText(value));

        /// <summary>
        /// Converts a validated document for readers that require HTML, without trusting serialized markup.
        /// </summary>
        /// <param name="value">The serialized editor document.</param>
        /// <returns>Sanitized reading markup.</returns>
        /// <exception cref="JsonException">The value is not a supported document.</exception>
        public static string ToHtml(string value)
        {
            using var json = Parse(value);
            var builder = new StringBuilder();
            var count = 0;
            var headings = PrepareContents(Child(json.RootElement, "doc"));
            foreach (var node in Read(Child(json.RootElement, "doc"), ref count, headings))
            {
                node.ToString(builder, 0);
            }
            return builder.ToString();
        }

        /// <summary>
        /// Counts document text rather than JSON metadata when applying form length constraints.
        /// Atom content contributes one position, matching the editor's selection model.
        /// </summary>
        /// <param name="value">The serialized editor document.</param>
        /// <returns>Text and atomic content positions used by form validation.</returns>
        public static string ValidationText(string value)
        {
            using var json = Parse(value);
            var builder = new StringBuilder();
            AppendText(Child(json.RootElement, "doc"), builder);
            return builder.ToString();
        }

        /// <summary>
        /// Validates the complete format before a reader consumes any content.
        /// </summary>
        /// <param name="value">The serialized document.</param>
        /// <returns>The validated JSON document owned by the caller.</returns>
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
            if (Child(json.RootElement, "sheets").ValueKind != JsonValueKind.Undefined)
            {
                json.Dispose();
                throw new JsonException("An editor state cannot also contain a workbook.");
            }
            try
            {
                var count = 0;
                ValidateNode(Child(json.RootElement, "doc"), ref count);
            }
            catch
            {
                json.Dispose();
                throw;
            }
            return json;
        }

        /// <summary>
        /// Rejects malformed node shapes before rendering or extracting text.
        /// </summary>
        /// <param name="node">The node to inspect.</param>
        /// <param name="count">The shared structural budget.</param>
        private static void ValidateNode(JsonElement node, ref int count)
        {
            var type = Text(node, "type");
            if (++count > 50000 || type.Length == 0 ||
                !(Tags.Contains(type) || type is "doc" or "text" or "image" or "atom" or "row" or "region" or "addon"))
            {
                throw new JsonException("Invalid editor node type or structural limit exceeded.");
            }
            if (type == "text" && Child(node, "text").ValueKind != JsonValueKind.String)
            {
                throw new JsonException("An editor text node requires text.");
            }
            var children = Child(node, "children");
            if (children.ValueKind != JsonValueKind.Undefined && children.ValueKind != JsonValueKind.Array)
            {
                throw new JsonException("Editor children must be an array.");
            }
            foreach (var child in Children(node)) ValidateNode(child, ref count);
        }

        /// <summary>
        /// Enumerates document headings without exposing serialized metadata.
        /// </summary>
        /// <param name="node">The validated subtree.</param>
        /// <returns>The headings in document order.</returns>
        private static IEnumerable<JsonElement> Headings(JsonElement node)
        {
            if (new[] { "h1", "h2", "h3", "h4", "h5", "h6" }.Contains(Text(node, "type"))) yield return node;
            foreach (var child in Children(node))
            {
                foreach (var heading in Headings(child)) yield return heading;
            }
        }

        /// <summary>
        /// Bounds generated contents before allocating repeated entries or their HTML output.
        /// </summary>
        /// <param name="document">The validated document whose contents widgets will be rendered.</param>
        /// <returns>Encoded heading captions shared by every contents widget.</returns>
        private static IReadOnlyList<string> PrepareContents(JsonElement document)
        {
            var copies = CountContents(document);
            var headings = new List<string>();
            if (copies == 0) return headings;
            if (copies * 2L > 50000) throw new JsonException("Editor contents exceed the generated output limit.");
            long textLength = 0;
            foreach (var heading in Headings(document))
            {
                var text = new StringBuilder();
                AppendPlainText(heading, text);
                var caption = WebUtility.HtmlEncode(text.ToString().Trim());
                headings.Add(caption);
                textLength += caption.Length + 9L;
                // repeated entries must not bypass the input document's resource limits
                if (copies * (headings.Count * 2L + 2) > 50000 || copies * textLength > 8000000)
                {
                    throw new JsonException("Editor contents exceed the generated output limit.");
                }
            }
            return headings;
        }

        /// <summary>
        /// Counts contents widgets once so repeated widgets cannot trigger repeated document scans.
        /// </summary>
        /// <param name="node">The validated subtree to inspect.</param>
        /// <returns>The number of contents widgets in this subtree.</returns>
        private static int CountContents(JsonElement node)
        {
            var count = Text(node, "type") == "addon" && Text(Child(node, "attrs"), "name") == "toc" ? 1 : 0;
            foreach (var child in Children(node)) count += CountContents(child);
            return count;
        }

        /// <summary>
        /// Allows optional metadata without treating scalar values as objects.
        /// </summary>
        /// <param name="node">The candidate object.</param>
        /// <param name="name">The property name.</param>
        /// <returns>The property or an undefined element.</returns>
        private static JsonElement Child(JsonElement node, string name) => node.ValueKind == JsonValueKind.Object && node.TryGetProperty(name, out var value) ? value : default;
        /// <summary>
        /// Reads text without accepting incompatible metadata types.
        /// </summary>
        /// <param name="node">The metadata object.</param>
        /// <param name="name">The property name.</param>
        /// <returns>The text or an empty string.</returns>
        private static string Text(JsonElement node, string name) => Child(node, name) is var value && value.ValueKind == JsonValueKind.String ? value.GetString() : "";
        /// <summary>
        /// Requires an explicit JSON boolean for optional flags.
        /// </summary>
        /// <param name="node">The metadata object.</param>
        /// <param name="name">The property name.</param>
        /// <returns>True only for the JSON true value.</returns>
        private static bool Flag(JsonElement node, string name) => Child(node, name).ValueKind == JsonValueKind.True;
        /// <summary>
        /// Allows leaf nodes to omit their children collection.
        /// </summary>
        /// <param name="node">The validated node.</param>
        /// <returns>The child sequence, empty for a leaf.</returns>
        private static IEnumerable<JsonElement> Children(JsonElement node) => Child(node, "children") is var value && value.ValueKind == JsonValueKind.Array ? value.EnumerateArray() : [];

        /// <summary>
        /// Restricts imported document nodes to supported markup before server-side rendering.
        /// </summary>
        /// <param name="node">The serialized node to validate and render.</param>
        /// <param name="count">The shared node count enforcing the document size limit.</param>
        /// <param name="headings">The bounded, encoded captions shared by the contents widgets.</param>
        /// <returns>The supported HTML nodes for this document node.</returns>
        private static List<IHtmlNode> Read(JsonElement node, ref int count, IReadOnlyList<string> headings)
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
                return [AddComment(text, marks)];
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
            foreach (var child in Children(node)) children.AddRange(Read(child, ref count, headings));
            if (type is "doc" or "row" or "region") return children;
            if (type == "addon")
            {
                var name = Text(attrs, "name");
                var data = Child(attrs, "data");
                var tone = Text(data, "tone");
                if (!new[] { "info", "success", "warning", "danger", "secondary", "primary" }.Contains(tone)) tone = "info";
                if (name == "callout")
                {
                    var box = Element("aside", children);
                    box.Class = "wx-editor-callout";
                    box.AddUserAttribute("data-tone", tone).AddUserAttribute("data-title", Text(data, "title"));
                    return [box];
                }
                if (name == "status")
                {
                    var status = Element("span", [new HtmlText(WebUtility.HtmlEncode(Text(data, "text")))]);
                    status.Class = "badge bg-" + tone;
                    return [status];
                }
                if (name == "toc")
                {
                    var entries = headings.Select(caption => (IHtmlNode)Element("li", [new HtmlText(caption)]));
                    var navigation = Element("nav", [Element("ol", entries)]);
                    navigation.Class = "wx-document-toc";
                    return [navigation];
                }
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

        /// <summary>
        /// Preserves annotation metadata during HTML interchange without treating comment text as markup.
        /// </summary>
        /// <param name="content">The formatted text referenced by the annotation.</param>
        /// <param name="marks">The serialized marks that may contain a comment.</param>
        /// <returns>The annotated text, or the original text when no valid comment exists.</returns>
        private static IHtmlNode AddComment(IHtmlNode content, JsonElement marks)
        {
            var comment = Child(marks, "comment");
            var id = Text(comment, "id");
            var text = Text(comment, "text").Trim();
            if (!Regex.IsMatch(id, @"^[a-zA-Z0-9_-]{1,100}$") || text.Length == 0)
            {
                return content;
            }

            var span = Element("span", [content]);
            span.Class = "wx-editor-comment";
            text = text.Length > 10000 ? text[..10000] : text;
            span.AddUserAttribute("data-comment-id", id);
            span.AddUserAttribute("data-comment-text", text);
            span.AddUserAttribute("title", text);

            return span;
        }

        /// <summary>
        /// Builds structured markup without concatenating untrusted content.
        /// </summary>
        /// <param name="tag">The supported tag name.</param>
        /// <param name="children">The sanitized child nodes.</param>
        /// <returns>The HTML element.</returns>
        private static HtmlElement Element(string tag, IEnumerable<IHtmlNode> children)
        {
            var element = new HtmlElement(tag, tag != "br" && tag != "hr") { Inline = true };
            element.Add(children.ToArray());
            return element;
        }

        /// <summary>
        /// Restricts navigation and image sources to safe URL schemes.
        /// </summary>
        /// <param name="value">The submitted URL.</param>
        /// <param name="image">Whether the URL is an image source.</param>
        /// <returns>The allowed URL or an empty string.</returns>
        private static string Url(string value, bool image = false)
        {
            if (string.IsNullOrWhiteSpace(value) || value.Any(c => char.IsControl(c) || char.IsWhiteSpace(c) || c == '\\') || value.StartsWith("//", StringComparison.Ordinal)) return "";
            if (Uri.TryCreate(value, UriKind.Absolute, out var uri)) return uri.Scheme is "http" or "https" || !image && uri.Scheme is "mailto" or "tel" ? value : "";
            return Regex.IsMatch(value, @"^[^/?#]*:") ? "" : value;
        }

        /// <summary>
        /// Restricts inline colors to supported CSS color syntax.
        /// </summary>
        /// <param name="value">The submitted color.</param>
        /// <returns>The color or an empty string.</returns>
        private static string Color(string value) => Regex.IsMatch(value, @"^(?:#[\da-f]{3,8}|[a-z]{1,24}|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+-]+\))$", RegexOptions.IgnoreCase) ? value : "";

        /// <summary>
        /// Preserves inline words and separates structural blocks without parsing HTML.
        /// </summary>
        /// <param name="node">The validated model node.</param>
        /// <param name="builder">The text accumulator.</param>
        private static void AppendPlainText(JsonElement node, StringBuilder builder)
        {
            var type = Text(node, "type");
            var attrs = Child(node, "attrs");
            if (type == "text") builder.Append(Text(node, "text"));
            else if (type == "atom" && Text(attrs, "kind") != "instruction") builder.Append(Text(attrs, "text"));
            else if (type == "addon")
            {
                var data = Child(attrs, "data");
                builder.Append(Text(data, "title"));
                if (Text(data, "title").Length > 0) builder.Append(' ');
                builder.Append(Text(data, "text"));
            }
            foreach (var child in Children(node)) AppendPlainText(child, builder);
            if (Tags.Contains(type) || type is "row" or "region" || type == "addon" && !Flag(attrs, "inline")) builder.Append(' ');
        }

        /// <summary>
        /// Counts atomic content consistently with editor selection positions.
        /// </summary>
        /// <param name="node">The validated node.</param>
        /// <param name="builder">The text accumulator.</param>
        private static void AppendText(JsonElement node, StringBuilder builder)
        {
            var type = Text(node, "type");
            if (type == "text") builder.Append(Text(node, "text"));
            else if (type is "image" or "atom" or "hr" || type == "addon" && !Flag(Child(node, "attrs"), "container")) builder.Append('\uFFFC');
            else foreach (var child in Children(node)) AppendText(child, builder);
        }
    }
}
