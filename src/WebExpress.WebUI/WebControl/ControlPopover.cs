using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a trigger that reveals a small popover with a title and a
    /// message. The trigger label is the control's text or child content; the
    /// popover itself is wired by the client-side
    /// <c>webexpress.webui.PopoverCtrl</c>, because Bootstrap does not
    /// auto-initialize popovers.
    /// </summary>
    public class ControlPopover : Control
    {
        private readonly List<IControl> _content = [];

        /// <summary>
        /// Gets the child controls shown as the trigger label.
        /// </summary>
        public IEnumerable<IControl> Content => _content;

        /// <summary>
        /// Gets or sets the textual trigger label, used when no child content is set.
        /// </summary>
        public Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the title shown in the popover header.
        /// </summary>
        public Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the message shown in the popover body.
        /// </summary>
        public Func<IRenderControlContext, string> Message { get; set; }

        /// <summary>
        /// Gets or sets the side on which the popover is shown.
        /// </summary>
        public Func<IRenderControlContext, TypePopoverPlacement> Placement { get; set; } = _ => TypePopoverPlacement.Top;

        /// <summary>
        /// Gets or sets the interaction that reveals the popover.
        /// </summary>
        public Func<IRenderControlContext, TypePopoverTrigger> Trigger { get; set; } = _ => TypePopoverTrigger.Click;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The child controls shown as the trigger label.</param>
        public ControlPopover(string id = null, params IControl[] content)
            : base(id)
        {
            _content.AddRange(content);
        }

        /// <summary>
        /// Adds one or more controls to the trigger label.
        /// </summary>
        /// <param name="content">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public ControlPopover Add(params IControl[] content)
        {
            _content.AddRange(content);

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
            var text = Text?.Invoke(renderContext);
            var title = Title?.Invoke(renderContext);
            var message = Message?.Invoke(renderContext);
            var placement = Placement?.Invoke(renderContext) ?? TypePopoverPlacement.Top;
            var trigger = Trigger?.Invoke(renderContext) ?? TypePopoverTrigger.Click;
            var role = Role?.Invoke(renderContext) ?? "button";

            var html = new HtmlElementTextSemanticsSpan()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-popover", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role
            };

            html.AddUserAttribute("tabindex", "0");
            html.AddUserAttribute("data-bs-toggle", "popover");
            html.AddUserAttribute("data-bs-trigger", trigger.ToValue());
            html.AddUserAttribute("data-bs-placement", placement.ToValue());
            html.AddUserAttribute("data-bs-title", title);
            html.AddUserAttribute("data-bs-content", message);

            if (!string.IsNullOrWhiteSpace(text))
            {
                html.Add(new HtmlText(text));
            }

            html.Add([.. Content.Select(x => x.Render(renderContext, visualTree))]);

            return html;
        }
    }
}
