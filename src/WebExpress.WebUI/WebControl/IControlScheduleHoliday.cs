using System;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a holiday a schedule marks on the day it falls on.
    /// </summary>
    public interface IControlScheduleHoliday : IControlScheduleElement
    {
        /// <summary>
        /// Gets the day the holiday falls on.
        /// </summary>
        Func<IRenderControlContext, DateTime> Date { get; }

        /// <summary>
        /// Gets the name of the holiday.
        /// </summary>
        Func<IRenderControlContext, string> Name { get; }

        /// <summary>
        /// Gets the region the holiday applies to.
        /// </summary>
        Func<IRenderControlContext, string> Region { get; }

        /// <summary>
        /// Gets the kind of the holiday, which decides how prominently the day
        /// is marked.
        /// </summary>
        Func<IRenderControlContext, TypeHolidaySchedule> Type { get; }
    }
}
