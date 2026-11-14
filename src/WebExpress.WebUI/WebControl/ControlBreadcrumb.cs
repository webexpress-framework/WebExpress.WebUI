using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebTheme;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a breadcrumb control that displays a list of links indicating the current 
    /// page's location within a navigational hierarchy.
    /// </summary>
    public class ControlBreadcrumb : Control
    {
        /// <summary>
        /// Return or sets the uri.
        /// </summary>
        public Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeText> Size
        {
            get => (Func<IRenderControlContext, TypeSizeText>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Return or sets a prefix, which is statically displayed in front of the links.
        /// </summary>
        public Func<IRenderControlContext, string> Prefix { get; set; }

        /// <summary>
        /// Return or sets how many links to display. It will be truncated at the beginning of the link chain.
        /// </summary>
        public Func<IRenderControlContext, ushort> TakeLast { get; set; } = _ => ushort.MaxValue;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlBreadcrumb(string id = null)
            : base(id)
        {
            Size = _ => TypeSizeText.Small;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var prefix = Prefix?.Invoke(renderContext);
            var uri = Uri?.Invoke(renderContext);
            var takeLast = TakeLast?.Invoke(renderContext) ?? ushort.MaxValue;
            var siteManager = WebEx.ComponentHub.SitemapManager;
            var lastEndpointContext = default(WebCore.WebEndpoint.IEndpointContext);

            // the trail is a navigation landmark of its own, named so it is told apart from
            // the site menu; the list inside keeps the crumbs
            var html = new HtmlElementTextContentOl()
            {
                Class = "wx-breadcrumb"
            };
            var nav = new HtmlElementSectionNav(html)
            {
                Id = Id,
                Class = Css.Concatenate("wx-breadcrumb-nav", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
            }
                .AddUserAttribute("aria-label", I18N.Translate(renderContext, "webexpress.webui:breadcrumb.label"));

            if (!string.IsNullOrWhiteSpace(prefix))
            {
                html.Add
                (
                    new HtmlElementTextContentLi
                    (
                        new HtmlElementTextContentDiv
                        (
                            new HtmlText(I18N.Translate(renderContext.Request?.Culture, prefix))
                        )
                    )
                    {
                        Class = "wx-breadcrumb-prefix"
                    }
                );
            }

            if (uri is null)
            {
                return nav;
            }

            takeLast = (ushort)Math.Min(takeLast, uri?.PathSegments.Count() ?? 0);
            var from = uri.PathSegments.Count() - takeLast;

            for (int i = from + 1; i < uri.PathSegments.Count() + 1; i++)
            {
                var path = uri.Take(i);
                var last = path?.PathSegments?.LastOrDefault();
                var href = last?.Uri ?? path;
                var endpointContext = siteManager.GetEndpoint(href);

                // one segment of the address, several steps of the trail: the ancestors of a page
                // in a hierarchy each get a crumb of their own, whatever endpoint the address has
                if (last is IUriPathSegmentTrail trail && !last.IsHidden)
                {
                    foreach (var crumb in trail.GetTrail(renderContext) ?? [])
                    {
                        if (crumb is null || crumb.Hidden)
                        {
                            continue;
                        }

                        html.Add(RenderCrumb(renderContext, visualTree, crumb.Text, crumb.Icon, crumb.Uri, crumb.Menu));
                    }

                    lastEndpointContext = endpointContext;
                    continue;
                }

                if (endpointContext == lastEndpointContext)
                {
                    continue;
                }

                var displayText = path.GetDisplayText(renderContext);
                var pathIcon = path.GetIcon(renderContext);

                if (last?.IsHidden ?? false)
                {
                    // ignore
                }
                else if (displayText is not null)
                {
                    var display = I18N.Translate(renderContext.Request?.Culture, displayText);

                    html.Add
                    (
                        new HtmlElementTextContentLi()
                            .Add
                            (
                                pathIcon is not null
                                    ? new ControlIcon()
                                    {
                                        Icon = _ => pathIcon
                                    }
                                        .Render(renderContext, visualTree)
                                    : null
                            )
                            .Add(new HtmlElementTextSemanticsA(display)
                            {
                                Href = href?.ToString()
                            })
                    );
                }
                else if (endpointContext is PageContext page)
                {
                    var display = I18N.Translate(renderContext.Request?.Culture, page.PageTitle);
                    var icon = page?.PageIcon;

                    html.Add
                    (
                        new HtmlElementTextContentLi()
                            .Add
                            (
                                icon is not null
                                    ? new ControlIcon()
                                    {
                                        Icon = _ => icon
                                    }
                                        .Render(renderContext, visualTree)
                                    : null
                            )
                            .Add(new HtmlElementTextSemanticsA(display)
                            {
                                Href = href?.ToString()
                            })
                    );
                }

                lastEndpointContext = endpointContext;
            }

            // the last crumb is the page being read
            (html.Elements.LastOrDefault() as HtmlElement)?.Elements.OfType<HtmlElementTextSemanticsA>().LastOrDefault()?.AddUserAttribute("aria-current", "page");

            return nav;
        }

        /// <summary>
        /// Renders a crumb of a trail segment: its icon, its link and, when it has one, a menu
        /// that leads sideways - to the siblings of a page, for instance.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="text">The text or its internationalization key.</param>
        /// <param name="icon">The icon, or null.</param>
        /// <param name="uri">The address, or null for a crumb that is text only.</param>
        /// <param name="menu">The menu entries, or none.</param>
        /// <returns>The list item of the crumb.</returns>
        private static HtmlElementTextContentLi RenderCrumb(IRenderControlContext renderContext, IVisualTreeControl visualTree,
            string text, WebCore.WebIcon.IIcon icon, IUri uri, IEnumerable<UriTrailCrumb> menu)
        {
            var display = I18N.Translate(renderContext.Request?.Culture, text);
            var entries = menu?.Where(x => x is not null && !x.Hidden).ToArray() ?? [];
            var li = new HtmlElementTextContentLi();

            li.Add
            (
                icon is not null
                    ? new ControlIcon()
                    {
                        Icon = _ => icon
                    }
                        .Render(renderContext, visualTree)
                    : null
            );

            li.Add
            (
                uri is not null
                    ? new HtmlElementTextSemanticsA(display) { Href = uri.ToString() }
                    : new HtmlElementTextSemanticsSpan(new HtmlText(display))
            );

            if (entries.Length > 0)
            {
                li.Class = "wx-breadcrumb-menu";
                li.Add(new ControlDropdown(null, [.. entries.Select(x => new ControlDropdownItemLink()
                {
                    Text = _ => x.Text,
                    Icon = _ => x.Icon,
                    Uri = _ => x.Uri
                })])
                {
                    Icon = _ => new WebIcon.IconAngleDown(),
                    Tooltip = _ => display,
                    Size = _ => TypeSizeButton.Small
                }
                    .Render(renderContext, visualTree));
            }

            return li;
        }
    }
}
