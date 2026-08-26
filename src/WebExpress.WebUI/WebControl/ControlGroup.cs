using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Items that belong together, laid out as fields of one surface and divided by hairlines.
    /// </summary>
    /// <remarks>
    /// Things placed side by side are read as one statement about one subject, and the reader
    /// compares them. Left as separate boxes they read as separate claims: each carries its own
    /// frame, the gaps between them say nothing, and nothing indicates that they share a scope.
    /// Collecting them into one bounded surface with a rule between the fields is what makes a
    /// row a summary rather than a list of unrelated things - four metrics that describe one
    /// installation, four entry paths into one body of work, three columns of one help area.
    /// <para>
    /// The content is not the group's business: any control can be a field. What the group
    /// decides is how many fields share a row, whether the surface is drawn, and - the reason
    /// this is a control rather than a stylesheet - where the dividers go. A rule drawn on every
    /// field except the first is correct only while the row does not wrap; once it does, the
    /// first field of every later row carries a line into empty space. Which field starts a row
    /// is a question about the laid-out geometry, so it is answered after layout by
    /// <c>webexpress.webui.GroupCtrl</c> and re-answered whenever the width changes.
    /// </para>
    /// <para>
    /// Like <see cref="ControlPanelCard"/> and <see cref="ControlSection"/>, the C# side emits
    /// only a host element carrying the <c>wx-webui-group</c> class and the relevant
    /// <c>data-*</c> attributes.
    /// </para>
    /// </remarks>
    public class ControlGroup : Control
    {
        private readonly List<IControl> _items = [];

        /// <summary>
        /// Returns the items of the group, in the order they are read.
        /// </summary>
        public IEnumerable<IControl> Items => _items;

        /// <summary>
        /// Gets or sets whether the group is drawn as a bounded surface with a border, or as a
        /// bare row that takes the background it sits on.
        /// </summary>
        /// <remarks>
        /// A bounded row is the default because a group is usually read against the page. A
        /// group placed inside something that already frames it - a card, a section with a
        /// guide line - sets this to <c>false</c> so the two frames do not double up.
        /// </remarks>
        public Func<IRenderControlContext, bool> Framed { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets the number of fields a row holds before it wraps. A value of zero lets
        /// the fields divide the available width evenly, whatever their number.
        /// </summary>
        public Func<IRenderControlContext, int> Columns { get; set; } = _ => 0;

        /// <summary>
        /// Gets or sets the padding of a field. The default suits a field that holds a control
        /// of its own; a group of bare text sets it wider, a dense one narrower.
        /// </summary>
        public Func<IRenderControlContext, TypeSpacingGroup> Spacing { get; set; } = _ => TypeSpacingGroup.Default;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="items">The items to group.</param>
        public ControlGroup(string id = null, params IControl[] items)
            : base(id)
        {
            _items.AddRange(items);
        }

        /// <summary>
        /// Adds one or more items to the group.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlGroup Add(params IControl[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the group.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlGroup Add(IEnumerable<IControl> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes an item from the group.
        /// </summary>
        /// <param name="item">The item to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlGroup Remove(IControl item)
        {
            _items.Remove(item);

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
            var framed = Framed?.Invoke(renderContext) ?? true;
            var columns = Columns?.Invoke(renderContext) ?? 0;
            var spacing = Spacing?.Invoke(renderContext) ?? TypeSpacingGroup.Default;

            return new HtmlElementTextContentDiv(_items.Select(x => x?.Render(renderContext, visualTree)))
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-group", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("data-columns", columns > 0 ? columns.ToString() : null)
                .AddUserAttribute("data-framed", framed ? null : "false")
                .AddUserAttribute("data-spacing", spacing.ToValue());
        }
    }
}
