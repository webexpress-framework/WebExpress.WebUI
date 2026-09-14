/**
 * Confirms an action before executing it, retaining the dialog when an asynchronous
 * action fails so the user can retry without losing the original context.
 */
webexpress.webui.ModalConfirm = class extends webexpress.webui.ModalCtrl {
    static _nextId = 0;

    _confirmButton = document.createElement("button");
    _errorElement = document.createElement("p");
    _action = null;
    _pending = false;
    _open = false;
    _destroyed = false;
    _returnFocus = null;
    _fallbackFocus = null;

    /**
     * Owns a reusable dialog outside the caller's DOM so it can overlay tab content.
     */
    constructor() {
        super(document.createElement("dialog"));

        const id = "wx-confirm-" + (++webexpress.webui.ModalConfirm._nextId);
        this._titleH1.id = id + "-title";
        this._bodyDiv.id = id + "-body";
        this._element.setAttribute("aria-labelledby", this._titleH1.id);
        this._element.setAttribute("aria-describedby", this._bodyDiv.id);

        this._confirmButton.type = "button";
        this._confirmButton.className = "btn btn-danger";
        this._confirmButton.onclick = () => this._execute();
        this._cancelButton.textContent = this._i18n("webexpress.webui:cancel", "Cancel");
        this._errorElement.className = "text-danger mt-3 mb-0";
        this._errorElement.setAttribute("role", "alert");

        this._element.addEventListener(webexpress.webui.Event.MODAL_SHOW_EVENT, () => {
            this._open = true;
            if (this._destroyed) {
                super.hide();
            } else {
                this._confirmButton.disabled = this._pending;
                this._cancelButton.focus({ preventScroll: true });
            }
        });
        this._element.addEventListener("close", () => {
            this._open = false;
            this._action = null;
            if (this._destroyed) {
                this._dispose();
            } else if (this._returnFocus?.isConnected) {
                this._returnFocus.focus({ preventScroll: true });
            } else {
                this._fallbackFocus?.()?.focus({ preventScroll: true });
            }
            this._returnFocus = null;
        });

        document.body.appendChild(this._element);
    }

    /**
     * Accepts plain text so resource names cannot inject markup into the confirmation.
     * Returning false from the action keeps the dialog open; thrown errors do the same.
     * @param {string} header - A title or translation key.
     * @param {string} message - The confirmation text.
     * @param {function} action - A synchronous or asynchronous action.
     * @param {object} options - Optional confirmLabel, errorMessage and fallbackFocus callback.
     * @returns {boolean} Whether the dialog accepted a new action.
     */
    confirmation(header, message, action, options = {}) {
        if (this._open || this._pending || this._destroyed) {
            return false;
        }

        this._action = action;
        this._fallbackFocus = options.fallbackFocus || null;
        this._errorMessage = options.errorMessage || this._i18n("webexpress.webui:confirm.error", "The action failed. Please try again.");
        this._confirmButton.textContent = options.confirmLabel || this._i18n("webexpress.webui:confirm", "Confirm");
        this._confirmButton.disabled = false;
        this._cancelButton.disabled = false;
        this._titleH1.textContent = this._i18n(header, header || "Confirmation");

        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        this._bodyDiv.replaceChildren(paragraph, this._errorElement);
        this._errorElement.textContent = "";
        this._errorElement.hidden = true;
        this._footerDiv.replaceChildren(this._confirmButton, this._cancelButton);
        return true;
    }

    /**
     * Keeps one action in flight and reports failure without dismissing its context.
     */
    async _execute() {
        if (this._pending || this._destroyed || !this._open || typeof this._action !== "function") {
            return;
        }

        this._pending = true;
        this._confirmButton.disabled = true;
        this._cancelButton.disabled = true;
        this._element.setAttribute("aria-busy", "true");
        this._errorElement.hidden = true;
        let success = false;
        try {
            success = (await this._action()) !== false;
        } catch {
            // callers provide an actionable message instead of exposing transport details
            success = false;
        } finally {
            this._pending = false;
        }

        if (this._destroyed) {
            return;
        }

        this._element.removeAttribute("aria-busy");
        this._cancelButton.disabled = false;
        if (success) {
            this._action = null;
            this.hide();
        } else {
            this._confirmButton.disabled = false;
            this._errorElement.textContent = this._errorMessage;
            this._errorElement.hidden = false;
            this._confirmButton.focus({ preventScroll: true });
        }
    }

    /**
     * Remembers the trigger so cancellation returns keyboard users to their context.
     */
    show() {
        if (this._destroyed || this._open) {
            return;
        }
        this._returnFocus = document.activeElement;
        this._confirmButton.disabled = true;
        super.show();
    }

    /**
     * Retains the confirmation while its action is in flight.
     */
    hide() {
        if (!this._pending || this._destroyed) {
            super.hide();
        }
    }

    /**
     * Releases the top layer before removing the owned dialog.
     */
    destroy() {
        if (this._destroyed) {
            return;
        }
        this._destroyed = true;
        this._action = null;
        this._returnFocus = null;
        this._fallbackFocus = null;
        if (this._open) {
            super.hide();
        } else {
            this._dispose();
        }
        super.destroy();
    }

    /**
     * Releases the DOM owned by this controller.
     */
    _dispose() {
        this._confirmButton.onclick = null;
        this._element.remove();
    }
};
