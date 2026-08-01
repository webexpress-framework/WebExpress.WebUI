using System;
using System.Globalization;
using System.Net;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a holiday a <see cref="ControlSchedule"/> marks on the day it
    /// falls on, in every view.
    /// </summary>
    /// <remarks>
    /// A holiday is a whole day rather than a moment, so it is emitted as a bare
    /// date. The client keys its holidays by that date string and never turns it
    /// into a point in time, which is what keeps a holiday on its day regardless
    /// of the visitor's zone.
    /// </remarks>
    public class ControlScheduleHoliday : IControlScheduleHoliday
    {
        /// <summary>
        /// The date format the client uses as the day key.
        /// </summary>
        internal const string DateFormat = "yyyy-MM-dd";

        /// <summary>
        /// Gets the unique identifier of the holiday.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the day the holiday falls on.
        /// </summary>
        public Func<IRenderControlContext, DateTime> Date { get; set; }

        /// <summary>
        /// Gets or sets the name of the holiday.
        /// </summary>
        public Func<IRenderControlContext, string> Name { get; set; }

        /// <summary>
        /// Gets or sets the region the holiday applies to. It is carried through
        /// unchanged so a schedule showing several regions can tell them apart,
        /// and so a data-driven schedule can request the holidays of one region.
        /// </summary>
        public Func<IRenderControlContext, string> Region { get; set; }

        /// <summary>
        /// Gets or sets the kind of the holiday, which decides how prominently
        /// the day is marked.
        /// </summary>
        public Func<IRenderControlContext, TypeHolidaySchedule> Type { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the holiday.</param>
        public ControlScheduleHoliday(string id = null)
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
            var date = Date?.Invoke(renderContext);
            var name = Name?.Invoke(renderContext);
            var region = Region?.Invoke(renderContext);
            var type = Type?.Invoke(renderContext) ?? TypeHolidaySchedule.Default;

            return new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = "wx-schedule-holiday"
            }
                .AddUserAttribute("data-date", date?.ToString(DateFormat, CultureInfo.InvariantCulture))
                .AddUserAttribute("data-name", Encode(I18N.Translate(renderContext, name)))
                .AddUserAttribute("data-region", Encode(region))
                .AddUserAttribute("data-type", type != TypeHolidaySchedule.Default ? type.ToValue() : null);
        }

        /// <summary>
        /// Encodes a value for an attribute, because attribute values are
        /// written verbatim by the HTML writer.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <returns>The encoded value, or null when there is none.</returns>
        private static string Encode(string value)
        {
            return string.IsNullOrEmpty(value) ? null : WebUtility.HtmlEncode(value);
        }
    }
}
