using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebParameter;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a hyperlink control.
    /// </summary>
    public class ControlLink : Control, IControlLink
    {
        private readonly List<IControl> _controls = [];

        /// <summary>
        /// Returns the content of the control.
        /// </summary>
        /// <value>
        /// An enumerable collection of child controls.
        /// </value>
        public IEnumerable<IControl> Controls => _controls;

        /// <summary>
        /// Gets or sets whether the link is active or not.
        /// </summary>
        public System.Func<IRenderControlContext, TypeActive> Active
        {
            get => (System.Func<IRenderControlContext, TypeActive>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets whether the link is underlined or not.
        /// </summary>
        public System.Func<IRenderControlContext, TypeTextDecoration> Decoration
        {
            get => (System.Func<IRenderControlContext, TypeTextDecoration>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public System.Func<IRenderControlContext, string> Text { get; set; }

        /// <summary>
        /// Gets or sets the title.
        /// </summary>
        public System.Func<IRenderControlContext, string> Title { get; set; }

        /// <summary>
        /// Gets or sets the target uri.
        /// </summary>
        public System.Func<IRenderControlContext, IUri> Uri { get; set; }

        /// <summary>
        /// Gets or sets the target.
        /// </summary>
        public System.Func<IRenderControlContext, TypeTarget> Target { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public System.Func<IRenderControlContext, IAction> PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double-click to open a modal or similar target.
        /// </summary>
        public System.Func<IRenderControlContext, IAction> SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public System.Func<IRenderControlContext, IIcon> Icon { get; set; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        public System.Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets or sets a tooltip text.
        /// </summary>
        public System.Func<IRenderControlContext, string> Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the parameters that apply to the link.
        /// </summary>
        public System.Func<IRenderControlContext, List<Parameter>> Params { get; set; }

        /// <summary>
        /// Return or specifies the vertical orientation..
        /// </summary>
        public System.Func<IRenderControlContext, TypeVerticalAlignment> VerticalAlignment
        {
            get => (System.Func<IRenderControlContext, TypeVerticalAlignment>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null).ToClass());
        }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public System.Func<IRenderControlContext, PropertySizeText> Size
        {
            get => (System.Func<IRenderControlContext, PropertySizeText>)GetPropertyObjectValue();
            set => SetProperty(value, () => value?.Invoke(null)?.ToClass(), () => value?.Invoke(null)?.ToStyle());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The content of the html element.</param>
        public ControlLink(string id = null, params IControl[] content)
            : base(id)
        {
            _controls.AddRange(content);
            Active = _ => TypeActive.None;
            Decoration = _ => TypeTextDecoration.Default;
            Target = _ => TypeTarget.None;
            VerticalAlignment = _ => TypeVerticalAlignment.Default;
            Params = _ => [];
        }

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <remarks>
        /// This method allows adding one or multiple controls to the content collection 
        /// of the control panel. It is useful for dynamically constructing the user interface by 
        /// appending various controls to the panel's content.
        /// 
        /// Example usage:
        /// <code>
        /// var link = new ControlLink();
        /// var text1 = new ControlText { Text = "A" };
        /// var text2 = new ControlText { Text = "B" };
        /// link.Add(text1, text2);
        /// </code>
        /// 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        public void Add(params IControl[] controls)
        {
            _controls.AddRange(controls);
        }

        /// <summary>
        /// Adds one or more controls to the content.
        /// </summary>
        /// <param name="controls">The controls to add to the content.</param>
        /// <remarks>
        /// This method allows adding one or multiple controls to the content collection 
        /// of the control panel. It is useful for dynamically constructing the user interface by 
        /// appending various controls to the panel's content.
        /// 
        /// Example usage:
        /// <code>
        /// var link = new ControlLink();
        /// var text1 = new ControlText { Text = "A" };
        /// var text2 = new ControlText { Text = "B" };
        /// link.Add(text1, text2);
        /// </code>
        /// 
        /// This method accepts any control that implements the <see cref="IControl"/> interface.
        /// </remarks>
        public void Add(IEnumerable<IControl> controls)
        {
            _controls.AddRange(controls);
        }

        /// <summary>
        /// Returns all local and temporary parameters.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The parameters as a query string.</returns>
        private string GetParams(IRenderControlContext renderContext)
        {
            var dict = new Dictionary<string, Parameter>();
            var p = Params?.Invoke(renderContext);

            // transfer of the parameters from the request.
            if (p is not null)
            {
                foreach (var v in p)
                {
                    if (v.Scope == ParameterScope.Parameter)
                    {
                        if (!dict.ContainsKey(v.Key.ToLower()))
                        {
                            dict.Add(v.Key.ToLower(), v);
                        }
                        else
                        {
                            dict[v.Key.ToLower()] = v;
                        }
                    }
                }
            }

            return string.Join("&amp;", from x in dict where !string.IsNullOrWhiteSpace(x.Value.Value) select x.Value.ToString());
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var param = GetParams(renderContext);

            var icon = Icon?.Invoke(renderContext);
            var title = Title?.Invoke(renderContext);
            var tooltip = Tooltip?.Invoke(renderContext);
            var text = Text?.Invoke(renderContext);
            var role = Role?.Invoke(renderContext);

            var html = new HtmlElementTextSemanticsA([.. _controls.Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate("wx-link", icon is ImageIcon ? "d-inline-flex align-items-baseline" : null, GetClasses()),
                Style = GetStyles(),
                Role = role,
                Href = Uri?.Invoke(renderContext)?.ToString() + (param.Length > 0 ? "?" + param : string.Empty),
                Target = Target?.Invoke(renderContext) ?? TypeTarget.None,
                Title = string.IsNullOrEmpty(title) ? I18N.Translate(renderContext.Request, tooltip) : I18N.Translate(renderContext.Request, title)
            };

            if (icon is not null)
            {
                html.Add(new ControlIcon()
                {
                    Icon = icon
                }.Render(renderContext, visualTree));
            }

            if (!string.IsNullOrWhiteSpace(text))
            {
                html.Add(new HtmlText(I18N.Translate(renderContext.Request, text)));
            }

            if (!string.IsNullOrWhiteSpace(tooltip))
            {
                html.AddUserAttribute("data-bs-toggle", "tooltip");
            }

            PrimaryAction?.Invoke(renderContext)?.ApplyUserAttributes(html, TypeAction.Primary);
            SecondaryAction?.Invoke(renderContext)?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}