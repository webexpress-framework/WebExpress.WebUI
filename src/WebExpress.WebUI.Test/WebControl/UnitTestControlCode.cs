using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the code control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlCode
    {
        /// <summary>
        /// Tests the id property of the code control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<pre class=""wx-webui-code"" data-base64=""true""></pre>")]
        [InlineData("id", @"<pre id=""id"" class=""wx-webui-code"" data-base64=""true""></pre>")]
        public void Id(string id, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCode(id)
            {
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the code property of the code control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<pre class=""wx-webui-code"" data-base64=""true""></pre>")]
        [InlineData("abc", @"<pre class=""wx-webui-code"" data-base64=""true"">YWJj</pre>")]
        public void Code(string code, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCode()
            {
                Code = code
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the line numbers property of the code control.
        /// </summary>
        [Theory]
        [InlineData(false, @"<pre class=""wx-webui-code"" data-base64=""true""></pre>")]
        [InlineData(true, @"<pre class=""wx-webui-code"" data-line-numbers=""true"" data-base64=""true""></pre>")]
        public void LineNumbers(bool lineNumbers, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCode()
            {
                LineNumbers = lineNumbers

            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the language property of the code control.
        /// </summary>
        [Theory]
        [InlineData(TypeLanguage.Default, @"<pre class=""wx-webui-code"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Bash, @"<pre class=""wx-webui-code"" data-language=""bash"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Basic, @"<pre class=""wx-webui-code"" data-language=""basic"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Cmd, @"<pre class=""wx-webui-code"" data-language=""cmd"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Cobol, @"<pre class=""wx-webui-code"" data-language=""cobol"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Cpp, @"<pre class=""wx-webui-code"" data-language=""cpp"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.CSharp, @"<pre class=""wx-webui-code"" data-language=""csharp"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Groovy, @"<pre class=""wx-webui-code"" data-language=""groovy"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Java, @"<pre class=""wx-webui-code"" data-language=""java"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.JavaScript, @"<pre class=""wx-webui-code"" data-language=""javascript"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Markdown, @"<pre class=""wx-webui-code"" data-language=""markdown"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Php, @"<pre class=""wx-webui-code"" data-language=""php"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.PowerShell, @"<pre class=""wx-webui-code"" data-language=""powershell"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Property, @"<pre class=""wx-webui-code"" data-language=""property"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Python, @"<pre class=""wx-webui-code"" data-language=""python"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.VisualBasic, @"<pre class=""wx-webui-code"" data-language=""visualbasic"" data-base64=""true""></pre>")]
        [InlineData(TypeLanguage.Xml, @"<pre class=""wx-webui-code"" data-language=""xml"" data-base64=""true""></pre>")]

        public void Language(TypeLanguage language, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CrerateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlCode()
            {
                Language = language
            };

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
