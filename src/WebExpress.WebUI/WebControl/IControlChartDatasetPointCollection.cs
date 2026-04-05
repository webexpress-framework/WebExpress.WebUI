using System.Collections.Generic;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a collection of control chart dataset points.
    /// </summary>
    /// <remarks>
    /// This interface provides access to a collection of <see cref="IControlChartDatasetPoint"/>
    /// objects and supports enumeration of the dataset points. It is typically used to manage and 
    /// iterate over the points in a control chart dataset.
    /// </remarks>
    public interface IControlChartDatasetPointCollection : IEnumerable<IControlChartDatasetPoint>
    {
        /// <summary>
        /// Returns the number of elements contained in the collection.
        /// </summary>
        int Count { get; }
    }

}
