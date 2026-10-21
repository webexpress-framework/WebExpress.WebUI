using WebExpress.WebCore.WebHtml;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Plays a sound file or an audio stream inside the page through the player the browser
    /// brings along, such as a podcast episode, a voice message or a recorded call.
    /// </summary>
    /// <remarks>
    /// An autoplaying audio player is not muted: without a picture a silent start would tell
    /// nothing, so a blocked autoplay simply leaves the player waiting for the listener.
    /// </remarks>
    public class ControlAudio : ControlPlayer
    {
        /// <summary>
        /// Returns the name of the media kind.
        /// </summary>
        protected override string MediaName => "audio";

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="sources">The alternative files of the sound.</param>
        public ControlAudio(string id = null, params ControlPlayerSource[] sources)
            : base(id, sources)
        {
        }

        /// <summary>
        /// Creates the media element.
        /// </summary>
        /// <returns>The empty media element.</returns>
        protected override HtmlElement CreateElement()
        {
            return new HtmlElementMultimediaAudio();
        }
    }
}
