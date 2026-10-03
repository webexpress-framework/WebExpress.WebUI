using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Text;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Holds a picture in the form a PDF image object takes: the sample data with the filter
    /// that decodes it, and an optional soft mask carrying the transparency.
    /// <para>
    /// JPEG is passed through untouched, since a PDF reader decodes it natively. PNG shares
    /// its compression with PDF, so a PNG without transparency is passed through as well and
    /// only has its row filters declared; a PNG with an alpha channel, a transparent palette
    /// entry or 16 bit samples has to be decoded here, because PDF keeps the transparency in
    /// a separate image. Interlaced PNG and every other format are not understood.
    /// </para>
    /// </summary>
    internal sealed class PdfImage
    {
        private static readonly byte[] PngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

        /// <summary>
        /// Returns the width in pixels.
        /// </summary>
        public int Width { get; private init; }

        /// <summary>
        /// Returns the height in pixels.
        /// </summary>
        public int Height { get; private init; }

        /// <summary>
        /// Returns the encoded samples.
        /// </summary>
        public byte[] Data { get; private init; }

        /// <summary>
        /// Returns the name of the filter that decodes the samples.
        /// </summary>
        public string Filter { get; private init; }

        /// <summary>
        /// Returns the color space, as it is written into the image dictionary.
        /// </summary>
        public string ColorSpace { get; private init; }

        /// <summary>
        /// Returns the number of bits per sample.
        /// </summary>
        public int BitsPerComponent { get; private init; } = 8;

        /// <summary>
        /// Returns the decode parameters, or null.
        /// </summary>
        public string DecodeParms { get; private init; }

        /// <summary>
        /// Returns the decode array, or null.
        /// </summary>
        public string Decode { get; private init; }

        /// <summary>
        /// Returns the transparency as a grayscale image, or null for an opaque picture.
        /// </summary>
        public PdfImage SoftMask { get; private init; }

        /// <summary>
        /// Reads an encoded picture.
        /// </summary>
        /// <param name="data">The content of a JPEG or PNG file.</param>
        /// <returns>The image, or null when the format is not understood or the data is damaged.</returns>
        public static PdfImage Read(byte[] data)
        {
            if (data is null || data.Length < 8)
            {
                return null;
            }

            try
            {
                if (data[0] == 0xFF && data[1] == 0xD8)
                {
                    return ReadJpeg(data);
                }

                if (data.AsSpan(0, 8).SequenceEqual(PngSignature))
                {
                    return ReadPng(data);
                }
            }
            catch (Exception ex) when (ex is IndexOutOfRangeException or ArgumentException or InvalidDataException or IOException)
            {
                // a damaged picture is a property of the content, not of the document; the
                // layout falls back to the alternative text
            }

            return null;
        }

        /// <summary>
        /// Decodes a <c>data:</c> address.
        /// </summary>
        /// <param name="uri">The address.</param>
        /// <returns>The bytes, or null when the address is not a base64 data address.</returns>
        public static byte[] ReadDataUri(string uri)
        {
            if (uri is null || !uri.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var comma = uri.IndexOf(',');

            if (comma < 0 || !uri[..comma].EndsWith(";base64", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            try
            {
                return Convert.FromBase64String(uri[(comma + 1)..].Trim());
            }
            catch (FormatException)
            {
                return null;
            }
        }

        /// <summary>
        /// Reads the frame header of a JPEG file; the samples stay encoded.
        /// </summary>
        /// <param name="data">The file.</param>
        /// <returns>The image, or null.</returns>
        private static PdfImage ReadJpeg(byte[] data)
        {
            var adobe = false;
            var position = 2;

            while (position + 4 <= data.Length)
            {
                if (data[position] != 0xFF)
                {
                    return null;
                }

                var marker = data[position + 1];

                if (marker == 0xFF)
                {
                    position++;
                    continue;
                }

                var length = (data[position + 2] << 8) | data[position + 3];

                if (marker == 0xEE && length >= 7 && Encoding.ASCII.GetString(data, position + 4, 5) == "Adobe")
                {
                    adobe = true;
                }

                // every start-of-frame marker except the ones reserved for other purposes
                if (marker is >= 0xC0 and <= 0xCF && marker is not (0xC4 or 0xC8 or 0xCC))
                {
                    var height = (data[position + 5] << 8) | data[position + 6];
                    var width = (data[position + 7] << 8) | data[position + 8];
                    var components = data[position + 9];

                    if (width == 0 || height == 0)
                    {
                        return null;
                    }

                    return new PdfImage
                    {
                        Width = width,
                        Height = height,
                        Data = data,
                        Filter = "DCTDecode",
                        ColorSpace = components switch
                        {
                            1 => "/DeviceGray",
                            4 => "/DeviceCMYK",
                            _ => "/DeviceRGB"
                        },
                        // Adobe writes CMYK JPEGs inverted, and every reader expects that
                        Decode = components == 4 && adobe ? "[1 0 1 0 1 0 1 0]" : null
                    };
                }

                position += 2 + length;
            }

            return null;
        }

        /// <summary>
        /// Reads a PNG file.
        /// </summary>
        /// <param name="data">The file.</param>
        /// <returns>The image, or null.</returns>
        private static PdfImage ReadPng(byte[] data)
        {
            var position = 8;
            int width = 0, height = 0, depth = 0, colorType = 0, interlace = 0;
            byte[] palette = null;
            byte[] transparency = null;
            using var idat = new MemoryStream();

            while (position + 8 <= data.Length)
            {
                var length = (data[position] << 24) | (data[position + 1] << 16) | (data[position + 2] << 8) | data[position + 3];
                var type = Encoding.ASCII.GetString(data, position + 4, 4);
                var body = position + 8;

                if (length < 0 || body + length > data.Length)
                {
                    return null;
                }

                switch (type)
                {
                    case "IHDR":
                        width = (data[body] << 24) | (data[body + 1] << 16) | (data[body + 2] << 8) | data[body + 3];
                        height = (data[body + 4] << 24) | (data[body + 5] << 16) | (data[body + 6] << 8) | data[body + 7];
                        depth = data[body + 8];
                        colorType = data[body + 9];
                        interlace = data[body + 12];
                        break;
                    case "PLTE":
                        palette = data.AsSpan(body, length).ToArray();
                        break;
                    case "tRNS":
                        transparency = data.AsSpan(body, length).ToArray();
                        break;
                    case "IDAT":
                        idat.Write(data, body, length);
                        break;
                }

                if (type == "IEND")
                {
                    break;
                }

                position = body + length + 4;
            }

            if (width <= 0 || height <= 0 || interlace != 0 || idat.Length == 0 || (colorType == 3 && palette is null))
            {
                return null;
            }

            var channels = colorType switch
            {
                0 => 1,
                2 => 3,
                3 => 1,
                4 => 2,
                6 => 4,
                _ => 0
            };

            if (channels == 0)
            {
                return null;
            }

            if (colorType is 4 or 6 || depth == 16 || transparency is not null)
            {
                return DecodePng(idat.ToArray(), width, height, depth, colorType, channels, palette, transparency);
            }

            return new PdfImage
            {
                Width = width,
                Height = height,
                Data = idat.ToArray(),
                Filter = "FlateDecode",
                BitsPerComponent = depth,
                ColorSpace = colorType switch
                {
                    0 => "/DeviceGray",
                    3 => $"[/Indexed /DeviceRGB {palette.Length / 3 - 1} <{Convert.ToHexString(palette)}>]",
                    _ => "/DeviceRGB"
                },
                DecodeParms = $"<< /Predictor 15 /Colors {channels} /BitsPerComponent {depth} /Columns {width} >>"
            };
        }

        /// <summary>
        /// Decodes the samples of a PNG file into 8 bit color and alpha planes.
        /// </summary>
        /// <param name="compressed">The concatenated IDAT chunks.</param>
        /// <param name="width">The width in pixels.</param>
        /// <param name="height">The height in pixels.</param>
        /// <param name="depth">The bits per sample.</param>
        /// <param name="colorType">The PNG color type.</param>
        /// <param name="channels">The samples per pixel.</param>
        /// <param name="palette">The palette, or null.</param>
        /// <param name="transparency">The tRNS chunk, or null.</param>
        /// <returns>The image.</returns>
        private static PdfImage DecodePng(byte[] compressed, int width, int height, int depth, int colorType, int channels, byte[] palette, byte[] transparency)
        {
            var raw = Inflate(compressed);
            var stride = (width * channels * depth + 7) / 8;
            var bpp = Math.Max(1, channels * depth / 8);
            var pixels = Unfilter(raw, stride, height, bpp);
            var gray = colorType is 0 or 4;
            var color = new byte[width * height * (gray ? 1 : 3)];
            var alpha = new byte[width * height];
            var translucent = false;

            for (var y = 0; y < height; y++)
            {
                for (var x = 0; x < width; x++)
                {
                    var index = y * width + x;
                    var a = 255;

                    if (colorType == 3)
                    {
                        var entry = Sample(pixels, y * stride, x, depth);
                        var offset = Math.Min(entry, palette.Length / 3 - 1) * 3;
                        color[index * 3] = palette[offset];
                        color[index * 3 + 1] = palette[offset + 1];
                        color[index * 3 + 2] = palette[offset + 2];
                        a = transparency is not null && entry < transparency.Length ? transparency[entry] : 255;
                    }
                    else
                    {
                        var samples = new int[channels];

                        for (var c = 0; c < channels; c++)
                        {
                            samples[c] = Sample(pixels, y * stride, x * channels + c, depth);
                        }

                        if (gray)
                        {
                            color[index] = Scale(samples[0], depth);
                            a = colorType == 4
                                ? Scale(samples[1], depth)
                                : IsTransparentKey(transparency, samples, depth) ? 0 : 255;
                        }
                        else
                        {
                            color[index * 3] = Scale(samples[0], depth);
                            color[index * 3 + 1] = Scale(samples[1], depth);
                            color[index * 3 + 2] = Scale(samples[2], depth);
                            a = colorType == 6
                                ? Scale(samples[3], depth)
                                : IsTransparentKey(transparency, samples, depth) ? 0 : 255;
                        }
                    }

                    alpha[index] = (byte)a;
                    translucent |= a != 255;
                }
            }

            return new PdfImage
            {
                Width = width,
                Height = height,
                Data = PdfWriter.Deflate(color),
                Filter = "FlateDecode",
                ColorSpace = gray ? "/DeviceGray" : "/DeviceRGB",
                SoftMask = translucent
                    ? new PdfImage
                    {
                        Width = width,
                        Height = height,
                        Data = PdfWriter.Deflate(alpha),
                        Filter = "FlateDecode",
                        ColorSpace = "/DeviceGray"
                    }
                    : null
            };
        }

        /// <summary>
        /// Decompresses zlib data.
        /// </summary>
        /// <param name="data">The compressed data.</param>
        /// <returns>The decompressed data.</returns>
        private static byte[] Inflate(byte[] data)
        {
            using var input = new ZLibStream(new MemoryStream(data), CompressionMode.Decompress);
            using var output = new MemoryStream();
            input.CopyTo(output);

            return output.ToArray();
        }

        /// <summary>
        /// Reverses the per-row filters of PNG.
        /// </summary>
        /// <param name="raw">The decompressed rows, each led by its filter type.</param>
        /// <param name="stride">The bytes per row without the filter type.</param>
        /// <param name="height">The number of rows.</param>
        /// <param name="bpp">The bytes per complete pixel, at least one.</param>
        /// <returns>The unfiltered rows.</returns>
        private static byte[] Unfilter(byte[] raw, int stride, int height, int bpp)
        {
            var result = new byte[stride * height];

            for (var y = 0; y < height; y++)
            {
                var source = y * (stride + 1);

                if (source + stride >= raw.Length)
                {
                    throw new InvalidDataException("The image data is truncated.");
                }

                var filter = raw[source];
                var row = y * stride;
                var previous = row - stride;

                for (var i = 0; i < stride; i++)
                {
                    var value = raw[source + 1 + i];
                    var left = i >= bpp ? result[row + i - bpp] : 0;
                    var up = y > 0 ? result[previous + i] : 0;
                    var upLeft = y > 0 && i >= bpp ? result[previous + i - bpp] : 0;

                    result[row + i] = (byte)(filter switch
                    {
                        1 => value + left,
                        2 => value + up,
                        3 => value + ((left + up) >> 1),
                        4 => value + Paeth(left, up, upLeft),
                        _ => value
                    });
                }
            }

            return result;
        }

        /// <summary>
        /// Returns the predictor of the Paeth filter.
        /// </summary>
        private static int Paeth(int a, int b, int c)
        {
            var p = a + b - c;
            var pa = Math.Abs(p - a);
            var pb = Math.Abs(p - b);
            var pc = Math.Abs(p - c);

            return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        }

        /// <summary>
        /// Reads one sample of a row.
        /// </summary>
        /// <param name="pixels">The unfiltered rows.</param>
        /// <param name="row">The offset of the row.</param>
        /// <param name="index">The index of the sample in the row.</param>
        /// <param name="depth">The bits per sample.</param>
        /// <returns>The sample.</returns>
        private static int Sample(byte[] pixels, int row, int index, int depth)
        {
            switch (depth)
            {
                case 8:
                    return pixels[row + index];
                case 16:
                    return (pixels[row + index * 2] << 8) | pixels[row + index * 2 + 1];
                default:
                    var bit = index * depth;
                    var shift = 8 - depth - bit % 8;
                    return (pixels[row + bit / 8] >> shift) & ((1 << depth) - 1);
            }
        }

        /// <summary>
        /// Scales a sample to 8 bits.
        /// </summary>
        /// <param name="sample">The sample.</param>
        /// <param name="depth">The bits per sample.</param>
        /// <returns>The scaled sample.</returns>
        private static byte Scale(int sample, int depth)
        {
            return depth switch
            {
                16 => (byte)(sample >> 8),
                8 => (byte)sample,
                _ => (byte)(sample * 255 / ((1 << depth) - 1))
            };
        }

        /// <summary>
        /// Returns whether a pixel matches the transparent color key of a tRNS chunk.
        /// </summary>
        /// <param name="transparency">The tRNS chunk, or null.</param>
        /// <param name="samples">The samples of the pixel.</param>
        /// <param name="depth">The bits per sample.</param>
        /// <returns>True when the pixel is transparent.</returns>
        private static bool IsTransparentKey(byte[] transparency, IReadOnlyList<int> samples, int depth)
        {
            if (transparency is null || transparency.Length < samples.Count * 2)
            {
                return false;
            }

            var mask = depth == 16 ? 0xFFFF : (1 << depth) - 1;

            for (var c = 0; c < Math.Min(samples.Count, 3); c++)
            {
                if ((((transparency[c * 2] << 8) | transparency[c * 2 + 1]) & mask) != samples[c])
                {
                    return false;
                }
            }

            return true;
        }
    }
}
