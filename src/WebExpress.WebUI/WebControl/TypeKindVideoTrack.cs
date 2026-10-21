namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// What a text track of a video holds.
    /// </summary>
    public enum TypeKindVideoTrack
    {
        /// <summary>
        /// Represents the default value, which is <see cref="Subtitles"/>.
        /// </summary>
        Default = 0,

        /// <summary>
        /// A translation of the dialogue for viewers who do not understand the spoken language.
        /// </summary>
        Subtitles = 1,

        /// <summary>
        /// A transcription of the dialogue and of relevant sounds for viewers who cannot hear
        /// the audio.
        /// </summary>
        Captions = 2,

        /// <summary>
        /// A description of the picture for viewers who cannot see it, read out by assistive
        /// technology.
        /// </summary>
        Descriptions = 3,

        /// <summary>
        /// Titles of the chapters, which a player may offer for navigation.
        /// </summary>
        Chapters = 4
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeKindVideoTrack"/> enumeration.
    /// </summary>
    public static class TypeKindVideoTrackExtensions
    {
        /// <summary>
        /// Converts the kind to the value of the <c>kind</c> attribute.
        /// </summary>
        /// <param name="type">The kind to convert.</param>
        /// <returns>The value.</returns>
        public static string ToValue(this TypeKindVideoTrack type)
        {
            return type switch
            {
                TypeKindVideoTrack.Captions => "captions",
                TypeKindVideoTrack.Descriptions => "descriptions",
                TypeKindVideoTrack.Chapters => "chapters",
                _ => "subtitles"
            };
        }
    }
}
