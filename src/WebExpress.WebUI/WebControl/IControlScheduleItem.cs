using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a single time-based entry of a schedule, such as an appointment,
    /// an event or a task.
    /// </summary>
    public interface IControlScheduleItem : IControlScheduleElement
    {
        /// <summary>
        /// Gets the title shown on the item.
        /// </summary>
        Func<IRenderControlContext, string> Title { get; }

        /// <summary>
        /// Gets the moment the item begins.
        /// </summary>
        Func<IRenderControlContext, DateTime> Start { get; }

        /// <summary>
        /// Gets the moment the item ends. When null, the item is treated as
        /// ending on the day it begins.
        /// </summary>
        Func<IRenderControlContext, DateTime?> End { get; }

        /// <summary>
        /// Gets a value indicating whether the item occupies whole days rather
        /// than a span of hours.
        /// </summary>
        Func<IRenderControlContext, bool> AllDay { get; }

        /// <summary>
        /// Gets the category the item belongs to, which groups related items and
        /// gives the stylesheet a hook.
        /// </summary>
        Func<IRenderControlContext, string> Category { get; }

        /// <summary>
        /// Gets the color of the item.
        /// </summary>
        Func<IRenderControlContext, PropertyColorBackground> Color { get; }

        /// <summary>
        /// Gets the icon shown in front of the title.
        /// </summary>
        Func<IRenderControlContext, IIcon> Icon { get; }

        /// <summary>
        /// Gets the URI the item links to.
        /// </summary>
        Func<IRenderControlContext, IUri> Uri { get; }

        /// <summary>
        /// Gets the free-form metadata carried with the item, which a custom
        /// renderer or an event handler reads.
        /// </summary>
        Func<IRenderControlContext, IDictionary<string, string>> Metadata { get; }
    }
}
