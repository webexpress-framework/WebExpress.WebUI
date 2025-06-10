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

            _componentHub = componentHub;

            Title = pageContext?.PageTitle;
            _favicons.Add(new Favicon(RouteEndpoint.Combine(contextPath, "/assets/img/rocket.png")));

            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/fontawesome.min.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/bootstrap.min.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/solid.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.button.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.dropdownbutton.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.editor.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.expand.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.form.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.modal.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.modalpage.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.modalform.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.more.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.move.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.pagination.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.search.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.selection.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.table.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.toolpanel.css"));
            _cssLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/css/webexpress.webui.tree.css"));

            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/jquery-3.7.1.min.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/popper.min.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/bootstrap.min.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.button.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.dropdownbutton.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.editor.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.expand.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.form.progress.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.modal.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.modalpage.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.modalform.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.modalconfirm.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.modalconfirmdelete.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.more.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.move.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.pagination.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.search.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.selection.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.table.js"));
            _headerScriptLinks.Add(RouteEndpoint.Combine(contextPath, "/assets/js/webexpress.webui.tree.js"));

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
            //html.Body.Elements.AddRange(Content?.Where(x => x.Enable).Select(x => x.Render(context)));
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
            return StatusCode switch
            {
                200 => new ResponseOK() { Content = Render(context) },
                201 => new ResponseCreated() { Content = Render(context) },
                204 => new ResponseNoContent() { Content = Render(context) },
                301 => new ResponseMovedPermanently() { Content = Render(context) },
                //302 => new ResponseMovedTemporarily() { Content = Render(context) },
                400 => new ResponseBadRequest() { Content = Render(context) },
                401 => new ResponseUnauthorized() { Content = Render(context) },
                404 => new ResponseNotFound() { Content = Render(context) },
                422 => new ResponseUnprocessableEntity() { Content = Render(context) },
                500 => new ResponseInternalServerError() { Content = Render(context) },
                _ => new ResponseOK() { Content = Render(context) }
            };
        }
    }
}
