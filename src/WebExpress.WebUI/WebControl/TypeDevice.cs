namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Enumeration of supported device types.
    /// </summary>
    public enum TypeDevice
    {
        /// <summary>
        /// No selection.
        /// </summary>
        None,
        /// <summary>
        /// Automatic adjustment.
        /// </summary>
        Auto,
        /// <summary>
        /// Suitable for phones less 576px.
        /// </summary>
        ExtraSmall,
        /// <summary>
        /// Suitable for tablets with a width of 576px or greater.
        /// </summary>
        Small,
        /// <summary>
        /// Suitable for small laptops 768px or greater.
        /// </summary>
        Medium,
        /// <summary>
        /// Suitable for laptops and desktops 992px or greater.
        /// </summary>
        Large,
        /// <summary>
        /// Suitable for laptops and desktops 1200px or greater.
        /// </summary>
        ExtraLarge
    }
}
