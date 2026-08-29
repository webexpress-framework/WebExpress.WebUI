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
    /// A flat, collapsible section: a quiet label row over a body of content, without the
    /// frame, background or shadow of a <see cref="ControlPanelCard"/>.
    /// </summary>
    /// <remarks>
    /// A card separates its content from the page by drawing a box around it. That reads well
    /// when a page shows a handful of unrelated things, and badly when it shows one thing from
    /// many angles: a reading view built from cards is a stack of boxes whose borders compete
    /// with the content for the eye, and every box costs the padding of its own frame. This
    /// control separates by typography and whitespace instead - a small upper-case label, a
    /// generous gap to the section above, and an optional vertical guide line down the left of
    /// the body that ties the content back to its label without enclosing it.
    /// <para>
    /// Collapsing is what makes a long view scannable: the labels stay, the bodies fold away,
    /// and the reader gets an outline of the whole. The state is remembered per section (see
    /// <see cref="Persist"/>), so a reader who folds away what they never need keeps that view
    /// on their next visit.
    /// </para>
    /// <para>
    /// Like <see cref="ControlPanelCard"/>, the C# side emits only a host element carrying the
    /// <c>wx-webui-section</c> class and the relevant <c>data-*</c> attributes; the header row,
    /// the chevron and the collapsible body are built at runtime by
    /// <c>webexpress.webui.SectionCtrl</c>.
    /// </para>
    /// </remarks>
    public class ControlSection : ControlPanel
    {
        /// <summary>
        /// Gets or sets the section label. Shown in the header row and used as the accessible
        /// name of the toggle.
        /// </summary>
        public Func<IRenderControlContext, string> Header { get; set; }

        /// <summary>
        /// Gets or sets the icon shown before the label. The icon can be image-based
        /// (<see cref="ImageIcon"/>) or CSS-based (any <see cref="Icon"/>).
        /// </summary>
        public Func<IRenderControlContext, IIcon> HeaderIcon { get; set; }

        /// <summary>
        /// Gets or sets the note shown at the trailing end of the header row, set apart from
        /// the label - a count, a state, a date. It stays visible while the section is
        /// collapsed, so a folded section can still report what is inside it.
        /// </summary>
        public Func<IRenderControlContext, string> Note { get; set; }

        /// <summary>
        /// Gets or sets the badge shown directly after the label - a count, a state, a short
        /// verdict. Unlike <see cref="Note"/>, which stays a quiet trailing line, a badge is a
        /// filled pill and carries a color, so it is read before the label it follows.
        /// </summary>
        public Func<IRenderControlContext, string> Badge { get; set; }

        /// <summary>
        /// Gets or sets the background color of the badge. Accepts both system colors (e.g.
        /// <see cref="TypeColorBackgroundBadge.Danger"/>) and user-defined colors (e.g.
        /// <c>"gold"</c>). Without one the badge takes the neutral secondary fill.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackgroundBadge> BadgeColor { get; set; }

        /// <summary>
        /// Gets or sets the accent color of the section: the label, its icon and the guide line
        /// take it, while the body keeps the body color so the content stays readable.
        /// </summary>
        /// <remarks>
        /// An accent is a way of grouping sections that a label alone cannot - every section of
        /// one concern in one color - and it is the only color the control offers, because a
        /// filled background would put back the box the section exists to avoid.
        /// </remarks>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the layout of the section.
        /// </summary>
        public Func<IRenderControlContext, TypeLayoutSection> Layout { get; set; } = _ => TypeLayoutSection.Stacked;

        /// <summary>
        /// Gets or sets a value indicating whether the label is set in upper case.
        /// </summary>
        /// <remarks>
        /// Upper case is what makes a label read as structure rather than as content, which is
        /// right for the word that names a part of a page ("DETAILS", "STATUS"). It is wrong for
        /// a label that is a name or a sentence - a swimlane called "Team A", an error box headed
        /// "Content could not be loaded." - because upper case turns a name into a shout and a
        /// sentence into a headline. Switch it off there; the label then keeps the spelling and
        /// the size it was given.
        /// </remarks>
        public Func<IRenderControlContext, bool> Uppercase { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets additional CSS classes placed on the label element.
        /// </summary>
        /// <remarks>
        /// The escape hatch for a label that needs a class the control does not model - the tint
        /// of a host component, a weight a caller insists on. Reach for <see cref="Color"/>
        /// first: it colors the label, its icon and the guide line together and keeps the section
        /// consistent with every other one. This lands on the label alone, and nothing else in
        /// the control knows about it.
        /// </remarks>
        public Func<IRenderControlContext, string> LabelCss { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the section can be folded away. A section
        /// that cannot renders without a chevron and with its label inert.
        /// </summary>
        public Func<IRenderControlContext, bool> Collapsible { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets the initial state. Applies on first render only - a remembered state
        /// takes precedence when <see cref="Persist"/> is set.
        /// </summary>
        public Func<IRenderControlContext, bool> Expanded { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets a value indicating whether the body carries the vertical guide line
        /// that ties it to its label. Switch it off for a body that draws its own structure
        /// (a table, a board) and would read as doubly framed. Has no effect under
        /// <see cref="TypeLayoutSection.Rule"/>, where the hairline already separates and the
        /// body is indented regardless.
        /// </summary>
        public Func<IRenderControlContext, bool> Guide { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets a value indicating whether the collapsed state survives a reload. The
        /// state is stored per <see cref="Control.Id"/>, so a section without an id is never
        /// persisted regardless of this setting.
        /// </summary>
        public Func<IRenderControlContext, bool> Persist { get; set; } = _ => true;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="controls">The child controls that make up the section body.</param>
        public ControlSection(string id = null, params IControl[] controls)
            : base(id, controls)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var header = Header?.Invoke(renderContext);
            var headerIcon = HeaderIcon?.Invoke(renderContext);
            var note = Note?.Invoke(renderContext);
            var badge = Badge?.Invoke(renderContext);
            var badgeColor = BadgeColor?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);
            var layout = Layout?.Invoke(renderContext) ?? TypeLayoutSection.Stacked;
            var uppercase = Uppercase?.Invoke(renderContext) ?? true;
            var labelCss = LabelCss?.Invoke(renderContext);
            var collapsible = Collapsible?.Invoke(renderContext) ?? true;
            var expanded = Expanded?.Invoke(renderContext) ?? true;
            var guide = Guide?.Invoke(renderContext) ?? true;
            var persist = Persist?.Invoke(renderContext) ?? true;

            // what the client has to drive travels as a data attribute; what only paints travels
            // as a class, so a purely visual choice costs nothing at runtime
            return new HtmlElementSectionSection([.. Content.Select(x => x?.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-section", layout.ToClass(), uppercase ? "" : "wx-section-verbatim", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("data-header", I18N.Translate(renderContext, header))
                .AddUserAttribute("data-header-icon-css", (headerIcon as Icon)?.Class)
                .AddUserAttribute("data-header-icon-image", (headerIcon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-note", I18N.Translate(renderContext, note))
                .AddUserAttribute("data-badge", I18N.Translate(renderContext, badge))
                .AddUserAttribute("data-badge-bg-class", badgeColor?.ToClass())
                .AddUserAttribute("data-badge-bg-style", badgeColor?.ToStyle())
                .AddUserAttribute("data-color-class", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle())
                .AddUserAttribute("data-label-css", labelCss)
                .AddUserAttribute("data-collapsible", collapsible ? "true" : "false")
                .AddUserAttribute("data-expanded", expanded ? "true" : "false")
                .AddUserAttribute("data-guide", guide ? "true" : "false")
                .AddUserAttribute("data-persist", persist ? "true" : "false");
        }
    }
}
