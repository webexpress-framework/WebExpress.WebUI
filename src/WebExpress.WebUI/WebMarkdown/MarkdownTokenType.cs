namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Defines the possible types of tokens for Markdown parsing.
    /// </summary>
    public enum MarkdownTokenType
    {
        /// <summary>
        /// | - pipe (used for tables).
        /// </summary>
        Pipe,

        /// <summary>
        /// &lt; - less-than (used for html).
        /// </summary>
        Less,

        /// <summary>
        /// + - plus (used for list).
        /// </summary>
        Plus,

        /// <summary>
        /// &gt; - greater-than (used for blockquotes and html).
        /// </summary>
        Greater,

        /// <summary>
        /// &gt;&gt; - doubble greater-than (used to indicate multi-line cells within a Markdown table or nested blockquote).
        /// </summary>
        DoubleGreater,

        /// <summary>
        /// &gt;? - callout symbol for helpful or supportive content.
        /// Typically used for tips, suggestions, or contextual assistance.
        /// </summary>
        GratherHint,

        /// <summary>
        /// &gt;! - callout symbol for cautionary or alert messages.
        /// Used to signal potential issues, risks, or non-critical concerns.
        /// </summary>
        GratherWarning,

        /// <summary>
        /// &gt;!! - callout symbol for critical or blocking problems.
        /// Highlights fatal errors, exceptions, or urgent issues requiring immediate attention.
        /// </summary>
        GratherError,

        /// <summary>
        /// &gt;* - callout symbol for positive feedback or highlighted achievements.
        /// Used to celebrate successful actions, best practices, or recommended insights.
        /// </summary>
        GratherSuccess,

        /// <summary>
        /// #, ##, ###, ... - hash or sequence of hashes (used for headings).
        /// </summary>
        Hash,

        /// <summary>
        /// * - single star, used for emphasis (italic) or list items.
        /// </summary>
        Star,

        /// <summary>
        /// ** - double star, used for strong emphasis (bold).
        /// </summary>
        DoubleStar,

        /// <summary>
        /// *** - triple star, used for strong emphasis and emphasis (bold + italic) or horizontal rule if alone in a line.
        /// </summary>
        TripleStar,

        /// <summary>
        /// **** or more - sequence of four or more stars, used for horizontal rule if alone in a line.
        /// </summary>
        MultiStar,

        /// <summary>
        /// _ - single underscore, used for underscore.
        /// </summary>
        Underscore,

        /// <summary>
        /// __ - double underscore, used for underscore and strong emphasis (bold).
        /// </summary>
        DoubleUnderscore,

        /// <summary>
        /// ___ - triple underscore, used for underscore, strong emphasis and emphasis (bold + italic).
        /// </summary>
        TripleUnderscore,

        /// <summary>
        /// ____ or more - sequence of four or more underscores, used for horizontal rule if alone in a line.
        /// </summary>
        MultiUnderscore,

        /// <summary>
        /// ~ - single tilde.
        /// </summary>
        Tilde,

        /// <summary>
        /// ~~ - double tilde, used for strikethrough.
        /// </summary>
        DoubleTilde,

        /// <summary>
        /// ~~~ - triple tilde, used for strikethrough and strong emphasis (bold) or fenced code blocks.
        /// </summary>
        TripleTilde,

        /// <summary>
        /// ~~~~ or more - sequence of four or more tildes, used for longer fenced code blocks.
        /// </summary>
        MultiTilde,

        /// <summary>
        /// - single hyphen.
        /// </summary>
        Hyphen,

        /// <summary>
        /// -- double hyphen.
        /// </summary>
        DoubleHyphen,

        /// <summary>
        /// --- triple hyphen, used for horizontal rule (thematic break) if alone in a line.
        /// </summary>
        TripleHyphen,

        /// <summary>
        /// ---- or more - sequence of four or more hyphens, used for horizontal rule if alone in a line.
        /// </summary>
        MultiHyphen,

        /// <summary>
        /// == - double equal (used for highlight or mark text).
        /// </summary>
        DoubleEqual,

        /// <summary>
        /// ` - backtick (used for inline code).
        /// </summary>
        Backtick,

        /// <summary>
        /// ``` - three backticks (used for code blocks).
        /// </summary>
        CodeMarker,

        /// <summary>
        /// Everything else (plain text content).
        /// </summary>
        Text,

        /// <summary>
        /// Space character.
        /// </summary>
        Space,

        /// <summary>
        /// Tab character.
        /// </summary>
        Tab,

        /// <summary>
        /// Emoji (e.g., 😊, 🚀, etc.).
        /// </summary>
        Emoji,

        /// <summary>
        /// URL (e.g., https://example.com or mailto:user@example.com).
        /// </summary>
        Url,

        /// <summary>
        /// Link in the format [Text](URL).
        /// </summary>
        Link,

        /// <summary>
        /// Image in the format ![Alt](URL).
        /// </summary>
        Image,

        /// <summary>
        /// HTML tags, such as <div>content</div>.
        /// </summary>
        Html,

        /// <summary>
        /// Checkbox in the format [x].
        /// </summary>
        Checkbox,

        /// <summary>
        /// Footnote in the format [^1].
        /// </summary>
        Footnote,

        /// <summary>
        /// Inline plugin in the format {{plugin_name param1="val1"}}.
        /// </summary>
        InlinePlugin,

        /// <summary>
        /// Block plugin opening tag in the format {{% plugin_name param1="val1" %}}.
        /// </summary>
        PluginBlock,

        /// <summary>
        /// Block plugin closing tag in the format {{% /plugin_name %}}.
        /// </summary>
        PluginBlockEnd,

        /// <summary>
        /// End of line.
        /// </summary>
        EOL,

        /// <summary>
        /// End of file/input.
        /// </summary>
        EOF
    }
}