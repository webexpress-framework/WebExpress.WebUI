using System;
using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a calendar that displays time-based items in an agenda, a week
    /// or a month view.
    /// </summary>
    public interface IControlSchedule : IControl
    {
        /// <summary>
        /// Gets the items displayed in the schedule.
        /// </summary>
        IEnumerable<IControlScheduleItem> Items { get; }

        /// <summary>
        /// Gets the holidays marked in the schedule.
        /// </summary>
        IEnumerable<IControlScheduleHoliday> Holidays { get; }

        /// <summary>
        /// Gets the view the schedule opens in.
        /// </summary>
        Func<IRenderControlContext, TypeViewSchedule> View { get; }

        /// <summary>
        /// Gets the views offered in the toolbar, as a comma separated subset of
        /// agenda, week and month.
        /// </summary>
        Func<IRenderControlContext, string> Views { get; }

        /// <summary>
        /// Gets how the agenda view groups its chronological list.
        /// </summary>
        Func<IRenderControlContext, TypeGroupingScheduleAgenda> AgendaGrouping { get; }

        /// <summary>
        /// Gets the culture the month and weekday names, the date formats and the
        /// calendar system are taken from.
        /// </summary>
        Func<IRenderControlContext, string> Culture { get; }

        /// <summary>
        /// Gets the day a week starts on.
        /// </summary>
        Func<IRenderControlContext, DayOfWeek?> WeekStart { get; }

        /// <summary>
        /// Gets a value indicating whether week numbers follow ISO 8601.
        /// </summary>
        Func<IRenderControlContext, bool> IsoWeek { get; }

        /// <summary>
        /// Gets a value indicating whether week numbers are shown.
        /// </summary>
        Func<IRenderControlContext, bool> ShowWeekNumbers { get; }

        /// <summary>
        /// Gets a value indicating whether holidays are marked.
        /// </summary>
        Func<IRenderControlContext, bool> ShowHolidays { get; }

        /// <summary>
        /// Gets the date the schedule initially shows.
        /// </summary>
        Func<IRenderControlContext, DateTime?> Date { get; }

        /// <summary>
        /// Gets a value indicating whether the week view carries a time axis.
        /// </summary>
        Func<IRenderControlContext, bool> TimeAxis { get; }

        /// <summary>
        /// Gets the first hour shown on the time axis.
        /// </summary>
        Func<IRenderControlContext, int?> HourStart { get; }

        /// <summary>
        /// Gets the last hour shown on the time axis.
        /// </summary>
        Func<IRenderControlContext, int?> HourEnd { get; }

        /// <summary>
        /// Gets a value indicating whether the toolbar offers a mini calendar
        /// for direct date selection.
        /// </summary>
        Func<IRenderControlContext, bool> MiniCalendar { get; }

        /// <summary>
        /// Gets a value indicating whether items can be moved with the pointer.
        /// </summary>
        Func<IRenderControlContext, bool> Editable { get; }

        /// <summary>
        /// Gets a value indicating whether the calendar takes the height its host
        /// offers instead of growing with the period it shows.
        /// </summary>
        Func<IRenderControlContext, bool> Fill { get; }

        /// <summary>
        /// Adds one or more items to the schedule.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance to allow method chaining.</returns>
        IControlSchedule Add(params IControlScheduleItem[] items);

        /// <summary>
        /// Adds one or more holidays to the schedule.
        /// </summary>
        /// <param name="holidays">The holidays to add.</param>
        /// <returns>The current instance to allow method chaining.</returns>
        IControlSchedule Add(params IControlScheduleHoliday[] holidays);
    }
}
