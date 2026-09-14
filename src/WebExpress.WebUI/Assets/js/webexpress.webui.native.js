/**
 * Defers removal until the alert's own opacity transition finishes.
 */
webexpress.webui.NativeActions = class {
    static _closing = new WeakSet();

    /**
     * Keeps repeated dismissals and child transitions from removing an alert twice.
     */
    static dismissAlert(alert) {
        if (!alert || this._closing.has(alert)) { return; }
        this._closing.add(alert);
        if (!alert.classList.contains("fade")) { alert.remove(); return; }
        const style = getComputedStyle(alert);
        const time = value => value.trim().endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000;
        const durations = style.transitionDuration.split(",").map(time);
        const delays = style.transitionDelay.split(",").map(time);
        const duration = Math.max(0, ...durations.map((value, index) => value + (delays[index % delays.length] || 0)));
        let timer;
        const finish = () => {
            clearTimeout(timer);
            alert.removeEventListener("transitionend", ended);
            alert.remove();
        };
        const ended = event => {
            if (event.target === alert && event.propertyName === "opacity") { finish(); }
        };
        alert.addEventListener("transitionend", ended);
        alert.classList.remove("show");
        if (duration > 0) { timer = setTimeout(finish, duration + 50); }
        else { finish(); }
    }
};

/**
 * Handles the framework's declarative dismiss and offcanvas actions through native dialogs.
 */
document.addEventListener("click", (event) => {
    const dismiss = event.target.closest("[data-wx-dismiss]");
    if (dismiss?.getAttribute("data-wx-dismiss") === "alert") {
        event.preventDefault();
        webexpress.webui.NativeActions.dismissAlert(dismiss.closest(".alert"));
    }
    if (dismiss?.getAttribute("data-wx-dismiss") === "offcanvas") {
        event.preventDefault();
        dismiss.closest("dialog")?.close();
    }
    const trigger = event.target.closest('[data-wx-toggle="offcanvas"]');
    if (trigger) {
        const target = trigger.getAttribute("data-wx-target") || trigger.getAttribute("href");
        const dialog = target?.startsWith("#") ? document.getElementById(target.slice(1)) : null;
        if (dialog?.tagName === "DIALOG") {
            event.preventDefault();
            dialog.open ? dialog.close() : dialog.showModal();
        }
    }
    const item = event.target.closest(".dropdown-item");
    const menu = item?.closest("[popover]");
    if (menu && !menu.hasAttribute("data-wx-keep-open") && !item.classList.contains("disabled")) {
        webexpress.webui.NativeMenu.hide(menu);
    }
});
