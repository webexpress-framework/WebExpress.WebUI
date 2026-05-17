using WebExpress.WebCore.WebIcon;

namespace WebExpress.WebUI.WebIcon
{
    /// <summary>
    /// Represents a ball of wool icon.
    /// Use this icon for textile, knitting, or creative contexts.
    /// </summary>
    public class IconBallOfWool : Icon
    {
        /// <summary>
        /// Initializes a new instance of the class with the default theme.
        /// </summary>
        public IconBallOfWool()
            : base(TypeIconTheme.Light)
        {
        }

        /// <summary>
        /// Gets the CSS class for the ball of wool icon, depending on the selected theme.
        /// </summary>
        public override string Class => "wx-icon-light wx-icon-light-ball-of-wool";
    }
}