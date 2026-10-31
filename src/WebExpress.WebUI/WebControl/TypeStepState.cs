namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The progress state of a step in a <see cref="ControlSteps"/>.
    /// </summary>
    public enum TypeStepState
    {
        /// <summary>
        /// A step that has not been reached yet.
        /// </summary>
        Pending,

        /// <summary>
        /// The step the user is currently on.
        /// </summary>
        Active,

        /// <summary>
        /// A step that has been completed.
        /// </summary>
        Completed
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeStepState"/> enum.
    /// </summary>
    public static class TypeStepStateExtensions
    {
        /// <summary>
        /// Converts the step state to a CSS class.
        /// </summary>
        /// <param name="state">The state.</param>
        /// <returns>The CSS class corresponding to the state.</returns>
        public static string ToClass(this TypeStepState state)
        {
            return state switch
            {
                TypeStepState.Active => "wx-steps-item-active",
                TypeStepState.Completed => "wx-steps-item-completed",
                _ => "wx-steps-item-pending",
            };
        }
    }
}
