namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines a contract for a binding that re-opens (calls <c>show()</c> on)
    /// the target control whenever a source element raises a configured event -
    /// typically <c>SELECT_ITEM_EVENT</c> from a list/tile/tree. Use this to
    /// wire a <see cref="ControlPanelDismissible"/> back into view after the
    /// user dismissed it.
    /// </summary>
    public interface IBindShow : IBind
    {
        /// <summary>
        /// Gets the ID of the source element whose events are observed.
        /// </summary>
        string Source { get; }

        /// <summary>
        /// Gets the optional event name to listen for. Defaults to
        /// <c>webexpress.webui.table.select.row</c> when omitted client-side.
        /// </summary>
        string Event { get; }

        /// <summary>
        /// Gets the optional condition expression that is matched against the
        /// event detail before <c>show()</c> is invoked (same syntax as the
        /// hide / disable bindings).
        /// </summary>
        string Condition { get; }

        /// <summary>
        /// Gets the optional key in the event detail used to evaluate the
        /// <see cref="Condition"/>. Defaults to <c>itemId</c>.
        /// </summary>
        string DetailKey { get; }
    }
}
