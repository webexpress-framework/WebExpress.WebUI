using System;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The state of a service level agreement: when its clock started, how much
    /// time it grants, how often it starts over and what has happened to it
    /// since - a pause, a resume or a manual settlement.
    /// </summary>
    /// <remarks>
    /// The type carries state, not behaviour that reaches outside itself: it
    /// knows nothing about storage, requests or rendering, which is what lets
    /// <see cref="SlaEvaluator"/> derive a status from it in a single pure call
    /// and lets a test drive a whole month of history without a clock.
    ///
    /// The transitions return a new instance instead of mutating this one, so a
    /// definition that is being read - by a renderer, by another request - can
    /// never be changed underneath the reader.
    /// </remarks>
    public class SlaDefinition
    {
        /// <summary>
        /// Gets or sets the moment the clock of the first cycle started.
        /// </summary>
        public DateTime Start { get; set; }

        /// <summary>
        /// Gets or sets the time budget granted per cycle. A budget larger than
        /// the recurrence interval is capped to the interval, because a cycle
        /// that resets before its budget runs out could never be violated.
        /// </summary>
        public TimeSpan Target { get; set; }

        /// <summary>
        /// Gets or sets the fraction of the budget after which the agreement
        /// counts as at risk, between 0 and 1. The default warns once four
        /// fifths of the budget are used up, which leaves an operator a fifth of
        /// the time to react.
        /// </summary>
        public double WarningThreshold { get; set; } = 0.8d;

        /// <summary>
        /// Gets or sets the interval after which the agreement starts over.
        /// </summary>
        public TypeRecurrenceSla Recurrence { get; set; } = TypeRecurrenceSla.None;

        /// <summary>
        /// Gets or sets the number of cycles the agreement runs for, where 0
        /// means unlimited. Once the last cycle is reached the agreement stops
        /// resetting and its final window keeps running, so a missed last cycle
        /// stays visible as a violation instead of quietly disappearing.
        /// </summary>
        public int Cycles { get; set; } = 1;

        /// <summary>
        /// Gets or sets the time the agreement has spent paused so far. It is
        /// subtracted from the elapsed time, which is what makes a pause stop
        /// the clock rather than merely hide it.
        /// </summary>
        public TimeSpan PauseTotal { get; set; }

        /// <summary>
        /// Gets or sets the moment the current pause began, or null while the
        /// clock is running.
        /// </summary>
        public DateTime? PausedSince { get; set; }

        /// <summary>
        /// Gets or sets the one-based cycle that was settled manually, or null
        /// when none was. The cycle is stored rather than a timestamp so a
        /// recurring agreement forgets the settlement exactly when it starts
        /// over - which is the reset behaviour a periodic agreement promises.
        /// </summary>
        public int? FulfilledCycle { get; set; }

        /// <summary>
        /// Gets or sets the moment the agreement was settled manually. It is
        /// informational - the status is decided by <see cref="FulfilledCycle"/>.
        /// </summary>
        public DateTime? FulfilledAt { get; set; }

        /// <summary>
        /// Stops the clock. Pausing an already paused agreement is a no-op
        /// rather than an error, because a duplicated request - a double click,
        /// a retried call - must not extend the credited pause.
        /// </summary>
        /// <param name="moment">The moment the pause begins.</param>
        /// <returns>The resulting definition.</returns>
        public SlaDefinition Pause(DateTime moment)
        {
            if (PausedSince.HasValue)
            {
                return this;
            }

            var definition = Clone();
            definition.PausedSince = moment;

            return definition;
        }

        /// <summary>
        /// Starts the clock again and credits the time spent paused.
        /// </summary>
        /// <param name="moment">The moment the pause ends.</param>
        /// <returns>The resulting definition.</returns>
        public SlaDefinition Resume(DateTime moment)
        {
            if (!PausedSince.HasValue)
            {
                return this;
            }

            var definition = Clone();
            var paused = moment - PausedSince.Value;

            // a resume dated before the pause would hand the agreement extra
            // budget, so only forward time is credited
            definition.PauseTotal += paused > TimeSpan.Zero ? paused : TimeSpan.Zero;
            definition.PausedSince = null;

            return definition;
        }

        /// <summary>
        /// Settles the current cycle manually. The clock is released as well: a
        /// settled cycle has no reason to stay frozen, and leaving it paused
        /// would credit the remaining pause to the cycle that follows.
        /// </summary>
        /// <param name="moment">The moment the agreement is settled.</param>
        /// <returns>The resulting definition.</returns>
        public SlaDefinition Fulfill(DateTime moment)
        {
            var definition = PausedSince.HasValue ? Resume(moment) : Clone();

            definition.FulfilledCycle = SlaEvaluator.Evaluate(definition, moment).Cycle;
            definition.FulfilledAt = moment;

            return definition;
        }

        /// <summary>
        /// Starts the agreement over from the given moment, discarding the
        /// pause and settlement history of the run so far.
        /// </summary>
        /// <param name="moment">The moment the new run starts.</param>
        /// <returns>The resulting definition.</returns>
        public SlaDefinition Restart(DateTime moment)
        {
            var definition = Clone();

            definition.Start = moment;
            definition.PauseTotal = TimeSpan.Zero;
            definition.PausedSince = null;
            definition.FulfilledCycle = null;
            definition.FulfilledAt = null;

            return definition;
        }

        /// <summary>
        /// Creates a copy carrying the same state.
        /// </summary>
        /// <returns>The copy.</returns>
        public SlaDefinition Clone()
        {
            return new SlaDefinition
            {
                Start = Start,
                Target = Target,
                WarningThreshold = WarningThreshold,
                Recurrence = Recurrence,
                Cycles = Cycles,
                PauseTotal = PauseTotal,
                PausedSince = PausedSince,
                FulfilledCycle = FulfilledCycle,
                FulfilledAt = FulfilledAt
            };
        }
    }
}
