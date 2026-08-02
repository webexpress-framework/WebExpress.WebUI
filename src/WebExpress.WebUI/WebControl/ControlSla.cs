using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the state of a service level agreement as a dashboard widget:
    /// a coloured status, a meter of the consumed budget, the time left, the
    /// cycle of a periodic agreement and the actions that pause, resume or
    /// settle it.
    /// </summary>
    /// <remarks>
    /// The widget renders complete: the server evaluates the agreement through
    /// <see cref="SlaEvaluator"/> and writes the result into the markup, so the
    /// status is correct in the first paint, survives a page without JavaScript
    /// and can be asserted on in a test. The client runtime
    /// (webexpress.webui.sla.js) only takes over what the server cannot know -
    /// the passing of time. It ticks the countdown, moves the widget between
    /// the states as thresholds are crossed, rolls a periodic agreement over
    /// into its next cycle and localises the labels.
    ///
    /// The control has two readings, and which one it takes is decided by
    /// whether agreements were added to it. Empty, it is one agreement,
    /// configured through its own properties. Filled, it is the panel that
    /// gathers them: a heading, a summary of how they are doing, and the tiles
    /// below it. A dashboard that shows more than one agreement should show
    /// them as one thing - rendered on their own, five of them read as five
    /// unrelated widgets that happen to sit next to each other.
    ///
    /// Neither reading draws a box of its own; the frame belongs to whatever
    /// hosts the widget, because a widget that brought its own would nest a
    /// second frame inside the host's.
    ///
    /// The control holds no data of its own. Where the state lives - in memory,
    /// in a database, behind a REST endpoint - is the business of whoever owns
    /// it; <see cref="ActionUri"/> is the one seam through which the widget
    /// reports back that a visitor asked for a transition.
    /// </remarks>
    public class ControlSla : Control
    {
        private readonly List<ControlSla> _items = [];

        /// <summary>
        /// Gets the agreements framed by the control. While it is empty the
        /// control renders as one agreement of its own.
        /// </summary>
        public IEnumerable<ControlSla> Items => _items;

        /// <summary>
        /// Gets or sets a value indicating whether the summary of the framed
        /// agreements is shown. It has no meaning for a single agreement.
        /// </summary>
        public Func<IRenderControlContext, bool> ShowSummary { get; set; } = _ => true;

        /// <summary>
        /// The format the timestamps are written in. It carries no zone offset
        /// and is read back as local time, exactly like the schedule control -
        /// converting to UTC here would shift every deadline for every visitor
        /// that is not on the server's offset.
        /// </summary>
        internal const string TimestampFormat = "yyyy-MM-ddTHH:mm:ss";

        /// <summary>
        /// Gets or sets the name of the agreement.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Gets or sets the optional line below the name, for example what the
        /// agreement covers or who owns it.
        /// </summary>
        public Func<IRenderControlContext, string> Description { get; set; }

        /// <summary>
        /// Gets or sets the moment the clock of the first cycle started.
        /// </summary>
        public Func<IRenderControlContext, DateTime> Start { get; set; }

        /// <summary>
        /// Gets or sets the time budget granted per cycle. A non-positive
        /// budget leaves the agreement without time and reports as violated
        /// from the first moment, so a widget that was never configured is
        /// impossible to miss on a dashboard.
        /// </summary>
        public Func<IRenderControlContext, TimeSpan> Target { get; set; }

        /// <summary>
        /// Gets or sets the fraction of the budget after which the agreement
        /// counts as at risk, between 0 and 1.
        /// </summary>
        public Func<IRenderControlContext, double> WarningThreshold { get; set; }

        /// <summary>
        /// Gets or sets the interval after which the agreement starts over with
        /// a fresh budget.
        /// </summary>
        public Func<IRenderControlContext, TypeRecurrenceSla> Recurrence { get; set; }

        /// <summary>
        /// Gets or sets the number of cycles the agreement runs for, where 0
        /// means unlimited.
        /// </summary>
        public Func<IRenderControlContext, int> Cycles { get; set; }

        /// <summary>
        /// Gets or sets the time the agreement has spent paused so far.
        /// </summary>
        public Func<IRenderControlContext, TimeSpan> PauseTotal { get; set; }

        /// <summary>
        /// Gets or sets the moment the current pause began, or null while the
        /// clock is running.
        /// </summary>
        public Func<IRenderControlContext, DateTime?> PausedSince { get; set; }

        /// <summary>
        /// Gets or sets the one-based cycle that was settled manually.
        /// </summary>
        public Func<IRenderControlContext, int?> FulfilledCycle { get; set; }

        /// <summary>
        /// Gets or sets the moment the agreement was settled manually.
        /// </summary>
        public Func<IRenderControlContext, DateTime?> FulfilledAt { get; set; }

        /// <summary>
        /// Gets or sets the moment the agreement is evaluated at. It defaults to
        /// the current server time and exists so a test - or a report over a
        /// past period - can render the widget as it looked at any moment.
        /// </summary>
        public Func<IRenderControlContext, DateTime> Now { get; set; } = _ => DateTime.Now;

        /// <summary>
        /// Gets or sets the endpoint the client sends a requested transition to.
        /// Without it the actions raise their events only, which is enough for a
        /// page that handles them itself and for a demo that persists nothing.
        /// </summary>
        public Func<IRenderControlContext, IUri> ActionUri { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the pause, resume and settle
        /// buttons are rendered.
        /// </summary>
        public Func<IRenderControlContext, bool> ShowActions { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets a value indicating whether the client keeps the widget
        /// running - the countdown, the status changes and the cycle rollover.
        /// Switched off, the widget stays exactly as the server rendered it,
        /// which is what a printable report or a table of many rows wants.
        /// </summary>
        public Func<IRenderControlContext, bool> Live { get; set; } = _ => true;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlSla(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class that frames the given
        /// agreements.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The agreements to frame.</param>
        public ControlSla(string id, params ControlSla[] items)
            : this(id)
        {
            Add(items);
        }

        /// <summary>
        /// Adds one or more agreements, which turns the control into the panel
        /// that frames them.
        /// </summary>
        /// <param name="items">The agreements to add.</param>
        /// <returns>The current instance to allow method chaining.</returns>
        public ControlSla Add(params ControlSla[] items)
        {
            _items.AddRange(items.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Adopts the state of an existing definition, which spares a caller
        /// that already keeps its agreements as <see cref="SlaDefinition"/> -
        /// a store, a REST endpoint - from restating every property by hand.
        /// </summary>
        /// <param name="definition">The definition to adopt.</param>
        /// <returns>The current instance to allow method chaining.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the definition is null.</exception>
        public ControlSla Bind(SlaDefinition definition)
        {
            ArgumentNullException.ThrowIfNull(definition);

            Start = _ => definition.Start;
            Target = _ => definition.Target;
            WarningThreshold = _ => definition.WarningThreshold;
            Recurrence = _ => definition.Recurrence;
            Cycles = _ => definition.Cycles;
            PauseTotal = _ => definition.PauseTotal;
            PausedSince = _ => definition.PausedSince;
            FulfilledCycle = _ => definition.FulfilledCycle;
            FulfilledAt = _ => definition.FulfilledAt;

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
            return _items.Count > 0
                ? RenderPanel(renderContext, visualTree)
                : RenderHost(renderContext, visualTree, "wx-webui-sla");
        }

        /// <summary>
        /// Builds the panel that frames several agreements.
        /// </summary>
        /// <remarks>
        /// The summary and the colour of the panel are computed from the same
        /// evaluation the tiles render, and the client keeps both current as the
        /// tiles change status - so a panel can never disagree with what is
        /// shown underneath it.
        /// </remarks>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>The panel element.</returns>
        private IHtmlElement RenderPanel(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var evaluations = _items.Select(x => x.Evaluate(renderContext)).ToList();
            var label = Label?.Invoke(renderContext);
            var description = Description?.Invoke(renderContext);
            var showSummary = ShowSummary?.Invoke(renderContext) ?? true;

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate
                (
                    "wx-sla-group wx-webui-sla-group",
                    SlaSummary.Worst(evaluations).ToClass(),
                    GetClasses(renderContext)
                ),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext) ?? "group"
            };

            html.AddUserAttribute("aria-label", label);

            html.Add(RenderPanelHeader(label, evaluations, showSummary));
            html.Add(!string.IsNullOrWhiteSpace(description)
                ? new HtmlElementTextContentDiv(new HtmlText(description)) { Class = "wx-sla-group-description" }
                : null);
            html.Add(new HtmlElementTextContentDiv(_items.Select(x => x.Render(renderContext, visualTree)).ToArray())
            {
                Class = "wx-sla-group-items"
            });

            return html;
        }

        /// <summary>
        /// Builds the heading and the summary of the panel.
        /// </summary>
        /// <param name="label">The heading.</param>
        /// <param name="evaluations">The status of the framed agreements.</param>
        /// <param name="showSummary">Whether the summary is shown.</param>
        /// <returns>The header element, or null when there is nothing to show.</returns>
        private static IHtmlElement RenderPanelHeader(string label, IEnumerable<SlaEvaluation> evaluations, bool showSummary)
        {
            if (string.IsNullOrWhiteSpace(label) && !showSummary)
            {
                return null;
            }

            var summary = new HtmlElementTextSemanticsSpan(new HtmlText(SlaSummary.Text(evaluations)))
            {
                Class = "wx-sla-summary",
                // the summary changes on its own as the tiles below it move
                // between the states, so it has to announce itself
                Role = "status"
            };
            summary.AddUserAttribute("aria-live", "polite");

            return new HtmlElementTextContentDiv() { Class = "wx-sla-group-header" }
                .Add(!string.IsNullOrWhiteSpace(label)
                    ? new HtmlElementTextSemanticsSpan(new HtmlText(label)) { Class = "wx-sla-group-label" }
                    : null)
                .Add(showSummary ? summary : null);
        }

        /// <summary>
        /// Evaluates the agreement at the moment the widget would be rendered at.
        /// </summary>
        /// <remarks>
        /// A container that frames several agreements - a group, a management
        /// surface - has to know what each of them says before it can summarise
        /// them, and it must arrive at the same answer the tile shows. Asking
        /// the control rather than rebuilding a definition next to it is what
        /// guarantees that.
        /// </remarks>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The status of the agreement.</returns>
        public SlaEvaluation Evaluate(IRenderControlContext renderContext)
        {
            return SlaEvaluator.Evaluate(CreateDefinition(renderContext), Now?.Invoke(renderContext) ?? DateTime.Now);
        }

        /// <summary>
        /// Builds the tile with its state, its parts and its actions.
        /// </summary>
        /// <remarks>
        /// It is the single place the client contract is emitted, so a derived
        /// control - the data-driven agreement of WebExpress.WebApp - reuses it
        /// under its own marker class instead of restating twenty attributes
        /// that would then have to be kept in step by hand.
        /// </remarks>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="cssClass">The marker class the client registers the control under.</param>
        /// <returns>The host element.</returns>
        protected IHtmlElement RenderHost(IRenderControlContext renderContext, IVisualTreeControl visualTree, string cssClass)
        {
            var definition = CreateDefinition(renderContext);
            var moment = Now?.Invoke(renderContext) ?? DateTime.Now;
            var evaluation = SlaEvaluator.Evaluate(definition, moment);
            var label = Label?.Invoke(renderContext);
            var description = Description?.Invoke(renderContext);
            var iconTheme = visualTree?.IconTheme ?? TypeIconTheme.Default;

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-sla", cssClass, evaluation.Status.ToClass(), GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext) ?? "group"
            };

            // the group needs a name of its own, otherwise a screen reader
            // announces a bare group and leaves the visitor to guess which of
            // the agreements on the dashboard it belongs to
            html.AddUserAttribute("aria-label", label);

            AddState(html, definition, evaluation, moment, renderContext);

            html.Add(RenderHeader(label, evaluation));
            html.Add(!string.IsNullOrWhiteSpace(description)
                ? new HtmlElementTextContentDiv(new HtmlText(description)) { Class = "wx-sla-description" }
                : null);
            html.Add(RenderMeter(evaluation));
            html.Add(RenderFooter(evaluation));
            html.Add((ShowActions?.Invoke(renderContext) ?? true) ? RenderActions(evaluation, iconTheme) : null);

            return html;
        }

        /// <summary>
        /// Assembles the definition the widget is evaluated from.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The definition.</returns>
        protected SlaDefinition CreateDefinition(IRenderControlContext renderContext)
        {
            var definition = new SlaDefinition
            {
                Start = Start?.Invoke(renderContext) ?? DateTime.Now,
                Target = Target?.Invoke(renderContext) ?? TimeSpan.Zero,
                Recurrence = Recurrence?.Invoke(renderContext) ?? TypeRecurrenceSla.None,
                PauseTotal = PauseTotal?.Invoke(renderContext) ?? TimeSpan.Zero,
                PausedSince = PausedSince?.Invoke(renderContext),
                FulfilledCycle = FulfilledCycle?.Invoke(renderContext),
                FulfilledAt = FulfilledAt?.Invoke(renderContext)
            };

            // the defaults of the definition carry the reasoning behind them and
            // must not be overwritten with a zero just because a property was
            // left unset
            if (WarningThreshold is not null)
            {
                definition.WarningThreshold = WarningThreshold(renderContext);
            }

            if (Cycles is not null)
            {
                definition.Cycles = Cycles(renderContext);
            }

            return definition;
        }

        /// <summary>
        /// Writes the state the client runtime picks the widget up from.
        /// </summary>
        /// <remarks>
        /// The durations are written in seconds rather than as timestamps
        /// wherever the client counts with them: a duration is immune to the
        /// skew between the server clock and the visitor's clock, which a
        /// countdown built from an absolute deadline is not. The timestamps are
        /// carried alongside for display only.
        /// </remarks>
        /// <param name="html">The host element.</param>
        /// <param name="definition">The evaluated definition.</param>
        /// <param name="evaluation">The result of the evaluation.</param>
        /// <param name="moment">The moment the widget was evaluated at.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        protected void AddState
        (
            IHtmlElement html,
            SlaDefinition definition,
            SlaEvaluation evaluation,
            DateTime moment,
            IRenderControlContext renderContext
        )
        {
            html.AddUserAttribute("data-status", evaluation.Status.ToValue())
                .AddUserAttribute("data-now", Timestamp(moment))
                .AddUserAttribute("data-target", Seconds(evaluation.Budget))
                .AddUserAttribute("data-elapsed", Seconds(evaluation.Elapsed))
                .AddUserAttribute("data-remaining", Seconds(evaluation.Remaining))
                .AddUserAttribute("data-progress", evaluation.Progress.ToString("0.####", CultureInfo.InvariantCulture))
                .AddUserAttribute("data-warning-threshold", definition.WarningThreshold.ToString("0.####", CultureInfo.InvariantCulture))
                .AddUserAttribute("data-recurrence", definition.Recurrence.ToValue())
                .AddUserAttribute("data-period", evaluation.Period > TimeSpan.Zero ? Seconds(evaluation.Period) : null)
                .AddUserAttribute("data-cycle", evaluation.Cycle.ToString(CultureInfo.InvariantCulture))
                .AddUserAttribute("data-cycles", evaluation.Cycles > 0 ? evaluation.Cycles.ToString(CultureInfo.InvariantCulture) : null)
                .AddUserAttribute("data-deadline", Timestamp(evaluation.Deadline))
                .AddUserAttribute("data-reset", Timestamp(evaluation.Reset))
                .AddUserAttribute("data-fulfilled", Timestamp(definition.FulfilledAt))
                // the running, unsettled and live cases are the defaults; only
                // the deviations are worth an attribute
                .AddUserAttribute("data-paused", evaluation.IsPaused ? "true" : null)
                .AddUserAttribute("data-settled", evaluation.IsSettled ? "true" : null)
                .AddUserAttribute("data-live", (Live?.Invoke(renderContext) ?? true) ? null : "false")
                .AddUserAttribute("data-action-uri", ActionUri?.Invoke(renderContext)?.ToString());
        }

        /// <summary>
        /// Builds the name and the status badge.
        /// </summary>
        /// <param name="label">The name of the agreement.</param>
        /// <param name="evaluation">The result of the evaluation.</param>
        /// <returns>The header element.</returns>
        protected static IHtmlElement RenderHeader(string label, SlaEvaluation evaluation)
        {
            var status = new HtmlElementTextSemanticsSpan(new HtmlText(StatusText(evaluation.Status)))
            {
                Class = "wx-sla-status",
                // the badge is the one part that changes on its own, so it is
                // the one part that has to announce itself
                Role = "status"
            };
            status.AddUserAttribute("aria-live", "polite");

            return new HtmlElementTextContentDiv() { Class = "wx-sla-header" }
                .Add(!string.IsNullOrWhiteSpace(label)
                    ? new HtmlElementTextSemanticsSpan(new HtmlText(label)) { Class = "wx-sla-label" }
                    : null)
                .Add(status);
        }

        /// <summary>
        /// Builds the meter of the consumed budget.
        /// </summary>
        /// <param name="evaluation">The result of the evaluation.</param>
        /// <returns>The meter element.</returns>
        protected static IHtmlElement RenderMeter(SlaEvaluation evaluation)
        {
            var percent = (int)Math.Round(evaluation.Progress * 100d, MidpointRounding.AwayFromZero);

            var value = new HtmlElementTextContentDiv()
            {
                Class = "wx-sla-meter-value",
                Style = string.Create(CultureInfo.InvariantCulture, $"width: {percent}%;")
            };

            var track = new HtmlElementTextContentDiv(value) { Class = "wx-sla-meter-track" };

            var meter = new HtmlElementTextContentDiv(track)
            {
                Class = "wx-sla-meter",
                Role = "progressbar"
            };

            meter.AddUserAttribute("aria-valuemin", "0")
                 .AddUserAttribute("aria-valuemax", "100")
                 .AddUserAttribute("aria-valuenow", percent.ToString(CultureInfo.InvariantCulture))
                 // the bare percentage says nothing about the deadline, which is
                 // the number the widget exists for
                 .AddUserAttribute("aria-valuetext", $"{percent}% - {RemainingText(evaluation.Remaining)}");

            return meter;
        }

        /// <summary>
        /// Builds the remaining time and the cycle counter.
        /// </summary>
        /// <param name="evaluation">The result of the evaluation.</param>
        /// <returns>The footer element.</returns>
        protected static IHtmlElement RenderFooter(SlaEvaluation evaluation)
        {
            var remaining = new HtmlElementTextSemanticsTime(new HtmlText(RemainingText(evaluation.Remaining)))
            {
                Class = "wx-sla-remaining"
            };
            remaining.AddUserAttribute("datetime", Duration(evaluation.Remaining));

            var cycle = evaluation.Cycles == 1 && evaluation.Cycle == 1
                ? null
                : new HtmlElementTextSemanticsSpan(new HtmlText(CycleText(evaluation))) { Class = "wx-sla-cycle" };

            return new HtmlElementTextContentDiv() { Class = "wx-sla-footer" }
                .Add(remaining)
                .Add(cycle);
        }

        /// <summary>
        /// Builds the transition buttons.
        /// </summary>
        /// <remarks>
        /// A transition that would do nothing is rendered as a disabled button
        /// rather than dropped, so the row of actions keeps its shape while the
        /// agreement moves between the states.
        /// </remarks>
        /// <param name="evaluation">The result of the evaluation.</param>
        /// <param name="iconTheme">The icon theme of the page.</param>
        /// <returns>The actions element.</returns>
        protected static IHtmlElement RenderActions(SlaEvaluation evaluation, TypeIconTheme iconTheme)
        {
            return new HtmlElementTextContentDiv() { Class = "wx-sla-actions" }
                .Add(RenderAction("pause", "Pause", new IconPause(iconTheme), evaluation.IsPaused))
                .Add(RenderAction("resume", "Resume", new IconPlay(iconTheme), !evaluation.IsPaused))
                .Add(RenderAction("fulfill", "Mark as fulfilled", new IconCheck(iconTheme), evaluation.IsSettled));
        }

        /// <summary>
        /// Builds a single transition button.
        /// </summary>
        /// <param name="action">The token the client dispatches the transition under.</param>
        /// <param name="label">The accessible name of the button.</param>
        /// <param name="icon">The icon shown on the button.</param>
        /// <param name="disabled">Whether the transition is unavailable.</param>
        /// <returns>The button element.</returns>
        protected static IHtmlElement RenderAction(string action, string label, Icon icon, bool disabled)
        {
            var button = new HtmlElementFieldButton(new HtmlElementTextSemanticsI() { Class = icon.Class })
            {
                Type = "button",
                Class = "wx-sla-action",
                Title = label
            };

            // the button carries an icon only, so without the label a screen
            // reader would announce an unnamed button
            button.AddUserAttribute("aria-label", label)
                  .AddUserAttribute("data-wx-sla-action", action);

            button.Disabled = disabled;

            return button;
        }

        /// <summary>
        /// Returns the English default for a status. The client replaces it with
        /// the visitor's language; it is rendered here so the widget is readable
        /// before - and without - the client runtime.
        /// </summary>
        /// <param name="status">The status.</param>
        /// <returns>The text.</returns>
        protected static string StatusText(TypeStatusSla status)
        {
            return status switch
            {
                TypeStatusSla.AtRisk => "At risk",
                TypeStatusSla.Violated => "Violated",
                TypeStatusSla.Paused => "Paused",
                _ => "Fulfilled",
            };
        }

        /// <summary>
        /// Returns the English default for the cycle counter.
        /// </summary>
        /// <param name="evaluation">The result of the evaluation.</param>
        /// <returns>The text.</returns>
        protected static string CycleText(SlaEvaluation evaluation)
        {
            return evaluation.Cycles > 0
                ? $"Cycle {evaluation.Cycle} of {evaluation.Cycles}"
                : $"Cycle {evaluation.Cycle}";
        }

        /// <summary>
        /// Returns the English default for the remaining time, as a compact two
        /// unit reading - a countdown that spells out four units is read as a
        /// number rather than as a warning.
        /// </summary>
        /// <param name="remaining">The remaining time.</param>
        /// <returns>The text.</returns>
        protected static string RemainingText(TimeSpan remaining)
        {
            var overrun = remaining < TimeSpan.Zero;
            var value = overrun ? remaining.Negate() : remaining;
            var sign = overrun ? "-" : string.Empty;

            if (value.Days > 0)
            {
                return value.Hours > 0 ? $"{sign}{value.Days} d {value.Hours} h" : $"{sign}{value.Days} d";
            }

            if (value.Hours > 0)
            {
                return value.Minutes > 0 ? $"{sign}{value.Hours} h {value.Minutes} min" : $"{sign}{value.Hours} h";
            }

            return value.Minutes > 0 ? $"{sign}{value.Minutes} min" : $"{sign}{value.Seconds} s";
        }

        /// <summary>
        /// Formats a duration as an ISO 8601 duration for the datetime attribute.
        /// </summary>
        /// <param name="value">The duration.</param>
        /// <returns>The formatted duration.</returns>
        protected static string Duration(TimeSpan value)
        {
            var negative = value < TimeSpan.Zero;
            var absolute = negative ? value.Negate() : value;
            var date = absolute.Days > 0 ? $"{absolute.Days}D" : string.Empty;
            var time = $"{absolute.Hours}H{absolute.Minutes}M{absolute.Seconds}S";

            return $"{(negative ? "-" : string.Empty)}P{date}T{time}";
        }

        /// <summary>
        /// Formats a duration as whole seconds.
        /// </summary>
        /// <param name="value">The duration.</param>
        /// <returns>The formatted duration.</returns>
        private static string Seconds(TimeSpan value)
        {
            return ((long)Math.Round(value.TotalSeconds, MidpointRounding.AwayFromZero))
                .ToString(CultureInfo.InvariantCulture);
        }

        /// <summary>
        /// Formats a moment for an attribute, or returns null when there is none.
        /// </summary>
        /// <param name="value">The moment.</param>
        /// <returns>The formatted moment, or null.</returns>
        private static string Timestamp(DateTime? value)
        {
            return value?.ToString(TimestampFormat, CultureInfo.InvariantCulture);
        }
    }
}
