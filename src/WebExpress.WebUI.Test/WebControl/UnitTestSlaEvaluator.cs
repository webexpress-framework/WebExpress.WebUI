using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the evaluation of a service level agreement.
    /// </summary>
    /// <remarks>
    /// Every case names the moment it evaluates at instead of reading the clock,
    /// which is what lets a month of recurrence and a pause that spans a cycle
    /// boundary be asserted on without waiting for either.
    /// </remarks>
    public class UnitTestSlaEvaluator
    {
        /// <summary>
        /// The moment the agreements under test start at.
        /// </summary>
        private static readonly DateTime _start = new(2026, 8, 1, 8, 0, 0);

        /// <summary>
        /// Creates an agreement that grants four hours and warns after four
        /// fifths of them, so it turns at risk at 03:12 and is violated at 04:00.
        /// </summary>
        /// <param name="recurrence">The interval the agreement resets in.</param>
        /// <param name="cycles">The number of cycles the agreement runs for.</param>
        /// <returns>The definition.</returns>
        private static SlaDefinition CreateDefinition(TypeRecurrenceSla recurrence = TypeRecurrenceSla.None, int cycles = 1)
        {
            return new SlaDefinition
            {
                Start = _start,
                Target = TimeSpan.FromHours(4),
                Recurrence = recurrence,
                Cycles = cycles
            };
        }

        /// <summary>
        /// Tests that an agreement with budget to spare counts as fulfilled.
        /// </summary>
        [Fact]
        public void OnTrack()
        {
            // arrange
            var definition = CreateDefinition();

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(1));

            // assert
            Assert.Equal(TypeStatusSla.Fulfilled, evaluation.Status);
            Assert.Equal(TimeSpan.FromHours(1), evaluation.Elapsed);
            Assert.Equal(TimeSpan.FromHours(3), evaluation.Remaining);
            Assert.Equal(0.25d, evaluation.Progress, 4);
            Assert.Equal(_start.AddHours(4), evaluation.Deadline);
            Assert.False(evaluation.IsSettled);
        }

        /// <summary>
        /// Tests that the status turns at risk exactly when the warning
        /// threshold is reached, and not a minute earlier.
        /// </summary>
        [Theory]
        [InlineData(191, TypeStatusSla.Fulfilled)]
        [InlineData(192, TypeStatusSla.AtRisk)]
        [InlineData(239, TypeStatusSla.AtRisk)]
        [InlineData(240, TypeStatusSla.Violated)]
        [InlineData(300, TypeStatusSla.Violated)]
        public void Threshold(int minutes, TypeStatusSla expected)
        {
            // arrange
            var definition = CreateDefinition();

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddMinutes(minutes));

            // assert
            Assert.Equal(expected, evaluation.Status);
        }

        /// <summary>
        /// Tests that the warning threshold is configurable and that it is
        /// applied as a fraction of the budget.
        /// </summary>
        [Theory]
        [InlineData(0.5d, 119, TypeStatusSla.Fulfilled)]
        [InlineData(0.5d, 120, TypeStatusSla.AtRisk)]
        [InlineData(0.25d, 60, TypeStatusSla.AtRisk)]
        [InlineData(1d, 239, TypeStatusSla.Fulfilled)]
        public void WarningThreshold(double threshold, int minutes, TypeStatusSla expected)
        {
            // arrange
            var definition = CreateDefinition();
            definition.WarningThreshold = threshold;

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddMinutes(minutes));

            // assert
            Assert.Equal(expected, evaluation.Status);
        }

        /// <summary>
        /// Tests that the size of an overrun stays readable after a violation,
        /// because that is the number an operator needs once the deadline passed.
        /// </summary>
        [Fact]
        public void Overrun()
        {
            // arrange
            var definition = CreateDefinition();

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(6));

            // assert
            Assert.Equal(TypeStatusSla.Violated, evaluation.Status);
            Assert.Equal(TimeSpan.FromHours(-2), evaluation.Remaining);
            Assert.Equal(1d, evaluation.Progress);
        }

        /// <summary>
        /// Tests that a pause stops the clock: neither the elapsed time nor the
        /// deadline moves on while the agreement is paused.
        /// </summary>
        [Fact]
        public void Paused()
        {
            // arrange
            var definition = CreateDefinition().Pause(_start.AddHours(1));

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(3));

            // assert
            Assert.Equal(TypeStatusSla.Paused, evaluation.Status);
            Assert.Equal(TimeSpan.FromHours(1), evaluation.Elapsed);
            Assert.Equal(TimeSpan.FromHours(3), evaluation.Remaining);
            Assert.True(evaluation.IsPaused);
            Assert.Null(evaluation.Deadline);
        }

        /// <summary>
        /// Tests that an agreement cannot slide into a violation while it is
        /// paused, which is the whole point of pausing it.
        /// </summary>
        [Fact]
        public void PausedBeyondDeadline()
        {
            // arrange
            var definition = CreateDefinition().Pause(_start.AddHours(3));

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddDays(4));

            // assert
            Assert.Equal(TypeStatusSla.Paused, evaluation.Status);
            Assert.Equal(TimeSpan.FromHours(1), evaluation.Remaining);
        }

        /// <summary>
        /// Tests that resuming credits the time spent paused, so the pause costs
        /// the agreement nothing.
        /// </summary>
        [Fact]
        public void Resumed()
        {
            // arrange
            var definition = CreateDefinition()
                .Pause(_start.AddHours(1))
                .Resume(_start.AddHours(3));

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(4));

            // assert
            Assert.Equal(TypeStatusSla.Fulfilled, evaluation.Status);
            Assert.Equal(TimeSpan.FromHours(2), evaluation.Elapsed);
            Assert.Equal(TimeSpan.FromHours(2), evaluation.Remaining);
            Assert.False(evaluation.IsPaused);
            Assert.Equal(TimeSpan.FromHours(2), definition.PauseTotal);
        }

        /// <summary>
        /// Tests that a repeated pause does not extend the credited pause, which
        /// a retried request or a double click would otherwise do.
        /// </summary>
        [Fact]
        public void PausedTwice()
        {
            // arrange
            var definition = CreateDefinition()
                .Pause(_start.AddHours(1))
                .Pause(_start.AddHours(2))
                .Resume(_start.AddHours(3));

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(3));

            // assert
            Assert.Equal(TimeSpan.FromHours(2), definition.PauseTotal);
            Assert.Equal(TimeSpan.FromHours(1), evaluation.Elapsed);
        }

        /// <summary>
        /// Tests that resuming an agreement that was never paused leaves it
        /// untouched.
        /// </summary>
        [Fact]
        public void ResumedWithoutPause()
        {
            // arrange
            var definition = CreateDefinition();

            // act
            var resumed = definition.Resume(_start.AddHours(1));

            // assert
            Assert.Same(definition, resumed);
            Assert.Equal(TimeSpan.Zero, resumed.PauseTotal);
        }

        /// <summary>
        /// Tests that a periodic agreement starts over with a fresh budget once
        /// its period elapsed, which clears a violation of the cycle before.
        /// </summary>
        [Theory]
        [InlineData(23, 1, TypeStatusSla.Violated)]
        [InlineData(24, 2, TypeStatusSla.Fulfilled)]
        [InlineData(25, 2, TypeStatusSla.Fulfilled)]
        [InlineData(28, 2, TypeStatusSla.Violated)]
        [InlineData(48, 3, TypeStatusSla.Fulfilled)]
        public void DailyReset(int hours, int expectedCycle, TypeStatusSla expectedStatus)
        {
            // arrange
            var definition = CreateDefinition(TypeRecurrenceSla.Daily, 0);

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(hours));

            // assert
            Assert.Equal(expectedCycle, evaluation.Cycle);
            Assert.Equal(expectedStatus, evaluation.Status);
        }

        /// <summary>
        /// Tests that the cycle of a daily agreement is measured from its start,
        /// and that the elapsed time restarts at the boundary.
        /// </summary>
        [Fact]
        public void DailyCycle()
        {
            // arrange
            var definition = CreateDefinition(TypeRecurrenceSla.Daily, 5);

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(50));

            // assert
            Assert.Equal(3, evaluation.Cycle);
            Assert.Equal(5, evaluation.Cycles);
            Assert.Equal(TimeSpan.FromHours(2), evaluation.Elapsed);
            Assert.Equal(TimeSpan.FromDays(1), evaluation.Period);
            Assert.False(evaluation.IsFinalCycle);
            Assert.Equal(_start.AddHours(72), evaluation.Reset);
        }

        /// <summary>
        /// Tests that a weekly agreement resets after seven days.
        /// </summary>
        [Fact]
        public void WeeklyReset()
        {
            // arrange
            var definition = CreateDefinition(TypeRecurrenceSla.Weekly, 0);

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddDays(15));

            // assert
            Assert.Equal(3, evaluation.Cycle);
            Assert.Equal(TimeSpan.FromDays(1), evaluation.Elapsed);
            Assert.Equal(TimeSpan.FromDays(7), evaluation.Period);
        }

        /// <summary>
        /// Tests that a monthly agreement follows the calendar rather than a
        /// fixed number of days, so its cycles inherit the unequal length of the
        /// months they fall into.
        /// </summary>
        [Theory]
        [InlineData(30, 1)]
        [InlineData(31, 2)]
        [InlineData(61, 3)]
        public void MonthlyReset(int days, int expectedCycle)
        {
            // arrange
            var definition = CreateDefinition(TypeRecurrenceSla.Monthly, 0);

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddDays(days));

            // assert
            Assert.Equal(expectedCycle, evaluation.Cycle);
        }

        /// <summary>
        /// Tests that the last cycle of a limited agreement stays open ended, so
        /// a cycle that was never settled remains visible as a violation instead
        /// of quietly resetting.
        /// </summary>
        [Fact]
        public void FinalCycle()
        {
            // arrange
            var definition = CreateDefinition(TypeRecurrenceSla.Daily, 2);

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddDays(4));

            // assert
            Assert.Equal(2, evaluation.Cycle);
            Assert.Equal(TypeStatusSla.Violated, evaluation.Status);
            Assert.Equal(TimeSpan.FromDays(3), evaluation.Elapsed);
            Assert.True(evaluation.IsFinalCycle);
            Assert.Null(evaluation.Reset);
        }

        /// <summary>
        /// Tests that a pause postpones the reset of a periodic agreement,
        /// because a stopped clock cannot carry the agreement into its next
        /// cycle either.
        /// </summary>
        [Fact]
        public void PausedAcrossCycleBoundary()
        {
            // arrange
            var definition = CreateDefinition(TypeRecurrenceSla.Daily, 0).Pause(_start.AddHours(1));

            // act
            var paused = SlaEvaluator.Evaluate(definition, _start.AddHours(30));
            var resumed = SlaEvaluator.Evaluate(definition.Resume(_start.AddHours(30)), _start.AddHours(31));

            // assert
            Assert.Equal(1, paused.Cycle);
            Assert.Equal(TimeSpan.FromHours(1), paused.Elapsed);
            Assert.Equal(1, resumed.Cycle);
            Assert.Equal(TimeSpan.FromHours(2), resumed.Elapsed);
        }

        /// <summary>
        /// Tests that a budget larger than the period is capped to it, because a
        /// cycle that resets before its budget runs out could never be violated.
        /// </summary>
        [Fact]
        public void BudgetCappedToPeriod()
        {
            // arrange
            var definition = CreateDefinition(TypeRecurrenceSla.Daily, 0);
            definition.Target = TimeSpan.FromHours(30);

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(23));

            // assert
            Assert.Equal(TimeSpan.FromDays(1), evaluation.Budget);
            Assert.Equal(TimeSpan.FromHours(1), evaluation.Remaining);
        }

        /// <summary>
        /// Tests that settling a cycle manually keeps it fulfilled even after
        /// its budget would have run out.
        /// </summary>
        [Fact]
        public void Fulfilled()
        {
            // arrange
            var definition = CreateDefinition().Fulfill(_start.AddHours(1));

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(6));

            // assert
            Assert.Equal(TypeStatusSla.Fulfilled, evaluation.Status);
            Assert.True(evaluation.IsSettled);
            Assert.Equal(1, definition.FulfilledCycle);
            Assert.Equal(_start.AddHours(1), definition.FulfilledAt);
        }

        /// <summary>
        /// Tests that a periodic agreement forgets a manual settlement when it
        /// starts over, which is the reset behaviour a recurring agreement
        /// promises.
        /// </summary>
        [Fact]
        public void FulfilledForgottenOnReset()
        {
            // arrange
            var definition = CreateDefinition(TypeRecurrenceSla.Daily, 0).Fulfill(_start.AddHours(1));

            // act
            var settled = SlaEvaluator.Evaluate(definition, _start.AddHours(5));
            var next = SlaEvaluator.Evaluate(definition, _start.AddHours(28));

            // assert
            Assert.Equal(TypeStatusSla.Fulfilled, settled.Status);
            Assert.True(settled.IsSettled);
            Assert.Equal(2, next.Cycle);
            Assert.False(next.IsSettled);
            Assert.Equal(TypeStatusSla.Violated, next.Status);
        }

        /// <summary>
        /// Tests that settling a paused agreement releases the clock, so the
        /// remaining pause is not credited to the cycle that follows.
        /// </summary>
        [Fact]
        public void FulfilledWhilePaused()
        {
            // arrange
            var definition = CreateDefinition()
                .Pause(_start.AddHours(1))
                .Fulfill(_start.AddHours(2));

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(3));

            // assert
            Assert.Equal(TypeStatusSla.Fulfilled, evaluation.Status);
            Assert.False(evaluation.IsPaused);
            Assert.Equal(TimeSpan.FromHours(1), definition.PauseTotal);
            Assert.Equal(TimeSpan.FromHours(2), evaluation.Elapsed);
        }

        /// <summary>
        /// Tests that restarting discards the pause and settlement history of
        /// the run so far.
        /// </summary>
        [Fact]
        public void Restarted()
        {
            // arrange
            var definition = CreateDefinition()
                .Pause(_start.AddHours(1))
                .Fulfill(_start.AddHours(2))
                .Restart(_start.AddHours(5));

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(6));

            // assert
            Assert.Equal(TimeSpan.FromHours(1), evaluation.Elapsed);
            Assert.Equal(TimeSpan.Zero, definition.PauseTotal);
            Assert.Null(definition.FulfilledCycle);
            Assert.False(evaluation.IsSettled);
        }

        /// <summary>
        /// Tests that a transition leaves the definition it was applied to
        /// untouched, so a definition that is being read cannot change beneath
        /// the reader.
        /// </summary>
        [Fact]
        public void TransitionsDoNotMutate()
        {
            // arrange
            var definition = CreateDefinition();

            // act
            var paused = definition.Pause(_start.AddHours(1));

            // assert
            Assert.Null(definition.PausedSince);
            Assert.NotNull(paused.PausedSince);
            Assert.NotSame(definition, paused);
        }

        /// <summary>
        /// Tests that an agreement whose start lies in the future has not
        /// consumed anything yet.
        /// </summary>
        [Fact]
        public void NotStarted()
        {
            // arrange
            var definition = CreateDefinition();

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start.AddHours(-2));

            // assert
            Assert.Equal(TimeSpan.Zero, evaluation.Elapsed);
            Assert.Equal(TypeStatusSla.Fulfilled, evaluation.Status);
            Assert.Equal(1, evaluation.Cycle);
        }

        /// <summary>
        /// Tests that an agreement without a time budget is reported as
        /// violated, so a widget that was never configured is impossible to miss.
        /// </summary>
        [Fact]
        public void WithoutBudget()
        {
            // arrange
            var definition = new SlaDefinition { Start = _start };

            // act
            var evaluation = SlaEvaluator.Evaluate(definition, _start);

            // assert
            Assert.Equal(TypeStatusSla.Violated, evaluation.Status);
            Assert.Equal(1d, evaluation.Progress);
        }

        /// <summary>
        /// Tests that a missing definition is rejected at the boundary rather
        /// than surfacing as a null reference deeper in the evaluation.
        /// </summary>
        [Fact]
        public void WithoutDefinition()
        {
            Assert.Throws<ArgumentNullException>(() => SlaEvaluator.Evaluate(null, _start));
        }
    }
}
