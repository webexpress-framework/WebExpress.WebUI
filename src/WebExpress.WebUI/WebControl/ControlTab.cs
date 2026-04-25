using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;
using WebExpress.WebUI.WebSection;
using WebExpress.WebUI.WebFragment;
using WebExpress.WebCore;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tab control.
    /// </summary>
    public class ControlTab : Control, IControlTab
    {
        private readonly List<IControlTabView> _views = [];
        private readonly List<IControlToolbarItem> _toolbarItems = [];

        /// <summary>
        /// Returns the pages of the tab.
        /// </summary>
        public IEnumerable<IControlTabView> Views => _views;

        /// <summary>
        /// Returns the toolbar items of the tab.
        /// </summary>
        public IEnumerable<IControlToolbarItem> ToolbarItems => _toolbarItems;

        /// <summary>
        /// Gets or sets the highlight color for the active tab (used in Underline layout).
        /// </summary>
        public PropertyColorText HighlightColor { get; set; } = new PropertyColorText();

        /// <summary>
        /// Gets or sets the layout.
        /// </summary>
        public TypeLayoutTab Layout
        {
            get => (TypeLayoutTab)GetProperty(TypeLayoutTab.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="pages">The pages to add to the tab.</param>
        public ControlTab(string id = null, IControlTabView[] pages = null)
            : base(id)
        {
            _views.AddRange(pages ?? []);
        }

        /// <summary>
        /// Adds one or more pages to the tab.
        /// </summary>
        /// <param name="pages">The pages to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTab Add(params IControlTabView[] pages)
        {
            _views.AddRange(pages);

            return this;
        }

        /// <summary>
        /// Adds one or more pages to the tab.
        /// </summary>
        /// <param name="pages">The pages to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTab Add(IEnumerable<IControlTabView> pages)
        {
            _views.AddRange(pages);

            return this;
        }

        /// <summary>
        /// Removes the specified page from the tab.
        /// </summary>
        /// <param name="page">The page to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTab Remove(IControlTabView page)
        {
            _views.Remove(page);

            return this;
        }

        /// <summary>
        /// Adds one or more toolbar items to the tab.
        /// </summary>
        /// <param name="items">The toolbar items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTab Add(params IControlToolbarItem[] items)
        {
            _toolbarItems.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more toolbar items to the tab.
        /// </summary>
        /// <param name="items">The toolbar items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTab Add(IEnumerable<IControlToolbarItem> items)
        {
            _toolbarItems.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified toolbar item from the tab.
        /// </summary>
        /// <param name="item">The toolbar item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlTab Remove(IControlToolbarItem item)
        {
            _toolbarItems.Remove(item);

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
            return Render(renderContext, visualTree, _views);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <param name="pages">The pages to include in the rendered output.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public virtual IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree, IEnumerable<IControlTabView> pages)
        {
            var classes = Classes.ToList();

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-tab", classes),
                Style = GetStyles(),
                Role = Role
            };

            // Get tab view fragments
            var viewPreferences = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControl, SectionTabViewPreferences>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );
            var viewPrimary = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControl, SectionTabViewPrimary>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );
            var viewSecondary = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControl, SectionTabViewSecondary>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );

            // Add standard views
            html.Add(pages.Select(x => x.Render(renderContext, visualTree)));
            
            // Add view fragments
            html.Add(viewPreferences.Select(x => x.Render(renderContext, visualTree)));
            html.Add(viewPrimary.Select(x => x.Render(renderContext, visualTree)));
            html.Add(viewSecondary.Select(x => x.Render(renderContext, visualTree)));

            html.AddUserAttribute("data-layout", Layout.ToString().ToLower());

            if (Layout == TypeLayoutTab.Underline && HighlightColor != null)
            {
                if ((TypeColor)HighlightColor.SystemColor == TypeColor.User && !string.IsNullOrWhiteSpace(HighlightColor.UserColor))
                {
                    html.AddStyle($"--bs-nav-underline-border-color: {HighlightColor.UserColor};", $"--bs-nav-underline-link-active-color: {HighlightColor.UserColor};");
                }
                else if ((TypeColor)HighlightColor.SystemColor != TypeColor.Default)
                {
                    var colorVar = $"var(--bs-{((TypeColor)HighlightColor.SystemColor).ToClass()})";
                    html.AddStyle($"--bs-nav-underline-border-color: {colorVar};", $"--bs-nav-underline-link-active-color: {colorVar};");
                }
            }

            // Get toolbar fragments
            var toolbarPreferences = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControlToolbarItem, SectionTabToolbarPreferences>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );
            var toolbarPrimary = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControlToolbarItem, SectionTabToolbarPrimary>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );
            var toolbarSecondary = WebEx.ComponentHub.FragmentManager.GetFragments<IFragmentControlToolbarItem, SectionTabToolbarSecondary>
            (
                renderContext?.PageContext?.ApplicationContext,
                [GetType()]
            );

            // Render toolbar if there are items
            if (_toolbarItems.Count > 0 || toolbarPreferences.Any() || toolbarPrimary.Any() || toolbarSecondary.Any())
            {
                var toolbarHtml = new HtmlElementTextContentDiv()
                {
                    Class = "wx-tab-toolbar"
                };

                toolbarHtml.Add(toolbarPreferences.OfType<IControlToolbarItem>().Select(x => x.Render(renderContext, visualTree)));
                toolbarHtml.Add(_toolbarItems.Select(x => x.Render(renderContext, visualTree)));
                toolbarHtml.Add(toolbarPrimary.OfType<IControlToolbarItem>().Select(x => x.Render(renderContext, visualTree)));
                toolbarHtml.Add(toolbarSecondary.OfType<IControlToolbarItem>().Select(x => x.Render(renderContext, visualTree)));

                html.Add(toolbarHtml);
            }

            return html;
        }
    }
}
