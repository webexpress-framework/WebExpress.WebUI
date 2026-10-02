namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The slot an action is bound to on a control. A control can carry a primary and a secondary
    /// action side by side; the slot decides how the action is triggered, not what it does - the
    /// kind of action (modal, frame, filter, ...) is the <see cref="IAction"/> itself.
    /// </summary>
    public enum TypeAction
    {
        /// <summary>
        /// The primary action, triggered by a click. Written as <c>data-wx-primary-*</c> attributes.
        /// </summary>
        Primary,

        /// <summary>
        /// The secondary action, triggered by a double click. Written as <c>data-wx-secondary-*</c> attributes.
        /// </summary>
        Secondary
    }
}
