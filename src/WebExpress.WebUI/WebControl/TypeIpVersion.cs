namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The versions of the internet protocol an address may belong to.
    /// </summary>
    public enum TypeIpVersion
    {
        /// <summary>
        /// Either version is accepted.
        /// </summary>
        Any,

        /// <summary>
        /// An IPv4 address in dotted-decimal notation, such as 192.0.2.10.
        /// </summary>
        Version4,

        /// <summary>
        /// An IPv6 address, such as 2001:db8::1.
        /// </summary>
        Version6
    }
}
