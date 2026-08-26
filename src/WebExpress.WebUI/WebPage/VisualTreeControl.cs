using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebComponent;
using WebExpress.WebCore.WebEndpoint;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebMessage;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebTheme;
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
        private readonly IPageContext _pageContext;
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
        /// Gets or sets the HTTP status code associated with the response.
        /// </summary>
        public int StatusCode
        {
            get { return _statusCode; }
            set { _statusCode = Math.Max(_statusCode, value); }
        }

        /// <summary>
        /// Gets the title of the html document.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets the active theme for the page. Resolved at construction time
        /// by picking the first theme registered for the application; null
        /// when the application has no theme.
        /// </summary>
        public IThemeContext Theme { get; protected set; }

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
            _componentHub = componentHub;
            _pageContext = pageContext;

            Title = pageContext?.PageTitle;

            // Resolve the active theme once at construction:
            //   1. [Theme<T>] declared on the application class wins, returned
            //      via IApplicationContext.DefaultTheme.
            //   2. Otherwise fall back to the first theme registered for the
            //      application (preserves the long-standing "default = first"
            //      convention documented in the Theme model).
            //   3. Otherwise leave Theme null.
            // Per-user theme overrides are wired by application code: the
            // page's Process override calls UseTheme<T>() based on whatever
            // store the application maintains (session, identity profile, …).
            var applicationContext = pageContext?.ApplicationContext;
            Theme = applicationContext?.DefaultTheme
                ?? componentHub?.ThemeManager?.Themes
                    ?.FirstOrDefault(t => t.ApplicationContext == applicationContext);

            _favicons.Add(new Favicon(RouteEndpoint.Combine(contextPath, WebEx.Favicon)));

            // an include names a file of its plugin, not a route - only the asset manager
            // knows where that plugin's assets are mounted for this application, and a
            // route composed here instead would drift from the mount silently: the browser
            // takes the html 404 page as a stylesheet with no rules.
            foreach (var include in _componentHub?.IncludeManager
                .GetIncludes(pageContext.ApplicationContext))
            {
                if (!include.Scopes.Any() || pageContext.Scopes.Intersect(include.Scopes).Any())
                {
                    foreach (var file in include.Files)
                    {
                        var route = _componentHub?.AssetManager?.GetAssetRoute
                        (
                            pageContext.ApplicationContext,
                            include.PluginContext,
                            file.FileName
                        )?.ToString();

                        if (route is null)
                        {
                            continue;
                        }

                        if (file.Type == WebCore.WebInclude.TypeInclude.StyleSheet)
                        {
                            _cssLinks.Add(route);
                        }
                        else if (file.Type == WebCore.WebInclude.TypeInclude.JavaScript)
                        {
                            _headerScriptLinks.Add(route);
                        }
                    }
                }
            }

            _base = contextPath;

            _meta.Add("charset", "UTF-8");
            _meta.Add("viewport", "width=device-width, initial-scale=1");
        }

        /// <summary>
        /// Overrides the active theme with the one identified by
        /// <typeparamref name="TTheme"/>. Looks the theme context up via the
        /// active <c>ThemeManager</c> for the page's application; when no
        /// matching theme is registered the call is a no-op and the previous
        /// theme stays in place.
        ///
        /// Derived visual trees (notably WebApp variants) can override
        /// <see cref="OnThemeChanged"/> to react to the swap, e.g. by
        /// re-adding the new theme's <c>ThemeStyle</c> CSS link.
        /// </summary>
        /// <typeparam name="TTheme">The theme type to use.</typeparam>
        /// <returns>The current instance for method chaining.</returns>
        public virtual VisualTreeControl UseTheme<TTheme>()
            where TTheme : class, ITheme
        {
            var resolved = _componentHub?.ThemeManager?
                .GetThemes(_pageContext?.ApplicationContext, typeof(TTheme))
                ?.FirstOrDefault();

            return UseTheme(resolved);
        }

        /// <summary>
        /// Overrides the active theme with the supplied resolved theme
        /// context. The call is a no-op when <paramref name="theme"/> is
        /// <see langword="null"/>; otherwise the previous theme is replaced
        /// and <see cref="OnThemeChanged"/> is invoked so subclasses can
        /// re-apply theme-specific resources. Use this overload when the
        /// theme has been resolved through a non-type lookup (cookie,
        /// session, identity preference, …).
        /// </summary>
        /// <param name="theme">The theme to activate.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual VisualTreeControl UseTheme(IThemeContext theme)
        {
            if (theme is null || theme == Theme)
            {
                return this;
            }

            var previous = Theme;
            Theme = theme;
            OnThemeChanged(previous, theme);
            return this;
        }

        /// <summary>
        /// Notification hook fired by <see cref="UseTheme{TTheme}"/> after the
        /// active theme has been swapped. Default implementation is a no-op;
        /// subclasses can override to re-apply theme-style CSS links etc.
        /// </summary>
        /// <param name="previousTheme">The theme that was active before the swap.</param>
        /// <param name="newTheme">The newly selected theme.</param>
        protected virtual void OnThemeChanged(IThemeContext previousTheme, IThemeContext newTheme)
        {
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
            if (id is not null)
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

            html.Head.CssLinks = CssLinks.Where(x => x is not null).Select(x => x.ToString());
            html.Head.ScriptLinks = HeaderScriptLinks?.Where(x => x is not null).Select(x => x.ToString());

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
