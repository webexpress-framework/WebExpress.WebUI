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
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList(id)
            {
            };

            // test execution
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
        public void Name(string name, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList()
                .Add(new ControlFileListItem()
                {
                    Name = name,
                });

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the icon property of the file list item control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-file-list""><div class=""wx-webui-file""></div></div>")]
        [InlineData(typeof(IconHome), @"<div class=""wx-webui-file-list""><div class=""wx-webui-file"" data-file-icon=""fas fa-home""></div></div>")]
        public void Icon(Type icon, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList()
                .Add(new ControlFileListItem()
                {
                    Icon = icon is not null
                        ? Activator.CreateInstance(icon) as IIcon
                        : null
                });

            // test execution
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
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList()
                .Add(new ControlFileListItem()
                {
                    Size = size,
                });

            // test execution
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
        public void Description(string description, string expected)
        {
            // preconditions
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFileList()
                .Add(new ControlFileListItem()
                {
                    Description = description,
                });

            // test execution
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
