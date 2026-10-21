![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# Video and Audio

`ControlVideo` plays a video and `ControlAudio` a sound file or an audio stream inside the page. Both embed the file with the media element of the browser (`<video>` / `<audio>`) and leave the playing to the player the browser brings along, so the controls have **no JavaScript counterpart** and load no third-party player. Playing, seeking, volume, captions, full screen and picture-in-picture work the way the reader knows them from the browser, keyboard and screen reader included.

Both derive from `ControlPlayer`, which holds everything they share: the file and its alternative formats, the playback switches, preloading and the time range. `ControlVideo` adds a poster picture and text tracks.

A browser without support for the media element renders its content instead: a short note and a link that opens the file on its own.

## Markup

```html
<video class="wx-webui-video" controls playsinline poster="/media/trailer.png"
       preload="metadata" aria-label="Trailer">
    <source src="/media/trailer.webm#t=4,8" type="video/webm">
    <source src="/media/trailer.mp4#t=4,8" type="video/mp4">
    <track kind="subtitles" src="/media/trailer-de.vtt" srclang="de" label="Deutsch" default>
    <div class="wx-webui-video-fallback">
        <p>The video cannot be played here.</p>
        <a href="/media/trailer.webm">Open video</a>
    </div>
</video>

<audio class="wx-webui-audio" src="/media/episode-1.mp3" controls preload="none"
       aria-label="Episode 1">
    <div class="wx-webui-audio-fallback">
        <p>The audio cannot be played here.</p>
        <a href="/media/episode-1.mp3">Open audio</a>
    </div>
</audio>
```

| Attribute     | Source                 | Description
|---------------|------------------------|-------------------------------------------------------------------------------------------------------|
| `src`         | `Uri` + time range     | Address of the file. Only rendered without sources, since the browser ignores it when sources exist.  |
| `controls`    | `Controls`             | The browser's controls.                                                                               |
| `autoplay`    | `Autoplay`             | Playback starts on its own. A video adds `muted`, see below.                                          |
| `loop`        | `Loop`                 | Playback starts over at the end.                                                                      |
| `muted`       | `Muted`, `Autoplay` (video only) | Playback starts without sound.                                                              |
| `playsinline` | - (video only)         | Always set; without it Safari on the iPhone leaves the page for its full screen player.              |
| `poster`      | `Poster` (video only)  | Picture shown until playback starts.                                                                  |
| `preload`     | `Preload`              | `metadata` by default, `none` or `auto`.                                                              |
| `aria-label`  | `Label`                | Name a screen reader announces for the player. Omitted when empty.                                    |

## Properties

`ControlPlayer`, shared by both controls:

| Property   | Type                                             | Default    | Description
|------------|--------------------------------------------------|------------|------------------------------------------------------------------------------------------|
| `Uri`      | `Func<IRenderControlContext, IUri>`              | -          | Address of the file. Sources take precedence.                                            |
| `Sources`  | `IEnumerable<ControlPlayerSource>`               | -          | Alternative formats, given to the constructor or `Add`. The browser plays the first playable one. |
| `Label`    | `Func<IRenderControlContext, string>`            | -          | Accessible name of the player; may be an i18n key.                                        |
| `Controls` | `Func<IRenderControlContext, bool>`              | `true`     | Shows the browser's controls. An audio player without them is not shown at all.          |
| `Autoplay` | `Func<IRenderControlContext, bool>`              | `false`    | Starts playback on its own.                                                              |
| `Loop`     | `Func<IRenderControlContext, bool>`              | `false`    | Starts over at the end.                                                                  |
| `Muted`    | `Func<IRenderControlContext, bool>`              | `false`    | Starts without sound.                                                                    |
| `Preload`  | `Func<IRenderControlContext, TypePreloadPlayer>` | `Metadata` | `None`, `Metadata` or `Auto`.                                                            |
| `Start`    | `Func<IRenderControlContext, TimeSpan>`          | -          | Position playback starts at.                                                             |
| `End`      | `Func<IRenderControlContext, TimeSpan>`          | -          | Position playback pauses at; ignored unless it lies after `Start`.                        |

`ControlVideo` adds:

| Property  | Type                                  | Description
|-----------|---------------------------------------|---------------------------------------------------------------------------------------------|
| `Poster`  | `Func<IRenderControlContext, IUri>`   | Picture shown until playback starts.                                                        |
| `Tracks`  | `IEnumerable<ControlVideoTrack>`      | Text tracks, added with `Add`. A track without an address is dropped.                       |

`ControlPlayerSource` has `Uri` and `Type` (the media type, optionally with codecs, such as `audio/ogg; codecs=opus`), which lets the browser skip a format it cannot play without downloading it. `ControlVideoTrack` has `Uri` (a WebVTT file), `Kind` (`Subtitles` by default, `Captions`, `Descriptions`, `Chapters`), `Language` (a BCP 47 tag, required for subtitles), `Label` (the entry in the captions menu; may be an i18n key) and `Default`.

### Autoplay

Browsers block autoplay with sound until the visitor has interacted with the site. An autoplaying `ControlVideo` is therefore always rendered `muted`: a picture still tells its story without sound, and the viewer can turn the sound on. An autoplaying `ControlAudio` is **not** muted, since a silent start would play nothing perceivable; when the browser blocks it, the player simply waits for the play button.

### Time range

`Start` and `End` travel as a temporal media fragment in the address of the file and of every source (`#t=4,8`, `#t=4` or `#t=,8`). The fragment is interpreted by the player and never sent to the server, so the same cached file serves every section. An address that already carries a fragment keeps it; the time range is joined to it with `&`. The fallback link keeps the plain address.

## Example

```csharp
new ControlVideo
(
    null,
    new ControlPlayerSource(new UriEndpoint("/media/trailer.webm"), "video/webm"),
    new ControlPlayerSource(new UriEndpoint("/media/trailer.mp4"), "video/mp4")
)
{
    Poster = _ => new UriEndpoint("/media/trailer.png"),
    Label = _ => "Trailer"
}
.Add(new ControlVideoTrack(new UriEndpoint("/media/trailer-de.vtt"))
{
    Language = _ => "de",
    Label = _ => "Deutsch",
    Default = _ => true
});

new ControlAudio()
{
    Uri = _ => new UriEndpoint("/media/episode-1.mp3"),
    Label = _ => "Episode 1",
    Preload = _ => TypePreloadPlayer.None
};
```

## Serving the files

Assets with the extensions `.mp4`, `.webm`, `.ogg`, `.mp3`, `.wav` and `.vtt` are served with their media type (`text/vtt` for the text tracks). The asset endpoint answers `Range` requests with `206 Partial Content` and announces it with `Accept-Ranges: bytes`, which players need to seek and to read the length of an Ogg file - Safari plays no video at all without it. An own endpoint that serves media should do the same.

Do not name an embedded track after its language with a dot, such as `trailer.de.vtt`: MSBuild reads `.de` as a culture and moves the file into a satellite assembly, so the asset is never registered and answers 404. Use `trailer-de.vtt` instead, or mark the embedded resource `WithCulture="false"`.

## Security

The media files are governed by the `media-src` directive of the content security policy. The default policy of the server is `media-src 'self' blob: https:`, so files of the own server and of any secure site play without further configuration. A text track from another origin is only loaded when that site permits cross-origin requests, so tracks are best served by the own server.

## Styling

| Class                        | Purpose
|------------------------------|--------------------------------------------------------------------------------------------------|
| `wx-webui-video`             | Block element at full width; the height follows the aspect ratio of the file, black letterbox, rounded corners. |
| `wx-webui-audio`             | Block element at full width, instead of the browser's default of 300 pixels.                       |
| `wx-webui-video-fallback`, `wx-webui-audio-fallback` | Centered note and link shown by browsers without support for the media element. |

## Internationalization

| Key                                 | English                             | German
|-------------------------------------|-------------------------------------|-----------------------------------------------|
| `webexpress.webui:video.fallback`   | The video cannot be played here.    | Das Video kann hier nicht abgespielt werden.  |
| `webexpress.webui:video.open`       | Open video                          | Video öffnen                                  |
| `webexpress.webui:audio.fallback`   | The audio cannot be played here.    | Das Audio kann hier nicht abgespielt werden.  |
| `webexpress.webui:audio.open`       | Open audio                          | Audio öffnen                                  |
