using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Shows a set of avatars as a compact, overlapping stack. Only the first few
    /// avatars are shown inline; the rest collapse into a <c>+N</c> overflow chip.
    /// </summary>
    public class ControlAvatarGroup : Control
    {
        private readonly List<ControlAvatarGroupItem> _items = [];

        /// <summary>
        /// Gets the avatars of the group.
        /// </summary>
        public IEnumerable<ControlAvatarGroupItem> Items => _items;

        /// <summary>
        /// Gets or sets the maximum number of avatars shown inline before the
        /// remaining ones collapse into a <c>+N</c> overflow chip. Defaults to 5.
        /// </summary>
        public Func<IRenderControlContext, int?> MaxVisible { get; set; } = _ => 5;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The avatars of the group.</param>
        public ControlAvatarGroup(string id = null, params ControlAvatarGroupItem[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more avatars to the group.
        /// </summary>
        /// <param name="items">The avatars to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlAvatarGroup Add(params ControlAvatarGroupItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var max = MaxVisible?.Invoke(renderContext) ?? 5;
            var visible = max > 0 ? _items.Take(max).ToList() : [.. _items];
            var overflow = _items.Count - visible.Count;

            var html = new HtmlElementTextContentDiv([.. visible.Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate("wx-avatar-group", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            };

            if (overflow > 0)
            {
                var hidden = string.Join(", ", _items.Skip(visible.Count).Select(x => x.Name?.Invoke(renderContext)).Where(x => !string.IsNullOrWhiteSpace(x)));

                html.Add(new HtmlElementTextSemanticsSpan(new HtmlText("+" + overflow)) { Class = "wx-avatar-group-more" }
                    .AddUserAttribute("title", string.IsNullOrWhiteSpace(hidden) ? null : hidden));
            }

            return html;
        }
    }
}
