using System;
using System.Collections.Generic;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Plays a video inside the page through the player the browser brings along. Besides
    /// playing, seeking and volume the player offers captions, full screen and
    /// picture-in-picture the way the viewer knows them from the browser.
    /// </summary>
    public class ControlVideo : ControlPlayer
    {
        private readonly List<ControlVideoTrack> _tracks = [];

        /// <summary>
        /// Returns the text tracks, such as subtitles, captions or chapters.
        /// </summary>
        public IEnumerable<ControlVideoTrack> Tracks => _tracks;

        /// <summary>
        /// Gets or sets the address of the picture shown until playback starts. Without it the
        /// player shows the first frame once it is loaded, or nothing at all when nothing is
        /// preloaded.
        /// </summary>
        public Func<IRenderControlContext, IUri> Poster { get; set; }

        /// <summary>
        /// Returns the name of the media kind.
        /// </summary>
        protected override string MediaName => "video";

        /// <summary>
        /// Returns that an autoplaying video is rendered muted: a picture still tells its story
        /// without sound, while an unmuted autoplay is blocked and shows nothing moving at all.
        /// </summary>
        protected override bool AutoplayMuted => true;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="sources">The alternative files of the video.</param>
        public ControlVideo(string id = null, params ControlPlayerSource[] sources)
            : base(id, sources)
        {
        }

        /// <summary>
        /// Adds one or more text tracks.
        /// </summary>
        /// <param name="tracks">The tracks to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlVideo Add(params ControlVideoTrack[] tracks)
        {
            _tracks.AddRange(tracks);

            return this;
        }

        /// <summary>
        /// Creates the media element.
        /// </summary>
        /// <returns>The empty media element.</returns>
        protected override HtmlElement CreateElement()
        {
            return new HtmlElementMultimediaVideo();
        }

        /// <summary>
        /// Adds the attributes only a video knows.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="html">The media element.</param>
        protected override void RenderAttributes(IRenderControlContext renderContext, HtmlElement html)
        {
            var poster = Poster?.Invoke(renderContext)?.ToString();

            // without it safari on the iphone leaves the page for its full screen player
            html.AddUserAttribute("playsinline");
            html.AddUserAttribute("poster", !string.IsNullOrWhiteSpace(poster) ? poster : null);
        }

        /// <summary>
        /// Adds the text tracks. A track without an address is dropped, since the player would
        /// list an entry that loads nothing.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="html">The media element.</param>
        protected override void RenderContent(IRenderControlContext renderContext, HtmlElement html)
        {
            foreach (var track in _tracks)
            {
                var uri = track.Uri?.Invoke(renderContext)?.ToString();

                if (string.IsNullOrWhiteSpace(uri))
                {
                    continue;
                }

                var label = I18N.Translate(renderContext, track.Label?.Invoke(renderContext));
                var trackElement = new HtmlElementMultimediaTrack()
                    .AddUserAttribute("kind", (track.Kind?.Invoke(renderContext) ?? TypeKindVideoTrack.Default).ToValue())
                    .AddUserAttribute("src", uri)
                    .AddUserAttribute("srclang", track.Language?.Invoke(renderContext))
                    .AddUserAttribute("label", !string.IsNullOrWhiteSpace(label) ? label : null);

                if (track.Default?.Invoke(renderContext) ?? false)
                {
                    trackElement.AddUserAttribute("default");
                }

                html.Add(trackElement);
            }
        }
    }
}
