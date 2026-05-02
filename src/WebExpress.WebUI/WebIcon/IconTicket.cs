namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for a ticket.
    /// </summary>
    public class IconTicket : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconTicket"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconTicket()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconTicket"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconTicket(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon.
        /// </summary>
        public override string Class => Theme == TypeIconTheme.Light
            ? "wx-icon-light wx-icon-light-ticket"
            : "fas fa-ticket";
    }
}