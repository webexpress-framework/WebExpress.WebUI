namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The notations a domain account may be written in.
    /// </summary>
    public enum TypeDomainFormat
    {
        /// <summary>
        /// Either notation is accepted.
        /// </summary>
        Any,

        /// <summary>
        /// The down-level logon name, DOMAIN\user, as Windows has asked for it since NT.
        /// </summary>
        DownLevel,

        /// <summary>
        /// The user principal name, user@domain.tld, which reads like an e-mail address.
        /// </summary>
        Principal
    }
}
