namespace WebExpress.WebUI.WebControl
{

    /// <summary>
    /// Specifies the programming or scripting language type.
    /// </summary>
    public enum TypeLanguage
    {
        /// <summary>
        /// Represents the default value for the enumeration.
        /// </summary>
        Default,

        /// <summary>
        /// Represents the Bash shell environment.
        /// </summary>
        Bash,

        /// <summary>
        /// Represents the basic level of a feature or service.
        /// </summary>
        Basic,

        /// <summary>
        /// Represents a command type with a specific identifier.
        /// </summary>
        Cmd,

        /// <summary>
        /// Representsthe COBOL (Common Business-Oriented Language).
        /// </summary>
        Cobol,

        /// <summary>
        /// Represents the C++ programming language in the enumeration.
        /// </summary>
        Cpp,

        /// <summary>
        /// Represents the C# programming language.
        /// </summary>
        CSharp,

        /// <summary>
        /// Represents the Groovy programming language.
        /// </summary>
        Groovy,

        /// <summary>
        /// 
        /// </summary>
        Java,

        /// <summary>
        /// Represents the JavaScript programming language.
        /// </summary>
        JavaScript,

        /// <summary>
        /// Represents the Markdown format type.
        /// </summary>
        Markdown,

        /// <summary>
        /// Represents the PHP programming language in the enumeration.
        /// </summary>
        Php,

        /// <summary>
        /// Represents the PowerShell scripting language.
        /// </summary>
        PowerShell,

        /// <summary>
        /// Represents a specific property value used within the application.
        /// </summary>
        Property,

        /// <summary>
        /// Represents the Python programming language with a specific identifier.
        /// </summary>
        Python,

        /// <summary>
        /// Represents a Visual Basic code element or feature within the application.
        /// </summary>
        VisualBasic,

        /// <summary>
        /// Represents the XML format type.
        /// </summary>
        Xml
    }

    /// <summary>
    /// Provides extension methods for the <see cref="TypeLanguage"/> enum.
    /// </summary>
    public static class TTypeLanguageExtensions
    {
        /// <summary>
        /// Converts the language to a language name.
        /// </summary>
        /// <param name="language">The language to convert.</param>
        /// <returns>The language name.</returns>
        public static string ToLanguage(this TypeLanguage language)
        {
            return language switch
            {
                TypeLanguage.Bash => "bash",
                TypeLanguage.Basic => "basic",
                TypeLanguage.Cmd => "cmd",
                TypeLanguage.Cobol => "cobol",
                TypeLanguage.Cpp => "cpp",
                TypeLanguage.CSharp => "csharp",
                TypeLanguage.Groovy => "groovy",
                TypeLanguage.Java => "java",
                TypeLanguage.JavaScript => "javascript",
                TypeLanguage.Markdown => "markdown",
                TypeLanguage.Php => "php",
                TypeLanguage.PowerShell => "powershell",
                TypeLanguage.Property => "property",
                TypeLanguage.Python => "python",
                TypeLanguage.VisualBasic => "visualbasic",
                TypeLanguage.Xml => "xml",
                _ => null,
            };
        }
    }
}
