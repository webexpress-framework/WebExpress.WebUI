namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property that defines a color, which can be either a system-defined 
    /// color or a user-defined color.
    /// </summary>
    public abstract class PropertyColor<T> : IProperty where T : System.Enum
    {
        /// <summary>
        /// Gets the system-defined color.
        /// </summary>
        public T SystemColor { get; protected set; }

        /// <summary>
        /// Gets the user-defined color.
        /// </summary>
        public string UserColor { get; protected set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public PropertyColor()
        {
        }

        /// <summary>
        /// Converts the color property to a CSS class.
        /// </summary>
        /// <returns>The CSS class corresponding to the color property.</returns>
        public abstract string ToClass();

        /// <summary>
        /// Converts the color property to a CSS style.
        /// </summary>
        /// <returns>The CSS style corresponding to the color property.</returns>
        public abstract string ToStyle();
    }
}
