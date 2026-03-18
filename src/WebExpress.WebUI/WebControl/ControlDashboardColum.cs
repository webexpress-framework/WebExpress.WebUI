namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a column in a control dashboard, including its display title 
    /// and size configuration.
    /// </summary>
    public sealed class ControlDashboardColumn
    {
        /// <summary>
        /// Returns the title associated with the object.
        /// </summary>
        public string Title { get; }

        /// <summary>
        /// Returns the size descriptor associated with the object.
        /// </summary>
        public string Size { get; }

        /// <summary>
        /// Initializes a new instance of class.
        /// </summary>
        public ControlDashboardColumn(string title, string size)
        {
            Title = title;
            Size = size;
        }

    }
}
