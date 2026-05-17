using System.Globalization;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property for text size, which can be either a predefined system size or a custom user-defined size.
    /// </summary>
    public class PropertySizeText : IProperty
    {
        /// <summary>
        /// Gets the system-defined size.
        /// </summary>
        public TypeSizeText SystemSize { get; protected set; }

        /// <summary>
        /// Gets the user-defined size in REM.
        /// </summary>
        public float? UserSize { get; protected set; }

        /// <summary>
        /// Initializes a new instance of the class with a system-defined size.
        /// </summary>
        /// <param name="size">The system-defined size.</param>
        public PropertySizeText(TypeSizeText size)
        {
            SystemSize = size;
        }

        /// <summary>
        /// Initializes a new instance of the class with a user-defined size in REM.
        /// </summary>
        /// <param name="size">The user-defined size in REM.</param>
        public PropertySizeText(float size)
        {
            SystemSize = TypeSizeText.Default;
            UserSize = size;
        }

        /// <summary>
        /// Converts the property to a CSS class.
        /// </summary>
        /// <returns>The CSS class corresponding to the size.</returns>
        public virtual string ToClass()
        {
            if (SystemSize != TypeSizeText.Default)
            {
                return SystemSize.ToClass();
            }

            return null;
        }

        /// <summary>
        /// Converts the property to a CSS style.
        /// </summary>
        /// <returns>The CSS style corresponding to the size.</returns>
        public virtual string ToStyle()
        {
            if (SystemSize != TypeSizeText.Default)
            {
                return SystemSize.ToStyle();
            }
            else if (IsUserSize)
            {
                return string.Format(CultureInfo.InvariantCulture, "font-size:{0:f}rem;", UserSize);
            }

            return null;
        }

        /// <summary>
        /// Gets a value indicating whether a size is set.
        /// </summary>
        /// <returns>True if a size is set, false otherwise.</returns>
        public virtual bool HasSize => SystemSize != TypeSizeText.Default || UserSize.HasValue;

        /// <summary>
        /// Gets a value indicating whether a user-defined size is set.
        /// </summary>
        /// <returns>True if a user-defined size is set, false otherwise.</returns>
        public virtual bool IsUserSize => SystemSize == TypeSizeText.Default && UserSize.HasValue;
    }
}
