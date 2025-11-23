using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebParameter;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a pagination control that allows navigation through pages of content.
    /// </summary>
    public class ControlPagination : Control
    {
        /// <summary>
        /// Returns or sets the number of pages.
        /// </summary>
        public uint PageCount { get; set; }

        /// <summary>
        /// Returns or sets the page size.
        /// </summary>
        public uint PageSize { get; set; }

        /// <summary>
        /// Returns or sets the current page.
        /// </summary>
        public uint PageOffset { get; set; }

        /// <summary>
        /// Returns or sets the maximum number of side buttons.
        /// </summary>
        public uint MaxDisplayCount { get; set; }

        /// <summary>
        /// Returns or sets the size.
        /// </summary>
        public TypeSizePagination Size
        {
            get => (TypeSizePagination)GetProperty(TypeSizePagination.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlPagination(string id = null)
            : base(id)
        {
            MaxDisplayCount = 5;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var html = new HtmlElementTextContentUl()
            {
                Id = Id,
                Class = Css.Concatenate("pagination", Css.Remove(GetClasses(), BackgroundColor?.ToClass(), BorderColor?.ToClass())),
                Style = Style.Remove(GetStyles(), BackgroundColor.ToStyle()),
                Role = Role
            };

            if (PageOffset >= PageCount)
            {
                PageOffset = PageCount - 1;
            }

            if (PageOffset < 0)
            {
                PageOffset = 0;
            }

            if (PageOffset > 0 && PageCount > 1)
            {
                html.Add
                (
                    new HtmlElementTextContentLi
                    (
                        new ControlLink()
                        {
                            Params = Parameter.Create(new Parameter("offset", (int)PageOffset - 1, ParameterScope.Parameter)),
                            Classes = ["page-link"],
                            Icon = new IconAngleLeft()
                        }.Render(renderContext, visualTree)
                    )
                    {
                        Class = "page-item"
                    }
                );
            }
            else
            {
                html.Add
                (
                    new HtmlElementTextContentLi
                    (
                        new ControlLink()
                        {
                            Params = Parameter.Create(),
                            Classes = ["page-link"],
                            Icon = new IconAngleLeft()
                        }.Render(renderContext, visualTree)
                    )
                    {
                        Class = "page-item disabled"
                    }
                );
            }

            var buf = new List<int>((int)MaxDisplayCount);

            var j = 0;
            var k = 0;

            buf.Add((int)PageOffset);
            while (buf.Count < Math.Min(PageCount, MaxDisplayCount))
            {
                if (PageOffset + j + 1 < PageCount)
                {
                    j += 1;
                    buf.Add((int)PageOffset + j);
                }

                if (PageOffset - k - 1 >= 0)
                {
                    k += 1;
                    buf.Add((int)PageOffset - k);
                }
            }

            buf.Sort();

            foreach (var v in buf)
            {
                if (v == PageOffset)
                {
                    html.Add
                    (
                        new HtmlElementTextContentLi
                        (
                            new ControlLink()
                            {
                                Text = (v + 1).ToString(),
                                BackgroundColor = BackgroundColor,
                                Params = Parameter.Create(new Parameter("offset", v, ParameterScope.Parameter)),
                                Classes = [Css.Concatenate("page-link")],
                                Styles = [Style.Concatenate("", BackgroundColor.ToStyle())]
                            }.Render(renderContext, visualTree)
                        )
                        {
                            Class = "page-item active"
                        }
                    );
                }
                else
                {
                    html.Add
                    (
                        new HtmlElementTextContentLi
                        (
                            new ControlLink()
                            {
                                Text = (v + 1).ToString(),
                                Params = Parameter.Create(new Parameter("offset", v, ParameterScope.Parameter)),
                                Classes = ["page-link"]
                            }.Render(renderContext, visualTree)
                        )
                        {
                            Class = "page-item"
                        }
                    );
                }
            }

            if (PageOffset < PageCount - 1)
            {
                html.Add
                (
                    new HtmlElementTextContentLi
                    (
                        new ControlLink()
                        {
                            Params = Parameter.Create(new Parameter("offset", (int)PageOffset + 1, ParameterScope.Parameter)),
                            Classes = ["page-link"],
                            Icon = new IconAngleRight()
                        }.Render(renderContext, visualTree)
                    )
                    {
                        Class = "page-item"
                    }
                );
            }
            else
            {
                html.Add
                (
                    new HtmlElementTextContentLi
                    (
                        new ControlLink()
                        {
                            Params = Parameter.Create(),
                            Classes = ["page-link"],
                            Icon = new IconAngleRight()
                        }.Render(renderContext, visualTree)
                    )
                    {
                        Class = "page-item disabled"
                    }
                );
            }

            return html;
        }
    }
}
