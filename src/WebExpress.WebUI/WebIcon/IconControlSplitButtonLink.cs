using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents an icon for the split button link control, drawn as a split button whose primary part navigates.
    /// </summary>
    public class IconControlSplitButtonLink : Icon
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="IconControlSplitButtonLink"/> class using the
        /// <see cref="TypeIconTheme.Default"/> theme.
        /// </summary>
        public IconControlSplitButtonLink()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="IconControlSplitButtonLink"/> class using the
        /// specified theme.
        /// </summary>
        /// <param name="theme">The theme to use when rendering the icon.</param>
        public IconControlSplitButtonLink(TypeIconTheme theme)
            : base(theme)
        {
        }

        /// <summary>
        /// Returns the CSS class associated with the icon. The control icons exist
        /// only as lightweight SVG variants - FontAwesome ships no glyph for a
        /// specific framework control - so the same class is used in every theme.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-control-split-button-link";
    }
}
