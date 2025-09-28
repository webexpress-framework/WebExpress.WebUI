using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebComponent;
using WebExpress.WebCore.WebEndpoint;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebPage;
using WebExpress.WebUI.WebControl;

namespace WebExpress.WebUI.WebPage
{
    /// <summary>
    /// The content design of a page is realized by controls.
    /// </summary>
    public class VisualTreeControl : IVisualTreeControl
    {
        private int _statusCode = 200;
        private IRoute _base;
        private readonly IComponentHub _componentHub;
        private readonly List<Favicon> _favicons = [];
        private readonly List<string> _styles = [];
        private readonly List<string> _headerScriptLinks = [];
        private readonly List<string> _scriptLinks = [];
        private readonly List<string> _headerScripts = [];
        private readonly Dictionary<string, string> _scripts = [];
        private readonly List<string> _cssLinks = [];
        private readonly Dictionary<string, string> _meta = [];
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Returns the component hub.
        /// </summary>
        protected IComponentHub ComponentHub => _componentHub;

        /// <summary>
        /// Returns or sets the HTTP status code associated with the response.
        /// </summary>
        public int StatusCode
        {
            get { return _statusCode; }
            set { _statusCode = Math.Max(_statusCode, value); }
        }

        /// <summary>
        /// Returns the title of the html document.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Returns the favicons.
        /// </summary>
        public IEnumerable<Favicon> Favicons => _favicons;

        /// <summary>
        /// Returns the internal stylesheet.  
        /// </summary>
        public IEnumerable<string> Styles => _styles;

        /// <summary>
        /// Returns the links to the java script files to be used, which are inserted in the header.
        /// </summary>
        public IEnumerable<string> HeaderScriptLinks => _headerScriptLinks;

        /// <summary>
        /// Returns the links to the java script files to be used.
        /// </summary>
        public IEnumerable<string> ScriptLinks => _scriptLinks;

        /// <summary>
        /// Returns the links to the java script files to be used, which are inserted in the header.
        /// </summary>
        public IEnumerable<string> HeaderScripts => _headerScripts;

        /// <summary>
        /// Returns the links to the java script files to be used.
        /// </summary>
        public IReadOnlyDictionary<string, string> Scripts => _scripts;

        /// <summary>
        /// Returns the links to the css files to be used.
        /// </summary>
        public IEnumerable<string> CssLinks => _cssLinks;

        /// <summary>
        /// Returns the base route for the current page.
        /// </summary>
        public IRoute Base => _base;

        /// <summary>
        /// Returns the meta information.
        /// </summary>
        public IReadOnlyDictionary<string, string> Meta => _meta;

        /// <summary>
        /// Returns the content.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="componentHub">The component hub.</param>
        /// <param name="pageContext">The page context.</param>
        public VisualTreeControl(IComponentHub componentHub, IPageContext pageContext)
        {
            var contextPath = pageContext.ApplicationContext?.Route;
            var baseUri = RouteEndpoint.Combine(contextPath, "webexpress.webui/assets");

            _componentHub = componentHub;

            Title = pageContext?.PageTitle;
            _favicons.Add(new Favicon(RouteEndpoint.Combine(baseUri, "img/rocket.png")));

            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/fontawesome.min.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/bootstrap.min.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/solid.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.avatar.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.button.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.calendar.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.code.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.date.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.dropdown.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.editor.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.expandable.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.filelist.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.form.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.modal.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.modal.page.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.modal.form.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.move.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.overflow.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.pagination.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.search.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.selection.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.sidebar.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.smartedit.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.smartview.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.split.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.table.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.tag.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.tile.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.toolbar.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.tree.css"));
            _cssLinks.Add(RouteEndpoint.Combine(baseUri, "css/webexpress.webui.upload.css"));

            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/popper.min.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/bootstrap.min.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.avatar.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.button.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.calendar.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.code.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.date.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.dropdown.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.editor.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.expandable.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.filelist.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.input.avatar.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.input.calendar.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.input.date.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.input.move.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.input.selection.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.input.tag.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.form.progress.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.modal.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.modal.page.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.modal.form.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.modal.confirm.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.modal.confirm.delete.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.modal.sidebar.panel.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.move.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.overflow.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.pagination.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.responsive.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.search.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.search.content.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.selection.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.sidebar.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.smartedit.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.smartview.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.split.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.table.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.tag.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.tile.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.toolbar.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.tree.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/webexpress.webui.upload.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/i18n/en.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/i18n/de.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/bash.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/basic.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/cmd.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/cobol.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/cpp.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/csharp.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/groovy.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/java.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/javascript.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/markdown.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/php.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/powershell.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/property.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/python.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/visualbasic.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/syntax/xml.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/panels/webexpress.webapp.panel.editor.image.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(baseUri, "js/panels/webexpress.webapp.panel.editor.link.js"));

