using System.Collections.Generic;
using System.Linq;
using System.Text;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebHtml.Parser;
using WebExpress.WebUI.WebMarkdown;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Reads the value the WYSIWYG editor stores and hands back the document inside it.
    /// <para>
    /// The editor does not store a document, it stores its working surface: an add-on sits in
    /// a frame that names it, offers its settings and can be dragged; instruction texts
    /// address whoever edits the document; and blocks that must not be typed into are fenced
    /// by empty paragraphs the caret needs. On a page that scaffolding is removed on the
    /// client by <c>ContentFormat</c>, which is what <see cref="ControlContent"/> ships. Away
    /// from a browser - converting a stored value to Markdown, indexing it, mailing it - there
    /// is no client, and this class applies the same rules on the server.
    /// </para>
    /// <para>
    /// The two implementations are held together by a shared fixture rather than by shared
    /// code, because they work on different trees and produce different output: see
    /// <c>Data/editor-content.fixture.json</c>, which both the C# and the JavaScript tests
    /// read. A rule added on one side and forgotten on the other fails there.
    /// </para>
    /// </summary>
    public static class EditorContent
    {
        /// <summary>
        /// The classes of elements that exist only so the document can be edited, and that
        /// therefore carry nothing a reader should see.
        /// </summary>
        private static readonly string[] Chrome =
        [
            "wx-editor-instruction",
            "wx-editor-placeholder",
            "wx-drop-marker",
            "wx-col-resizer",
            "wx-addon-drag-handle",
            "wx-addon-settings-btn",
            "wx-editor-toolbar",
            "wx-editor-status"
        ];

        /// <summary>
        /// Converts a stored editor value into Markdown.
        /// </summary>
        /// <param name="html">The value as the editor stores it.</param>
        /// <returns>The Markdown representation, or an empty string for no input.</returns>
        public static string ConvertToMarkdown(string html)
        {
            return ReadDocument(html).ConvertToMarkdown();
        }

        /// <summary>
        /// Reads a stored editor value and returns the nodes of the document, with the
        /// editing scaffolding removed.
        /// <para>
        /// The nodes are returned rather than markup on purpose: serializing them back is
        /// lossy, because <see cref="HtmlElementTableTable"/> renders from its own
        /// <c>Rows</c> collection and not from the children a parser gives it, so a parsed
        /// table would come back empty. Callers that want markup should render the nodes
        /// themselves, or go through <see cref="ConvertToMarkdown"/>.
        /// </para>
        /// </summary>
        /// <param name="html">The value as the editor stores it.</param>
        /// <returns>The document nodes.</returns>
        public static IReadOnlyList<IHtmlNode> ReadDocument(string html)
        {
            if (string.IsNullOrEmpty(html))
            {
                return [];
            }

            var unwrapped = new HashSet<IHtmlNode>();
            var nodes = Strip(new HtmlParser().Parse(html), unwrapped);

            return DropTypingSpace(nodes, unwrapped);
        }

        /// <summary>
        /// Removes the scaffolding from a sequence of nodes, recursively.
        /// </summary>
        /// <param name="nodes">The nodes to read.</param>
        /// <param name="unwrapped">Collects the nodes that replaced an add-on frame.</param>
        /// <returns>The remaining nodes.</returns>
        private static List<IHtmlNode> Strip(IEnumerable<IHtmlNode> nodes, HashSet<IHtmlNode> unwrapped)
        {
            var result = new List<IHtmlNode>();

            foreach (var node in nodes)
            {
                if (node is not HtmlElement element)
                {
                    result.Add(node);
                    continue;
                }

                if (IsChrome(element))
                {
                    continue;
                }

                if (HasClass(element, "wx-addon-frame"))
                {
                    // the card header names the add-on for the author and opens its settings,
                    // which says nothing about the document; what the add-on renders is in
                    // its body
                    var body = Find(element, "wx-addon-body-container", "wx-addon-body-widget");
                    var content = body is not null
                        ? Strip(body.Elements, unwrapped)
                        : Strip(element.Elements.Where(x => !(x is HtmlElement h && HasClass(h, "card-header"))), unwrapped);

                    foreach (var child in content)
                    {
                        unwrapped.Add(child);
                        result.Add(child);
                    }

                    continue;
                }

                if (HasClass(element, "wx-addon-inline-frame"))
                {
                    result.AddRange(Strip(element.Elements, unwrapped));
                    continue;
                }

                var children = Strip(element.Elements, unwrapped);
                element.Clear();
                element.Add(children.ToArray());
                result.Add(element);
            }

            return result;
        }

        /// <summary>
        /// Drops the empty paragraphs the editor keeps around block level non-editables so
        /// the caret can reach past them. An empty paragraph between two paragraphs of text
        /// was typed by the author and stays - the same rule the client applies.
        /// </summary>
        /// <param name="nodes">The stripped nodes.</param>
        /// <param name="unwrapped">The nodes that replaced an add-on frame.</param>
        /// <returns>The document nodes.</returns>
        private static IReadOnlyList<IHtmlNode> DropTypingSpace(List<IHtmlNode> nodes, HashSet<IHtmlNode> unwrapped)
        {
            var keep = new List<IHtmlNode>();

            for (var i = 0; i < nodes.Count; i++)
            {
                if (nodes[i] is HtmlElementTextContentP paragraph && IsEmpty(paragraph))
                {
                    var previous = nodes.Take(i).LastOrDefault(x => x is HtmlElement);
                    var next = nodes.Skip(i + 1).FirstOrDefault(x => x is HtmlElement);

                    if (previous is null || next is null || unwrapped.Contains(previous) || unwrapped.Contains(next))
                    {
                        continue;
                    }
                }

                keep.Add(nodes[i]);
            }

            return keep;
        }

        /// <summary>
        /// Returns whether an element exists only for the sake of editing.
        /// </summary>
        /// <param name="element">The element to test.</param>
        /// <returns>True when the element is scaffolding.</returns>
        private static bool IsChrome(HtmlElement element)
        {
            // an attribute written without a value ("data-wx-caret=\"\"") does not survive
            // parsing - HtmlElement treats an empty value as unset - so only the valueless
            // form of the marker is visible here. Caret markers are transient in the editor
            // and are not part of a stored value; both sides remove them defensively
            return Chrome.Any(x => HasClass(element, x))
                || element.Attributes.Any(x => x.Name == "data-wx-caret");
        }

        /// <summary>
        /// Returns whether an element carries a css class.
        /// </summary>
        /// <param name="element">The element to test.</param>
        /// <param name="name">The class name.</param>
        /// <returns>True when the class is present.</returns>
        private static bool HasClass(HtmlElement element, string name)
        {
            return (element.Class ?? "").Split(' ').Contains(name);
        }

        /// <summary>
        /// Returns the first descendant carrying one of the given css classes.
        /// </summary>
        /// <param name="element">The element to search.</param>
        /// <param name="names">The class names.</param>
        /// <returns>The element, or null.</returns>
        private static HtmlElement Find(HtmlElement element, params string[] names)
        {
            foreach (var child in element.Elements.OfType<HtmlElement>())
            {
                if (names.Any(x => HasClass(child, x)))
                {
                    return child;
                }

                var nested = Find(child, names);
                if (nested is not null)
                {
                    return nested;
                }
            }

            return null;
        }

        /// <summary>
        /// Returns whether a paragraph carries nothing a reader would see.
        /// </summary>
        /// <param name="paragraph">The paragraph to test.</param>
        /// <returns>True when it is empty.</returns>
        private static bool IsEmpty(HtmlElement paragraph)
        {
            var builder = new StringBuilder();
            paragraph.ToString(builder, 0);
            var markup = builder.ToString();

            return !markup.Contains("<img")
                && !markup.Contains("<table")
                && string.IsNullOrWhiteSpace(Text(paragraph));
        }

        /// <summary>
        /// Returns the concatenated text of a node and its descendants.
        /// </summary>
        /// <param name="node">The node.</param>
        /// <returns>The text.</returns>
        private static string Text(IHtmlNode node)
        {
            switch (node)
            {
                case HtmlText text:
                    return text.Value ?? "";
                case HtmlElement element:
                    return string.Concat(element.Elements.Select(Text));
                default:
                    return "";
            }
        }
    }
}
