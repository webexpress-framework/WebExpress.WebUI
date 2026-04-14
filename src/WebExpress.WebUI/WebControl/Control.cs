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
        private readonly Dictionary<string, Tuple<object, Func<string>, Func<string>>> _propertys = [];

        /// <summary>
        /// Gets or sets the id of the control.
        /// </summary>
        public string Id { get; private set; }

        /// <summary>
        /// Gets or sets the horizontal alignment.
        /// </summary>
        public virtual TypeHorizontalAlignment HorizontalAlignment
        {
            get => (TypeHorizontalAlignment)GetProperty(TypeHorizontalAlignment.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the text color.
        /// </summary>
        public virtual PropertyColorText TextColor
        {
            get => (PropertyColorText)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        public virtual PropertyColorBackground BackgroundColor
        {
            get => (PropertyColorBackground)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the border color.
        /// </summary>
        public virtual PropertyColorBorder BorderColor
        {
            get => (PropertyColorBorder)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass(), () => value?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the padding.
        /// </summary>
        public virtual PropertySpacingPadding Padding
        {
            get => (PropertySpacingPadding)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass());
        }

        /// <summary>
        /// Gets or sets the margin.
        /// </summary>
        public virtual PropertySpacingMargin Margin
        {
            get => (PropertySpacingMargin)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass());
        }

        /// <summary>
        /// Gets or sets the border.
        /// </summary>
        public virtual PropertyBorder Border
        {
            get => (PropertyBorder)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass());
        }

        /// <summary>
        /// Gets or sets the column property if the control is on a grid.
        /// </summary>
        public virtual PropertyGrid GridColumn
        {
            get => (PropertyGrid)GetPropertyObject();
            set => SetProperty(value, () => value?.ToClass());
        }

        /// <summary>
        /// Gets or sets the width property of the control.
        /// </summary>
        public virtual TypeWidth Width
        {
            get => (TypeWidth)GetProperty(TypeWidth.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the height property of the control.
        /// </summary>
        public virtual TypeHeight Height
        {
            get => (TypeHeight)GetProperty(TypeHeight.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the flex grow property of the control.
        /// </summary>
        public virtual TypeFlexGrow FlexGrow
        {
            get => (TypeFlexGrow)GetProperty(TypeFlexGrow.None);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Gets or sets the display type for the current object.
        /// </summary>
        /// <remarks>
        /// This property determines how the object is visually represented. Setting this
        /// property may involve converting the value to a class representation.
        /// </remarks>
        public virtual TypeDisplay Display
        {
            get => (TypeDisplay)GetProperty(TypeDisplay.None);
            set => SetProperty(value, () => value.ToClass());
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
        public string Role { get; set; }

        /// <summary>
        /// Gets or sets the OnClick attribute, which executes a java script on the client.
        /// </summary>
        public PropertyOnClick OnClick { get; set; }

        /// <summary>
        /// Determines whether the control is active and rendering.
        /// </summary>
        public bool Enable { get; set; } = true;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The control id.</param>
        public Control(string id = null)
        {
            Id = id?.Replace('.', '-');

            HorizontalAlignment = TypeHorizontalAlignment.Default;
            BackgroundColor = new PropertyColorBackground(TypeColorBackground.Default);
            Padding = new PropertySpacingPadding(PropertySpacing.Space.None);
            Margin = new PropertySpacingMargin(PropertySpacing.Space.None);
        }

        /// <summary>
        /// Returns a property.
        /// </summary>
        /// <param name="defaultValue">The default value.</param>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected Enum GetProperty(Enum defaultValue, [CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out Tuple<object, Func<string>, Func<string>> item))
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
            if (_propertys.TryGetValue(propertyName, out Tuple<object, Func<string>, Func<string>> item))
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
            if (_propertys.TryGetValue(propertyName, out Tuple<object, Func<string>, Func<string>> item))
            {
                return (IProperty)item.Item1;
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
            if (_propertys.TryGetValue(propertyName, out Tuple<object, Func<string>, Func<string>> item))
            {
                return item.Item2();
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
        protected void SetProperty(Enum value, Func<string> callbackClass, Func<string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            if (!_propertys.ContainsKey(propertyName))
            {
                _propertys.Add(propertyName, new Tuple<object, Func<string>, Func<string>>(value, callbackClass, callbackStyle));
                return;
            }

            _propertys[propertyName] = new Tuple<object, Func<string>, Func<string>>(value, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Stores a property.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="callbackClass">The callback function to determine the css class.</param>
        /// <param name="callbackStyle">The callback function to determine the css style.</param>
        /// <param name="propertyName">The name of the property.</param>
        protected void SetProperty(IProperty value, Func<string> callbackClass, Func<string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            if (!_propertys.ContainsKey(propertyName))
            {
                _propertys.Add(propertyName, new Tuple<object, Func<string>, Func<string>>(value, callbackClass, callbackStyle));
                return;
            }

            _propertys[propertyName] = new Tuple<object, Func<string>, Func<string>>(value, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Stores a property.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="callbackClass">The callback function to determine the css class.</param>
        /// <param name="callbackStyle">The callback function to determine the css style.</param>
        /// <param name="propertyName">The name of the property.</param>
        protected void SetProperty(Func<string> callbackClass, Func<string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            if (!_propertys.ContainsKey(propertyName))
            {
                _propertys.Add(propertyName, new Tuple<object, Func<string>, Func<string>>(null, callbackClass, callbackStyle));
                return;
            }

            _propertys[propertyName] = new Tuple<object, Func<string>, Func<string>>(null, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Returns all css classes.
        /// </summary>
        /// <returns>The css classes.</returns>
        protected string GetClasses()
        {
            var list = _propertys.Values
                .Where(x => x.Item2 is not null)
                .Select(x => x.Item2())
                .Where(x => !string.IsNullOrEmpty(x))
                .Distinct();

            return string.Join(" ", Classes.Union(list));
        }

        /// <summary>
        /// Returns all css styles.
        /// </summary>
        /// <returns>The css styles.</returns>
        protected string GetStyles()
        {
            var list = _propertys.Values
                .Where(x => x.Item3 is not null)
                .Select(x => x.Item3())
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
