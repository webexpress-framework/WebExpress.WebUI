namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The slot an action is bound to on a control. A control can carry a primary and a secondary
    /// action side by side; the slot decides how the action is triggered, not what it does - the
    /// kind of action (modal, frame, filter, ...) is the <see cref="IAction"/> itself. The slot
    /// is a request, not a guarantee: an action the client handles outside the slot mechanism,
    /// such as <see cref="ActionDismiss"/>, ignores it and always reacts to a click.
    /// </summary>
    public enum TypeAction
    {
        /// <summary>
        /// The primary action, triggered by a click. Slot-aware actions write it under the
        /// <c>data-wx-primary-</c> prefix so it cannot collide with a secondary action on the same element.
        /// </summary>
        Primary,

        /// <summary>
        /// The secondary action, triggered by a double click. Slot-aware actions write it under the
        /// <c>data-wx-secondary-</c> prefix so it cannot collide with a primary action on the same element.
        /// </summary>
        Secondary
    }
}
