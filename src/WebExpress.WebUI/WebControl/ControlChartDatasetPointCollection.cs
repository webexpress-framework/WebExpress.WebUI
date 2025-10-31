using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a collection of control chart dataset points, which can be initialized from scalar values or
    /// pre-defined dataset points.
    /// </summary>
    /// <remarks>
    /// This collection provides an enumerable interface for iterating over the dataset points and
    /// supports initialization using either scalar values or instances of <see cref="IControlChartDatasetPoint"/>. 
    /// It also includes an implicit conversion operator to create a collection from an array of scalar values.
    /// </remarks>
    public class ControlChartDatasetPointCollection : IControlChartDatasetPointCollection
    {
        private readonly IEnumerable<IControlChartDatasetPoint> _points;

        /// <summary>
        /// Initializes a new instance of the class using the specified scalar values.
        /// </summary>
        /// <param name="scalars">
        /// An array of scalar values used to create the dataset points. Each value is converted 
        /// into a <see cref="ControlChartDatasetPointScalar"/> instance.
        /// </param>
        public ControlChartDatasetPointCollection(params float[] scalars)
        {
            _points = scalars.Select(v => new ControlChartDatasetPointScalar(v));
        }

        /// <summary>
        /// Initializes a new instance of the class  with the specified collection of dataset points.
        /// </summary>
        /// <param name="points">
        /// An array of <see cref="IControlChartDatasetPoint"/> objects representing the dataset points 
        /// to include in the collection. This parameter can accept zero or more points.</param>
        public ControlChartDatasetPointCollection(params IControlChartDatasetPoint[] points)
        {
            _points = points;
        }

        /// <summary>
        /// Returns an enumerator that iterates through the collection of control chart 
        /// dataset points.
        /// </summary>
        /// <remarks>
        /// The enumerator provides read-only access to the dataset points in the 
        /// collection. Use this method to iterate over the points in a `foreach` loop 
        /// or similar constructs.
        /// </remarks>
        /// <returns>
        /// An enumerator for the collection of <see cref="IControlChartDatasetPoint"/> objects.
        /// </returns>
        public IEnumerator<IControlChartDatasetPoint> GetEnumerator()
        {
            return _points.GetEnumerator();
        }

        /// <summary>
        /// Returns the number of points in the collection.
        /// </summary>
        public int Count => _points.Count();

        /// <summary>
        /// Returns an enumerator that iterates through the collection.
        /// </summary>
        /// <returns>
        /// An <see cref="System.Collections.IEnumerator"/> that can be used to iterate 
        /// through the collection.
        /// </returns>
        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();

        /// <summary>
        /// Implicitly converts an array of floating-point values to a 
        /// <see cref="ControlChartDatasetPointCollection"/>.
        /// </summary>
        /// <param name="values">
        /// An array of floating-point values to initialize the collection with.
        /// </param>
        public static implicit operator ControlChartDatasetPointCollection(float[] values) => new(values);
    }
}
