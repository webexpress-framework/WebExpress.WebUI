namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a contract for a binding that disables the target element (or its
    /// enclosing form group) when a source element satisfies a condition.
    /// </summary>
    public interface IBindDisable : IBind
    {
        /// <summary>
        /// Gets the ID of the source element whose value is observed.
        /// </summary>
        string Source { get; }

        /// <summary>
        /// Gets the condition expression that is evaluated against the source value.
        /// Supported formats:
        /// <list type="bullet">
        ///   <item><description><c>value</c> — equality (boolean-normalised)</description></item>
        ///   <item><description><c>=value</c> — explicit equality prefix</description></item>
        ///   <item><description><c>!=value</c> — not-equal</description></item>
        ///   <item><description><c>&gt;number</c>, <c>&gt;=number</c>, <c>&lt;number</c>, <c>&lt;=number</c> — numeric comparison</description></item>
        ///   <item><description><c>/pattern/flags</c> — regular-expression match, e.g. <c>/^foo/i</c></description></item>
        /// </list>
        /// </summary>
        string Condition { get; }
    }
}
