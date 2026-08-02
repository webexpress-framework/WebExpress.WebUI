/**
 * Keeps a service level agreement widget current.
 *
 * The server renders the widget complete and correct for the moment it was
 * evaluated at (see ControlSla), so this control never builds the markup - it
 * only takes over what the server cannot know: the passing of time. It counts
 * the budget down, moves the widget between the states as the thresholds are
 * crossed, rolls a periodic agreement over into its next cycle and localises
 * the labels the server wrote in English.
 *
 * The countdown runs on the durations the server sent, not on its timestamps.
 * A visitor whose clock is a few minutes off the server's would otherwise see a
 * deadline that is wrong by exactly that offset.
 */
webexpress.webui.SlaCtrl = class extends webexpress.webui.Ctrl {
    /**
     * The interval the countdown is refreshed in, in milliseconds.
     */
    static TICK_INTERVAL = 1000;

    /**
     * The CSS classes the status is carried by, indexed by the status token.
     */
    static STATUS_CLASSES = {
        "fulfilled": "wx-sla-fulfilled",
        "at-risk": "wx-sla-at-risk",
        "violated": "wx-sla-violated",
        "paused": "wx-sla-paused"
    };

    /**
     * Constructor
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        this._readState();
        this._collectParts();
        this.render();
        this._bindActions();

        if (this._live) {
            this._timer = setInterval(() => this.update(), webexpress.webui.SlaCtrl.TICK_INTERVAL);
        }
    }

    /**
     * Reads the state the server wrote onto the host element.
     */
    _readState() {
        const data = this._element.dataset;

        this._budget = this._seconds(data.target);
        this._elapsed = this._seconds(data.elapsed);
        this._period = this._seconds(data.period);
        this._threshold = this._number(data.warningThreshold, 0.8);
        this._cycle = Math.max(1, Math.trunc(this._number(data.cycle, 1)));
        this._cycles = Math.max(0, Math.trunc(this._number(data.cycles, 0)));
        this._paused = data.paused === "true";
        this._settled = data.settled === "true";
        this._live = data.live !== "false";
        this._actionUri = data.actionUri || null;
        this._status = data.status || "fulfilled";

        this._baseElapsed = this._elapsed;
        this._baseTime = Date.now();
    }

    /**
     * Looks up the parts of the widget the countdown writes into. Every one of
     * them is optional: a host that was reduced to its data attributes stays a
     * valid, if silent, widget.
     */
    _collectParts() {
        this._statusElement = this._element.querySelector(".wx-sla-status");
        this._meter = this._element.querySelector(".wx-sla-meter");
        this._meterValue = this._element.querySelector(".wx-sla-meter-value");
        this._remainingElement = this._element.querySelector(".wx-sla-remaining");
        this._cycleElement = this._element.querySelector(".wx-sla-cycle");
        this._actions = Array.from(this._element.querySelectorAll("[data-wx-sla-action]"));
    }

    /**
     * Registers the click handlers of the transition buttons and gives them
     * their localised accessible names.
     */
    _bindActions() {
        this._actions.forEach((button) => {
            const action = button.getAttribute("data-wx-sla-action");
            const label = this._i18n(`webexpress.webui:sla.${action}`, button.getAttribute("aria-label"));

            button.setAttribute("aria-label", label);
            button.setAttribute("title", label);
            button.addEventListener("click", () => this.execute(action));
        });
    }

    /**
     * Advances the widget to the current moment and renders it.
     *
     * The elapsed time is derived from the wall clock rather than accumulated
     * per tick, because a browser throttles the timers of a background tab and
     * a widget that counted ticks would come back minutes behind.
     */
    update() {
        if (!this._paused) {
            this._elapsed = this._baseElapsed + ((Date.now() - this._baseTime) / 1000);
            this._rollover();
        }

        this.render();
    }

    /**
     * Starts the next cycle of a periodic agreement once the current one runs
     * out. The last cycle of a limited agreement is left open ended, so a cycle
     * that was never settled stays visible as a violation instead of quietly
     * resetting.
     */
    _rollover() {
        if (this._period <= 0) {
            return;
        }

        while (this._elapsed >= this._period && (this._cycles === 0 || this._cycle < this._cycles)) {
            this._elapsed -= this._period;
            this._baseElapsed -= this._period;
            this._cycle++;
            this._settled = false;

            this._element.setAttribute("data-cycle", String(this._cycle));
            this._element.removeAttribute("data-settled");
            this._dispatch(webexpress.webui.Event.SLA_CYCLE_EVENT, {
                cycle: this._cycle,
                cycles: this._cycles
            });
        }
    }

    /**
     * Derives the status from the current state. The rules mirror the server
     * side evaluator exactly - a widget that disagreed with the endpoint it is
     * fed from would flip its colour on every reload.
     * @returns {string} The status token.
     */
    _evaluate() {
        if (this._settled) {
            return "fulfilled";
        }

        if (this._paused) {
            return "paused";
        }

        if (this._remaining() <= 0) {
            return "violated";
        }

        return this._elapsed >= this._budget * this._threshold ? "at-risk" : "fulfilled";
    }

    /**
     * Returns the time left in the current cycle, in seconds.
     * @returns {number} The remaining seconds, negative once the budget is overrun.
     */
    _remaining() {
        return this._budget - this._elapsed;
    }

    /**
     * Writes the current state into the widget.
     */
    render() {
        const status = this._evaluate();
        const remaining = this._remaining();
        const progress = this._budget > 0 ? Math.min(Math.max(this._elapsed / this._budget, 0), 1) : 1;
        const percent = Math.round(progress * 100);

        this._applyStatus(status);

        if (this._statusElement) {
            this._statusElement.textContent = this._i18n(`webexpress.webui:sla.${status}`, this._statusElement.textContent);
        }

        if (this._meterValue) {
            this._meterValue.style.width = `${percent}%`;
        }

        const text = this._remainingText(remaining);

        if (this._meter) {
            this._meter.setAttribute("aria-valuenow", String(percent));
            this._meter.setAttribute("aria-valuetext", `${percent}% - ${text}`);
        }

        if (this._remainingElement) {
            this._remainingElement.textContent = text;
            this._remainingElement.setAttribute("datetime", this._duration(remaining));
        }

        if (this._cycleElement) {
            this._cycleElement.textContent = this._cycleText();
        }

        this._element.setAttribute("data-elapsed", String(Math.round(this._elapsed)));
        this._element.setAttribute("data-remaining", String(Math.round(remaining)));
        this._element.setAttribute("data-progress", progress.toFixed(4));

        this._updateActions();
    }

    /**
     * Moves the widget to a status and reports the change once.
     * @param {string} status - The status token.
     */
    _applyStatus(status) {
        const classes = webexpress.webui.SlaCtrl.STATUS_CLASSES;

        Object.keys(classes).forEach((key) => {
            this._element.classList.toggle(classes[key], key === status);
        });

        this._element.setAttribute("data-status", status);

        if (status !== this._status) {
            const previous = this._status;
            this._status = status;

            this._dispatch(webexpress.webui.Event.SLA_STATUS_CHANGE_EVENT, {
                status: status,
                previous: previous,
                cycle: this._cycle,
                remaining: this._remaining()
            });
        }
    }

    /**
     * Enables the transitions that would change something and disables the rest,
     * so the row of actions keeps its shape as the agreement moves between the
     * states.
     */
    _updateActions() {
        this._actions.forEach((button) => {
            switch (button.getAttribute("data-wx-sla-action")) {
                case "pause":
                    button.disabled = this._paused;
                    break;
                case "resume":
                    button.disabled = !this._paused;
                    break;
                case "fulfill":
                    button.disabled = this._settled;
                    break;
            }
        });
    }

    /**
     * Applies a transition, reports it and - when the widget was given an
     * endpoint - persists it.
     *
     * The transition is applied locally first: the visitor asked for it, the
     * outcome is known, and waiting for a round trip to grey out a paused
     * agreement makes the button feel broken. A failing request is reported
     * through the data error event, which is where a page that cares about the
     * discrepancy reloads.
     *
     * @param {string} action - The transition: pause, resume or fulfill.
     */
    execute(action) {
        switch (action) {
            case "pause":
                if (this._paused) {
                    return;
                }
                this._paused = true;
                this._element.setAttribute("data-paused", "true");
                break;

            case "resume":
                if (!this._paused) {
                    return;
                }
                this._paused = false;
                this._element.removeAttribute("data-paused");
                // the clock restarts where it stopped, so the pause costs the
                // agreement nothing
                this._baseElapsed = this._elapsed;
                this._baseTime = Date.now();
                break;

            case "fulfill":
                if (this._settled) {
                    return;
                }
                this._settled = true;
                this._element.setAttribute("data-settled", "true");
                // settling releases the clock as well, mirroring the server
                if (this._paused) {
                    this._paused = false;
                    this._element.removeAttribute("data-paused");
                    this._baseElapsed = this._elapsed;
                    this._baseTime = Date.now();
                }
                break;

            default:
                return;
        }

        this.render();
        this._dispatch(webexpress.webui.Event.SLA_ACTION_EVENT, {
            action: action,
            status: this._status,
            cycle: this._cycle,
            remaining: this._remaining()
        });

        this._persist(action);
    }

    /**
     * Sends a transition to the endpoint the widget was given. It is the single
     * seam a data-driven variant overrides to route the request through its own
     * service instead of a raw one.
     * @param {string} action - The transition.
     * @returns {Promise<void>} Resolves when the transition was sent.
     */
    _persist(action) {
        if (!this._actionUri) {
            return Promise.resolve();
        }

        return fetch(this._actionUri, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: action })
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then((state) => this.apply(state))
            .catch((error) => {
                this._dispatch(webexpress.webui.Event.DATA_ERROR_EVENT, {
                    action: action,
                    error: String(error)
                });
            });
    }

    /**
     * Adopts a state the server computed, which is how the widget recovers from
     * a local guess that the endpoint did not agree with.
     * @param {object} state - The state: target, elapsed, period, cycle, cycles, paused, settled.
     */
    apply(state) {
        if (!state || typeof state !== "object") {
            return;
        }

        if (state.target != null) {
            this._budget = this._seconds(state.target);
        }
        if (state.elapsed != null) {
            this._elapsed = this._seconds(state.elapsed);
        }
        if (state.period != null) {
            this._period = this._seconds(state.period);
        }
        if (state.cycle != null) {
            this._cycle = Math.max(1, Math.trunc(this._number(state.cycle, this._cycle)));
        }
        if (state.cycles != null) {
            this._cycles = Math.max(0, Math.trunc(this._number(state.cycles, this._cycles)));
        }
        if (state.paused != null) {
            this._paused = state.paused === true || state.paused === "true";
        }
        if (state.settled != null) {
            this._settled = state.settled === true || state.settled === "true";
        }

        this._baseElapsed = this._elapsed;
        this._baseTime = Date.now();

        this.render();
    }

    /**
     * Gets the status the widget currently shows.
     * @returns {string} The status token.
     */
    get status() {
        return this._status;
    }

    /**
     * Gets the time left in the current cycle, in seconds.
     * @returns {number} The remaining seconds.
     */
    get remaining() {
        return this._remaining();
    }

    /**
     * Gets the one-based number of the current cycle.
     * @returns {number} The cycle.
     */
    get cycle() {
        return this._cycle;
    }

    /**
     * Builds the localised reading of the remaining time, as a compact two unit
     * value - a countdown that spells out four units is read as a number rather
     * than as a warning.
     * @param {number} remaining - The remaining seconds.
     * @returns {string} The text.
     */
    _remainingText(remaining) {
        const overrun = remaining < 0;
        const total = Math.floor(Math.abs(remaining));
        const days = Math.floor(total / 86400);
        const hours = Math.floor((total % 86400) / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = total % 60;

        const unit = (key, fallback) => this._i18n(`webexpress.webui:sla.unit.${key}`, fallback);
        let text;

        if (days > 0) {
            text = hours > 0
                ? `${days} ${unit("day", "d")} ${hours} ${unit("hour", "h")}`
                : `${days} ${unit("day", "d")}`;
        } else if (hours > 0) {
            text = minutes > 0
                ? `${hours} ${unit("hour", "h")} ${minutes} ${unit("minute", "min")}`
                : `${hours} ${unit("hour", "h")}`;
        } else if (minutes > 0) {
            text = `${minutes} ${unit("minute", "min")}`;
        } else {
            text = `${seconds} ${unit("second", "s")}`;
        }

        return overrun
            ? this._i18n("webexpress.webui:sla.overrun", "{0} overdue").replace("{0}", text)
            : text;
    }

    /**
     * Builds the localised cycle counter.
     * @returns {string} The text.
     */
    _cycleText() {
        return this._cycles > 0
            ? this._i18n("webexpress.webui:sla.cycle", "Cycle {0} of {1}")
                .replace("{0}", String(this._cycle))
                .replace("{1}", String(this._cycles))
            : this._i18n("webexpress.webui:sla.cycle.open", "Cycle {0}")
                .replace("{0}", String(this._cycle));
    }

    /**
     * Formats a duration as an ISO 8601 duration for the datetime attribute.
     * @param {number} value - The duration in seconds.
     * @returns {string} The formatted duration.
     */
    _duration(value) {
        const total = Math.floor(Math.abs(value));
        const days = Math.floor(total / 86400);
        const date = days > 0 ? `${days}D` : "";
        const time = `${Math.floor((total % 86400) / 3600)}H${Math.floor((total % 3600) / 60)}M${total % 60}S`;

        return `${value < 0 ? "-" : ""}P${date}T${time}`;
    }

    /**
     * Parses a duration written as whole seconds.
     * @param {string|number} value - The raw value.
     * @returns {number} The seconds, or 0 when the value is missing or unusable.
     */
    _seconds(value) {
        return this._number(value, 0);
    }

    /**
     * Parses a number, falling back when the value is missing or unusable.
     * @param {string|number} value - The raw value.
     * @param {number} fallback - The value to fall back to.
     * @returns {number} The parsed number.
     */
    _number(value, fallback) {
        const parsed = parseFloat(value);

        return isNaN(parsed) ? fallback : parsed;
    }

    /**
     * Stops the countdown.
     */
    destroy() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }
};

