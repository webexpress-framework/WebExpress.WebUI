using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Derives the status of a service level agreement from its definition and
    /// a moment in time.
    /// </summary>
    /// <remarks>
    /// The evaluation is pure and takes the moment as an argument rather than
    /// reading the clock, which is what makes a whole month of recurrence and a
    /// pause that spans a cycle boundary testable in microseconds - and what
    /// lets the server and the client agree on a status without exchanging one.
    ///
    /// All arithmetic happens on the *agreement's own timeline*: the time it has
    /// actually been running, with every paused interval removed. A pause
    /// therefore does not merely freeze the countdown, it also postpones the
    /// next reset, which is the only reading under which "the clock is stopped"
    /// stays true for a periodic agreement.
    /// </remarks>
    public static class SlaEvaluator
    {
        /// <summary>
        /// Evaluates the agreement at the given moment.
        /// </summary>
        /// <remarks>
        /// The status is decided in a fixed order: a manually settled cycle wins
        /// over everything, because settling it is a statement about the outcome
        /// rather than about the clock; a stopped clock wins over the remaining
        /// time, because a paused agreement must not slide into a violation
        /// while nobody is working on it; and only then does the budget decide
        /// between violated, at risk and on track.
        /// </remarks>
        /// <param name="definition">The definition to evaluate.</param>
        /// <param name="moment">The moment to evaluate it at.</param>
        /// <returns>The status of the agreement at that moment.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the definition is null.</exception>
        public static SlaEvaluation Evaluate(SlaDefinition definition, DateTime moment)
        {
            ArgumentNullException.ThrowIfNull(definition);

            var isPaused = definition.PausedSince.HasValue;
            var reference = definition.PausedSince ?? moment;
            var running = reference - definition.Start - definition.PauseTotal;

            // an agreement whose start lies in the future has not consumed
            // anything yet; without the floor it would report a negative cycle
            if (running < TimeSpan.Zero)
            {
                running = TimeSpan.Zero;
            }

            var (index, elapsed, period) = Locate(definition, running);
            var budget = Budget(definition, period);
            var remaining = budget - elapsed;
            var threshold = Math.Clamp(definition.WarningThreshold, 0d, 1d);
            var cycle = index + 1;
            var isFinalCycle = definition.Cycles > 0 && cycle >= definition.Cycles;
            var isSettled = definition.FulfilledCycle == cycle;

            return new SlaEvaluation
            {
                Status = Status(isSettled, isPaused, budget, elapsed, remaining, threshold),
                Elapsed = elapsed,
                Remaining = remaining,
                Budget = budget,
                Period = period,
                Progress = budget > TimeSpan.Zero ? Math.Clamp(elapsed / budget, 0d, 1d) : 1d,
                Cycle = cycle,
                Cycles = definition.Cycles,
                IsPaused = isPaused,
                IsFinalCycle = isFinalCycle,
                IsSettled = isSettled,
                Deadline = isPaused ? null : Advance(moment, remaining),
                Reset = isPaused || isFinalCycle || period <= TimeSpan.Zero
                    ? null
                    : Advance(moment, period - elapsed)
            };
        }

        /// <summary>
        /// Decides the status from the parts that were computed for the cycle.
        /// </summary>
        /// <param name="isSettled">Whether the cycle was settled manually.</param>
        /// <param name="isPaused">Whether the clock is stopped.</param>
        /// <param name="budget">The budget of the cycle.</param>
        /// <param name="elapsed">The time consumed in the cycle.</param>
        /// <param name="remaining">The time left in the cycle.</param>
        /// <param name="threshold">The warning threshold, clamped to 0..1.</param>
        /// <returns>The status.</returns>
        private static TypeStatusSla Status
        (
            bool isSettled,
            bool isPaused,
            TimeSpan budget,
            TimeSpan elapsed,
            TimeSpan remaining,
            double threshold
        )
        {
            if (isSettled)
            {
                return TypeStatusSla.Fulfilled;
            }

            if (isPaused)
            {
                return TypeStatusSla.Paused;
            }

            if (remaining <= TimeSpan.Zero)
            {
                return TypeStatusSla.Violated;
            }

            return elapsed >= budget * threshold ? TypeStatusSla.AtRisk : TypeStatusSla.Fulfilled;
        }

        /// <summary>
        /// Locates the cycle the agreement is in after the given amount of
        /// running time, and how far into that cycle it has come.
        /// </summary>
        /// <remarks>
        /// The index is capped at the last cycle of a limited agreement, which
        /// leaves the final window open ended: it keeps accumulating instead of
        /// resetting, so a cycle that was never settled stays visible as a
        /// violation.
        /// </remarks>
        /// <param name="definition">The definition being evaluated.</param>
        /// <param name="running">The time the agreement has actually been running.</param>
        /// <returns>The zero-based cycle index, the time consumed in it, and its length.</returns>
        private static (int Index, TimeSpan Elapsed, TimeSpan Period) Locate(SlaDefinition definition, TimeSpan running)
        {
            if (definition.Recurrence == TypeRecurrenceSla.None)
            {
                return (0, running, TimeSpan.Zero);
            }

            var last = definition.Cycles > 0 ? definition.Cycles - 1 : int.MaxValue;

            if (definition.Recurrence == TypeRecurrenceSla.Monthly)
            {
                // months differ in length, so the boundary is walked on the
                // calendar instead of being derived from a fixed tick count
                var moment = definition.Start + running;
                var months = ((moment.Year - definition.Start.Year) * 12) + moment.Month - definition.Start.Month;

                if (months > 0 && definition.Start.AddMonths(months) > moment)
                {
                    months--;
                }

                var month = Math.Clamp(months, 0, last);
                var start = definition.Start.AddMonths(month);

                return (month, moment - start, definition.Start.AddMonths(month + 1) - start);
            }

            var length = definition.Recurrence == TypeRecurrenceSla.Weekly
                ? TimeSpan.FromDays(7)
                : TimeSpan.FromDays(1);
            var index = Math.Min(running.Ticks / length.Ticks, last);

            return ((int)index, running - (length * index), length);
        }

        /// <summary>
        /// Returns the budget of a cycle.
        /// </summary>
        /// <param name="definition">The definition being evaluated.</param>
        /// <param name="period">The length of the cycle, or zero when the agreement does not recur.</param>
        /// <returns>The budget.</returns>
        private static TimeSpan Budget(SlaDefinition definition, TimeSpan period)
        {
            var target = definition.Target > TimeSpan.Zero ? definition.Target : TimeSpan.Zero;

            // a recurring agreement cannot promise more time than its interval
            // grants, otherwise the cycle would reset before the budget is spent
            return period > TimeSpan.Zero && target > period ? period : target;
        }

        /// <summary>
        /// Moves a moment by an offset, or returns null when the result would
        /// leave the representable range - a deadline that cannot be expressed
        /// is better reported as absent than as a wrapped-around date.
        /// </summary>
        /// <param name="moment">The moment to move.</param>
        /// <param name="offset">The offset to apply.</param>
        /// <returns>The resulting moment, or null when it is out of range.</returns>
        private static DateTime? Advance(DateTime moment, TimeSpan offset)
        {
            if (offset.Ticks > DateTime.MaxValue.Ticks - moment.Ticks ||
                offset.Ticks < DateTime.MinValue.Ticks - moment.Ticks)
            {
                return null;
            }

            return new DateTime(moment.Ticks + offset.Ticks, moment.Kind);
        }
    }
}
