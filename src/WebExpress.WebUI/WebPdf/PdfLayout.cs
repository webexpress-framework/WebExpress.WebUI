using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using WebExpress.WebUI.WebPdf.Element;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Sets the blocks of a <see cref="PdfDocument"/> on pages and turns them into the drawing
    /// instructions of the page content streams.
    /// <para>
    /// The layout is a single pass from top to bottom with a cursor made of a page index and
    /// a vertical position. Every container that draws something behind its content - a code
    /// block, a callout, a table row - remembers where it started and paints its background
    /// once its end is known, one segment per page it spans. Backgrounds are inserted into a
    /// separate layer at the position the container started at, so an outer box never paints
    /// over the box of something nested in it.
    /// </para>
    /// <para>
    /// A table row is measured before it is placed: the same layout runs in a measuring mode
    /// on an endless page and reports the height. Rows that fit are moved to the next page as
    /// a whole; a row that is taller than a page is laid out cell by cell from the same start,
    /// each cell breaking onto the following pages on its own.
    /// </para>
    /// <para>
    /// Coordinates run from the top of the page downwards while laying out, as they do in a
    /// browser, and are turned into the bottom-up coordinates of PDF only when an instruction
    /// is written.
    /// </para>
    /// </summary>
    internal sealed class PdfLayout
    {
        private const float LineHeight = 1.4f;
        private const float CodeLineHeight = 1.35f;
        private const float RuleWidth = 0.75f;

        private static readonly PdfColor TextColor = new(33, 37, 41);
        private static readonly PdfColor MutedColor = new(108, 117, 125);
        private static readonly PdfColor LinkColor = new(13, 110, 253);
        private static readonly PdfColor BorderColor = new(206, 212, 218);
        private static readonly PdfColor QuoteBarColor = new(173, 181, 189);
        private static readonly PdfColor CodeBackground = new(246, 248, 250);
        private static readonly PdfColor InlineCodeBackground = new(240, 242, 245);
        private static readonly PdfColor HeaderBackground = new(241, 243, 245);
        private static readonly PdfColor StripeBackground = new(248, 249, 250);

        private static readonly string[] Bullets = ["\u2022", "\u2013", "\u00B7"];

        private readonly PdfDocument _document;
        private readonly Resources _resources;
        private readonly bool _measuring;
        private readonly float _pageHeight;
        private readonly float _top;
        private readonly float _bottom;
        private readonly List<Page> _pages = [];
        private readonly List<OutlineEntry> _outline = [];

        private int _page;
        private float _y;
        private Marker _marker;
        private int _listDepth;
        private bool _bold;
        private PdfTextAlign _align = PdfTextAlign.Left;
        private PdfColor _color = TextColor;

        /// <summary>
        /// Returns the pages, in order.
        /// </summary>
        public IReadOnlyList<Page> Pages => _pages;

        /// <summary>
        /// Returns the headings in document order, as entries for the bookmarks.
        /// </summary>
        public IReadOnlyList<OutlineEntry> Outline => _outline;

        /// <summary>
        /// Returns the fonts and images the pages reference.
        /// </summary>
        public Resources UsedResources => _resources;

        /// <summary>
        /// Initializes a new instance of the class for laying out a document.
        /// </summary>
        /// <param name="document">The document.</param>
        public PdfLayout(PdfDocument document)
            : this(document, new Resources(), false)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="document">The document.</param>
        /// <param name="resources">The resources, shared with the layout that measures.</param>
        /// <param name="measuring">Whether the layout only measures, on an endless page.</param>
        private PdfLayout(PdfDocument document, Resources resources, bool measuring)
        {
            _document = document;
            _resources = resources;
            _measuring = measuring;
            _pageHeight = document.PageSize.Height;
            _top = measuring ? 0 : document.Margin.Top;
            _bottom = measuring ? float.MaxValue : document.PageSize.Height - document.Margin.Bottom;
            _pages.Add(new Page());
            _y = _top;
        }

        /// <summary>
        /// Lays out the whole document, including the running header and footer.
        /// </summary>
        public void Run()
        {
            var left = _document.Margin.Left;
            var width = Math.Max(1, _document.PageSize.Width - _document.Margin.Left - _document.Margin.Right);

            LayoutBlocks(_document.Elements, left, width);
            DrawRunningText(_document.Header, true, left, width);
            DrawRunningText(_document.Footer, false, left, width);
        }

        /// <summary>
        /// Returns whether the cursor stands at the top of a page.
        /// </summary>
        private bool AtPageTop => _y <= _top + 0.01f;

        /// <summary>
        /// Returns the size of the body text.
        /// </summary>
        private float FontSize => _document.FontSize;

        /// <summary>
        /// Lays out a sequence of blocks below each other. The space between two blocks is the
        /// larger of what the first wants below and the second wants above, as with collapsing
        /// margins, and is dropped at the top of a page.
        /// </summary>
        /// <param name="blocks">The blocks.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        private void LayoutBlocks(IEnumerable<PdfBlockElement> blocks, float x, float width)
        {
            var sequence = blocks?.ToList() ?? [];

            for (var i = 0; i < sequence.Count; i++)
            {
                var block = sequence[i];

                if (i > 0 && !AtPageTop)
                {
                    // a nested list continues its item, so it sits as close as the next item would
                    _y += _listDepth > 0 && block is PdfBlockElementList
                        ? FontSize * 0.25f
                        : Math.Max(SpaceAfter(sequence[i - 1]), SpaceBefore(block));
                }

                if (block is PdfBlockElementHeading heading)
                {
                    LayoutHeading(heading, x, width, i + 1 < sequence.Count ? sequence[i + 1] : null);
                }
                else
                {
                    LayoutBlock(block, x, width);
                }
            }
        }

        /// <summary>
        /// Lays out a single block.
        /// </summary>
        /// <param name="block">The block.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        private void LayoutBlock(PdfBlockElement block, float x, float width)
        {
            switch (block)
            {
                case PdfBlockElementHeading heading:
                    LayoutHeading(heading, x, width);
                    break;
                case PdfBlockElementParagraph paragraph:
                    var indent = Math.Clamp(paragraph.Indent, 0, width * 0.75f);
                    LayoutParagraph(paragraph.Content, x + indent, width - indent, paragraph.Align ?? _align, 1f, paragraph.Background);
                    break;
                case PdfBlockElementCode code:
                    LayoutCode(code, x, width);
                    break;
                case PdfBlockElementQuote quote:
                    LayoutQuote(quote, x, width);
                    break;
                case PdfBlockElementCallout callout:
                    LayoutCallout(callout, x, width);
                    break;
                case PdfBlockElementList list:
                    LayoutList(list, x, width);
                    break;
                case PdfBlockElementTable table:
                    LayoutTable(table, x, width);
                    break;
                case PdfBlockElementRule:
                    LayoutRule(x, width);
                    break;
                case PdfBlockElementImage image:
                    LayoutImage(image, x, width);
                    break;
                case PdfBlockElementPageBreak:
                    if (!_measuring && !AtPageTop)
                    {
                        NewPage();
                    }
                    break;
                case PdfBlockElementContainer container:
                    LayoutBlocks(container.Content, x, width);
                    break;
            }
        }

        /// <summary>
        /// Returns the space a block wants below itself.
        /// </summary>
        /// <param name="block">The block.</param>
        /// <returns>The space in points.</returns>
        private float SpaceAfter(PdfBlockElement block)
        {
            return block switch
            {
                PdfBlockElementHeading => FontSize * 0.5f,
                PdfBlockElementPageBreak => 0,
                PdfBlockElementParagraph or PdfBlockElementList or PdfBlockElementImage => FontSize * 0.6f,
                _ => FontSize * 0.8f
            };
        }

        /// <summary>
        /// Returns the space a block wants above itself.
        /// </summary>
        /// <param name="block">The block.</param>
        /// <returns>The space in points.</returns>
        private float SpaceBefore(PdfBlockElement block)
        {
            return block switch
            {
                PdfBlockElementHeading heading => FontSize * (heading.Level <= 2 ? 1.4f : 1.1f),
                PdfBlockElementRule or PdfBlockElementTable or PdfBlockElementCode => FontSize * 0.8f,
                _ => 0
            };
        }

        /// <summary>
        /// Moves the cursor to the top of the next page, creating it when needed. The page may
        /// already exist when a neighbouring table cell has broken onto it before.
        /// </summary>
        private void NewPage()
        {
            _page++;

            if (_page >= _pages.Count)
            {
                _pages.Add(new Page());
            }

            _y = _top;
        }

        /// <summary>
        /// Starts a new page when the given height does not fit below the cursor. A block at
        /// the top of a page stays there even if it is too tall, since another page would not
        /// give it more room.
        /// </summary>
        /// <param name="height">The height that should fit.</param>
        private void EnsureSpace(float height)
        {
            if (!_measuring && _y + height > _bottom && !AtPageTop)
            {
                NewPage();
            }
        }

        /// <summary>
        /// Lays out a heading and records it for the bookmarks. The heading is moved to the
        /// next page together with the beginning of what follows - two lines of text, or a
        /// whole picture, since a picture cannot be split - so it never ends up alone at the
        /// bottom of a page.
        /// </summary>
        /// <param name="heading">The heading.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        /// <param name="next">The block that follows the heading, or null.</param>
        private void LayoutHeading(PdfBlockElementHeading heading, float x, float width, PdfBlockElement next = null)
        {
            var scale = heading.Level switch
            {
                1 => 2.0f,
                2 => 1.6f,
                3 => 1.35f,
                4 => 1.15f,
                5 => 1.0f,
                _ => 0.9f
            };

            var saved = _bold;
            _bold = true;
            var lines = BreakLines(Flatten(heading.Content, scale), width, FontSize * scale);
            var first = lines.FirstOrDefault()?.Height ?? FontSize * scale * LineHeight;

            var lead = next is PdfBlockElementImage
                ? SpaceAfter(heading) + Measure([next], width, false, _align)
                : FontSize * LineHeight * 2;

            // capped so heading and lead always fit on a fresh page together
            EnsureSpace(first + Math.Min(lead, _bottom - _top - first));

            var title = heading.PlainText?.Trim();

            if (!_measuring && _document.Outline && !string.IsNullOrEmpty(title))
            {
                _outline.Add(new OutlineEntry(title, heading.Level, _page, _pageHeight - _y));
            }

            DrawLines(lines, x, width, heading.Align ?? _align);
            _bold = saved;

            if (heading.Level <= 2)
            {
                _y += FontSize * 0.2f;
                StrokeLine(x, _y, x + width, _y, heading.Level == 1 ? 1f : 0.5f, BorderColor);
                _y += 1f;
            }
        }

        /// <summary>
        /// Lays out a paragraph.
        /// </summary>
        /// <param name="content">The inline content.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        /// <param name="align">The alignment.</param>
        /// <param name="scale">The size relative to the body text.</param>
        /// <param name="background">The color behind the paragraph, or null.</param>
        private void LayoutParagraph(IEnumerable<PdfInlineElement> content, float x, float width, PdfTextAlign align, float scale, PdfColor? background)
        {
            var lines = BreakLines(Flatten(content, scale), width, FontSize * scale);

            if (lines.Count == 0)
            {
                return;
            }

            EnsureSpace(lines[0].Height);

            var start = Here();
            DrawLines(lines, x, width, align);

            if (background is PdfColor color)
            {
                PaintBehind(start, (top, bottom) => FillRect(x - 2, top, width + 4, bottom - top, color));
            }
        }

        /// <summary>
        /// Lays out a code block. Lines are wrapped at the last character that fits, since
        /// code has no word boundaries a reader would expect a break at.
        /// </summary>
        /// <param name="code">The code block.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        private void LayoutCode(PdfBlockElementCode code, float x, float width)
        {
            var size = FontSize * 0.9f;
            var lineHeight = size * CodeLineHeight;
            var padding = FontSize * 0.6f;
            var face = PdfFont.Resolve(PdfFontFamily.Courier, false, false);
            var columns = Math.Max(1, (int)((width - 2 * padding) / PdfFont.Measure(face, " ", size)));
            var lines = new List<string>();

            foreach (var line in code.Code.Replace("\r\n", "\n").Replace('\r', '\n').TrimEnd('\n').Split('\n'))
            {
                var encoded = PdfFont.Encode(line.Replace("\t", "    "));

                do
                {
                    lines.Add(encoded.Length > columns ? encoded[..columns] : encoded);
                    encoded = encoded.Length > columns ? encoded[columns..] : string.Empty;
                }
                while (encoded.Length > 0);
            }

            EnsureSpace(padding + lineHeight);

            var start = Here();
            _y += padding;

            foreach (var line in lines)
            {
                EnsureSpace(lineHeight);

                var baseline = _y + (lineHeight - size * (PdfFont.Ascent + PdfFont.Descent)) / 2 + size * PdfFont.Ascent;
                DrawText(x + padding, baseline, face, size, _color, line);
                _y += lineHeight;
            }

            _y += padding;

            PaintBehind(start, (top, bottom) => FillRect(x, top, width, bottom - top, CodeBackground));
        }

        /// <summary>
        /// Lays out a quotation.
        /// </summary>
        /// <param name="quote">The quotation.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        private void LayoutQuote(PdfBlockElementQuote quote, float x, float width)
        {
            var inset = FontSize * 1.2f;

            EnsureSpace(FontSize * LineHeight);

            var start = Here();
            var saved = _color;
            _color = MutedColor;
            LayoutBlocks(quote.Content, x + inset, width - inset);
            _color = saved;

            PaintBehind(start, (top, bottom) => FillRect(x, top, 3, bottom - top, QuoteBarColor));
        }

        /// <summary>
        /// Lays out a callout.
        /// </summary>
        /// <param name="callout">The callout.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        private void LayoutCallout(PdfBlockElementCallout callout, float x, float width)
        {
            var (accent, tint) = callout.CalloutType switch
            {
                PdfCalloutType.Warning => (new PdfColor(255, 193, 7), new PdfColor(255, 248, 225)),
                PdfCalloutType.Danger => (new PdfColor(220, 53, 69), new PdfColor(253, 236, 234)),
                PdfCalloutType.Success => (new PdfColor(25, 135, 84), new PdfColor(232, 245, 238)),
                _ => (new PdfColor(13, 110, 253), new PdfColor(231, 241, 255))
            };
            var padding = FontSize * 0.8f;
            var bar = 4f;

            EnsureSpace(2 * padding + FontSize * LineHeight);

            var start = Here();
            _y += padding;
            LayoutBlocks(callout.Content, x + bar + padding, width - bar - 2 * padding);
            _y += padding;

            PaintBehind(start, (top, bottom) =>
            {
                FillRect(x, top, width, bottom - top, tint);
                FillRect(x, top, bar, bottom - top, accent);
            });
        }

        /// <summary>
        /// Lays out a list. The marker of an item is set on the baseline of the first line the
        /// item draws, wherever that ends up - which is why it is handed to the line drawing
        /// as a pending marker rather than drawn in advance.
        /// </summary>
        /// <param name="list">The list.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        private void LayoutList(PdfBlockElementList list, float x, float width)
        {
            var items = list.Items.ToList();
            var face = PdfFont.Resolve(_document.FontFamily, false, false);
            var markers = items
                .Select((_, i) => PdfFont.Encode(MarkerText(list.Type, list.Start + i, _listDepth)))
                .ToList();
            var gap = FontSize * 0.5f;
            var indent = Math.Max(FontSize * 1.6f, markers.Select(m => PdfFont.Measure(face, m, FontSize)).DefaultIfEmpty(0).Max() + gap);

            _listDepth++;

            for (var i = 0; i < items.Count; i++)
            {
                if (i > 0)
                {
                    _y += FontSize * 0.25f;
                }

                var start = Here();
                _marker = string.IsNullOrEmpty(markers[i])
                    ? null
                    : new Marker(markers[i], face, FontSize, x + indent - gap, _color);

                LayoutBlocks(items[i].Content, x + indent, width - indent);

                if (_marker is not null)
                {
                    // the item drew no line of text - an image, an empty item - so the marker
                    // goes where the item began
                    var baseline = start.Y + (FontSize * LineHeight - FontSize * (PdfFont.Ascent + PdfFont.Descent)) / 2 + FontSize * PdfFont.Ascent;
                    DrawMarker(start.Page, baseline);

                    if (start.Page == _page && _y < start.Y + FontSize * LineHeight)
                    {
                        _y = start.Y + FontSize * LineHeight;
                    }
                }
            }

            _listDepth--;
        }

        /// <summary>
        /// Returns the text of the marker of an item.
        /// </summary>
        /// <param name="type">The list type.</param>
        /// <param name="number">The number of the item.</param>
        /// <param name="depth">The nesting depth.</param>
        /// <returns>The marker, or an empty string.</returns>
        private static string MarkerText(PdfListType type, int number, int depth)
        {
            return type switch
            {
                PdfListType.Bullet => Bullets[depth % Bullets.Length],
                PdfListType.Numeric => number.ToString(CultureInfo.InvariantCulture) + ".",
                PdfListType.LowerAlpha => Alpha(number).ToLowerInvariant() + ".",
                PdfListType.UpperAlpha => Alpha(number) + ".",
                PdfListType.LowerRoman => Roman(number).ToLowerInvariant() + ".",
                PdfListType.UpperRoman => Roman(number) + ".",
                _ => string.Empty
            };
        }

        /// <summary>
        /// Returns a number as letters: A to Z, then AA.
        /// </summary>
        private static string Alpha(int number)
        {
            if (number < 1)
            {
                return number.ToString(CultureInfo.InvariantCulture);
            }

            var builder = new StringBuilder();

            while (number > 0)
            {
                number--;
                builder.Insert(0, (char)('A' + number % 26));
                number /= 26;
            }

            return builder.ToString();
        }

        /// <summary>
        /// Returns a number as roman numerals.
        /// </summary>
        private static string Roman(int number)
        {
            if (number < 1 || number > 3999)
            {
                return number.ToString(CultureInfo.InvariantCulture);
            }

            var values = new[] { 1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1 };
            var symbols = new[] { "M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I" };
            var builder = new StringBuilder();

            for (var i = 0; i < values.Length; i++)
            {
                while (number >= values[i])
                {
                    builder.Append(symbols[i]);
                    number -= values[i];
                }
            }

            return builder.ToString();
        }

        /// <summary>
        /// Lays out a table.
        /// </summary>
        /// <param name="table">The table.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        private void LayoutTable(PdfBlockElementTable table, float x, float width)
        {
            var rows = table.Rows.Where(r => r.Cells.Any()).ToList();
            var columns = rows.Select(r => r.Cells.Sum(c => c.ColSpan)).DefaultIfEmpty(0).Max();

            if (columns == 0)
            {
                return;
            }

            var bordered = table.Bordered;
            var padX = bordered ? FontSize * 0.45f : FontSize * 0.5f;
            var padY = bordered ? FontSize * 0.35f : 0;
            var widths = ColumnWidths(table, rows, columns, width, padX);
            var header = rows.TakeWhile(r => r.Header).ToList();
            var body = 0;

            foreach (var row in rows)
            {
                var height = MeasureRow(row, widths, padX, padY);

                if (!_measuring && !AtPageTop && _y + height > _bottom)
                {
                    NewPage();

                    var headerHeight = header.Sum(h => MeasureRow(h, widths, padX, padY));

                    if (!row.Header && header.Count > 0 && headerHeight + height <= _bottom - _top)
                    {
                        foreach (var repeated in header)
                        {
                            LayoutRow(repeated, x, widths, padX, padY, bordered, false);
                        }
                    }
                }

                LayoutRow(row, x, widths, padX, padY, bordered, table.Striped && !row.Header && body++ % 2 == 1);
            }
        }

        /// <summary>
        /// Returns the widths of the columns of a table.
        /// </summary>
        /// <param name="table">The table.</param>
        /// <param name="rows">The rows that have cells.</param>
        /// <param name="columns">The number of columns.</param>
        /// <param name="width">The available width.</param>
        /// <param name="padX">The horizontal padding of a cell.</param>
        /// <returns>The widths, one per column.</returns>
        private float[] ColumnWidths(PdfBlockElementTable table, List<PdfBlockElementTableRow> rows, int columns, float width, float padX)
        {
            var given = table.ColumnWidths.ToList();
            var weights = Enumerable.Range(0, columns).Select(i => i < given.Count ? Math.Max(0, given[i]) : 0).ToArray();

            if (weights.Any(w => w > 0))
            {
                var fixedSum = weights.Sum();
                var open = weights.Count(w => w <= 0);

                if (open > 0 && fixedSum < width)
                {
                    // next to columns without a width the given widths are lengths, as a
                    // column group in a table of full width: the open columns share the rest
                    var rest = (width - fixedSum) / open;

                    return weights.Select(w => w > 0 ? w : rest).ToArray();
                }

                var average = weights.Where(w => w > 0).Average();
                var total = weights.Sum(w => w > 0 ? w : average);

                return weights.Select(w => width * (w > 0 ? w : average) / total).ToArray();
            }

            var min = Enumerable.Repeat(2 * padX + FontSize, columns).ToArray();
            var max = Enumerable.Repeat(2 * padX + FontSize, columns).ToArray();

            foreach (var row in rows)
            {
                var column = 0;
                var saved = _bold;
                _bold = row.Header;

                foreach (var cell in row.Cells)
                {
                    if (cell.ColSpan == 1 && column < columns)
                    {
                        var (cellMin, cellMax) = MeasureNatural(cell.Content);
                        min[column] = Math.Max(min[column], cellMin + 2 * padX);
                        max[column] = Math.Max(max[column], cellMax + 2 * padX);
                    }

                    column += cell.ColSpan;
                }

                _bold = saved;
            }

            var sumMin = min.Sum();
            var sumMax = max.Sum();

            if (sumMax <= width)
            {
                return max.Select(m => m + (width - sumMax) * m / sumMax).ToArray();
            }

            if (sumMin <= width)
            {
                var flexible = max.Zip(min, (a, b) => a - b).Sum();

                return min.Select((m, i) => m + (width - sumMin) * (flexible > 0 ? (max[i] - m) / flexible : 1f / columns)).ToArray();
            }

            return min.Select(m => width * m / sumMin).ToArray();
        }

        /// <summary>
        /// Returns the height of a row.
        /// </summary>
        /// <param name="row">The row.</param>
        /// <param name="widths">The column widths.</param>
        /// <param name="padX">The horizontal padding of a cell.</param>
        /// <param name="padY">The vertical padding of a cell.</param>
        /// <returns>The height in points.</returns>
        private float MeasureRow(PdfBlockElementTableRow row, float[] widths, float padX, float padY)
        {
            var height = FontSize * LineHeight;
            var column = 0;

            foreach (var cell in row.Cells)
            {
                var cellWidth = SpanWidth(widths, column, cell.ColSpan);
                height = Math.Max(height, Measure(cell.Content, cellWidth - 2 * padX, row.Header, cell.Align ?? _align));
                column += cell.ColSpan;
            }

            return height + 2 * padY;
        }

        /// <summary>
        /// Lays out a row. Every cell starts at the same cursor; the row ends where the
        /// longest cell ends, which may be on a later page.
        /// </summary>
        /// <param name="row">The row.</param>
        /// <param name="x">The left edge of the table.</param>
        /// <param name="widths">The column widths.</param>
        /// <param name="padX">The horizontal padding of a cell.</param>
        /// <param name="padY">The vertical padding of a cell.</param>
        /// <param name="bordered">Whether the cells are framed.</param>
        /// <param name="striped">Whether the row is shaded as an odd body row.</param>
        private void LayoutRow(PdfBlockElementTableRow row, float x, float[] widths, float padX, float padY, bool bordered, bool striped)
        {
            var start = Here();
            var end = start;
            var column = 0;
            var cells = new List<(float X, float Width, PdfBlockElementTableCell Cell)>();
            var savedBold = _bold;
            var savedAlign = _align;
            var savedMarker = _marker;

            foreach (var cell in row.Cells)
            {
                var cellX = x + SpanWidth(widths, 0, column);
                var cellWidth = SpanWidth(widths, column, cell.ColSpan);

                _page = start.Page;
                _y = start.Y + padY;
                _bold = row.Header;
                _align = cell.Align ?? savedAlign;
                // the marker of a list item belongs to the first cell, not to every cell
                _marker = cells.Count == 0 ? savedMarker : null;

                LayoutBlocks(cell.Content, cellX + padX, cellWidth - 2 * padX);

                _y += padY;

                if (_page > end.Page || (_page == end.Page && _y > end.Y))
                {
                    end = Here();
                }

                cells.Add((cellX, cellWidth, cell));
                column += cell.ColSpan;
            }

            _bold = savedBold;
            _align = savedAlign;
            _page = end.Page;
            _y = end.Y;

            if (_page == start.Page)
            {
                _y = Math.Max(_y, start.Y + FontSize * LineHeight + 2 * padY);
            }

            var rowWidth = widths.Sum();
            var fill = row.Background ?? (row.Header && bordered ? HeaderBackground : striped ? StripeBackground : null);

            PaintBehind(start, (top, bottom) =>
            {
                if (fill is PdfColor rowColor)
                {
                    FillRect(x, top, rowWidth, bottom - top, rowColor);
                }

                foreach (var (cellX, cellWidth, cell) in cells)
                {
                    if (cell.Background is PdfColor cellColor)
                    {
                        FillRect(cellX, top, cellWidth, bottom - top, cellColor);
                    }
                }
            });

            if (bordered)
            {
                ForEachSegment(start, (page, top, bottom) =>
                {
                    foreach (var (cellX, cellWidth, _) in cells)
                    {
                        StrokeRect(page, cellX, top, cellWidth, bottom - top, 0.5f, BorderColor);
                    }
                });
            }
        }

        /// <summary>
        /// Returns the width of consecutive columns.
        /// </summary>
        private static float SpanWidth(float[] widths, int first, int count)
        {
            var sum = 0f;

            for (var i = first; i < Math.Min(widths.Length, first + count); i++)
            {
                sum += widths[i];
            }

            return sum;
        }

        /// <summary>
        /// Lays out a horizontal rule.
        /// </summary>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        private void LayoutRule(float x, float width)
        {
            EnsureSpace(FontSize * 0.6f);

            _y += FontSize * 0.3f;
            StrokeLine(x, _y, x + width, _y, RuleWidth, BorderColor);
            _y += FontSize * 0.3f + RuleWidth;
        }

        /// <summary>
        /// Lays out a picture, or its alternative text when the picture cannot be loaded.
        /// </summary>
        /// <param name="element">The picture.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        private void LayoutImage(PdfBlockElementImage element, float x, float width)
        {
            var image = _resources.Load(element, _document);

            if (image is null)
            {
                var text = string.IsNullOrWhiteSpace(element.AltText) ? "Image" : element.AltText.Trim();
                var style = new PdfTextStyle { Italic = true, Color = MutedColor };

                LayoutParagraph([new PdfInlineElementText($"[{text}]", style)], x, width, element.Align ?? _align, 1f, null);

                return;
            }

            var ratio = (float)image.Height / image.Width;
            var w = element.Width ?? (element.Height.HasValue ? element.Height.Value / ratio : image.Width * 0.75f);
            var h = element.Height ?? w * ratio;

            if (w > width)
            {
                h *= width / w;
                w = width;
            }

            if (!_measuring && h > _bottom - _top)
            {
                w *= (_bottom - _top) / h;
                h = _bottom - _top;
            }

            EnsureSpace(h);

            var left = (element.Align ?? _align) switch
            {
                PdfTextAlign.Center => x + (width - w) / 2,
                PdfTextAlign.Right => x + width - w,
                _ => x
            };

            if (!_measuring)
            {
                var name = _resources.Register(image);
                _pages[_page].Foreground.Append($"q {F(w)} 0 0 {F(h)} {F(left)} {F(_pageHeight - _y - h)} cm /{name} Do Q\n");
            }

            DrawMarker(_page, _y + Math.Min(h, FontSize) * PdfFont.Ascent);
            _y += h;
        }

        /// <summary>
        /// Draws the running header or footer on every page.
        /// </summary>
        /// <param name="template">The text with its placeholders, or null.</param>
        /// <param name="isHeader">Whether the text is set in the top margin.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The content width.</param>
        private void DrawRunningText(string template, bool isHeader, float x, float width)
        {
            if (string.IsNullOrWhiteSpace(template) || _measuring)
            {
                return;
            }

            var size = FontSize * 0.8f;
            var face = PdfFont.Resolve(_document.FontFamily, false, false);
            var baseline = isHeader
                ? _document.Margin.Top / 2 + size * PdfFont.Ascent / 2
                : _pageHeight - _document.Margin.Bottom / 2 + size * PdfFont.Ascent / 2;

            for (var i = 0; i < _pages.Count; i++)
            {
                var text = PdfFont.Encode(template
                    .Replace("{page}", (i + 1).ToString(CultureInfo.InvariantCulture))
                    .Replace("{pages}", _pages.Count.ToString(CultureInfo.InvariantCulture)));
                var textWidth = PdfFont.Measure(face, text, size);

                _page = i;
                DrawText(x + (width - textWidth) / 2, baseline, face, size, MutedColor, text);
            }
        }

        /// <summary>
        /// Measures the height of blocks at a width, by laying them out on an endless page.
        /// </summary>
        /// <param name="blocks">The blocks.</param>
        /// <param name="width">The width.</param>
        /// <param name="bold">Whether the text is set bold, as in a header cell.</param>
        /// <param name="align">The inherited alignment.</param>
        /// <returns>The height in points.</returns>
        private float Measure(IEnumerable<PdfBlockElement> blocks, float width, bool bold, PdfTextAlign align)
        {
            var layout = new PdfLayout(_document, _resources, true)
            {
                _bold = bold,
                _align = align,
                _listDepth = _listDepth,
                _color = _color
            };

            layout.LayoutBlocks(blocks, 0, width);

            return layout._y;
        }

        /// <summary>
        /// Returns the narrowest width blocks can be set in without breaking a word, and the
        /// width they take when no line is broken.
        /// </summary>
        /// <param name="blocks">The blocks.</param>
        /// <returns>The minimum and maximum width.</returns>
        private (float Min, float Max) MeasureNatural(IEnumerable<PdfBlockElement> blocks)
        {
            var min = 0f;
            var max = 0f;

            foreach (var block in blocks ?? [])
            {
                var (blockMin, blockMax) = block switch
                {
                    PdfBlockElementParagraph paragraph => MeasureNatural(Flatten(paragraph.Content, 1f), paragraph.Indent),
                    PdfBlockElementHeading heading => MeasureHeadingNatural(heading),
                    PdfBlockElementCode code => MeasureCodeNatural(code),
                    PdfBlockElementList list => Shift(MeasureNatural(list.Items.SelectMany(i => i.Content)), FontSize * 1.6f),
                    PdfBlockElementQuote quote => Shift(MeasureNatural(quote.Content), FontSize * 1.2f),
                    PdfBlockElementCallout callout => Shift(MeasureNatural(callout.Content), FontSize * 1.6f + 4),
                    PdfBlockElementTable table => MeasureTableNatural(table),
                    PdfBlockElementImage image => MeasureImageNatural(image),
                    PdfBlockElementContainer container => MeasureNatural(container.Content),
                    _ => (0f, 0f)
                };

                min = Math.Max(min, blockMin);
                max = Math.Max(max, blockMax);
            }

            return (min, max);
        }

        /// <summary>
        /// Returns the natural widths of inline content: the widest word and the widest line
        /// between forced breaks.
        /// </summary>
        private static (float Min, float Max) MeasureNatural(List<Piece> pieces, float indent)
        {
            float min = 0, max = 0, word = 0, line = 0;

            foreach (var piece in pieces)
            {
                switch (piece.Kind)
                {
                    case PieceKind.Break:
                        max = Math.Max(max, line);
                        line = 0;
                        word = 0;
                        break;
                    case PieceKind.Space:
                        word = 0;
                        line += piece.Width;
                        break;
                    default:
                        word += piece.Width;
                        line += piece.Width;
                        min = Math.Max(min, word);
                        break;
                }
            }

            return (min + indent, Math.Max(max, line) + indent);
        }

        /// <summary>
        /// Returns the natural widths of a heading.
        /// </summary>
        private (float Min, float Max) MeasureHeadingNatural(PdfBlockElementHeading heading)
        {
            var saved = _bold;
            _bold = true;
            var result = MeasureNatural(Flatten(heading.Content, heading.Level switch { 1 => 2.0f, 2 => 1.6f, 3 => 1.35f, 4 => 1.15f, 5 => 1.0f, _ => 0.9f }), 0);
            _bold = saved;

            return result;
        }

        /// <summary>
        /// Returns the natural widths of a code block; it may be wrapped down to twenty
        /// characters.
        /// </summary>
        private (float Min, float Max) MeasureCodeNatural(PdfBlockElementCode code)
        {
            var size = FontSize * 0.9f;
            var character = PdfFont.Measure(PdfFontFace.Courier, " ", size);
            var longest = code.Code.Replace("\t", "    ").Split('\n').Select(l => l.TrimEnd('\r').Length).DefaultIfEmpty(0).Max();
            var padding = FontSize * 1.2f;

            return (Math.Min(longest, 20) * character + padding, longest * character + padding);
        }

        /// <summary>
        /// Returns the natural widths of a nested table: its rows laid side by side.
        /// </summary>
        private (float Min, float Max) MeasureTableNatural(PdfBlockElementTable table)
        {
            float min = 0, max = 0;
            var padding = FontSize * 0.9f;

            foreach (var row in table.Rows)
            {
                var natural = row.Cells.Select(c => MeasureNatural(c.Content)).ToList();
                min = Math.Max(min, natural.Sum(n => n.Min + padding));
                max = Math.Max(max, natural.Sum(n => n.Max + padding));
            }

            return (min, max);
        }

        /// <summary>
        /// Returns the natural widths of a picture; it may be scaled down to a thumbnail.
        /// </summary>
        private (float Min, float Max) MeasureImageNatural(PdfBlockElementImage element)
        {
            var image = _resources.Load(element, _document);
            var width = element.Width ?? (image is null ? FontSize * 6 : image.Width * 0.75f);

            return (Math.Min(width, FontSize * 4), width);
        }

        /// <summary>
        /// Adds an indentation to natural widths.
        /// </summary>
        private static (float Min, float Max) Shift((float Min, float Max) natural, float indent)
        {
            return (natural.Min + indent, natural.Max + indent);
        }

        /// <summary>
        /// Turns inline content into pieces: words, spaces, forced breaks and checkboxes,
        /// each with its face, size and width. Runs of whitespace collapse into one space, as
        /// in a browser; a non-breaking space is kept as part of its word.
        /// </summary>
        /// <param name="content">The inline content.</param>
        /// <param name="scale">The size relative to the body text.</param>
        /// <returns>The pieces.</returns>
        private List<Piece> Flatten(IEnumerable<PdfInlineElement> content, float scale)
        {
            var pieces = new List<Piece>();

            foreach (var element in content ?? [])
            {
                switch (element)
                {
                    case PdfInlineElementText text:
                        FlattenText(text.Text, text.Style, scale, pieces);
                        break;
                    case PdfInlineElementLineBreak:
                        pieces.Add(new Piece { Kind = PieceKind.Break, Style = PdfTextStyle.Default, LineSize = FontSize * scale });
                        break;
                    case PdfInlineElementCheckbox checkbox:
                        var size = FontSize * scale * checkbox.Style.Scale;
                        pieces.Add(new Piece
                        {
                            Kind = PieceKind.Checkbox,
                            Style = checkbox.Style,
                            Checked = checkbox.Checked,
                            Size = size,
                            LineSize = size,
                            Width = size * 0.75f
                        });
                        break;
                }
            }

            return pieces;
        }

        /// <summary>
        /// Splits a run of text into word and space pieces.
        /// </summary>
        private void FlattenText(string text, PdfTextStyle style, float scale, List<Piece> pieces)
        {
            var lineSize = FontSize * scale * style.Scale;
            var size = style.Superscript || style.Subscript ? lineSize * 0.7f : lineSize;
            var face = PdfFont.Resolve(style.FontFamily ?? _document.FontFamily, style.Bold || _bold, style.Italic);
            var word = new StringBuilder();

            void FlushWord()
            {
                var encoded = PdfFont.Encode(word.ToString());
                word.Clear();

                if (encoded.Length > 0)
                {
                    pieces.Add(new Piece
                    {
                        Kind = PieceKind.Text,
                        Text = encoded,
                        Style = style,
                        Face = face,
                        Size = size,
                        LineSize = lineSize,
                        Width = PdfFont.Measure(face, encoded, size)
                    });
                }
            }

            foreach (var c in text)
            {
                if (char.IsWhiteSpace(c) && c != '\u00A0' && c != '\u202F')
                {
                    FlushWord();

                    if (pieces.Count == 0 || pieces[^1].Kind != PieceKind.Space)
                    {
                        pieces.Add(new Piece
                        {
                            Kind = PieceKind.Space,
                            Text = " ",
                            Style = style,
                            Face = face,
                            Size = size,
                            LineSize = lineSize,
                            Width = PdfFont.Measure(face, " ", size)
                        });
                    }
                }
                else
                {
                    word.Append(c);
                }
            }

            FlushWord();
        }

        /// <summary>
        /// Breaks pieces into lines that fit a width. Lines break at spaces; a word that is
        /// wider than the whole line is broken between characters.
        /// </summary>
        /// <param name="pieces">The pieces.</param>
        /// <param name="width">The available width.</param>
        /// <param name="emptySize">The size an empty line is measured with.</param>
        /// <returns>The lines.</returns>
        private static List<Line> BreakLines(List<Piece> pieces, float width, float emptySize)
        {
            var lines = new List<Line>();
            var line = new Line();
            Piece space = null;

            void Finish(bool forced)
            {
                line.Forced = forced;
                line.Close(emptySize);
                lines.Add(line);
                line = new Line();
                space = null;
            }

            var i = 0;

            while (i < pieces.Count)
            {
                var piece = pieces[i];

                if (piece.Kind == PieceKind.Break)
                {
                    if (line.Items.Count > 0)
                    {
                        Finish(true);
                    }
                    else if (i < pieces.Count - 1 || lines.Count == 0)
                    {
                        Finish(true);
                    }

                    i++;
                    continue;
                }

                if (piece.Kind == PieceKind.Space)
                {
                    space = line.Items.Count > 0 ? piece : null;
                    i++;
                    continue;
                }

                var end = i;
                var wordWidth = 0f;

                while (end < pieces.Count && pieces[end].Kind is PieceKind.Text or PieceKind.Checkbox)
                {
                    wordWidth += pieces[end].Width;
                    end++;
                }

                var spaceWidth = space?.Width ?? 0;

                if (line.Items.Count > 0 && line.Width + spaceWidth + wordWidth > width)
                {
                    Finish(false);
                    spaceWidth = 0;
                }

                if (space is not null && line.Items.Count > 0)
                {
                    line.Add(space);
                }

                space = null;

                for (var k = i; k < end; k++)
                {
                    var part = pieces[k];

                    while (part.Kind == PieceKind.Text && line.Width + part.Width > width && part.Text.Length > 1)
                    {
                        var (head, tail) = part.Split(width - line.Width);

                        if (head is null)
                        {
                            if (line.Items.Count == 0)
                            {
                                (head, tail) = part.Split(0, 1);
                            }
                            else
                            {
                                Finish(false);
                                continue;
                            }
                        }

                        line.Add(head);
                        Finish(false);
                        part = tail;
                    }

                    line.Add(part);
                }

                i = end;
            }

            if (line.Items.Count > 0)
            {
                Finish(true);
            }

            return lines;
        }

        /// <summary>
        /// Draws lines below the cursor, starting a new page whenever the next line does not
        /// fit.
        /// </summary>
        /// <param name="lines">The lines.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        /// <param name="align">The alignment.</param>
        private void DrawLines(List<Line> lines, float x, float width, PdfTextAlign align)
        {
            foreach (var line in lines)
            {
                EnsureSpace(line.Height);
                DrawLine(line, x, width, align);
                _y += line.Height;
            }
        }

        /// <summary>
        /// Draws one line at the cursor: highlights, text, decorations, checkboxes, links and
        /// a pending list marker.
        /// </summary>
        /// <param name="line">The line.</param>
        /// <param name="x">The left edge.</param>
        /// <param name="width">The available width.</param>
        /// <param name="align">The alignment.</param>
        private void DrawLine(Line line, float x, float width, PdfTextAlign align)
        {
            var baseline = _y + (line.Height - line.Size * (PdfFont.Ascent + PdfFont.Descent)) / 2 + line.Size * PdfFont.Ascent;

            DrawMarker(_page, baseline);

            if (_measuring || line.Items.Count == 0)
            {
                return;
            }

            var spaces = line.Items.Count(p => p.Kind == PieceKind.Space);
            var justify = align == PdfTextAlign.Justify && !line.Forced && spaces > 0;
            var extra = justify ? (width - line.Width) / spaces : 0;
            var position = align switch
            {
                PdfTextAlign.Center => x + (width - line.Width) / 2,
                PdfTextAlign.Right => x + width - line.Width,
                _ => x
            };
            var placed = new List<(Piece Piece, float X, float Width)>();

            foreach (var piece in line.Items)
            {
                var pieceWidth = piece.Width + (piece.Kind == PieceKind.Space ? extra : 0);
                placed.Add((piece, position, pieceWidth));
                position += pieceWidth;
            }

            var page = _pages[_page];

            // highlights go first so the text is drawn on top of them
            foreach (var (start, end, size, color) in Spans(placed, p => p.Style.Background))
            {
                FillRect(start, baseline - size * 0.85f, end - start, size * 1.1f, (PdfColor)color);
            }

            DrawRuns(placed, baseline, justify);

            foreach (var (start, end, size, color) in Spans(placed, p => p.Style.Underline ? ColorOf(p) : null))
            {
                FillRect(start, baseline + size * 0.1f, end - start, Math.Max(0.5f, size * 0.06f), (PdfColor)color);
            }

            foreach (var (start, end, size, color) in Spans(placed, p => p.Style.Strikethrough ? ColorOf(p) : null))
            {
                FillRect(start, baseline - size * 0.3f, end - start, Math.Max(0.5f, size * 0.06f), (PdfColor)color);
            }

            foreach (var (piece, left, _) in placed.Where(p => p.Piece.Kind == PieceKind.Checkbox))
            {
                DrawCheckbox(piece, left, baseline);
            }

            foreach (var (start, end, size, link) in Spans(placed, p => IsLinkable(p.Style.Link) ? p.Style.Link : null))
            {
                page.Links.Add(new LinkArea(start, _pageHeight - baseline - size * PdfFont.Descent, end - start, size * (PdfFont.Ascent + PdfFont.Descent), (string)link));
            }
        }

        /// <summary>
        /// Draws the text of a line, merging neighbouring pieces in the same style into one
        /// text operation.
        /// </summary>
        private void DrawRuns(List<(Piece Piece, float X, float Width)> placed, float baseline, bool justify)
        {
            var run = new StringBuilder();
            Piece first = null;
            var runX = 0f;

            void Flush()
            {
                if (first is not null && run.Length > 0)
                {
                    DrawText(runX, baseline - Rise(first), first.Face, first.Size, ColorOf(first), run.ToString().TrimEnd(' '));
                }

                run.Clear();
                first = null;
            }

            foreach (var (piece, x, _) in placed)
            {
                if (piece.Kind == PieceKind.Checkbox)
                {
                    Flush();
                    continue;
                }

                var same = first is not null
                    && piece.Face == first.Face
                    && piece.Size == first.Size
                    && ColorOf(piece) == ColorOf(first)
                    && Rise(piece) == Rise(first);

                if (piece.Kind == PieceKind.Space)
                {
                    if (same && !justify)
                    {
                        run.Append(' ');
                    }
                    else
                    {
                        Flush();
                    }

                    continue;
                }

                if (!same)
                {
                    Flush();
                    first = piece;
                    runX = x;
                }

                run.Append(piece.Text);
            }

            Flush();
        }

        /// <summary>
        /// Returns the vertical shift of raised or lowered text.
        /// </summary>
        private static float Rise(Piece piece)
        {
            return piece.Style.Superscript ? piece.LineSize * 0.33f : piece.Style.Subscript ? -piece.LineSize * 0.15f : 0;
        }

        /// <summary>
        /// Returns the color a piece is drawn in.
        /// </summary>
        private PdfColor ColorOf(Piece piece)
        {
            return piece.Style.Color ?? (piece.Style.Link is not null ? LinkColor : _color);
        }

        /// <summary>
        /// Merges neighbouring pieces that share a value into spans. A space only joins a span
        /// that continues after it, so a decoration never runs into the gap at its end.
        /// </summary>
        /// <param name="placed">The placed pieces of a line.</param>
        /// <param name="key">Returns the value of a piece, or null for none.</param>
        /// <returns>The spans with their extent, the largest size and the value.</returns>
        private static List<(float Start, float End, float Size, object Value)> Spans(List<(Piece Piece, float X, float Width)> placed, Func<Piece, object> key)
        {
            var spans = new List<(float Start, float End, float Size, object Value)>();
            (float Start, float End, float Size, object Value)? current = null;

            foreach (var (piece, x, width) in placed)
            {
                var value = key(piece);

                if (value is not null && current is { } open && Equals(open.Value, value))
                {
                    current = piece.Kind == PieceKind.Space
                        ? open
                        : (open.Start, x + width, Math.Max(open.Size, piece.Size), value);
                    continue;
                }

                if (current is { } closed)
                {
                    spans.Add(closed);
                    current = null;
                }

                if (value is not null && piece.Kind != PieceKind.Space)
                {
                    current = (x, x + width, piece.Size, value);
                }
            }

            if (current is { } last)
            {
                spans.Add(last);
            }

            return spans;
        }

        /// <summary>
        /// Returns whether an address can be opened from a file: an absolute address with a
        /// scheme a reader hands to a browser or a mail program. Anything else would either
        /// lead nowhere or, like a script address, should not be followed at all.
        /// </summary>
        /// <param name="link">The address.</param>
        /// <returns>True when the address becomes a link annotation.</returns>
        internal static bool IsLinkable(string link)
        {
            return Uri.TryCreate(link, UriKind.Absolute, out var uri)
                && uri.Scheme is "http" or "https" or "mailto" or "ftp";
        }

        /// <summary>
        /// Draws the box of a task item, with a tick when it is done.
        /// </summary>
        private void DrawCheckbox(Piece piece, float x, float baseline)
        {
            var side = piece.Size * 0.62f;
            var top = baseline - side - piece.Size * 0.02f;
            var color = piece.Style.Color ?? _color;

            StrokeRect(_page, x, top, side, side, 0.7f, color);

            if (piece.Checked)
            {
                var page = _pages[_page].Foreground;
                page.Append($"{Rgb(color, true)} {F(Math.Max(0.8f, side * 0.14f))} w 1 J 1 j ");
                page.Append($"{F(x + side * 0.2f)} {F(_pageHeight - (top + side * 0.52f))} m ");
                page.Append($"{F(x + side * 0.42f)} {F(_pageHeight - (top + side * 0.75f))} l ");
                page.Append($"{F(x + side * 0.82f)} {F(_pageHeight - (top + side * 0.22f))} l S\n");
            }
        }

        /// <summary>
        /// Draws the pending list marker on a baseline, right-aligned to its column.
        /// </summary>
        /// <param name="page">The page.</param>
        /// <param name="baseline">The baseline.</param>
        private void DrawMarker(int page, float baseline)
        {
            if (_marker is not { } marker)
            {
                return;
            }

            _marker = null;

            if (_measuring)
            {
                return;
            }

            var saved = _page;
            _page = page;
            DrawText(marker.Right - PdfFont.Measure(marker.Face, marker.Text, marker.Size), baseline, marker.Face, marker.Size, marker.Color, marker.Text);
            _page = saved;
        }

        /// <summary>
        /// Writes a text operation onto the current page.
        /// </summary>
        private void DrawText(float x, float baseline, PdfFontFace face, float size, PdfColor color, string encoded)
        {
            if (_measuring || string.IsNullOrEmpty(encoded))
            {
                return;
            }

            _resources.Fonts.Add(face);
            _pages[_page].Foreground.Append($"BT /F{(int)face + 1} {F(size)} Tf {Rgb(color, false)} {F(x)} {F(_pageHeight - baseline)} Td ({Escape(encoded)}) Tj ET\n");
        }

        /// <summary>
        /// Writes a filled rectangle onto the current page.
        /// </summary>
        private void FillRect(float x, float top, float width, float height, PdfColor color)
        {
            if (_measuring || width <= 0 || height <= 0)
            {
                return;
            }

            _pages[_page].Foreground.Append($"{Rgb(color, false)} {F(x)} {F(_pageHeight - top - height)} {F(width)} {F(height)} re f\n");
        }

        /// <summary>
        /// Writes the outline of a rectangle onto a page.
        /// </summary>
        private void StrokeRect(int page, float x, float top, float width, float height, float lineWidth, PdfColor color)
        {
            if (_measuring)
            {
                return;
            }

            _pages[page].Foreground.Append($"{Rgb(color, true)} {F(lineWidth)} w {F(x)} {F(_pageHeight - top - height)} {F(width)} {F(height)} re S\n");
        }

        /// <summary>
        /// Writes a line onto the current page.
        /// </summary>
        private void StrokeLine(float x1, float y1, float x2, float y2, float lineWidth, PdfColor color)
        {
            if (_measuring)
            {
                return;
            }

            _pages[_page].Foreground.Append($"{Rgb(color, true)} {F(lineWidth)} w {F(x1)} {F(_pageHeight - y1)} m {F(x2)} {F(_pageHeight - y2)} l S\n");
        }

        /// <summary>
        /// Paints behind a container that started at a cursor and ends at the current one,
        /// once per page it spans. The drawing is captured and moved into the background
        /// layer, in front of everything that was drawn there after the container started -
        /// the backgrounds of what it contains.
        /// </summary>
        /// <param name="start">The cursor at the start of the container.</param>
        /// <param name="paint">Draws onto the current page between a top and a bottom.</param>
        private void PaintBehind(Cursor start, Action<float, float> paint)
        {
            if (_measuring)
            {
                return;
            }

            ForEachSegment(start, (page, top, bottom) =>
            {
                var saved = _page;
                var foreground = _pages[page].Foreground;
                var length = foreground.Length;

                _page = page;
                paint(top, bottom);
                _page = saved;

                var drawn = foreground.ToString(length, foreground.Length - length);
                foreground.Length = length;
                _pages[page].Background.Insert(page == start.Page ? start.Mark : 0, drawn);
            });
        }

        /// <summary>
        /// Calls an action for every page between a cursor and the current one, with the part
        /// of the page that lies in between.
        /// </summary>
        private void ForEachSegment(Cursor start, Action<int, float, float> action)
        {
            for (var page = start.Page; page <= _page; page++)
            {
                var top = page == start.Page ? start.Y : _top;
                var bottom = page == _page ? _y : _bottom;

                if (bottom > top)
                {
                    action(page, top, bottom);
                }
            }
        }

        /// <summary>
        /// Returns the current cursor, including the position in the background layer that a
        /// container starting here paints at.
        /// </summary>
        private Cursor Here()
        {
            return new Cursor(_page, _y, _pages[_page].Background.Length);
        }

        /// <summary>
        /// Returns the operator that sets a color for filling or stroking.
        /// </summary>
        private static string Rgb(PdfColor color, bool stroke)
        {
            return $"{F(color.R / 255f)} {F(color.G / 255f)} {F(color.B / 255f)} {(stroke ? "RG" : "rg")}";
        }

        /// <summary>
        /// Formats a number the way content streams expect it: invariant, without exponent
        /// and with at most three decimals.
        /// </summary>
        internal static string F(float value)
        {
            var text = Math.Round(value, 3).ToString("0.###", CultureInfo.InvariantCulture);

            return text == "-0" ? "0" : text;
        }

        /// <summary>
        /// Escapes encoded text for a literal string. Bytes outside of printable ASCII are
        /// written as octal escapes, so the content stream stays free of line ends that a
        /// reader would normalize.
        /// </summary>
        internal static string Escape(string encoded)
        {
            var builder = new StringBuilder(encoded.Length + 8);

            foreach (var c in encoded)
            {
                if (c is '(' or ')' or '\\')
                {
                    builder.Append('\\').Append(c);
                }
                else if (c < 32 || c > 126)
                {
                    builder.Append('\\').Append(Convert.ToString(c & 0xFF, 8).PadLeft(3, '0'));
                }
                else
                {
                    builder.Append(c);
                }
            }

            return builder.ToString();
        }

        /// <summary>
        /// Represents the drawing of a page, in two layers.
        /// </summary>
        internal sealed class Page
        {
            /// <summary>
            /// Returns the layer drawn first: the backgrounds of containers.
            /// </summary>
            public StringBuilder Background { get; } = new();

            /// <summary>
            /// Returns the layer drawn on top: text, lines and pictures.
            /// </summary>
            public StringBuilder Foreground { get; } = new();

            /// <summary>
            /// Returns the clickable areas.
            /// </summary>
            public List<LinkArea> Links { get; } = [];
        }

        /// <summary>
        /// Represents a clickable area in PDF coordinates.
        /// </summary>
        internal sealed record LinkArea(float X, float Y, float Width, float Height, string Uri);

        /// <summary>
        /// Represents a heading for the bookmarks, with its position in PDF coordinates.
        /// </summary>
        internal sealed record OutlineEntry(string Title, int Level, int Page, float Top);

        /// <summary>
        /// Represents a position of the layout.
        /// </summary>
        private readonly record struct Cursor(int Page, float Y, int Mark);

        /// <summary>
        /// Represents the marker of a list item waiting for its line.
        /// </summary>
        private sealed record Marker(string Text, PdfFontFace Face, float Size, float Right, PdfColor Color);

        /// <summary>
        /// Holds the fonts and images used by the pages, and caches decoded pictures so a
        /// picture is read once although it is measured and drawn.
        /// </summary>
        internal sealed class Resources
        {
            private readonly Dictionary<PdfBlockElementImage, PdfImage> _loaded = [];
            private readonly Dictionary<PdfImage, string> _names = [];

            /// <summary>
            /// Returns the faces in use.
            /// </summary>
            public SortedSet<PdfFontFace> Fonts { get; } = [];

            /// <summary>
            /// Returns the images in use with their resource names.
            /// </summary>
            public IEnumerable<KeyValuePair<PdfImage, string>> Images => _names;

            /// <summary>
            /// Loads the picture of an element.
            /// </summary>
            /// <param name="element">The element.</param>
            /// <param name="document">The document, for its resolver.</param>
            /// <returns>The image, or null.</returns>
            public PdfImage Load(PdfBlockElementImage element, PdfDocument document)
            {
                if (!_loaded.TryGetValue(element, out var image))
                {
                    var data = element.Data ?? PdfImage.ReadDataUri(element.Source);

                    if (data is null && !string.IsNullOrWhiteSpace(element.Source) && !element.Source.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                    {
                        data = document.ImageResolver?.Invoke(element.Source);
                    }

                    image = PdfImage.Read(data);
                    _loaded[element] = image;
                }

                return image;
            }

            /// <summary>
            /// Returns the resource name of an image, registering it on first use.
            /// </summary>
            /// <param name="image">The image.</param>
            /// <returns>The name.</returns>
            public string Register(PdfImage image)
            {
                if (!_names.TryGetValue(image, out var name))
                {
                    name = $"Im{_names.Count + 1}";
                    _names[image] = name;
                }

                return name;
            }
        }

        /// <summary>
        /// Names the kinds of pieces inline content is broken into.
        /// </summary>
        private enum PieceKind
        {
            Text,
            Space,
            Break,
            Checkbox
        }

        /// <summary>
        /// Represents a word, a space, a forced break or a checkbox, measured.
        /// </summary>
        private sealed class Piece
        {
            public PieceKind Kind { get; init; }
            public string Text { get; init; }
            public PdfTextStyle Style { get; init; }
            public PdfFontFace Face { get; init; }
            public float Size { get; init; }
            public float LineSize { get; init; }
            public float Width { get; init; }
            public bool Checked { get; init; }

            /// <summary>
            /// Splits a word after the last character that fits a width.
            /// </summary>
            /// <param name="width">The width the head must fit.</param>
            /// <param name="minimum">The number of characters the head takes at least.</param>
            /// <returns>The head, or null when not even one character fits, and the tail.</returns>
            public (Piece Head, Piece Tail) Split(float width, int minimum = 0)
            {
                var count = minimum;

                while (count < Text.Length - 1 && PdfFont.Measure(Face, Text[..(count + 1)], Size) <= width)
                {
                    count++;
                }

                if (count == 0)
                {
                    return (null, this);
                }

                return (With(Text[..count]), With(Text[count..]));
            }

            /// <summary>
            /// Returns a copy holding another part of the text.
            /// </summary>
            private Piece With(string text)
            {
                return new Piece
                {
                    Kind = Kind,
                    Text = text,
                    Style = Style,
                    Face = Face,
                    Size = Size,
                    LineSize = LineSize,
                    Width = PdfFont.Measure(Face, text, Size)
                };
            }
        }

        /// <summary>
        /// Represents a line of pieces.
        /// </summary>
        private sealed class Line
        {
            public List<Piece> Items { get; } = [];
            public float Width { get; private set; }
            public float Size { get; private set; }
            public float Height { get; private set; }
            public bool Forced { get; set; }

            /// <summary>
            /// Appends a piece.
            /// </summary>
            public void Add(Piece piece)
            {
                Items.Add(piece);
                Width += piece.Width;
            }

            /// <summary>
            /// Fixes the size and height once the line is complete.
            /// </summary>
            /// <param name="emptySize">The size an empty line is measured with.</param>
            public void Close(float emptySize)
            {
                Size = Items.Select(p => p.LineSize).DefaultIfEmpty(emptySize).Max();
                Height = Size * LineHeight;
            }
        }
    }
}
