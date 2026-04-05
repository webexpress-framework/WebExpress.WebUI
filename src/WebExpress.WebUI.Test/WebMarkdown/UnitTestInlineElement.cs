using WebExpress.WebUI.WebMarkdown;
using WebExpress.WebUI.WebMarkdown.Element;

namespace WebExpress.WebUI.Test.WebMarkdown
{
    /// <summary>
    /// Unit tests for inline elements in Markdown.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestInlineElement
    {
        /// <summary>
        /// Tests whether italic text (using single asterisks) is correctly recognized and parsed as MarkdownInlineElementItalic,
        /// and verifies that the plain text content of the italic element matches the expected value.
        /// </summary>
        [Theory]
        [InlineData("This is *italic* text.", "italic")]
        [InlineData("*italic* Start", "italic")]
        public void Italic(string input, string expectedItalic)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementItalic it && it.PlainText == expectedItalic);
        }

        /// <summary>
        /// Tests that text which is not marked as italic (i.e., without single asterisks) does not get parsed as MarkdownInlineElementItalic.
        /// Ensures no MarkdownInlineElementItalic is present for such inputs.
        /// </summary>
        [Theory]
        [InlineData("This *is not closed italic text.", "This * is not closed italic text.")]
        [InlineData("No asterisks here", "No asterisks here")]
        [InlineData("mixed *italic **bold** not closed", "mixed * italic bold not closed")]
        public void Italic_Invalid(string input, string expected)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            // Ensures that no MarkdownInlineElementItalic element exists in the paragraph content
            Assert.DoesNotContain(para.Content, n => n is MarkdownInlineElementItalic);
            Assert.Equal(expected, para.PlainText);
        }

        /// <summary>
        /// Tests whether bold text (using double asterisks) is correctly recognized and parsed as MarkdownInlineElementBold,
        /// and verifies that the plain text content of the bold element matches the expected value.
        /// </summary>
        [Theory]
        [InlineData("This is **bold** text.", "bold")]
        [InlineData("Before **bold** after", "bold")]
        [InlineData("**bold** after", "bold")]
        [InlineData("**bold**!", "bold")]
        [InlineData("Before **bold**", "bold")]
        [InlineData("**This is line \nand this is line is still bold.**\n\nThis is no longer bold.", "This is line and this is line is still bold.")]
        public void Bold(string input, string expectedBold)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementBold bt && bt.PlainText == expectedBold);
        }

        /// <summary>
        /// Tests whether bold text (using double asterisks) is correctly recognized and parsed as MarkdownInlineElementBold,
        /// and verifies that the plain text content of the bold element matches the expected value.
        /// </summary>
        [Theory]
        [InlineData("This is **bold text.", "This is ** bold text.")]
        [InlineData("Before bold** after.", "Before bold ** after.")]
        [InlineData("**bold* after", "** bold * after")]
        [InlineData("Before *bold**", "Before * bold **")]
        public void Bold_Invalid(string input, string expectedBold)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.DoesNotContain(para.Content, n => n is MarkdownInlineElementBold);
            Assert.Equal(expectedBold, para.PlainText);
        }

        /// <summary>
        /// Tests whether strong emphasis and emphasis text is correctly recognized and parsed as MarkdownInlineElementItalic,
        /// and verifies that the plain text content of the italic element matches the expected value.
        /// Also checks that triple-star (bold+italic) is parsed as italic inline element.
        /// </summary>
        [Theory]
        [InlineData("This is ***bold+italic*** text.", "bold+italic")]
        [InlineData("***bold+italic*** Start", "bold+italic")]
        public void BoldItalic(string input, string expectedItalic)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            var bold = para.Content.FirstOrDefault(x => x is MarkdownInlineElementBold) as MarkdownInlineElementBold;

            // Checks if there is an italic element with the expected plain text
            Assert.Contains(bold.Content, n =>
                n is MarkdownInlineElementItalic it && it.PlainText == expectedItalic
            );
        }

        /// <summary>
        /// Tests whether strikethrough text (using double tildes) is correctly recognized and parsed as MarkdownInlineElementStrikethrough,
        /// and verifies that the plain text content of the strikethrough element matches the expected value.
        /// </summary>
        [Theory]
        [InlineData("This is ~strikethrough~ text.", "strikethrough")]
        [InlineData("This is ~~strikethrough~~ text.", "strikethrough")]
        [InlineData("~strike~ Test", "strike")]
        [InlineData("~~strike~~ Test", "strike")]
        public void Strikethrough(string input, string expectedStrike)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementStrikethrough st && st.PlainText == expectedStrike);
        }

        /// <summary>
        /// Tests whether bold strikethrough text (using triple tildes) is correctly recognized and parsed as MarkdownInlineElementStrikethroughBold,
        /// and verifies that the plain text content of the strikethrough-bold element matches the expected value.
        /// </summary>
        [Theory]
        [InlineData("This is ~~~strikethrough bold~~~ text.", "strikethrough bold")]
        [InlineData("~~~strike bold~~~ Test", "strike bold")]
        [InlineData("~~**strike bold**~~ Test", "strike bold")]
        public void StrikethroughBold(string input, string expectedStrikeBold)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            var strike = para.Content.FirstOrDefault(x => x is MarkdownInlineElementStrikethrough) as MarkdownInlineElementStrikethrough;

            Assert.Contains(strike.Content, n => n is MarkdownInlineElementBold st && st.PlainText == expectedStrikeBold);
        }

        /// <summary>
        /// Tests whether underlined text (using double underscores) is correctly recognized and parsed as MarkdownInlineElementUnderline,
        /// and verifies that the plain text content of the underline element matches the expected value.
        /// </summary>
        [Theory]
        [InlineData("This is _underlined_ text.", "underlined")]
        [InlineData("_underline_ in between", "underline")]
        public void Underline(string input, string expectedUnderline)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementUnderline ut && ut.PlainText == expectedUnderline);
        }

        /// <summary>
        /// Tests whether bold underlined text (using double underscores and double asterisks) is correctly recognized and parsed as MarkdownInlineElementUnderlineBold,
        /// and verifies that the plain text content of the underline-bold element matches the expected value.
        /// </summary>
        [Theory]
        [InlineData("This is __underlined bold__ text.", "underlined bold")]
        [InlineData("__underline bold__ in between", "underline bold")]
        [InlineData("_**underline bold**_ in between", "underline bold")]
        public void UnderlineBold(string input, string expectedUnderlineBold)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            var underline = para.Content.FirstOrDefault(x => x is MarkdownInlineElementUnderline) as MarkdownInlineElementUnderline;

            Assert.Contains(underline.Content, n => n is MarkdownInlineElementBold b && b.PlainText == expectedUnderlineBold);
        }

        /// <summary>
        /// Tests whether bold underlined text (using double underscores and double asterisks) is correctly recognized and parsed as MarkdownInlineElementUnderlineBold,
        /// and verifies that the plain text content of the underline-bold element matches the expected value.
        /// </summary>
        [Theory]
        [InlineData("This is ___underlined bold italic___ text.", "underlined bold italic")]
        [InlineData("___underline bold italic___ in between", "underline bold italic")]
        [InlineData("_***underline bold italic***_ in between", "underline bold italic")]
        public void UnderlineBoldItalic(string input, string expected)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            var underline = para.Content.FirstOrDefault(x => x is MarkdownInlineElementUnderline) as MarkdownInlineElementUnderline;
            var bold = underline.Content.FirstOrDefault(x => x is MarkdownInlineElementBold) as MarkdownInlineElementBold;

            Assert.Contains(bold.Content, n => n is MarkdownInlineElementItalic i && i.PlainText == expected);
        }

        /// <summary>
        /// Unit test for detecting highlighted text via double equal signs in Markdown.
        /// </summary>
        [Theory]
        [InlineData("This is ==highlight== text.", "highlight")]
        [InlineData("==highlight== before and after", "highlight")]
        [InlineData("Multiple ==highlights== in ==one== line", "highlights")]
        [InlineData("==Multiline \nhighlight== continues here.", "Multiline highlight")]
        public void Marked(string input, string expected)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementMarked bt && bt.PlainText == expected);
        }

        /// <summary>
        /// Tests whether Markdown links are correctly parsed as MarkdownInlineElementLink,
        /// verifying that both the link text and the URL are extracted as expected.
        /// </summary>
        [Theory]
        [InlineData("A [Link](https://example.com).", "Link", "https://example.com")]
        [InlineData("[Test](http://example.com)", "Test", "http://example.com")]
        public void Link(string input, string expectedText, string expectedUrl)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementLink l && l.Text == expectedText && l.Url == expectedUrl);
        }

        /// <summary>
        /// Tests whether images in Markdown are correctly recognized and parsed as MarkdownInlineElementImage,
        /// verifying that both the alternative text and the image URL are extracted as expected.
        /// </summary>
        [Theory]
        [InlineData("An image ![Alt](https://img.com/test.png) here.", "Alt", "https://img.com/test.png")]
        [InlineData("![Test](http://a.com/b.png)", "Test", "http://a.com/b.png")]
        public void Image(string input, string expectedAlt, string expectedUrl)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementImage img && img.AltText == expectedAlt && img.Url == expectedUrl);
        }

        /// <summary>
        /// Tests whether images in Markdown are correctly recognized and parsed as MarkdownInlineElementImage,
        /// verifying that both the alternative text and the image URL are extracted as expected.
        /// </summary>
        [Theory]
        [InlineData("Text! Text", "Text! Text")]
        [InlineData("**! Text [Text](http://example.com)", "** ! Text http://example.com")]
        public void Image_Invalid(string input, string expected)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            Assert.Equal(expected, doc.GetPlainText());
        }

        /// <summary>
        /// Tests if plain URLs (including mailto-links) are correctly recognized and parsed as MarkdownInlineElementUrl.
        /// </summary>
        [Theory]
        [InlineData("See https://www.example.com for info.", "https://www.example.com")]
        [InlineData("Direct link: http://test.org/page", "http://test.org/page")]
        [InlineData("Contact: mailto:info@example.com", "mailto:info@example.com")]
        public void Url(string input, string expectedUrl)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementUrl url && url.Url == expectedUrl);
        }

        /// <summary>
        /// Tests the tokenization of checkbox in the format [X].
        /// </summary>
        [Theory]
        [InlineData("[X]", "true")]
        [InlineData("[x]", "true")]
        [InlineData("[ ]", "false")]
        [InlineData("This is a checkbox [X].", "true")]
        [InlineData("This is a checkbox [x].", "true")]
        [InlineData("This is a checkbox [ ].", "false")]
        [InlineData("This is a checkbox [ X ].", "true")]
        [InlineData("This is a checkbox [ x ].", "true")]
        [InlineData("This is a checkbox [   ].", "false")]
        public void Checkbox(string input, string expected)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementCheckbox fn && fn.Value == expected);
        }

        /// <summary>
        /// Tests the tokenization of footnotes in the format [^1].
        /// </summary>
        [Theory]
        [InlineData("This is a footnote[^1].", "1")]
        public void Footnotes(string input, string expectedNumber)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementFootnote fn && fn.Id == expectedNumber);
        }

        /// <summary>
        /// Tests the tokenization of code in the format `.
        /// </summary>
        [Theory]
        [InlineData("`code`", "code")]
        [InlineData("This is `code`.", "code")]
        public void Code(string input, string expectedCode)
        {
            // act
            var doc = MarkdownParser.Parse(input);

            // validation
            var para = Assert.IsType<MarkdownBlockElementParagraph>(doc.Elements.FirstOrDefault());
            Assert.Contains(para.Content, n => n is MarkdownInlineElementCode fn && fn.Code == expectedCode);
        }
    }
}