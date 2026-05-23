using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Abstract base class for all controls.
    /// </summary>
    public abstract class Control : IControl
    {
        private readonly Dictionary<string, Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>>> _propertys = [];

        /// <summary>
        /// Gets or sets the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the text color.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyColorText> TextColor
        {
            get => (Func<IRenderControlContext, PropertyColorText>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyColorBackground> BackgroundColor
        {
            get => (Func<IRenderControlContext, PropertyColorBackground>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the border color.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyColorBorder> BorderColor
        {
            get => (Func<IRenderControlContext, PropertyColorBorder>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the padding.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertySpacingPadding> Padding
        {
            get => (Func<IRenderControlContext, PropertySpacingPadding>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass());
        }

        /// <summary>
        /// Gets or sets the margin.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertySpacingMargin> Margin
        {
            get => (Func<IRenderControlContext, PropertySpacingMargin>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass());
        }

        /// <summary>
        /// Gets or sets the border.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyBorder> Border
        {
            get => (Func<IRenderControlContext, PropertyBorder>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass());
        }

        /// <summary>
        /// Gets or sets the column property if the control is on a grid.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyGrid> GridColumn
        {
            get => (Func<IRenderControlContext, PropertyGrid>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass());
        }

        /// <summary>
        /// Gets or sets the width property of the control.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeWidth> Width
        {
            get => (Func<IRenderControlContext, TypeWidth>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the height property of the control.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeHeight> Height
        {
            get => (Func<IRenderControlContext, TypeHeight>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the flex grow property of the control.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeFlexGrow> FlexGrow
        {
            get => (Func<IRenderControlContext, TypeFlexGrow>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the display type for the current object.
        /// </summary>
        /// <remarks>
        /// This property determines how the object is visually represented. Setting this
        /// property may involve converting the value to a class representation.
        /// </remarks>
        public virtual Func<IRenderControlContext, TypeDisplay> Display
        {
            get => (Func<IRenderControlContext, TypeDisplay>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the horizontal alignment.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeHorizontalAlignment> HorizontalAlignment
        {
            get => (Func<IRenderControlContext, TypeHorizontalAlignment>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the css class.
        /// </summary>
        public IEnumerable<string> Classes { get; set; } = [];

        /// <summary>
        /// Gets or sets the css style.
        /// </summary>
        public IEnumerable<string> Styles { get; set; } = [];

        /// <summary>
        /// Gets or sets the role.
        /// </summary>
        public Func<IRenderControlContext, string> Role { get; set; }

        /// <summary>
        /// Determines whether the control is active and rendering.
        /// </summary>
        public Func<IRenderControlContext, bool> Enable { get; set; } = _ => true;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The control id.</param>
        public Control(string id = null)
        {
            Id = id?.Replace('.', '-');

            HorizontalAlignment = _ => TypeHorizontalAlignment.Default;
            BackgroundColor = _ => new PropertyColorBackground(TypeColorBackground.Default);
            Padding = _ => new PropertySpacingPadding(PropertySpacing.Space.None);
            Margin = _ => new PropertySpacingMargin(PropertySpacing.Space.None);
        }

        /// <summary>
        /// Returns a property.
        /// </summary>
        /// <param name="defaultValue">The default value.</param>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected Enum GetProperty(Enum defaultValue, [CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>> item))
            {
                return (Enum)item.Item1;
            }

            return defaultValue;
        }

        /// <summary>
        /// Returns a property.
        /// </summary>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected Enum GetProperty([CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>> item))
            {
                return (Enum)item.Item1;
            }

            return null;
        }

        /// <summary>
        /// Returns a property.
        /// </summary>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected IProperty GetPropertyObject([CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>> item))
            {
                return (IProperty)item.Item1;
            }

            return null;
        }

        /// <summary>
        /// Returns a property.
        /// </summary>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected object GetPropertyObjectValue([CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>> item))
            {
                return item.Item1;
            }

            return null;
        }

        /// <summary>
        /// Returns a property value.
        /// </summary>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected string GetPropertyValue([CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>> item))
            {
                return item.Item2?.Invoke(null);
            }

            return null;
        }

        /// <summary>
        /// Stores a property.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="callbackClass">The callback function to determine the css class.</param>
        /// <param name="callbackStyle">The callback function to determine the css style.</param>
        /// <param name="propertyName">The name of the property.</param>
        protected void SetProperty(Enum value, Func<IRenderControlContext, string> callbackClass, Func<IRenderControlContext, string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            if (!_propertys.ContainsKey(propertyName))
            {
                _propertys.Add(propertyName, new Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>>(value, callbackClass, callbackStyle));
                return;
            }

            _propertys[propertyName] = new Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>>(value, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Stores a property.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="callbackClass">The callback function to determine the css class.</param>
        /// <param name="callbackStyle">The callback function to determine the css style.</param>
        /// <param name="propertyName">The name of the property.</param>
        protected void SetProperty(IProperty value, Func<IRenderControlContext, string> callbackClass, Func<IRenderControlContext, string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            if (!_propertys.ContainsKey(propertyName))
            {
                _propertys.Add(propertyName, new Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>>(value, callbackClass, callbackStyle));
                return;
            }

            _propertys[propertyName] = new Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>>(value, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Stores a property.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="callbackClass">The callback function to determine the css class.</param>
        /// <param name="callbackStyle">The callback function to determine the css style.</param>
        /// <param name="propertyName">The name of the property.</param>
        protected void SetProperty(Func<IRenderControlContext, string> callbackClass, Func<IRenderControlContext, string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            if (!_propertys.ContainsKey(propertyName))
            {
                _propertys.Add(propertyName, new Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>>(null, callbackClass, callbackStyle));
                return;
            }

            _propertys[propertyName] = new Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>>(null, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Stores a property.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="callbackClass">The callback function to determine the css class.</param>
        /// <param name="callbackStyle">The callback function to determine the css style.</param>
        /// <param name="propertyName">The name of the property.</param>
        protected void SetProperty(object value, Func<IRenderControlContext, string> callbackClass, Func<IRenderControlContext, string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            if (!_propertys.ContainsKey(propertyName))
            {
                _propertys.Add(propertyName, new Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>>(value, callbackClass, callbackStyle));
                return;
            }

            _propertys[propertyName] = new Tuple<object, Func<IRenderControlContext, string>, Func<IRenderControlContext, string>>(value, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Returns all css classes.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The css classes.</returns>
        protected string GetClasses(IRenderControlContext renderContext)
        {
            var list = _propertys.Values
                .Where(x => x.Item2 is not null)
                .Select(x => x.Item2?.Invoke(renderContext))
                .Where(x => !string.IsNullOrEmpty(x))
                .Distinct();

            return string.Join(" ", Classes.Union(list));
        }

        /// <summary>
        /// Returns all css styles.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The css styles.</returns>
        protected string GetStyles(IRenderControlContext renderContext)
        {
            var list = _propertys.Values
                .Where(x => x.Item3 is not null)
                .Select(x => x.Item3(renderContext))
                .Where(x => !string.IsNullOrEmpty(x))
                .Distinct();

            return string.Join(" ", Styles.Union(list));
        }

        /// <summary>
        /// Returns all attributes.
        /// </summary>
        /// <returns>The attributes.</returns>
        protected string GetAttributes()
        {
            var list = _propertys
                .Where(x => x.Value.Item2 is not null)
                .Where(x => x.Value.Item3 is not null)
                .Select(x => $"{x.Key}=\"{x.Value.Item1}\"")
                .Distinct();

            return string.Join(" ", list);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public abstract IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree);
    }
}
