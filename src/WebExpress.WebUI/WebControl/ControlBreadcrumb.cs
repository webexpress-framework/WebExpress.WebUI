using System;
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
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
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

            var html = new HtmlElementTextContentOl()
            {
                Id = Id,
                Class = Css.Concatenate("wx-breadcrumb", GetClasses()),
                Style = GetStyles(),
            };

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
                return html;
            }

            takeLast = (ushort)Math.Min(takeLast, uri?.PathSegments.Count() ?? 0);
            var from = uri.PathSegments.Count() - takeLast;

            for (int i = from + 1; i < uri.PathSegments.Count() + 1; i++)
            {
                var path = uri.Take(i);
                var last = path?.PathSegments?.LastOrDefault();
                var href = last?.Uri ?? path;
                var endpointContext = siteManager.GetEndpoint(href);

                if (endpointContext == lastEndpointContext)
                {
                    continue;
                }

                var displayText = path.GetDisplayText(renderContext);
                var pathIcon = path.GetIcon(renderContext)?.ApplyIconTheme(visualTree.IconTheme);

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
                    var icon = page?.PageIcon?.ApplyIconTheme(visualTree.IconTheme);

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

            return html;
        }
    }
}
