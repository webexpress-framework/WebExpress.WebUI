namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Defines an application-owned purpose independently of any service provider.
    /// </summary>
    public sealed class CookieBannerCategory
    {
        /// <summary>
        /// Gets or sets the stable identifier used by application integrations.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the label or translation key presented to visitors.
        /// </summary>
        public string Label { get; set; }

        /// <summary>
        /// Gets or sets the explanation or translation key for this purpose.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets whether the purpose is required and cannot be deselected.
        /// </summary>
        public bool Necessary { get; set; }
    }
}