/**
 * Keeps the summary of a panel of service level agreements current.
 *
 * The panel is the second rendering of the same control: filled with
 * agreements, ControlSla frames them instead of being one. The two renderings
 * are different enough in the DOM to warrant their own client - one counts a
 * budget down, the other condenses what the first ones report - but they ship
 * as one control and one asset.
 *
 * The panel computes nothing of its own: it reads the status the tiles already
 * carry and condenses it. The tiles report a change by bubbling an event, so
 * one listener on the panel serves all of them and keeps serving a tile that is
 * added later.
 */
webexpress.webui.SlaGroupCtrl = class extends webexpress.webui.Ctrl {
    /**
     * The CSS classes the aggregated status is carried by, indexed by the
     * status token.
     * @returns {object} The classes.
     */
    static get STATUS_CLASSES() {
        return webexpress.webui.SlaCtrl.STATUS_CLASSES;
    }

    /**
     * The order the statuses are reported in: the ones that need attention
     * first, because a summary is read from the left.
     */
    static ORDER = ["violated", "at-risk", "paused", "fulfilled"];

    /**
     * Constructor
     * @param {HTMLElement} element The host element.
     */
    constructor(element) {
        super(element);

        this._summary = element.querySelector(".wx-sla-summary");
        this._onChange = () => this.render();

        element.addEventListener(webexpress.webui.Event.SLA_STATUS_CHANGE_EVENT, this._onChange);
        element.addEventListener(webexpress.webui.Event.SLA_CYCLE_EVENT, this._onChange);

        this.render();
    }

    /**
     * Returns the agreements framed by the panel.
     * @returns {Array<HTMLElement>} The agreement hosts.
     */
    get items() {
        return Array.from(this._element.querySelectorAll(".wx-sla"));
    }

    /**
     * Counts the agreements per status.
     * @returns {object} The counts, indexed by the status token.
     */
    _count() {
        const counts = {};

        for (const item of this.items) {
            const status = item.getAttribute("data-status");

            if (status) {
                counts[status] = (counts[status] || 0) + 1;
            }
        }

        return counts;
    }

    /**
     * Returns the status the panel takes its colour from. The rule mirrors the
     * server side SlaSummary exactly: paused only wins when every agreement is
     * paused, because a single stopped clock among running ones says nothing
     * about the set.
     * @param {object} counts - The counts per status.
     * @param {number} total - The number of agreements.
     * @returns {string} The status token.
     */
    _worst(counts, total) {
        if (counts["violated"]) {
            return "violated";
        }

        if (counts["at-risk"]) {
            return "at-risk";
        }

        if (total > 0 && counts["paused"] === total) {
            return "paused";
        }

        return "fulfilled";
    }

    /**
     * Writes the summary and the aggregated status into the panel.
     */
    render() {
        const counts = this._count();
        const total = this.items.length;
        const worst = this._worst(counts, total);
        const classes = webexpress.webui.SlaGroupCtrl.STATUS_CLASSES;

        Object.keys(classes).forEach((key) => {
            this._element.classList.toggle(classes[key], key === worst);
        });

        if (this._summary) {
            this._summary.textContent = this._text(counts, total);
        }
    }

    /**
     * Builds the localised summary: a count per status with the empty ones left
     * out.
     * @param {object} counts - The counts per status.
     * @param {number} total - The number of agreements.
     * @returns {string} The text.
     */
    _text(counts, total) {
        if (total === 0) {
            return this._i18n("webexpress.webui:sla.summary.empty", "No agreements");
        }

        return webexpress.webui.SlaGroupCtrl.ORDER
            .filter((status) => counts[status] > 0)
            .map((status) => this._i18n(`webexpress.webui:sla.summary.${status}`, `{0} ${status}`)
                .replace("{0}", String(counts[status])))
            .join(", ");
    }

    /**
     * Stops listening to the agreements.
     */
    destroy() {
        this._element.removeEventListener(webexpress.webui.Event.SLA_STATUS_CHANGE_EVENT, this._onChange);
        this._element.removeEventListener(webexpress.webui.Event.SLA_CYCLE_EVENT, this._onChange);
    }
};

// register control classes - one control, two renderings
webexpress.webui.Controller.registerClass("wx-webui-sla", webexpress.webui.SlaCtrl);
webexpress.webui.Controller.registerClass("wx-webui-sla-group", webexpress.webui.SlaGroupCtrl);
