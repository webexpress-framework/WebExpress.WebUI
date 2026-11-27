namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// What a form shown in a dialog does after a successful save, when the opener of the dialog
    /// overrides the action the form was authored with.
    /// </summary>
    /// <remarks>
    /// The values mirror the success actions of the REST form, which lives in WebExpress.WebApp
    /// and therefore cannot be named here.
    /// </remarks>
    public enum TypeModalSuccessAction
    {
        /// <summary>
        /// The page stays as it is; the dialog closes. The opener refreshes what it shows.
        /// </summary>
        None,

        /// <summary>
        /// The page reloads, so everything it shows reflects the saved record.
        /// </summary>
        Reload,

        /// <summary>
        /// The browser follows the <c>uri</c> of the json answer.
        /// </summary>
        FollowUri
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeModalSuccessAction"/> enumeration.
    /// </summary>
    public static class TypeModalSuccessActionExtensions
    {
        /// <summary>
        /// Returns the value the client reads from the success option of a modal action.
        /// </summary>
        /// <remarks>
        /// Unlike the form's own attribute, <see cref="TypeModalSuccessAction.None"/> is written
        /// out: an absent option leaves the form to decide, while "none" suppresses its action.
        /// </remarks>
        /// <param name="action">The success action.</param>
        /// <returns>The attribute value.</returns>
        public static string ToValue(this TypeModalSuccessAction action)
        {
            return action switch
            {
                TypeModalSuccessAction.Reload => "reload",
                TypeModalSuccessAction.FollowUri => "follow-uri",
                _ => "none"
            };
        }
    }
}
