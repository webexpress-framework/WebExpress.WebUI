using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a calendar for time-based items - appointments, events or
    /// tasks - that carry a start, an end and may span several days. The items
    /// and the holidays are supplied through the properties of the control; it
    /// performs no data access of its own.
    /// </summary>
    /// <remarks>
    /// The control offers three views over the same set of items: an agenda, a
    /// chronological list grouped by day, week or month; a week, a seven day
    /// grid with an optional time axis on which the items are stretched or, with
    /// the axis off, stacked; and a month, the classic calendar grid with
    /// compact markers, per-day lists and continuous bars for multi-day entries.
    ///
    /// It renders only the host element and a hidden descriptor per item and
    /// holiday. The grids, the navigation and the localized names are built by
    /// the client runtime (see webexpress.webui.schedule.js), because they
    /// depend on the view the visitor switches to and on the viewport, neither
    /// of which the server knows. A data-driven schedule that loads its items
    /// from a REST endpoint is <c>ControlDataSchedule</c> in WebExpress.WebApp.
    /// </remarks>
    public class ControlSchedule : ControlPanel, IControlSchedule
    {
        private readonly List<IControlScheduleItem> _items = [];
        private readonly List<IControlScheduleHoliday> _holidays = [];

        /// <summary>
        /// Gets the items displayed in the schedule.
        /// </summary>
        public IEnumerable<IControlScheduleItem> Items => _items;

        /// <summary>
        /// Gets the holidays marked in the schedule.
        /// </summary>
        public IEnumerable<IControlScheduleHoliday> Holidays => _holidays;

        /// <summary>
        /// Gets or sets the view the schedule opens in. The default is the month
        /// grid, which is the view that shows the widest period at once.
        /// </summary>
        public Func<IRenderControlContext, TypeViewSchedule> View { get; set; }

        /// <summary>
        /// Gets or sets the views offered in the toolbar, as a comma separated
        /// subset of agenda, week and month. When null, all three are offered.
        /// </summary>
        public Func<IRenderControlContext, string> Views { get; set; }

        /// <summary>
        /// Gets or sets how the agenda view groups its chronological list.
        /// </summary>
        public Func<IRenderControlContext, TypeGroupingScheduleAgenda> AgendaGrouping { get; set; }

        /// <summary>
        /// Gets or sets the culture the month and weekday names, the date
        /// formats and the calendar system are taken from, as a BCP-47 tag.
        /// A tag may carry the Unicode calendar extension to select a calendar
        /// other than the Gregorian one, for example <c>th-TH-u-ca-buddhist</c>.
        /// When null, the client follows the browser's locale.
        /// </summary>
        public Func<IRenderControlContext, string> Culture { get; set; }

        /// <summary>
        /// Gets or sets the day a week starts on. When null, the client derives
        /// it from the culture, which is what makes a schedule start on Sunday
        /// in the United States and on Monday in Germany without the page having
        /// to know the rule.
        /// </summary>
        public Func<IRenderControlContext, DayOfWeek?> WeekStart { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether week numbers follow ISO 8601,
        /// where week one is the week containing the first Thursday. It is
        /// independent of <see cref="WeekStart"/>, because a region may well
        /// display Sunday-first weeks and still count them the ISO way.
        /// </summary>
        public Func<IRenderControlContext, bool> IsoWeek { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the week and month views show
        /// the week number in front of each week.
        /// </summary>
        public Func<IRenderControlContext, bool> ShowWeekNumbers { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether holidays are marked. They are
        /// marked unless switched off, because a schedule that was given
        /// holidays is expected to show them.
        /// </summary>
        public Func<IRenderControlContext, bool> ShowHolidays { get; set; }

        /// <summary>
        /// Gets or sets the date the schedule initially shows. When null, the
        /// client opens on the current day.
        /// </summary>
        public Func<IRenderControlContext, DateTime?> Date { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the week view carries a time
        /// axis. With the axis on, a timed item is placed and stretched by its
        /// hours; with it off, the items of a day are stacked as chips, which
        /// suits a schedule of mostly all-day entries. The axis is on unless
        /// switched off.
        /// </summary>
        public Func<IRenderControlContext, bool> TimeAxis { get; set; }

        /// <summary>
        /// Gets or sets the first hour shown on the time axis. Bounding the axis
        /// keeps the working hours legible instead of spending most of the
        /// height on the night.
        /// </summary>
        public Func<IRenderControlContext, int?> HourStart { get; set; }

        /// <summary>
        /// Gets or sets the last hour shown on the time axis.
        /// </summary>
        public Func<IRenderControlContext, int?> HourEnd { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the toolbar offers a mini
        /// calendar for jumping directly to a date, rather than only stepping
        /// through the periods.
        /// </summary>
        public Func<IRenderControlContext, bool> MiniCalendar { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether items can be moved with the
        /// pointer. The control itself only raises the move event; persisting it
        /// is the business of whoever owns the data, which is why the static
        /// schedule stays editable without becoming data bound.
        /// </summary>
        public Func<IRenderControlContext, bool> Editable { get; set; }

        /// <summary>
        /// Gets or sets whether the calendar takes the height its host offers
        /// instead of growing with the period it shows.
        /// </summary>
        /// <remarks>
        /// A calendar that grows is the right shape for one block among others on
        /// a page. Where the calendar *is* the view, it is the wrong one: the page
        /// scrolls around it and takes the toolbar and the weekday header along,
        /// so the reader loses the period he is navigating. Filling bounds the
        /// calendar instead, and the grid scrolls below a toolbar that stays.
        ///
        /// A host that is a flex column - which the WebApp content panel becomes
        /// on its own for a filling control - drives the height. A host that hands
        /// nothing down falls back to the self-imposed default of the
        /// <c>--wx-schedule-height</c> custom property, never to the content: the
        /// grid only scrolls while the calendar is bounded.
        /// </remarks>
        public Func<IRenderControlContext, bool> Fill { get; set; } = _ => false;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSchedule(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Adds one or more items to the schedule.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance to allow method chaining.</returns>
        public IControlSchedule Add(params IControlScheduleItem[] items)
        {
            _items.AddRange(items.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Adds one or more holidays to the schedule.
        /// </summary>
        /// <param name="holidays">The holidays to add.</param>
        /// <returns>The current instance to allow method chaining.</returns>
        public IControlSchedule Add(params IControlScheduleHoliday[] holidays)
        {
            _holidays.AddRange(holidays.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return RenderHost(renderContext, visualTree, "wx-webui-schedule");
        }

        /// <summary>
        /// Builds the host element with the view configuration and the item and
        /// holiday descriptors.
        /// </summary>
        /// <remarks>
        /// It is the single place the client contract is emitted, so a derived
        /// control - the data-driven schedule of WebExpress.WebApp - reuses it
        /// instead of restating fourteen attributes that would then have to be
        /// kept in step by hand.
        /// </remarks>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="cssClass">The marker class the client registers the control under.</param>
        /// <returns>The host element.</returns>
        protected IHtmlElement RenderHost(IRenderControlContext renderContext, IVisualTreeControl visualTree, string cssClass)
        {
            var view = View?.Invoke(renderContext) ?? TypeViewSchedule.Default;
            var grouping = AgendaGrouping?.Invoke(renderContext) ?? TypeGroupingScheduleAgenda.Default;
            var weekStart = WeekStart?.Invoke(renderContext);
            var date = Date?.Invoke(renderContext);
            var hourStart = HourStart?.Invoke(renderContext);
            var hourEnd = HourEnd?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate(cssClass, (Fill?.Invoke(renderContext) ?? false) ? "wx-fill" : null, GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext) ?? "region"
            };

            html.AddUserAttribute("data-view", view != TypeViewSchedule.Default ? view.ToValue() : null)
                .AddUserAttribute("data-views", Encode(Views?.Invoke(renderContext)))
                .AddUserAttribute("data-agenda-grouping", grouping != TypeGroupingScheduleAgenda.Default ? grouping.ToValue() : null)
                .AddUserAttribute("data-culture", Encode(Culture?.Invoke(renderContext)))
                .AddUserAttribute("data-week-start", weekStart.HasValue ? ((int)weekStart.Value).ToString(CultureInfo.InvariantCulture) : null)
                .AddUserAttribute("data-iso-week", (IsoWeek?.Invoke(renderContext) ?? false) ? "true" : null)
                .AddUserAttribute("data-week-numbers", (ShowWeekNumbers?.Invoke(renderContext) ?? false) ? "true" : null)
                // the client marks holidays unless it reads an explicit "false",
                // so only the opt-out is worth an attribute
                .AddUserAttribute("data-show-holidays", ShowHolidays != null && !ShowHolidays(renderContext) ? "false" : null)
                .AddUserAttribute("data-date", date?.ToString(ControlScheduleHoliday.DateFormat, CultureInfo.InvariantCulture))
                .AddUserAttribute("data-time-axis", TimeAxis != null && !TimeAxis(renderContext) ? "false" : null)
                .AddUserAttribute("data-hour-start", hourStart?.ToString(CultureInfo.InvariantCulture))
                .AddUserAttribute("data-hour-end", hourEnd?.ToString(CultureInfo.InvariantCulture))
                .AddUserAttribute("data-mini-calendar", (MiniCalendar?.Invoke(renderContext) ?? false) ? "true" : null)
                .AddUserAttribute("data-editable", (Editable?.Invoke(renderContext) ?? false) ? "true" : null);

            html.Add(_items.Select(x => x.Render(renderContext, visualTree)));
            html.Add(_holidays.Select(x => x.Render(renderContext, visualTree)));

            return html;
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
