using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.WebPage
{
    /// <summary>
    /// Represents a control that is part of the visual tree and implements the IVisualTree interface.
    /// </summary>
    public interface IVisualTreeControl : IVisualTree
    {
        /// <summary>
        /// Returns the title of the html document.
        /// </summary>
        string Title { get; set; }

        /// <summary>
        /// Gets or sets the HTTP status code associated with the response.
        /// </summary>
        int StatusCode { get; set; }

        /// <summary>
        /// Returns the favicons.
        /// </summary>
        IEnumerable<Favicon> Favicons { get; }

        /// <summary>
        /// Returns the internal stylesheet.  
        /// </summary>
        IEnumerable<string> Styles { get; }

        /// <summary>
        /// Returns the links to the java script files to be used, which are inserted in the header.
        /// </summary>
        IEnumerable<string> HeaderScriptLinks { get; }

        /// <summary>
        /// Returns the links to the java script files to be used.
        /// </summary>
        IEnumerable<string> ScriptLinks { get; }

        /// <summary>
        /// Returns the links to the java script files to be used, which are inserted in the header.
        /// </summary>
        IEnumerable<string> HeaderScripts { get; }

        /// <summary>
        /// Returns the links to the java script files to be used.
        /// </summary>
        IReadOnlyDictionary<string, string> Scripts { get; }

        /// <summary>
        /// Returns the links to the css files to be used.
        /// </summary>
        IEnumerable<string> CssLinks { get; }

        /// <summary>
        /// Returns the meta information.
        /// </summary>
        IReadOnlyDictionary<string, string> Meta { get; }

        /// <summary>
        /// Returns the content.
        /// </summary>
        IEnumerable<IControl> Content { get; }

        /// <summary>
        /// Adds a favicon to the web application.
        /// </summary>
        /// <param name="url">The URL of the favicon.</param>
        /// <param name="mediatype">The media type of the favicon.</param>
        void AddFavicon(string url, string mediatype);

        /// <summary>
        /// Removes a favicon from the web application.
        /// </summary>
        /// <param name="url">The URL of the favicon to remove.</param>
        void RemoveFavicon(string url);

        /// <summary>
        /// Adds one or more styles to the head.
        /// </summary>
        /// <param name="styles">The styles to add.</param>
        void AddStyle(params string[] styles);

        /// <summary>
        /// Removes a style from the head.
        /// </summary>
        /// <param name="style">The style to remove.</param>
        void RemoveStyle(string style);

        /// <summary>
        /// Adds one or more URLs to the list of header script links.
        /// </summary>
        /// <param name="urls">The URLs of the script to add.</param>
        void AddHeaderScriptLink(params string[] urls);

        /// <summary>
        /// Removes a URL from the list of header script links.
        /// </summary>
        /// <param name="url">The URL of the script to remove.</param>
        void RemoveHeaderScriptLink(string url);

        /// <summary>
        /// Adds one or more URLs to the list of script links.
        /// </summary>
        /// <param name="urls">The URLs of the script to add.</param>
        void AddScriptLink(params string[] urls);

        /// <summary>
        /// Removes a URL from the list of script links.
        /// </summary>
        /// <param name="url">The URL of the script to remove.</param>
        void RemoveScriptLink(string url);

        /// <summary>
        /// Adds one or more URLs to the list of header scripts.
        /// </summary>
        /// <param name="urls">The URLs of the script to add.</param>
        void AddHeaderScript(params string[] urls);

        /// <summary>
        /// Removes a URL from the list of header scripts.
        /// </summary>
        /// <param name="url">The URL of the script to remove.</param>
        void RemoveHeaderScript(string url);

        /// <summary>
        /// Adds a script to the collection. If a script with the same identifier already exists, it will be overwritten.
        /// </summary>
        /// <param name="id">The identifier of the script.</param>
        /// <param name="script">The script content.</param>
        void AddScript(string id, string script);

        /// <summary>
        /// Removes a script from the collection.
        /// </summary>
        /// <param name="id">The identifier of the script to remove.</param>
        void RemoveScript(string id);

        /// <summary>
        /// Adds one or more URLs to the list of CSS links.
        /// </summary>
        /// <param name="urls">The URLs of the CSS file to add.</param>
        void AddCssLink(params string[] urls);

        /// <summary>
        /// Removes all CSS links that match the specified URL.
        /// </summary>
        /// <param name="url">The URL of the CSS link to remove.</param>
        void RemoveCssLink(string url);

        /// <summary>
        /// Adds a meta tag to the collection. If a meta tag with the same name already exists, it will be overwritten.
        /// </summary>
        /// <param name="name">The name of the meta tag.</param>
        /// <param name="content">The content of the meta tag.</param>
        void AddMeta(string name, string content);

        /// <summary>
        /// Removes a meta tag from the collection.
        /// </summary>
        /// <param name="name">The name of the meta tag to remove.</param>
        void RemoveMeta(string name);

        /// <summary>
        /// Adds one or more controls to the content of the page.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        void AddContent(params IControl[] controls);

        /// <summary>
        /// Removes a control from the content of the page.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        void RemoveContent(IControl control);
    }
}
