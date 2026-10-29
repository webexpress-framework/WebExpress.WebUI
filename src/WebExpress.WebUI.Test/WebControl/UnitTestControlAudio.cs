using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the audio control. The rendering it shares with the video control is covered
    /// there; these tests pin what an audio player does differently.
    /// </summary>
    public class UnitTestControlAudio
    {
        private const string Fallback = @"<div class=""wx-webui-audio-fallback""><p>The audio cannot be played here.</p></div>";

        /// <summary>
        /// Tests the id property of the audio control. An audio player has neither a poster nor
        /// the inline flag of a video.
        /// </summary>
        [Theory]
        [InlineData(null, @"<audio class=""wx-webui-audio"" controls preload=""metadata"">" + Fallback + "</audio>")]
        [InlineData("id", @"<audio id=""id"" class=""wx-webui-audio"" controls preload=""metadata"">" + Fallback + "</audio>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAudio(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the uri property of the audio control. The address is both the played file
        /// and the target of the fallback link.
        /// </summary>
        [Theory]
        [InlineData(null, @"<audio class=""wx-webui-audio"" controls preload=""metadata"">" + Fallback + "</audio>")]
        [InlineData("/a.mp3", @"<audio class=""wx-webui-audio"" src=""/a.mp3"" controls preload=""metadata""><div class=""wx-webui-audio-fallback""><p>The audio cannot be played here.</p><a href=""/a.mp3"">Open audio</a></div></audio>")]
        public void Uri(string uri, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAudio()
            {
                Uri = _ => uri is not null ? new UriEndpoint(uri) : null,
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the sources of the audio control, which carry the time range like the address
        /// of the element.
        /// </summary>
        [Fact]
        public void Sources()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAudio()
            {
                Start = _ => TimeSpan.FromSeconds(30),
                End = _ => TimeSpan.FromSeconds(90)
            };

            control.Add
            (
                new ControlPlayerSource(new UriEndpoint("/a.opus"), "audio/ogg; codecs=opus"),
                new ControlPlayerSource(new UriEndpoint("/a.mp3"), "audio/mpeg")
            );

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<audio class=""wx-webui-audio"" controls preload=""metadata""><source src=""/a.opus#t=30,90"" type=""audio/ogg; codecs=opus""><source src=""/a.mp3#t=30,90"" type=""audio/mpeg""><div class=""wx-webui-audio-fallback""><p>The audio cannot be played here.</p><a href=""/a.opus"">Open audio</a></div></audio>", html);
        }

        /// <summary>
        /// Tests the playback switches of the audio control. Unlike a video, an autoplaying
        /// audio player is not muted, since a silent start would play nothing perceivable.
        /// </summary>
        [Theory]
        [InlineData(true, false, false, false, @"<audio class=""wx-webui-audio"" controls preload=""metadata"">*</audio>")]
        [InlineData(true, true, false, false, @"<audio class=""wx-webui-audio"" controls autoplay preload=""metadata"">*</audio>")]
        [InlineData(true, false, true, false, @"<audio class=""wx-webui-audio"" controls loop preload=""metadata"">*</audio>")]
        [InlineData(true, false, false, true, @"<audio class=""wx-webui-audio"" controls muted preload=""metadata"">*</audio>")]
        [InlineData(false, true, true, true, @"<audio class=""wx-webui-audio"" autoplay loop muted preload=""metadata"">*</audio>")]
        public void Playback(bool controls, bool autoplay, bool loop, bool muted, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAudio()
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
        /// Tests the label and the preload property of the audio control.
        /// </summary>
        [Theory]
        [InlineData(null, TypePreloadPlayer.Default, @"<audio class=""wx-webui-audio"" controls preload=""metadata"">*</audio>")]
        [InlineData("Episode 1", TypePreloadPlayer.None, @"<audio class=""wx-webui-audio"" controls preload=""none"" aria-label=""Episode 1"">*</audio>")]
        [InlineData("webexpress.webui:audio.open", TypePreloadPlayer.Auto, @"<audio class=""wx-webui-audio"" controls preload=""auto"" aria-label=""Open audio"">*</audio>")]
        public void LabelAndPreload(string label, TypePreloadPlayer preload, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlAudio()
            {
                Label = _ => label,
                Preload = _ => preload
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
