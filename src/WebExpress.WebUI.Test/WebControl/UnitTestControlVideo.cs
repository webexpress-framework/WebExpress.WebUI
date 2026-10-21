using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the video control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlVideo
    {
        private const string Fallback = @"<div class=""wx-webui-video-fallback""><p>The video cannot be played here.</p></div>";

        /// <summary>
        /// Tests the id property of the video control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<video class=""wx-webui-video"" controls playsinline preload=""metadata"">" + Fallback + "</video>")]
        [InlineData("id", @"<video id=""id"" class=""wx-webui-video"" controls playsinline preload=""metadata"">" + Fallback + "</video>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlVideo(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the video control. The address is both the played file
        /// and the target of the fallback link.
        /// </summary>
        [Theory]
        [InlineData(null, @"<video class=""wx-webui-video"" controls playsinline preload=""metadata"">" + Fallback + "</video>")]
        [InlineData("/a.mp4", @"<video class=""wx-webui-video"" src=""/a.mp4"" controls playsinline preload=""metadata""><div class=""wx-webui-video-fallback""><p>The video cannot be played here.</p><a href=""/a.mp4"">Open video</a></div></video>")]
        [InlineData("/a?b=1&c=2", @"<video class=""wx-webui-video"" src=""/a?b=1&amp;c=2"" controls playsinline preload=""metadata""><div class=""wx-webui-video-fallback""><p>The video cannot be played here.</p><a href=""/a?b=1&amp;c=2"">Open video</a></div></video>")]
        public void Uri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlVideo()
            {
                Uri = _ => uri is not null ? new UriEndpoint(uri) : null,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the sources replace the address of the element, keep their order and
        /// that the first of them becomes the target of the fallback link.
        /// </summary>
        [Fact]
        public void Sources()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlVideo
            (
                null,
                new ControlPlayerSource(new UriEndpoint("/a.webm"), "video/webm"),
                new ControlPlayerSource(null, "video/ogg"),
                new ControlPlayerSource(new UriEndpoint("/a.mp4"))
            )
            {
                Uri = _ => new UriEndpoint("/ignored.mp4")
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<video class=""wx-webui-video"" controls playsinline preload=""metadata""><source src=""/a.webm"" type=""video/webm""><source src=""/a.mp4""><div class=""wx-webui-video-fallback""><p>The video cannot be played here.</p><a href=""/a.webm"">Open video</a></div></video>", html);
        }

        /// <summary>
        /// Tests the tracks of the video control. A track without an address is dropped, since
        /// the player would list an entry that loads nothing.
        /// </summary>
        [Fact]
        public void Tracks()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlVideo()
                .Add
                (
                    new ControlVideoTrack(new UriEndpoint("/de.vtt")) { Language = _ => "de", Label = _ => "Deutsch", Default = _ => true },
                    new ControlVideoTrack(new UriEndpoint("/en.vtt")) { Kind = _ => TypeKindVideoTrack.Captions, Language = _ => "en", Label = _ => "webexpress.webui:video.open" },
                    new ControlVideoTrack(new UriEndpoint("/chapters.vtt")) { Kind = _ => TypeKindVideoTrack.Chapters },
                    new ControlVideoTrack() { Label = _ => "Empty" }
                );

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<video class=""wx-webui-video"" controls playsinline preload=""metadata""><track kind=""subtitles"" src=""/de.vtt"" srclang=""de"" label=""Deutsch"" default><track kind=""captions"" src=""/en.vtt"" srclang=""en"" label=""Open video""><track kind=""chapters"" src=""/chapters.vtt"">" + Fallback + "</video>", html);
        }

        /// <summary>
        /// Tests the poster property of the video control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<video class=""wx-webui-video"" controls playsinline preload=""metadata"">*</video>")]
        [InlineData("/poster.png", @"<video class=""wx-webui-video"" controls playsinline poster=""/poster.png"" preload=""metadata"">*</video>")]
        public void Poster(string poster, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlVideo()
            {
                Poster = _ => poster is not null ? new UriEndpoint(poster) : null
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the label property of the video control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<video class=""wx-webui-video"" controls playsinline preload=""metadata"">*</video>")]
        [InlineData("", @"<video class=""wx-webui-video"" controls playsinline preload=""metadata"">*</video>")]
        [InlineData("Trailer", @"<video class=""wx-webui-video"" controls playsinline preload=""metadata"" aria-label=""Trailer"">*</video>")]
        [InlineData("webexpress.webui:video.open", @"<video class=""wx-webui-video"" controls playsinline preload=""metadata"" aria-label=""Open video"">*</video>")]
        public void Label(string label, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlVideo()
            {
                Label = _ => label
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the playback switches of the video control. Autoplay always comes with muted,
        /// since browsers block autoplay with sound.
        /// </summary>
        [Theory]
        [InlineData(true, false, false, false, @"<video class=""wx-webui-video"" controls playsinline preload=""metadata"">*</video>")]
        [InlineData(false, false, false, false, @"<video class=""wx-webui-video"" playsinline preload=""metadata"">*</video>")]
        [InlineData(true, true, false, false, @"<video class=""wx-webui-video"" controls autoplay muted playsinline preload=""metadata"">*</video>")]
        [InlineData(true, false, true, false, @"<video class=""wx-webui-video"" controls loop playsinline preload=""metadata"">*</video>")]
        [InlineData(true, false, false, true, @"<video class=""wx-webui-video"" controls muted playsinline preload=""metadata"">*</video>")]
        [InlineData(false, true, true, true, @"<video class=""wx-webui-video"" autoplay loop muted playsinline preload=""metadata"">*</video>")]
        public void Playback(bool controls, bool autoplay, bool loop, bool muted, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlVideo()
            {
                Controls = _ => controls,
                Autoplay = _ => autoplay,
                Loop = _ => loop,
                Muted = _ => muted
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the preload property of the video control.
        /// </summary>
        [Theory]
        [InlineData(TypePreloadPlayer.Default, @"preload=""metadata""")]
        [InlineData(TypePreloadPlayer.None, @"preload=""none""")]
        [InlineData(TypePreloadPlayer.Metadata, @"preload=""metadata""")]
        [InlineData(TypePreloadPlayer.Auto, @"preload=""auto""")]
        public void Preload(TypePreloadPlayer preload, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlVideo()
            {
                Preload = _ => preload
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders($@"<video class=""wx-webui-video"" controls playsinline {expected}>*</video>", html);
        }

        /// <summary>
        /// Tests that the start and end position travel in the media fragment of the played
        /// address, while the fallback link keeps the plain address.
        /// </summary>
        [Theory]
        [InlineData("/a.mp4", 0, 0, @"src=""/a.mp4""")]
        [InlineData("/a.mp4", 10, 0, @"src=""/a.mp4#t=10""")]
        [InlineData("/a.mp4", 1.5, 0, @"src=""/a.mp4#t=1.5""")]
        [InlineData("/a.mp4", -1, 0, @"src=""/a.mp4""")]
        [InlineData("/a.mp4", 0, 20, @"src=""/a.mp4#t=,20""")]
        [InlineData("/a.mp4", 10, 20, @"src=""/a.mp4#t=10,20""")]
        [InlineData("/a.mp4", 20, 10, @"src=""/a.mp4#t=20""")]
        [InlineData("/a.mp4#track=video", 10, 0, @"src=""/a.mp4#track=video&amp;t=10""")]
        public void TimeRange(string uri, double start, double end, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlVideo()
            {
                Uri = _ => new UriEndpoint(uri),
                Start = _ => TimeSpan.FromSeconds(start),
                End = _ => TimeSpan.FromSeconds(end)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders($@"<video class=""wx-webui-video"" {expected} controls playsinline preload=""metadata"">*<a href=""{uri}"">Open video</a></div></video>", html);
        }

        /// <summary>
        /// Tests that the time range applies to every source, since the browser decides only
        /// at play time which of them it plays.
        /// </summary>
        [Fact]
        public void TimeRangeSources()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlVideo
            (
                null,
                new ControlPlayerSource(new UriEndpoint("/a.webm"), "video/webm"),
                new ControlPlayerSource(new UriEndpoint("/a.mp4"), "video/mp4")
            )
            {
                Start = _ => TimeSpan.FromSeconds(5)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<video class=""wx-webui-video"" controls playsinline preload=""metadata""><source src=""/a.webm#t=5"" type=""video/webm""><source src=""/a.mp4#t=5"" type=""video/mp4""><div class=""wx-webui-video-fallback""><p>The video cannot be played here.</p><a href=""/a.webm"">Open video</a></div></video>", html);
        }
    }
}
