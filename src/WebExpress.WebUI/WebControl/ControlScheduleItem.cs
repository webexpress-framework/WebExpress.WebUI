using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net;
using System.Text.Json;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a single time-based entry of a <see cref="ControlSchedule"/>: an
    /// appointment, an event or a task with a start, an end and an optional
    /// all-day flag. An item may span several days, in which case the month view
    /// draws it as a continuous bar and the week view stretches it across the
    /// day columns it covers.
    /// </summary>
    /// <remarks>
    /// The item renders as a hidden descriptor element that the client runtime
    /// reads and replaces with the visual entry (see
    /// webexpress.webui.schedule.js). Timestamps are serialized without a zone
    /// offset, so the client parses them as local time and a day never shifts
    /// across a date boundary because the visitor sits in another zone. An
    /// all-day item is emitted at midnight of its day for the same reason.
    /// </remarks>
    public class ControlScheduleItem : IControlScheduleItem
    {
        /// <summary>
        /// The timestamp format the client parses as local time.
        /// </summary>
        internal const string TimestampFormat = "yyyy-MM-ddTHH:mm:ss";

        /// <summary>
        /// Gets the unique identifier of the item.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the title shown on the item.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the moment the item begins.
        /// </summary>
        public Func<IRenderControlContext, DateTime> Start { get; set; }

        /// <summary>
        /// Gets or sets the moment the item ends. When null, the item is treated
        /// as ending on the day it begins, which is what a point-in-time entry
        /// without a duration means.
        /// </summary>
        public Func<IRenderControlContext, DateTime?> End { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the item occupies whole days
        /// rather than a span of hours. An all-day item is never placed on the
        /// time axis; it sits in the all-day lane above it.
        /// </summary>
        public Func<IRenderControlContext, bool> AllDay { get; set; }

        /// <summary>
        /// Gets or sets the category the item belongs to. It groups related
        /// items and is emitted verbatim, so the stylesheet can select on it.
        /// </summary>
        public Func<IRenderControlContext, string> Category { get; set; }

        /// <summary>
        /// Gets or sets the color of the item. Accepts a system color (emitted
        /// as a CSS class) or a user-defined color (emitted as an inline style).
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackground> Color { get; set; }

        /// <summary>
        /// Gets or sets the icon shown in front of the title.
        /// </summary>
        public Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the URI the item links to.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the free-form metadata carried with the item. It is
        /// emitted as a JSON object and reaches the click events and the custom
        /// item renderer unchanged, which is what lets an application attach its
        /// own domain data without the control having to know about it.
        /// </summary>
        public Func<IRenderControlContext, IDictionary<string, string>> Metadata { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the item.</param>
        public ControlScheduleItem(string id = null)
        {
            Id = id;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var title = Title?.Invoke(renderContext);
            var start = Start?.Invoke(renderContext);
            var end = End?.Invoke(renderContext);
            var allDay = AllDay?.Invoke(renderContext) ?? false;
            var category = Category?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);
            var icon = Icon?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext);
            var metadata = Metadata?.Invoke(renderContext);

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-schedule-item"
            }
                .AddUserAttribute("data-title", Encode(I18N.Translate(renderContext, title)))
                .AddUserAttribute("data-start", Format(start, allDay))
                .AddUserAttribute("data-end", Format(end, allDay))
                .AddUserAttribute("data-all-day", allDay ? "true" : null)
                .AddUserAttribute("data-category", Encode(category))
                .AddUserAttribute("data-color-css", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-icon", (icon as Icon)?.Class)
                .AddUserAttribute("data-uri", uri?.ToString())
                .AddUserAttribute("data-meta", SerializeMetadata(metadata));
        }

        /// <summary>
        /// Formats a timestamp into the zone-free form the client parses as
        /// local time, truncating an all-day timestamp to midnight so the day it
        /// belongs to cannot depend on the time of day it was authored with.
        /// </summary>
        /// <param name="value">The timestamp.</param>
        /// <param name="allDay">Whether the item occupies whole days.</param>
        /// <returns>The formatted timestamp, or null when there is none.</returns>
        internal static string Format(DateTime? value, bool allDay)
        {
            if (!value.HasValue)
            {
                return null;
            }

            var moment = allDay ? value.Value.Date : value.Value;

            return moment.ToString(TimestampFormat, CultureInfo.InvariantCulture);
        }

        /// <summary>
        /// Serializes the metadata into the JSON object the client parses.
        /// </summary>
        /// <param name="metadata">The metadata.</param>
        /// <returns>The encoded JSON, or null when there is nothing to carry.</returns>
        private static string SerializeMetadata(IDictionary<string, string> metadata)
        {
            if (metadata is null || metadata.Count == 0)
            {
                return null;
            }

            return Encode(JsonSerializer.Serialize(metadata));
        }

        /// <summary>
        /// Encodes a value for an attribute. Attribute values are written
        /// verbatim by the HTML writer, so a title carrying a quote would end
        /// the attribute and a JSON payload would never survive at all.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <returns>The encoded value, or null when there is none.</returns>
        private static string Encode(string value)
        {
            return string.IsNullOrEmpty(value) ? null : WebUtility.HtmlEncode(value);
        }
    }
}
