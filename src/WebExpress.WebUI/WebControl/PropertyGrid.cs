namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a property grid that can be used to define properties for a web control.
    /// </summary>
    public class PropertyGrid : IProperty
    {
        /// <summary>
        /// Gets the device type to be used.
        /// </summary>
        public TypeDevice Device { get; private set; }

        /// <summary>
        /// Gets the number of columns used.
        /// Note: All columns within a PanelGrid must sum up to 12!
        /// </summary>
        public int Columns { get; private set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public PropertyGrid()
        {
            Columns = 1;
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="device">Determines whether a uniform frame should be displayed.</param>
        /// <param name="columns">The number of columns used. Note: All columns within a PanelGrid must sum up to 12!</param>
        public PropertyGrid(TypeDevice device, int columns)
        {
            Device = device;
            Columns = columns;
        }

        /// <summary>
        /// Converts the property to a CSS class.
        /// </summary>
        /// <returns>The CSS class corresponding to the property.</returns>
        public string ToClass()
        {
            return Device switch
            {
                TypeDevice.Auto => "col",
                TypeDevice.ExtraSmall => "col-" + Columns,
                TypeDevice.Small => "col-sm-" + Columns,
                TypeDevice.Medium => "col-md-" + Columns,
                TypeDevice.Large => "col-lg-" + Columns,
                TypeDevice.ExtraLarge => "col-xl-" + Columns,
                _ => null,
            };
        }

        /// <summary>
        /// Converts the property to a CSS style.
        /// </summary>
        /// <returns>The CSS style corresponding to the property.</returns>
        public virtual string ToStyle()
        {
            return null;
        }
    }
}
