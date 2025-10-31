using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Provides custom JSON serialization and deserialization logic for the 
    /// <see cref="ControlChartDatasetPointCollection"/> type.
    /// </summary>
    /// <remarks>This converter handles serialization of different point types within the collection,
    /// including scalar, scatter, and bubble points. Deserialization is not implemented.</remarks>
    internal class ControlChartDatasetPointCollectionConverter : JsonConverter<ControlChartDatasetPointCollection>
    {
        /// <summary>
        /// Reads and converts the JSON representation of a collection object.
        /// </summary>
        /// <param name="reader">The Utf8 json reader to read from.</param>
        /// <param name="typeToConvert">The type of the object to convert, which is expected to be collection.</param>
        /// <param name="options">The serializer options to use during deserialization.</param>
        /// <returns>A collection object deserialized from the JSON input.</returns>
        /// <exception cref="NotImplementedException">Thrown to indicate that deserialization is not implemented.</exception>
        public override ControlChartDatasetPointCollection Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            throw new NotImplementedException("Deserialization not implemented.");
        }

        /// <summary>
        /// Writes a collection to a JSON array using the specified Utf8 json writer"/>.
        /// </summary>
        /// <param name="writer">The Utf8 json writer to write the JSON output to. Cannot be null.</param>
        /// <param name="value">The collection to serialize. Cannot be null. </param>
        /// <param name="options">The json serializer options to use during serialization. May be null.</param>
        /// <exception cref="JsonException">Thrown if the collection contains an unsupported point type.</exception>
        public override void Write(Utf8JsonWriter writer, ControlChartDatasetPointCollection value, JsonSerializerOptions options)
        {
            writer.WriteStartArray();

            foreach (var point in value)
            {
                switch (point)
                {
                    case ControlChartDatasetPointScalar scalar:
                        writer.WriteNumberValue(scalar.Value);
                        break;

                    case ControlChartDatasetPointScatter scatter:
                        writer.WriteStartArray();
                        writer.WriteNumberValue(scatter.X);
                        writer.WriteNumberValue(scatter.Y);
                        writer.WriteEndArray();
                        break;

                    case ControlChartDatasetPointBubble bubble:
                        writer.WriteStartArray();
                        writer.WriteNumberValue(bubble.X);
                        writer.WriteNumberValue(bubble.Y);
                        writer.WriteNumberValue(bubble.Radius);
                        writer.WriteEndArray();
                        break;

                    default:
                        throw new JsonException($"Unsupported point type: {point?.GetType().Name}");
                }
            }

            writer.WriteEndArray();
        }
    }
}
