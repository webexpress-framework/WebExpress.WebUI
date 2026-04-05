using System;
using System.Linq;
using WebExpress.WebCore;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebEndpoint;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebPage;
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
        public IUri Uri { get; set; }

        /// <summary>
        /// Returns or sets the size.
        /// </summary>
        public TypeSizeText Size
        {
            get => (TypeSizeText)GetProperty(TypeSizeText.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Return or sets a prefix, which is statically displayed in front of the links.
        /// </summary>
        public string Prefix { get; set; }

        /// <summary>
        /// Return or sets how many links to display. It will be truncated at the beginning of the link chain.
        /// </summary>
        public ushort TakeLast { get; set; } = ushort.MaxValue;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlBreadcrumb(string id = null)
            : base(id)
        {
            Size = TypeSizeText.Small;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return Render(renderContext, visualTree, Uri);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="uri">The URI used to generate the breadcrumb links.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IUri uri)
        {
            var siteManager = WebEx.ComponentHub.SitemapManager;
            var lastEndpointContext = default(IEndpointContext);

            var html = new HtmlElementTextContentOl()
            {
                Id = Id,
                Class = Css.Concatenate("wx-breadcrumb", GetClasses()),
                Style = GetStyles(),
            };

            if (!string.IsNullOrWhiteSpace(Prefix))
            {
                html.Add
                (
                    new HtmlElementTextContentLi
                    (
                        new HtmlElementTextContentDiv
                        (
                            new HtmlText(I18N.Translate(renderContext.Request?.Culture, Prefix))
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

            var takeLast = Math.Min(TakeLast, uri.PathSegments.Count());
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
                                        Icon = pathIcon
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
                                        Icon = icon
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
