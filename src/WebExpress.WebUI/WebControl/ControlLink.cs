using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebMessage;
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
        public TypeActive Active
        {
            get => (TypeActive)GetProperty(TypeActive.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets whether the link is underlined or not.
        /// </summary>
        public TypeTextDecoration Decoration
        {
            get => (TypeTextDecoration)GetProperty(TypeTextDecoration.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the text.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Gets or sets the title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the target uri.
        /// </summary>
        public IUri Uri { get; set; }

        /// <summary>
        /// Gets or sets the target.
        /// </summary>
        public TypeTarget Target { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// click to open a modal or similar target.
        /// </summary>
        public IAction PrimaryAction { get; set; }

        /// <summary>
        /// Gets or sets the secondary action, typically triggered by a 
        /// double‑click to open a modal or similar target.
        /// </summary>
        public IAction SecondaryAction { get; set; }

        /// <summary>
        /// Gets or sets the icon.
        /// </summary>
        public IIcon Icon { get; set; }

        /// <summary>
        /// Gets or sets a tooltip text.
        /// </summary>
        public string Tooltip { get; set; }

        /// <summary>
        /// Gets or sets the parameters that apply to the link.
        /// </summary>
        public List<Parameter> Params { get; set; } = [];

        /// <summary>
        /// Return or specifies the vertical orientation..
        /// </summary>
        public TypeVerticalAlignment VerticalAlignment
        {
            get => (TypeVerticalAlignment)GetProperty(TypeVerticalAlignment.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the size.
        /// </summary>
        public PropertySizeText Size
        {
            get => (PropertySizeText)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
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
        /// <param name="request">The context in which the control is rendered.</param>
        /// <returns>The parameters as a query string.</returns>
        private string GetParams(IRequest request)
        {
            var dict = new Dictionary<string, Parameter>();

            // transfer of the parameters from the request.
            if (Params is not null)
            {
                foreach (var v in Params)
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
            var param = GetParams(renderContext?.Request);

            var html = new HtmlElementTextSemanticsA([.. _controls.Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate("wx-link", Icon is ImageIcon ? "d-inline-flex align-items-baseline" : null, GetClasses()),
                Style = GetStyles(),
                Role = Role,
                Href = Uri?.ToString() + (param.Length > 0 ? "?" + param : string.Empty),
                Target = Target,
                Title = string.IsNullOrEmpty(Title) ? I18N.Translate(renderContext.Request, Tooltip) : I18N.Translate(renderContext.Request, Title),
                OnClick = OnClick?.ToString()
            };

            if (Icon is not null)
            {
                html.Add(new ControlIcon()
                {
                    Icon = Icon
                }.Render(renderContext, visualTree));
            }

            if (!string.IsNullOrWhiteSpace(Text))
            {
                html.Add(new HtmlText(I18N.Translate(renderContext.Request, Text)));
            }

            if (!string.IsNullOrWhiteSpace(Tooltip))
            {
                html.AddUserAttribute("data-bs-toggle", "tooltip");
            }

            PrimaryAction?.ApplyUserAttributes(html, TypeAction.Primary);
            SecondaryAction?.ApplyUserAttributes(html, TypeAction.Secondary);

            return html;
        }
    }
}