            _base = contextPath;

            _meta.Add("charset", "UTF-8");
            _meta.Add("viewport", "width=device-width, initial-scale=1");
        }

        /// <summary>
        /// Adds a favicon to the web application.
        /// </summary>
        /// <param name="url">The URL of the favicon.</param>
        /// <param name="mediatype">The media type of the favicon.</param>
        public virtual void AddFavicon(string url, string mediatype)
        {
            _favicons.Add(new Favicon(url, mediatype));
        }

        /// <summary>
        /// Removes a favicon from the web application.
        /// </summary>
        /// <param name="url">The URL of the favicon to remove.</param>
        public virtual void RemoveFavicon(string url)
        {
            _favicons.RemoveAll(x => x.Url.Equals(url));
        }

        /// <summary>
        /// Adds one or more styles to the head.
        /// </summary>
        /// <param name="styles">The styles to add.</param>
        public virtual void AddStyle(params string[] styles)
        {
            _styles.AddRange(styles);
        }

        /// <summary>
        /// Removes a style from the head.
        /// </summary>
        /// <param name="style">The style to remove.</param>
        public virtual void RemoveStyle(string style)
        {
            _styles.RemoveAll(x => x.Equals(style));
        }

        /// <summary>
        /// Adds one or more URLs to the list of header script links.
        /// </summary>
        /// <param name="urls">The URLs of the script to add.</param>
        public virtual void AddHeaderScriptLink(params string[] urls)
        {
            _headerScriptLinks.AddRange(urls);
        }

        /// <summary>
        /// Removes a URL from the list of header script links.
        /// </summary>
        /// <param name="url">The URL of the script to remove.</param>
        public virtual void RemoveHeaderScriptLink(string url)
        {
            _headerScriptLinks.RemoveAll(x => x.Equals(url));
        }

        /// <summary>
        /// Adds one or more URLs to the list of script links.
        /// </summary>
        /// <param name="urls">The URLs of the script to add.</param>
        public virtual void AddScriptLink(params string[] urls)
        {
            _scriptLinks.AddRange(urls);
        }

        /// <summary>
        /// Removes a URL from the list of script links.
        /// </summary>
        /// <param name="url">The URL of the script to remove.</param>
        public virtual void RemoveScriptLink(string url)
        {
            _scriptLinks.RemoveAll(x => x.Equals(url));
        }

        /// <summary>
        /// Adds one or more URLs to the list of header scripts.
        /// </summary>
        /// <param name="urls">The URLs of the script to add.</param>
        public virtual void AddHeaderScript(params string[] urls)
        {
            _headerScripts.AddRange(urls);
        }

        /// <summary>
        /// Removes a URL from the list of header scripts.
        /// </summary>
        /// <param name="url">The URL of the script to remove.</param>
        public virtual void RemoveHeaderScript(string url)
        {
            _headerScripts.RemoveAll(x => x.Equals(url));
        }

