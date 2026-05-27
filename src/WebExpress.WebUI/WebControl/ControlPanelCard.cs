using System;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebTheme;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control panel card with a header, footer, and content area.
    /// Header and footer accept an icon (image- or CSS-based) as well as
    /// independent background / text colors so the two ends of the card can be
    /// styled separately from the card body.
    /// </summary>
    /// <remarks>
    /// The C# side only emits a host element carrying the
    /// <c>wx-webui-panel-card</c> class plus the relevant <c>data-*</c>
    /// attributes; the actual card structure (wx-card-header / wx-card-body /
    /// wx-card-title / wx-card-text / wx-card-footer) is built at runtime by
    /// <c>webexpress.webui.PanelCardCtrl</c>. Colour properties are forwarded
    /// as a CSS class (system colours such as <c>bg-primary</c>) and an inline
    /// style (user colours such as <c>"gold"</c>); the JS controller applies
    /// both to the corresponding section element.
    /// </remarks>
    public class ControlPanelCard : ControlPanel
    {
        /// <summary>
        /// Gets or sets the header text.
        /// </summary>
        public Func<IRenderControlContext, string> Header { get; set; }

        /// <summary>
        /// Gets or sets the header icon. The icon can be image-based
        /// (<see cref="ImageIcon"/>) or CSS-based (any <see cref="Icon"/>).
        /// </summary>
        public Func<IRenderControlContext, IIcon> HeaderIcon { get; set; }

        /// <summary>
        /// Gets or sets the background color of the header row. Accepts both
        /// system colors (e.g. <see cref="TypeColorBackground.Primary"/>) and
        /// user-defined colors (e.g. <c>"gold"</c>).
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackground> HeaderBackgroundColor { get; set; }

        /// <summary>
        /// Gets or sets the text color of the header row.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> HeaderTextColor { get; set; }

        /// <summary>
        /// Gets or sets the headline.
        /// </summary>
        public Func<IRenderControlContext, string> Headline { get; set; }

        /// <summary>
        /// Gets or sets the footer.
        /// </summary>
        public Func<IRenderControlContext, string> Footer { get; set; }

        /// <summary>
        /// Gets or sets the footer icon. The icon can be image-based
        /// (<see cref="ImageIcon"/>) or CSS-based (any <see cref="Icon"/>).
        /// </summary>
        public Func<IRenderControlContext, IIcon> FooterIcon { get; set; }

        /// <summary>
        /// Gets or sets the background color of the footer row.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackground> FooterBackgroundColor { get; set; }

        /// <summary>
        /// Gets or sets the text color of the footer row.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorText> FooterTextColor { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="controls">The child controls to be added to the panel card.</param>
        public ControlPanelCard(string id = null, params IControl[] controls)
            : base(id, controls)
        {
            Border = _ => new PropertyBorder(true);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var role = Role?.Invoke(renderContext);
            var theme = Theme?.Invoke(renderContext) ?? TypeTheme.None;
            var header = Header?.Invoke(renderContext);
            var headerIcon = HeaderIcon?.Invoke(renderContext)?.ApplyIconTheme(visualTree?.IconTheme ?? TypeIconTheme.Default);
            var headerBg = HeaderBackgroundColor?.Invoke(renderContext);
            var headerColor = HeaderTextColor?.Invoke(renderContext);
            var headline = Headline?.Invoke(renderContext);
            var footer = Footer?.Invoke(renderContext);
            var footerIcon = FooterIcon?.Invoke(renderContext)?.ApplyIconTheme(visualTree?.IconTheme ?? TypeIconTheme.Default);
            var footerBg = FooterBackgroundColor?.Invoke(renderContext);
            var footerColor = FooterTextColor?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv([.. Content.Select(x => x?.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-card", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = role,
                DataTheme = theme.ToValue()
            }
                .AddUserAttribute("data-header", I18N.Translate(renderContext, header))
                .AddUserAttribute("data-header-icon-css", (headerIcon as Icon)?.Class)
                .AddUserAttribute("data-header-icon-image", (headerIcon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-header-bg-class", headerBg?.ToClass())
                .AddUserAttribute("data-header-bg-style", headerBg?.ToStyle())
                .AddUserAttribute("data-header-color-class", headerColor?.ToClass())
                .AddUserAttribute("data-header-color-style", headerColor?.ToStyle())
                .AddUserAttribute("data-headline", I18N.Translate(renderContext, headline))
                .AddUserAttribute("data-footer", I18N.Translate(renderContext, footer))
                .AddUserAttribute("data-footer-icon-css", (footerIcon as Icon)?.Class)
                .AddUserAttribute("data-footer-icon-image", (footerIcon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-footer-bg-class", footerBg?.ToClass())
                .AddUserAttribute("data-footer-bg-style", footerBg?.ToStyle())
                .AddUserAttribute("data-footer-color-class", footerColor?.ToClass())
                .AddUserAttribute("data-footer-color-style", footerColor?.ToStyle());

            return html;
        }
    }
}
