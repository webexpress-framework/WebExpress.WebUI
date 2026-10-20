using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml;
using System.Xml.Linq;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Tells whether an SVG document is a picture and nothing else. An SVG is served to other
    /// users once it is stored, and a browser that opens it as a document runs what it carries,
    /// so an upload is only taken when it contains no code: no script, no event handler, no
    /// script address, no embedded HTML and no nested document that could bring any of these.
    /// </summary>
    internal static class SvgContent
    {
        /// <summary>
        /// The elements that run code or embed a document that may.
        /// </summary>
        private static readonly HashSet<string> ActiveElements = new(StringComparer.OrdinalIgnoreCase)
        {
            "script", "foreignObject", "iframe", "frame", "embed", "object", "applet",
            "handler", "listener", "base", "meta", "link"
        };

        /// <summary>
        /// The address forms and css constructs that run code, or load a document that may.
        /// </summary>
        private static readonly string[] ActivePatterns =
        [
            "javascript:", "vbscript:", "livescript:", "data:text/html", "data:application/",
            "data:image/svg", "data:text/xml", "expression(", "-moz-binding", "behavior:"
        ];

        /// <summary>
        /// Determines whether the data is a well-formed SVG document without any code.
        /// </summary>
        /// <param name="data">The uploaded bytes.</param>
        /// <returns>True for a passive picture; false when it carries code or cannot be read.</returns>
        public static bool IsPassive(byte[] data)
        {
            if (data is not { Length: > 0 })
            {
                return false;
            }

            var settings = new XmlReaderSettings
            {
                // a document type is how entities smuggle text past the checks below and how
                // a parser is made to read files or expand without end
                DtdProcessing = DtdProcessing.Prohibit,
                XmlResolver = null
            };

            XDocument document;

            try
            {
                using var stream = new MemoryStream(data);
                using var reader = XmlReader.Create(stream, settings);
                document = XDocument.Load(reader);
            }
            catch (XmlException)
            {
                return false;
            }

            // an xml-stylesheet instruction loads and applies a document of its own
            if (document.Root?.Name.LocalName != "svg" || document.DescendantNodes().OfType<XProcessingInstruction>().Any())
            {
                return false;
            }

            foreach (var element in document.Root.DescendantsAndSelf())
            {
                if (ActiveElements.Contains(element.Name.LocalName))
                {
                    return false;
                }

                foreach (var attribute in element.Attributes())
                {
                    if (attribute.Name.LocalName.StartsWith("on", StringComparison.OrdinalIgnoreCase) || IsActive(attribute.Value))
                    {
                        return false;
                    }
                }

                // a stylesheet can address code through url() as an attribute can
                if (element.Name.LocalName.Equals("style", StringComparison.OrdinalIgnoreCase) && IsActive(element.Value))
                {
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Determines whether a text addresses code. Browsers ignore blanks and control
        /// characters inside a scheme ("java&#9;script:") and do not care about case, so both
        /// are removed before the comparison.
        /// </summary>
        /// <param name="text">The text of an attribute or a stylesheet.</param>
        /// <returns>True when the text addresses code.</returns>
        private static bool IsActive(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return false;
            }

            var normalized = new string(text.Where(c => !char.IsWhiteSpace(c) && !char.IsControl(c)).ToArray())
                .ToLowerInvariant();

            return ActivePatterns.Any(pattern => normalized.Contains(pattern, StringComparison.Ordinal));
        }
    }
}