        /// <summary>
        /// Adds a script to the collection. If a script with the same identifier already exists, it will be overwritten.
        /// </summary>
        /// <param name="id">The identifier of the script.</param>
        /// <param name="script">The script content.</param>
        public virtual void AddScript(string id, string script)
        {
            if (id != null)
            {
                _scripts[id] = script;
            }
        }

        /// <summary>
        /// Removes a script from the collection.
        /// </summary>
        /// <param name="id">The identifier of the script to remove.</param>
        public virtual void RemoveScript(string id)
        {
            _scripts.Remove(id);
        }

        /// <summary>
        /// Adds one or more URLs to the list of CSS links.
        /// </summary>
        /// <param name="urls">The URLs of the CSS file to add.</param>
        public virtual void AddCssLink(params string[] urls)
        {
            _cssLinks.AddRange(urls);
        }

        /// <summary>
        /// Removes all CSS links that match the specified URL.
        /// </summary>
        /// <param name="url">The URL of the CSS link to remove.</param>
        public virtual void RemoveCssLink(string url)
        {
            _cssLinks.RemoveAll(x => x.Equals(url));
        }

        /// <summary>
        /// Adds a meta tag to the collection. If a meta tag with the same name already exists, it will be overwritten.
        /// </summary>
        /// <param name="name">The name of the meta tag.</param>
        /// <param name="content">The content of the meta tag.</param>
        public virtual void AddMeta(string name, string content)
        {
            _meta[name] = content;
        }

        /// <summary>
        /// Removes a meta tag from the collection.
        /// </summary>
        /// <param name="name">The name of the meta tag to remove.</param>
        public virtual void RemoveMeta(string name)
        {
            _meta.Remove(name);
        }

        /// <summary>
        /// Adds one or more controls to the content of the page.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        public virtual void AddContent(params IControl[] controls)
        {
            _content.AddRange(controls);
        }

        /// <summary>
        /// Removes a control from the content of the page.
        /// </summary>
        /// <param name="control">The control to remove from the content.</param>
        public virtual void RemoveContent(IControl control)
        {
            _content.Remove(control);
        }

        /// <summary>
        /// Convert to html.
        /// </summary>
        /// <param name="context">The context for rendering the page.</param>
        /// <returns>The page as an html tree.</returns>
        public virtual IHtmlNode Render(IVisualTreeContext context)
        {
            var html = new HtmlElementRootHtml();
            html.Head.Title = I18N.Translate(context.Request, Title);
            html.Head.Favicons = Favicons?.Select(x => new Favicon(x.Url, x.Mediatype));
            html.Head.Styles = Styles;
            html.Head.Meta = Meta;
            html.Head.Scripts = HeaderScripts;
            html.Head.Base = _base?.ToString();
            html.Body.Scripts = [.. Scripts.Values];

            html.Head.CssLinks = CssLinks.Where(x => x != null).Select(x => x.ToString());
            html.Head.ScriptLinks = HeaderScriptLinks?.Where(x => x != null).Select(x => x.ToString());

            return html;
        }

        /// <summary>
        /// Retrieves a response based on the provided visual tree context.
        /// </summary>
        /// <param name="context">The visual tree context used to generate the response. Cannot be null.</param>
        /// <returns>A object representing the generated response.</returns>
        public Response GetResponse(IVisualTreeContext context)
        {
            var content = Render(context);

            return StatusCode switch
            {
                200 => new ResponseOK() { Content = content },
                201 => new ResponseCreated() { Content = content },
                204 => new ResponseNoContent() { Content = content },
                301 => new ResponseMovedPermanently() { Content = content },
                302 => new ResponseMovedTemporarily() { Content = content },
                400 => new ResponseBadRequest() { Content = content },
                401 => new ResponseUnauthorized() { Content = content },
                404 => new ResponseNotFound() { Content = content },
                422 => new ResponseUnprocessableEntity() { Content = content },
                500 => new ResponseInternalServerError() { Content = content },
                _ => new ResponseOK() { Content = content }
            };
        }
    }
}
