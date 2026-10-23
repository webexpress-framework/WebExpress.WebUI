using System.Globalization;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the file list control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFileList
    {
        /// <summary>
        /// Tests the id property of the file list control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-file-list""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-file-list""></div>")]
        [InlineData("03C6031F-04A9-451F-B817-EBD6D32F8B0C", @"<div id=""03C6031F-04A9-451F-B817-EBD6D32F8B0C"" class=""wx-webui-file-list""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the name property of the file list item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-file-list""><div class=""wx-webui-file""></div></div>")]
        [InlineData("name", @"<div class=""wx-webui-file-list""><div class=""wx-webui-file"">name</div></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-file-list""><div class=""wx-webui-file"">WebExpress.WebUI</div></div>")]
        public void Name(string name, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList()
                .Add(new ControlFileListItem()
                {
                    Name = _ => name,
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that both texts of the file list item control resolve against the culture the
        /// page is requested in. The mock server is configured en while the mock request asks
        /// for German, so a text resolved against the server default answers in the wrong
        /// language while its neighbours on the same page stay German.
        /// </summary>
        [Fact]
        public void NameAndDescriptionFollowTheRequestCulture()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock(CultureInfo.GetCultureInfo("de"));
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList()
                .Add(new ControlFileListItem()
                {
                    Name = _ => "webexpress.webui:form.submit.label",
                    Description = _ => "webexpress.webui:form.cancel.label"
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders
            (
                @"<div class=""wx-webui-file-list""><div class=""wx-webui-file"" data-description=""Abbrechen"">Speichern</div></div>",
                html
            );
        }

        /// <summary>
        /// Tests the icon property of the file list item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-file-list""><div class=""wx-webui-file""></div></div>")]
        [InlineData(typeof(IconHome), @"<div class=""wx-webui-file-list""><div class=""wx-webui-file"" data-file-icon=""wx-icon-light wx-icon-light-home""></div></div>")]
        public void Icon(Type icon, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList()
                .Add(new ControlFileListItem()
                {
                    Icon = _ => icon is not null
                        ? Activator.CreateInstance(icon) as IIcon
                        : null
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the size property of the file list item control.
        /// </summary>
        [Theory]
        [InlineData(-1, @"<div class=""wx-webui-file-list""><div class=""wx-webui-file""></div></div>")]
        [InlineData(22321, @"<div class=""wx-webui-file-list""><div class=""wx-webui-file"" data-file-size=""21.8 kB""></div></div>")]
        public void Size(long size, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList()
                .Add(new ControlFileListItem()
                {
                    Size = _ => size,
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the description property of the file list item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-file-list""><div class=""wx-webui-file""></div></div>")]
        [InlineData("description", @"<div class=""wx-webui-file-list""><div class=""wx-webui-file"" data-description=""description""></div></div>")]
        [InlineData("webexpress.webui:plugin.name", @"<div class=""wx-webui-file-list""><div class=""wx-webui-file"" data-description=""WebExpress.WebUI""></div></div>")]
        public void Description(string description, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList()
                .Add(new ControlFileListItem()
                {
                    Description = _ => description,
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
