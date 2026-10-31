using System;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a timed text track of a video, such as subtitles or captions. The track is a
    /// WebVTT file the browser's player offers in its captions menu.
    /// </summary>
    /// <remarks>
    /// A track from another origin is only loaded when the video element is allowed to fetch it
    /// across origins, so tracks are best served by the own server.
    /// </remarks>
    public class ControlVideoTrack
    {
        /// <summary>
        /// Gets or sets the address of the WebVTT file. The server should answer with the
        /// content type <c>text/vtt</c>.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets what the track holds.
        /// </summary>
        public Func<IRenderControlContext, TypeKindVideoTrack> Kind { get; set; }

        /// <summary>
        /// Gets or sets the language of the track as a BCP 47 tag, such as <c>de</c> or
        /// <c>en-US</c>. It is required for subtitles, which translate the spoken language.
        /// </summary>
        public Func<IRenderControlContext, string> Language { get; set; }

        /// <summary>
        /// Gets or sets the name the captions menu of the player lists the track under. It may
        /// be an internationalization key.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Gets or sets whether the track is shown from the start. The viewer's own captions
        /// preference may still override it.
        /// </summary>
        public Func<IRenderControlContext, bool> Default { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="uri">The address of the WebVTT file.</param>
        public ControlVideoTrack(IUri uri = null)
        {
            Uri = _ => uri;
        }
    }
}
