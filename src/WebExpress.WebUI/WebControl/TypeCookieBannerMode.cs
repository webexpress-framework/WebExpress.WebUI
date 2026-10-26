namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Separates informational acknowledgements from permission decisions.
    /// </summary>
    public enum TypeCookieBannerMode
    {
        /// <summary>
        /// Records an acknowledgement without granting optional permissions.
        /// </summary>
        Notice,

        /// <summary>
        /// Records explicit choices for application-defined categories.
        /// </summary>
        Consent
    }
}
