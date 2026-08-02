using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The status of a service level agreement at one moment, as computed by
    /// <see cref="SlaEvaluator"/>.
    /// </summary>
    /// <remarks>
    /// Everything a caller needs to render or to decide on is present here, so
    /// neither the control nor a caller has to redo any of the arithmetic - and
    /// none of them can arrive at a different answer than the one the widget
    /// shows.
    /// </remarks>
    public class SlaEvaluation
    {
        /// <summary>
        /// Gets the state the agreement is in.
        /// </summary>
        public TypeStatusSla Status { get; init; }

        /// <summary>
        /// Gets the time consumed in the current cycle, excluding paused time.
        /// </summary>
        public TimeSpan Elapsed { get; init; }

        /// <summary>
        /// Gets the time left in the current cycle. The value turns negative
        /// once the budget is overrun, because the size of the overrun is what
        /// an operator needs after a violation.
        /// </summary>
        public TimeSpan Remaining { get; init; }

        /// <summary>
        /// Gets the budget of the current cycle, after capping it to the
        /// recurrence interval.
        /// </summary>
        public TimeSpan Budget { get; init; }

        /// <summary>
        /// Gets the length of the current cycle, or <see cref="TimeSpan.Zero"/>
        /// when the agreement does not recur.
        /// </summary>
        public TimeSpan Period { get; init; }

        /// <summary>
        /// Gets the share of the budget consumed, between 0 and 1. The value is
        /// capped at 1 so a bar cannot render past its track.
        /// </summary>
        public double Progress { get; init; }

        /// <summary>
        /// Gets the one-based number of the current cycle.
        /// </summary>
        public int Cycle { get; init; }

        /// <summary>
        /// Gets the number of cycles the agreement runs for, where 0 means
        /// unlimited.
        /// </summary>
        public int Cycles { get; init; }

        /// <summary>
        /// Gets a value indicating whether the clock is stopped.
        /// </summary>
        public bool IsPaused { get; init; }

        /// <summary>
        /// Gets a value indicating whether the current cycle is the last one.
        /// </summary>
        public bool IsFinalCycle { get; init; }

        /// <summary>
        /// Gets a value indicating whether the current cycle was settled
        /// manually. It separates the two readings of
        /// <see cref="TypeStatusSla.Fulfilled"/> - settled and merely on track -
        /// which a client has to tell apart before it counts on: a settled cycle
        /// keeps its status until it resets, an on track one does not.
        /// </summary>
        public bool IsSettled { get; init; }

        /// <summary>
        /// Gets the wall clock moment the budget runs out, or null while the
        /// agreement is paused - a stopped clock has no deadline.
        /// </summary>
        public DateTime? Deadline { get; init; }

        /// <summary>
        /// Gets the wall clock moment the next cycle begins, or null when the
        /// agreement is paused, does not recur or has reached its last cycle.
        /// </summary>
        public DateTime? Reset { get; init; }
    }
}
