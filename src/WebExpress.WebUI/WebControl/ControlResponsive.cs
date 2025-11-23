using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The Responsive control is a UI controller that dynamically shows or hides
    /// panels depending on the width of its container. It enables modular, responsive
    /// layouts by selecting the most appropriate panel for the current viewport size.
    /// Only one panel is visible at a time, based on the active breakpoint.
    /// </summary>
    public class ControlResponsive : Control, IControlResponsive
    {
        private readonly Dictionary<int, IControlPanel> _panels = [];

        /// <summary>
        /// The list of responsive panels.
        /// </summary>
        public IEnumerable<KeyValuePair<int, IControlPanel>> Panels => _panels.OrderBy(p => p.Key);

        /// <summary>
        /// The fallback if no breakpoint matches.
        /// </summary>
        public IControlPanel Fallback => _panels[-1];

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlResponsive(string id = null)
            : base(id)
        {
        }

        /// <summary>
        /// Adds a panel with a specific breakpoint.
        /// </summary>
        /// <param name="panel">The panel to add.</param>
        /// <param name="breakpoint">
        /// The minimum width at which the panel becomes visible. Use values less than 0 to register as fallback panel.
        /// </param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlResponsive Add(IControlPanel panel, int breakpoint)
        {
            if (panel is null)
            {
                return this;
            }

            if (breakpoint < 0)
            {
                return SetFallback(panel);
            }

            if (!_panels.TryAdd(breakpoint, panel))
            {
                _panels[breakpoint] = panel;
            }

            return this;
        }

        /// <summary>
        /// Removes a previously added panel.
        /// </summary>
        /// <param name="panel">The panel to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlResponsive Remove(IControlPanel panel)
        {
            if (panel is null)
            {
                return this;
            }

            var match = _panels.FirstOrDefault(p => ReferenceEquals(p.Value, panel));
            if (!match.Equals(default(KeyValuePair<int, IControlPanel>)))
            {
                _panels.Remove(match.Key);
            }

            return this;
        }

        /// <summary>
        /// Sets the fallback panel to be shown when no breakpoint matches.
        /// </summary>
        /// <param name="panel">The fallback panel to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlResponsive SetFallback(IControlPanel panel)
        {
            if (panel is null)
            {
                return this;
            }

            if (!_panels.TryAdd(-1, panel))
            {
                _panels[-1] = panel;
            }

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
            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-responsive", GetClasses()),
                Style = GetStyles(),
                Role = Role
            }
                .Add(Panels.Select(x =>
                {
                    var html = x.Value.Render(renderContext, visualTree);

                    if (x.Key < 0)
                    {
                        html.AddClass("wx-responsive-panel-fallback");
                    }
                    else
                    {
                        html.AddClass("wx-responsive-panel")
                            .AddUserAttribute("data-breakpoint", x.Key.ToString());
                    }

                    return html;
                }));

            return html;
        }
    }
}
