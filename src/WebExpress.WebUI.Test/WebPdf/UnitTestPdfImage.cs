using System.Buffers.Binary;
using System.Diagnostics;
using System.IO.Compression;
using System.Text;
using WebExpress.WebUI.WebPdf;

namespace WebExpress.WebUI.Test.WebPdf
{
    /// <summary>
    /// Tests that a picture from a user cannot crash the server or run it out of memory while a
    /// PDF is laid out.
    /// </summary>
    public class UnitTestPdfImage
    {
        /// <summary>
        /// Verifies that a small, valid PNG with transparency is still decoded.
        /// </summary>
        [Fact]
        public void SmallPngIsDecoded()
        {
            // arrange
            var png = Png(4, 3, 6, 8, Rows(4, 3, 4));

            // act
            var image = PdfImage.Read(png);

            // validation
            Assert.NotNull(image);
            Assert.Equal(4, image.Width);
            Assert.Equal(3, image.Height);
        }

        /// <summary>
        /// Verifies that a header claiming dimensions beyond the limit is refused; the buffers
        /// sized from it took gigabytes or, multiplied in 32 bits, a negative size.
        /// </summary>
        /// <param name="width">The claimed width.</param>
        /// <param name="height">The claimed height.</param>
        [Theory]
        [InlineData(60_000, 60_000)]
        [InlineData(int.MaxValue, 2)]
        [InlineData(1_000_000, 1_000)]
        public void HugeDimensionsAreRefused(int width, int height)
        {
            // arrange
            var png = Png(width, height, 6, 8, new byte[16]);

            // act
            var image = PdfImage.Read(png);

            // validation
            Assert.Null(image);
        }

        /// <summary>
        /// Verifies that compressed data inflating far beyond what the image needs is cut off at
        /// the size of the image instead of being read completely.
        /// </summary>
        [Fact]
        public void DecompressionBombIsCutOff()
        {
            // arrange
            var bomb = new byte[512 * 1024 * 1024];
            var png = Png(16, 16, 6, 8, bomb);

            // counted for this thread only, because the tests running in parallel allocate in the
            // same process; the decoder runs synchronously, so everything it allocates is counted
            var before = GC.GetAllocatedBytesForCurrentThread();
            var watch = Stopwatch.StartNew();

            // act
            var image = PdfImage.Read(png);

            // validation
            Assert.NotNull(image);
            Assert.True(GC.GetAllocatedBytesForCurrentThread() - before < 64 * 1024 * 1024, "the decoder read the whole stream");
            Assert.True(watch.Elapsed < TimeSpan.FromSeconds(10));
        }

        /// <summary>
        /// Verifies that a bit depth the specification does not allow, and a truncated header,
        /// are refused.
        /// </summary>
        [Fact]
        public void InvalidHeadersAreRefused()
        {
            // arrange
            var depth = Png(4, 3, 6, 3, Rows(4, 3, 4));
            var truncated = Png(4, 3, 6, 8, Rows(4, 3, 4), headerLength: 8);

            // act / validation
            Assert.Null(PdfImage.Read(depth));
            Assert.Null(PdfImage.Read(truncated));
        }

        /// <summary>
        /// Verifies that a JPEG whose frame header is cut off is refused instead of being read past
        /// the end of the file.
        /// </summary>
        [Fact]
        public void TruncatedJpegIsRefused()
        {
            // arrange
            byte[] jpeg = [0xFF, 0xD8, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00];

            // act / validation
            Assert.Null(PdfImage.Read(jpeg));
        }

        /// <summary>
        /// Builds the raw rows of an image: a filter byte of none per row, then the samples.
        /// </summary>
        /// <param name="width">The width.</param>
        /// <param name="height">The height.</param>
        /// <param name="channels">The samples per pixel at 8 bits.</param>
        /// <returns>The rows.</returns>
        private static byte[] Rows(int width, int height, int channels)
        {
            var rows = new byte[(width * channels + 1) * height];
            Array.Fill(rows, (byte)0x7F);

            for (var y = 0; y < height; y++)
            {
                rows[y * (width * channels + 1)] = 0;
            }

            return rows;
        }

        /// <summary>
        /// Builds a PNG file; the chunk checksums are not verified by the reader and left zero.
        /// </summary>
        /// <param name="width">The width written into the header.</param>
        /// <param name="height">The height written into the header.</param>
        /// <param name="colorType">The color type.</param>
        /// <param name="depth">The bit depth.</param>
        /// <param name="rows">The uncompressed rows.</param>
        /// <param name="headerLength">The length written for the header chunk.</param>
        /// <returns>The file.</returns>
        private static byte[] Png(int width, int height, int colorType, int depth, byte[] rows, int headerLength = 13)
        {
            using var file = new MemoryStream();
            file.Write([137, 80, 78, 71, 13, 10, 26, 10]);

            var header = new byte[13];
            BinaryPrimitives.WriteInt32BigEndian(header.AsSpan(0), width);
            BinaryPrimitives.WriteInt32BigEndian(header.AsSpan(4), height);
            header[8] = (byte)depth;
            header[9] = (byte)colorType;
            Chunk(file, "IHDR", header[..Math.Min(13, headerLength)], headerLength);

            using var compressed = new MemoryStream();
            using (var zlib = new ZLibStream(compressed, CompressionLevel.Fastest, leaveOpen: true))
            {
                zlib.Write(rows);
            }

            Chunk(file, "IDAT", compressed.ToArray());
            Chunk(file, "IEND", []);

            return file.ToArray();
        }

        /// <summary>
        /// Writes one chunk.
        /// </summary>
        /// <param name="file">The file.</param>
        /// <param name="type">The chunk type.</param>
        /// <param name="body">The chunk body.</param>
        /// <param name="length">The length written, or the body length.</param>
        private static void Chunk(Stream file, string type, byte[] body, int? length = null)
        {
            var prefix = new byte[4];
            BinaryPrimitives.WriteInt32BigEndian(prefix, length ?? body.Length);
            file.Write(prefix);
            file.Write(Encoding.ASCII.GetBytes(type));
            file.Write(body);
            file.Write(new byte[4]);
        }
    }
}
