using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebFragment;
using WebExpress.WebUI.WebPage;
using WebExpress.WebUI.WebSection;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Renders a tabbed control where only the selected tab's panel is shown at a time.
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
        /// Gets or sets the color of the active tab: the text of the underline layout, whose
        /// line follows it unless <see cref="UnderlineColor"/> is set, or the fill of the pill
        /// layout. The other layouts mark the active tab without a color of its own and
        /// ignore it.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; } = _ => new PropertyColorText();

        /// <summary>
        /// Gets or sets the color of the line under the active tab in the underline layout,
        /// so the line can stand out from the text. When not set, the line takes the text
        /// color. The other layouts draw no such line and ignore it.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBorder> UnderlineColor { get; set; }

        /// <summary>
        /// Gets or sets the layout.
        /// </summary>
        public Func<IRenderControlContext, TypeLayoutTab> Layout
        {
            get => (Func<IRenderControlContext, TypeLayoutTab>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
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
            var role = Role?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-tab", classes),
                Style = GetStyles(renderContext),
                Role = role
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

            var layout = Layout?.Invoke(renderContext) ?? TypeLayoutTab.Default;

            html.AddUserAttribute("data-layout", layout.ToString().ToLower());
            html.AddStyle(GetColorStyles(layout, Color?.Invoke(renderContext), UnderlineColor?.Invoke(renderContext)));

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

        /// <summary>
        /// Translates the color of the active tab into the css variables the navigation
        /// reads. The navigation is built on the client inside the host element, so the
        /// color reaches it only as inherited variables, and they take a color value,
        /// not the class a system color would otherwise emit.
        /// </summary>
        /// <param name="layout">The layout of the tab headers.</param>
        /// <param name="color">The color of the active tab, or null when none is set.</param>
        /// <param name="underlineColor">The color of the underline, or null when it follows the text.</param>
        /// <returns>The style declarations, empty when the default color applies.</returns>
        private static string[] GetColorStyles(TypeLayoutTab layout, PropertyColorText color, PropertyColorBorder underlineColor)
        {
            var (value, contrast) = ResolveColor((TypeColor)(color?.SystemColor ?? TypeColorText.Default), color?.UserColor);

            switch (layout)
            {
                case TypeLayoutTab.Underline:
                    // the line is drawn in currentColor, so it follows the text color
                    // unless a color of its own is set
                    var (line, _) = ResolveColor((TypeColor)(underlineColor?.SystemColor ?? TypeColorBorder.Default), underlineColor?.UserColor);

                    return new[]
                    {
                        value == null ? null : $"--wx-nav-underline-link-active-color: {value};",
                        line == null ? null : $"--wx-nav-underline-border-color: {line};"
                    }
                        .Where(x => x != null)
                        .ToArray();
                case TypeLayoutTab.Pill when value != null:
                    return contrast == null
                        ? [$"--wx-nav-pills-link-active-bg: {value};"]
                        :
                        [
                            $"--wx-nav-pills-link-active-bg: {value};",
                            $"--wx-nav-pills-link-active-color: {contrast};"
                        ];
                default:
                    return [];
            }
        }

        /// <summary>
        /// Resolves a color into a css color value and the text color that reads on it.
        /// The variables of the navigation take a color, not a class, so a system color is
        /// mapped onto its css variable instead of onto the class it would otherwise emit.
        /// </summary>
        /// <param name="systemColor">The system color, or the marker of a user color.</param>
        /// <param name="userColor">The user-defined color.</param>
        /// <returns>The color and its contrast color, both null when the default color applies.</returns>
        private static (string Value, string Contrast) ResolveColor(TypeColor systemColor, string userColor)
        {
            return systemColor switch
            {
                TypeColor.Default => (null, null),
                TypeColor.User when string.IsNullOrWhiteSpace(userColor) => (null, null),
                // an author's color has no contrast variable, so the text on the pill is
                // picked here; an unparsable notation keeps the text color of the theme
                TypeColor.User => (userColor, ContrastColor.On(userColor)),
                // white has no contrast variable of its own; the body color keeps it legible
                _ => ($"var(--wx-{systemColor.ToClass()})", $"var(--wx-{systemColor.ToClass()}-contrast, var(--wx-body-color))")
            };
        }
    }
}
