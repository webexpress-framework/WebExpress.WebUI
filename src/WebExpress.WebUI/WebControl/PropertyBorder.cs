using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the border properties of a web control.
    /// </summary>
    public class PropertyBorder : IProperty
    {
        /// <summary>
        /// Gets the top border.
        /// </summary>
        public bool Top { get; private set; }

        /// <summary>
        /// Gets te bottom border.
        /// </summary>
        public bool Bottom { get; private set; }

        /// <summary>
        /// Gets the left border.
        /// </summary>
        public bool Left { get; private set; }

        /// <summary>
        /// Gets the right border.
        /// </summary>
        public bool Right { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class with no borders.
        /// </summary>
        public PropertyBorder()
        {
            Top = Bottom = Left = Right = false;
        }

        /// <summary>
        /// Initializes a new instance of the class with uniform borders.
        /// </summary>
        /// <param name="showBorder">Determines whether to show a uniform border.</param>
        public PropertyBorder(bool showBorder = true)
        {
            Top = Bottom = Left = Right = showBorder;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertyBorder"/> class with specified horizontal and vertical borders.
        /// </summary>
        /// <param name="horizontal">The horizontal border.</param>
        /// <param name="vertical">The vertical border.</param>
        public PropertyBorder(bool horizontal, bool vertical)
        {
            Left = Right = horizontal;
            Top = Bottom = vertical;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertyBorder"/> class with specified borders for each side.
        /// </summary>
        /// <param name="left">The left border.</param>
        /// <param name="right">The right border.</param>
        /// <param name="top">The top border.</param>
        /// <param name="bottom">The bottom border.</param>
        public PropertyBorder(bool left, bool right, bool top, bool bottom)
        {
            Left = left;
            Top = top;
            Right = right;
            Bottom = bottom;
        }

        /// <summary>
        /// Converts the border properties to a CSS class.
        /// </summary>
        /// <returns>The CSS class corresponding to the border properties.</returns>
        public string ToClass()
        {
            if (Top == Bottom && Top == Left && Top == Right && Top == false)
            {
                return "border-0";
            }
            else if (Top == Bottom && Top == Left && Top == Right && Top == true)
            {
                return "border";
            }

            var c = new List<string>();

            if (Top)
            {
                c.Add("border-top");
            }
            else
            {
                c.Add("border-top-0");
            }

            if (Right)
            {
                c.Add("border-right");
            }
            else
            {
                c.Add("border-right-0");
            }

            if (Bottom)
            {
                c.Add("border-bottom");
            }
            else
            {
                c.Add("border-bottom-0");
            }

            if (Left)
            {
                c.Add("border-left");
            }
            else
            {
                c.Add("border-left-0");
            }

            return string.Join(" ", c);
        }

        /// <summary>
        /// Converts the border properties to a CSS style.
        /// </summary>
        /// <returns>The CSS style corresponding to the border properties.</returns>
        public virtual string ToStyle()
        {
            return null;
        }
    }
}
