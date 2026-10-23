using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the form barcode control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlFormItemInputBarcode
    {
        /// <summary>
        /// Tests the id property of the form barcode control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-input-barcode""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-input-barcode"" name=""id""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputBarcode(id);

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the auto id property of the form barcode control.
        /// </summary>
        [Fact]
        public void AutoId()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputBarcode();

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div id=""*"" class=""wx-webui-input-barcode"" name=""*""></div>", html);
        }

        /// <summary>
        /// Tests the type property of the form barcode control.
        /// </summary>
        [Theory]
        [InlineData(TypeBarcode.Default, @"<div id=""id"" class=""wx-webui-input-barcode"" name=""id""></div>")]
        [InlineData(TypeBarcode.Code39, @"<div * data-type=""code39""></div>")]
        [InlineData(TypeBarcode.Ean13, @"<div * data-type=""ean13""></div>")]
        [InlineData(TypeBarcode.QR, @"<div * data-type=""qr""></div>")]
        public void Type(TypeBarcode type, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputBarcode("id")
            {
                Type = _ => type
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the error correction level reaches the client for a QR code.
        /// </summary>
        [Fact]
        public void ErrorCorrection()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputBarcode("id")
            {
                Type = _ => TypeBarcode.QR,
                ErrorCorrection = _ => TypeErrorCorrectionBarcode.High
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div * data-type=""qr"" data-level=""H""></div>", html);
        }

        /// <summary>
        /// Tests that the initial value reaches the client. An unset form value
        /// arrives as an empty string rather than as null, which a plain null
        /// check would mistake for a value and swallow the initial one.
        /// </summary>
        [Fact]
        public void Value()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputBarcode("id")
            {
                Type = _ => TypeBarcode.Ean13,
                Value = _ => "4006381333931"
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div * data-value=""4006381333931"" data-type=""ean13""></div>", html);
        }

        /// <summary>
        /// Tests the placeholder property of the form barcode control.
        /// </summary>
        [Fact]
        public void Placeholder()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputBarcode("id")
            {
                Placeholder = _ => "Article number"
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div * data-placeholder=""Article number""></div>", html);
        }

        /// <summary>
        /// Tests the disabled property of the form barcode control.
        /// </summary>
        [Fact]
        public void Disabled()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var form = new ControlForm();
            var context = new RenderControlFormContext(UnitTestControlFixture.CreateRenderContextMock(), form);
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlFormItemInputBarcode("id")
            {
                Disabled = _ => true
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(@"<div id=""id"" class=""wx-webui-input-barcode disabled"" name=""id""></div>", html);
        }
    }
}
