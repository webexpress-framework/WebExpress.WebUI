using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the barcode control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlBarcode
    {
        /// <summary>
        /// Tests the id property of the barcode control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-barcode""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-barcode""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBarcode(id);

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the value property of the barcode control.
        /// </summary>
        [Fact]
        public void Value()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBarcode()
            {
                Value = _ => "WX-2026"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-barcode"" data-value=""WX-2026""></div>", html);
        }

        /// <summary>
        /// Tests the type property of the barcode control. The default symbology is
        /// implied, so only a deviation from it is emitted.
        /// </summary>
        [Theory]
        [InlineData(TypeBarcode.Default, @"<div class=""wx-webui-barcode"" data-value=""1""></div>")]
        [InlineData(TypeBarcode.Code128, @"<div * data-type=""code128""></div>")]
        [InlineData(TypeBarcode.Code39, @"<div * data-type=""code39""></div>")]
        [InlineData(TypeBarcode.Ean13, @"<div * data-type=""ean13""></div>")]
        [InlineData(TypeBarcode.Ean8, @"<div * data-type=""ean8""></div>")]
        [InlineData(TypeBarcode.QR, @"<div * data-type=""qr""></div>")]
        public void Type(TypeBarcode type, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBarcode()
            {
                Value = _ => "1",
                Type = _ => type
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the error correction level is emitted for a QR code only,
        /// because it means nothing to the linear symbologies.
        /// </summary>
        [Theory]
        [InlineData(TypeBarcode.QR, TypeErrorCorrectionBarcode.Low, @"<div * data-type=""qr"" data-level=""L""></div>")]
        [InlineData(TypeBarcode.QR, TypeErrorCorrectionBarcode.Quartile, @"<div * data-level=""Q""></div>")]
        [InlineData(TypeBarcode.QR, TypeErrorCorrectionBarcode.High, @"<div * data-level=""H""></div>")]
        [InlineData(TypeBarcode.QR, TypeErrorCorrectionBarcode.Default, @"<div class=""wx-webui-barcode"" data-value=""1"" data-type=""qr""></div>")]
        [InlineData(TypeBarcode.Code128, TypeErrorCorrectionBarcode.High, @"<div class=""wx-webui-barcode"" data-value=""1"" data-type=""code128""></div>")]
        public void ErrorCorrection(TypeBarcode type, TypeErrorCorrectionBarcode level, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBarcode()
            {
                Value = _ => "1",
                Type = _ => type,
                ErrorCorrection = _ => level
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the geometry properties of the barcode control.
        /// </summary>
        [Fact]
        public void Geometry()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBarcode()
            {
                Value = _ => "1",
                BarHeight = _ => 80,
                ModuleWidth = _ => 3,
                ShowText = _ => false
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"<div class=""wx-webui-barcode"" data-value=""1"" data-height=""80"" data-module=""3"" data-text=""false""></div>",
                html
            );
        }

        /// <summary>
        /// Tests that the geometry defaults are left to the client instead of being
        /// written out as the values that would have been chosen anyway.
        /// </summary>
        [Fact]
        public void GeometryDefaults()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBarcode()
            {
                Value = _ => "1"
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(@"<div class=""wx-webui-barcode"" data-value=""1""></div>", html);
        }

        /// <summary>
        /// Tests the palette colors of the barcode control, which travel as the
        /// class the client applies to the symbol.
        /// </summary>
        [Fact]
        public void PaletteColor()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBarcode()
            {
                Value = _ => "1",
                Color = _ => new PropertyColorText(TypeColorText.Primary),
                BackgroundColor = _ => new PropertyColorBackground(TypeColorBackground.Light)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"<div class=""wx-webui-barcode"" data-value=""1"" data-color-css=""text-primary"" data-bgcolor-css=""bg-light""></div>",
                html
            );
        }

        /// <summary>
        /// Tests the custom colors of the barcode control, which travel as the
        /// style the client applies to the symbol.
        /// </summary>
        [Fact]
        public void CustomColor()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBarcode()
            {
                Value = _ => "1",
                Color = _ => new PropertyColorText("#0d6efd"),
                BackgroundColor = _ => new PropertyColorBackground("#fff8e1")
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"<div * data-color-style=""color:#0d6efd;"" data-bgcolor-style=""background:#fff8e1;""></div>",
                html
            );
        }

        /// <summary>
        /// Tests that the background color is handed to the client instead of
        /// being folded into the classes of the host, where it would paint the
        /// element around the symbol rather than the quiet zone of the symbol.
        /// </summary>
        [Fact]
        public void BackgroundColorIsNotAHostClass()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlBarcode()
            {
                Value = _ => "1",
                BackgroundColor = _ => new PropertyColorBackground(TypeColorBackground.Dark)
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders
            (
                @"<div class=""wx-webui-barcode"" data-value=""1"" data-bgcolor-css=""bg-dark""></div>",
                html
            );
        }

        /// <summary>
        /// Tests the table template of the barcode control, which is what makes a
        /// cell editable in place.
        /// </summary>
        [Theory]
        [InlineData(false, @"<template data-type=""barcode"" data-barcode-type=""qr""></template>")]
        [InlineData(true, @"<template data-type=""barcode"" data-barcode-type=""qr"" data-editable=""true""></template>")]
        public void TableTemplate(bool editable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateBarcode()
            {
                Type = _ => TypeBarcode.QR,
                Editable = _ => editable
            };

            // act
            var html = control.Render(context, visualTree);

            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the symbology of the table template does not collide with the
        /// attribute that selects the renderer.
        /// </summary>
        [Fact]
        public void TableTemplateRendererName()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlTableTemplateBarcode();

            // act
            var html = control.Render(context, visualTree);

            // data-type names the renderer; the symbology travels separately
            AssertExtensions.EqualWithPlaceholders(@"<template data-type=""barcode""></template>", html);
        }
    }
}
