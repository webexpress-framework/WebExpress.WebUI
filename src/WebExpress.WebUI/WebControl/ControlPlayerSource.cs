using System;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents one file of a video or a sound in a format of its own. Offering several
    /// formats lets each browser play the one it supports, for example a small WebM or Opus
    /// file with an MP4 or MP3 file as the fallback every browser plays.
    /// </summary>
    public class ControlPlayerSource
    {
        /// <summary>
        /// Gets or sets the address of the file.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the media type of the file, such as <c>video/webm</c> or
        /// <c>audio/mpeg</c>, optionally with its codecs. It lets the browser skip a format it
        /// cannot play without downloading it.
        /// </summary>
        public Func<IRenderControlContext, string> Type { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="uri">The address of the file.</param>
        /// <param name="type">The media type of the file.</param>
        public ControlPlayerSource(IUri uri = null, string type = null)
        {
            Uri = _ => uri;
            Type = _ => type;
        }
    }
}
