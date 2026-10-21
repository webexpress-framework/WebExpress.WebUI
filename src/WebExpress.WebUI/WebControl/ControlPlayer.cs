using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The common ground of the video and the audio control. Both hand the playing to the
    /// player the browser brings along, so no script and no third-party player are involved:
    /// playing, seeking and volume work the way the listener knows them from the browser,
    /// keyboard and screen reader included.
    /// </summary>
    /// <remarks>
    /// The file is governed by the <c>media-src</c> directive of the content security policy.
    /// The default policy of the server allows the own origin, <c>blob:</c> and any <c>https:</c>
    /// source, so files of other secure sites play without further configuration.
    /// </remarks>
    public abstract class ControlPlayer : Control
    {
        private readonly List<ControlPlayerSource> _sources = [];

        /// <summary>
        /// Returns the alternative files the browser picks the first playable one from.
        /// </summary>
        public IEnumerable<ControlPlayerSource> Sources => _sources;

        /// <summary>
        /// Gets or sets the address of the file. A single address suits a format every browser
        /// plays; for a choice of formats use the sources instead, which take precedence when
        /// both are given.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the name a screen reader announces for the player. Without a name it
        /// would only be read out as an unnamed player.
        /// </summary>
        public Func<IRenderControlContext, string> Label { get; set; }

        /// <summary>
        /// Gets or sets whether the browser shows its controls. A player without them can only
        /// be started by autoplay or by script, and an audio player without them is not shown
        /// at all.
        /// </summary>
        public Func<IRenderControlContext, bool> Controls { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets whether playback starts on its own. Browsers block autoplay with sound
        /// until the visitor has interacted with the site, so a player that has to start
        /// reliably has to start muted.
        /// </summary>
        public Func<IRenderControlContext, bool> Autoplay { get; set; }

        /// <summary>
        /// Gets or sets whether playback starts over at the end.
        /// </summary>
        public Func<IRenderControlContext, bool> Loop { get; set; }

        /// <summary>
        /// Gets or sets whether playback starts without sound.
        /// </summary>
        public Func<IRenderControlContext, bool> Muted { get; set; }

        /// <summary>
        /// Gets or sets how much of the file the browser loads before playback is requested.
        /// </summary>
        public Func<IRenderControlContext, TypePreloadPlayer> Preload { get; set; }

        /// <summary>
        /// Gets or sets the position playback starts at.
        /// </summary>
        public Func<IRenderControlContext, TimeSpan> Start { get; set; }

        /// <summary>
        /// Gets or sets the position playback pauses at. The listener can play on beyond it.
        /// </summary>
        public Func<IRenderControlContext, TimeSpan> End { get; set; }

        /// <summary>
        /// Returns the name of the media kind. It names the css class of the player and the
        /// internationalization keys of the fallback.
        /// </summary>
        protected abstract string MediaName { get; }

        /// <summary>
        /// Returns whether autoplay implies muted. A player that cannot be followed without its
        /// picture is better started silently than not at all.
        /// </summary>
        protected virtual bool AutoplayMuted => false;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="sources">The alternative files.</param>
        protected ControlPlayer(string id, ControlPlayerSource[] sources)
            : base(id)
        {
            _sources.AddRange(sources ?? []);
        }

        /// <summary>
        /// Adds one or more alternative files. The browser plays the first one whose format it
        /// supports, so the preferred format comes first.
        /// </summary>
        /// <param name="sources">The files to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlPlayer Add(params ControlPlayerSource[] sources)
        {
            _sources.AddRange(sources);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var uri = Uri?.Invoke(renderContext)?.ToString();
            var label = I18N.Translate(renderContext, Label?.Invoke(renderContext));
            var autoplay = Autoplay?.Invoke(renderContext) ?? false;
            var muted = (autoplay && AutoplayMuted) || (Muted?.Invoke(renderContext) ?? false);
            var preload = Preload?.Invoke(renderContext) ?? TypePreloadPlayer.Default;
            var fragment = TimeFragment(Start?.Invoke(renderContext) ?? TimeSpan.Zero, End?.Invoke(renderContext) ?? TimeSpan.Zero);

            var sources = _sources
                .Select(x => new { Uri = x.Uri?.Invoke(renderContext)?.ToString(), Type = x.Type?.Invoke(renderContext) })
                .Where(x => !string.IsNullOrWhiteSpace(x.Uri))
                .ToList();

            var html = CreateElement();
            html.Id = Id;
            html.Class = Css.Concatenate($"wx-webui-{MediaName}", GetClasses(renderContext));
            html.Style = GetStyles(renderContext);
            html.Role = Role?.Invoke(renderContext);

            // with sources the browser ignores the address on the element, so only one of them
            // is rendered
            if (sources.Count == 0 && !string.IsNullOrWhiteSpace(uri))
            {
                html.AddUserAttribute("src", AppendFragment(uri, fragment));
            }

            if (Controls?.Invoke(renderContext) ?? true)
            {
                html.AddUserAttribute("controls");
            }

            if (autoplay)
            {
                html.AddUserAttribute("autoplay");
            }

            if (Loop?.Invoke(renderContext) ?? false)
            {
                html.AddUserAttribute("loop");
            }

            if (muted)
            {
                html.AddUserAttribute("muted");
            }

            RenderAttributes(renderContext, html);

            html.AddUserAttribute("preload", preload.ToValue())
                .AddUserAttribute("aria-label", !string.IsNullOrWhiteSpace(label) ? label : null);

            foreach (var source in sources)
            {
                html.Add(new HtmlElementEmbeddedSource()
                    .AddUserAttribute("src", AppendFragment(source.Uri, fragment))
                    .AddUserAttribute("type", !string.IsNullOrWhiteSpace(source.Type) ? source.Type : null));
            }

            RenderContent(renderContext, html);

            html.Add(RenderFallback(renderContext, sources.FirstOrDefault()?.Uri ?? uri));

            return html;
        }

        /// <summary>
        /// Creates the media element.
        /// </summary>
        /// <returns>The empty media element.</returns>
        protected abstract HtmlElement CreateElement();

        /// <summary>
        /// Adds the attributes only one kind of media knows.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="html">The media element.</param>
        protected virtual void RenderAttributes(IRenderControlContext renderContext, HtmlElement html)
        {
        }

        /// <summary>
        /// Adds the children only one kind of media knows. They follow the sources, since the
        /// browser takes the files from the leading source elements.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="html">The media element.</param>
        protected virtual void RenderContent(IRenderControlContext renderContext, HtmlElement html)
        {
        }

        /// <summary>
        /// Renders the content a browser without support for the media element shows in place
        /// of the player: a short note and a link to the file, so it can still be played
        /// elsewhere.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="uri">The address of the file, may be null.</param>
        /// <returns>The fallback content.</returns>
        private HtmlElementTextContentDiv RenderFallback(IRenderControlContext renderContext, string uri)
        {
            var fallback = new HtmlElementTextContentDiv
            (
                new HtmlElementTextContentP(I18N.Translate(renderContext, $"webexpress.webui:{MediaName}.fallback"))
            )
            {
                Class = $"wx-webui-{MediaName}-fallback"
            };

            if (!string.IsNullOrWhiteSpace(uri))
            {
                fallback.Add(new HtmlElementTextSemanticsA(I18N.Translate(renderContext, $"webexpress.webui:{MediaName}.open"))
                {
                    Href = uri
                });
            }

            return fallback;
        }

        /// <summary>
        /// Builds the temporal media fragment for the start and end position. The fragment is
        /// interpreted by the player and never sent to the server, so the same cached file can
        /// be played from different positions.
        /// </summary>
        /// <param name="start">The start position, or zero for the beginning.</param>
        /// <param name="end">The end position, or zero for the end of the file.</param>
        /// <returns>The fragment without the leading hash, or null for the whole file.</returns>
        private static string TimeFragment(TimeSpan start, TimeSpan end)
        {
            var hasStart = start > TimeSpan.Zero;
            var hasEnd = end > TimeSpan.Zero && end > start;

            if (!hasStart && !hasEnd)
            {
                return null;
            }

            static string Seconds(TimeSpan value) => value.TotalSeconds.ToString("0.###", CultureInfo.InvariantCulture);

            // the syntax allows an open start ("t=,20"), so an end alone needs no start position
            return "t=" + (hasStart ? Seconds(start) : "") + (hasEnd ? "," + Seconds(end) : "");
        }

        /// <summary>
        /// Appends a fragment to an address.
        /// </summary>
        /// <param name="uri">The address.</param>
        /// <param name="fragment">The fragment without the leading hash, may be null.</param>
        /// <returns>The address with the fragment.</returns>
        private static string AppendFragment(string uri, string fragment)
        {
            if (string.IsNullOrWhiteSpace(fragment))
            {
                return uri;
            }

            // an address that already names a fragment keeps it, the time range joins it
            return uri + (uri.Contains('#') ? "&" : "#") + fragment;
        }
    }
}
