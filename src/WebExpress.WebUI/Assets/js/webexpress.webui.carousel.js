/**
 * Adds keyboard and button navigation to a carousel whose movement and snapping are native scrolling.
 */
webexpress.webui.CarouselCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Observes the snapped slide so indicators also follow touch and trackpad scrolling.
     */
    constructor(element) {
        super(element);
        this._track = element.querySelector(".carousel-inner");
        this._slides = [...element.querySelectorAll(".carousel-item")];
        this._indicators = [...element.querySelectorAll("[data-wx-slide-to]")];
        this._index = 0;
        this._track.tabIndex = 0;
        this._click = (event) => {
            const button = event.target.closest("[data-wx-slide], [data-wx-slide-to]");
            if (!button) { return; }
            event.preventDefault();
            const target = button.getAttribute("data-wx-slide-to");
            this.goTo(target === null ? this._index + (button.getAttribute("data-wx-slide") === "next" ? 1 : -1) : Number(target));
        };
        this._key = (event) => {
            if (event.target !== this._track) { return; }
            const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
            if (!direction) { return; }
            event.preventDefault();
            this.goTo(this._index + direction);
        };
        element.addEventListener("click", this._click);
        element.addEventListener("keydown", this._key);
        this._observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                    this._select(this._slides.indexOf(entry.target));
                }
            }
        }, { root: this._track, threshold: 0.6 });
        this._slides.forEach(slide => this._observer.observe(slide));
        this._select(0);
        this._interval = Number(element.getAttribute("data-wx-interval") ?? 5000);
        this._motion = matchMedia("(prefers-reduced-motion: reduce)");
        this._resume = () => {
            this._pause();
            if (this._disposed || this._slides.length < 2 || this._interval <= 0 || !Number.isFinite(this._interval) ||
                document.hidden || this._motion.matches || element.matches(":hover, :focus-within")) { return; }
            this._timer = setInterval(() => this.goTo(this._index + 1), this._interval);
        };
        element.addEventListener("pointerenter", this._pause);
        element.addEventListener("pointerleave", this._resume);
        element.addEventListener("focusin", this._pause);
        this._focusOut = () => queueMicrotask(this._resume);
        element.addEventListener("focusout", this._focusOut);
        document.addEventListener("visibilitychange", this._resume);
        this._motion.addEventListener("change", this._resume);
        this._resume();
    }

    /**
     * Selects a scroll target without computing offsets or translating slide elements.
     */
    goTo(index) {
        if (!this._slides.length || !Number.isInteger(index)) { return; }
        index = (index % this._slides.length + this._slides.length) % this._slides.length;
        this._slides[index].scrollIntoView({ block: "nearest", inline: "start", container: "nearest" });
        this._select(index);
    }

    _pause = () => {
        clearInterval(this._timer);
        this._timer = null;
    };

    _select(index) {
        this._index = index;
        this._slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
        this._indicators.forEach((button, i) => {
            button.classList.toggle("active", i === index);
            button.setAttribute("aria-current", i === index ? "true" : "false");
        });
    }

    /**
     * Releases observers when a feed or page removes the carousel.
     */
    destroy() {
        this._disposed = true;
        this._pause();
        this._observer.disconnect();
        this._element.removeEventListener("pointerenter", this._pause);
        this._element.removeEventListener("pointerleave", this._resume);
        this._element.removeEventListener("focusin", this._pause);
        this._element.removeEventListener("focusout", this._focusOut);
        document.removeEventListener("visibilitychange", this._resume);
        this._motion.removeEventListener("change", this._resume);
        this._element.removeEventListener("click", this._click);
        this._element.removeEventListener("keydown", this._key);
        super.destroy();
    }
};

webexpress.webui.Controller.registerClass("wx-webui-carousel", webexpress.webui.CarouselCtrl);
