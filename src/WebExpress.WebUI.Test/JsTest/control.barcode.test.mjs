/**
 * Headless contract and behavior tests for the BarcodeCtrl control
 * (wx-webui-barcode). The shared contract (controls.contract.mjs) covers
 * registration and the construct / teardown lifecycle.
 *
 * The encoders carry the risk here: a barcode that renders but does not scan
 * looks perfectly fine on screen, and there is no reference implementation to
 * compare against in this repository. The tests below therefore verify the
 * encoders mathematically and structurally rather than against recorded output:
 *
 *  - the Reed-Solomon remainder is checked by its syndromes, which are zero for
 *    every valid codeword polynomial and non-zero for a corrupted one.
 *  - the block table is checked against the module geometry: the codewords a
 *    version holds are derived from the symbol itself, independently of the
 *    table that has to add up to the same number.
 *  - the format and version information are checked by their BCH remainders and
 *    against the one constant the standard fixes.
 *  - the encoded payload is checked by decoding it again, through the same
 *    interleaving the encoder applied.
 *  - the linear symbologies are checked against published check digits and
 *    against their fixed structure.
 */
import { test } from "node:test";
import assert from "node:assert";
import { loadWebUi } from "./harness.mjs";
import { contract } from "./controls.contract.mjs";

const LEVELS = ["L", "M", "Q", "H"];

contract({
    file: "webexpress.webui.barcode.js",
    selector: "wx-webui-barcode",
    ctrl: "BarcodeCtrl"
});

/**
 * Loads a runtime with the barcode sources.
 * @returns {object} The loaded runtime.
 */
function loadRuntime() {
    return loadWebUi({ browser: true, extraFiles: ["webexpress.webui.barcode.js"] });
}

/**
 * Builds a barcode host element and its controller.
 * @param {object} rt - The loaded runtime.
 * @param {object} options - The data attributes to set.
 * @returns {object} The element and its controller.
 */
function makeBarcode(rt, options = {}) {
    const element = rt.createElement("div");
    element.classList.add("wx-webui-barcode");
    Object.entries(options).forEach(([name, value]) => element.setAttribute(name, String(value)));
    rt.document.body.appendChild(element);

    return { element, ctrl: new rt.wx.BarcodeCtrl(element) };
}

// --------------------------------------------------------------- reed-solomon

test("the reed-solomon remainder makes every block a valid codeword polynomial", () => {
    const { wx } = loadRuntime();
    const rs = wx.BarcodeReedSolomon;

    // a codeword polynomial is valid exactly when it is divisible by the
    // generator, which shows as a zero syndrome at every root of the generator
    const data = [0x40, 0xd2, 0x75, 0x47, 0x76, 0x17, 0x32, 0x06, 0x27, 0x26, 0x96, 0xc6, 0xc6, 0x96, 0x70, 0xec];
    const degree = 10;
    const codeword = data.concat(rs.remainder(data, degree));

    for (let root = 0; root < degree; root++) {
        let syndrome = 0;
        for (const value of codeword) {
            syndrome = rs.multiply(syndrome, rs._exp[root]) ^ value;
        }
        assert.equal(syndrome, 0, `syndrome ${root} of the intact codeword is zero`);
    }

    // and the same check has to fail once a codeword is damaged, otherwise it
    // would pass for any implementation at all
    codeword[3] ^= 0x5a;
    let syndrome = 0;
    for (const value of codeword) {
        syndrome = rs.multiply(syndrome, rs._exp[1]) ^ value;
    }
    assert.notEqual(syndrome, 0, "a corrupted codeword is detected");
});

test("the field arithmetic is a proper GF(256)", () => {
    const { wx } = loadRuntime();
    const rs = wx.BarcodeReedSolomon;

    assert.equal(rs.multiply(0, 123), 0, "zero absorbs");
    assert.equal(rs.multiply(1, 123), 123, "one is neutral");
    assert.equal(rs.multiply(123, 1), 123, "and is neutral on either side");

    // every non-zero element has an inverse, which is what makes the field a field
    for (let value = 1; value < 256; value++) {
        let inverse = 0;
        for (let candidate = 1; candidate < 256; candidate++) {
            if (rs.multiply(value, candidate) === 1) {
                inverse = candidate;
                break;
            }
        }
        assert.notEqual(inverse, 0, `${value} has a multiplicative inverse`);
    }
});

// -------------------------------------------------------------------- qr code

test("the block table matches the module geometry for every supported version", () => {
    const { wx } = loadRuntime();
    const qr = wx.BarcodeQR;

    for (let version = 1; version <= 10; version++) {
        // derived from the symbol: the modules left over once every function
        // pattern is placed, in bytes
        const geometric = qr.totalCodewords(version);

        for (const level of LEVELS) {
            const [ecPerBlock, group1Blocks, group1Size, group2Blocks, group2Size] = qr.BLOCKS[version][level];
            const fromTable = group1Blocks * group1Size
                + group2Blocks * group2Size
                + (group1Blocks + group2Blocks) * ecPerBlock;

            assert.equal(
                fromTable,
                geometric,
                `version ${version} level ${level}: the table adds up to ${fromTable} codewords, the symbol holds ${geometric}`
            );

            if (group2Blocks > 0) {
                assert.equal(group2Size, group1Size + 1, `version ${version} level ${level}: the second group holds one codeword more`);
            }
        }
    }
});

test("a higher error correction level never leaves more room for data", () => {
    const { wx } = loadRuntime();
    const qr = wx.BarcodeQR;

    for (let version = 1; version <= 10; version++) {
        let previous = Infinity;
        for (const level of LEVELS) {
            const capacity = qr.dataCodewords(version, level);
            assert.ok(capacity < previous, `version ${version}: level ${level} holds less data than the level before`);
            previous = capacity;
        }
    }
});

test("the format information carries its level and mask and is a valid BCH word", () => {
    const { wx } = loadRuntime();
    const qr = wx.BarcodeQR;

    // the one constant the standard fixes: level M with mask 0 is the mask
    // pattern itself, because its BCH remainder is zero
    assert.equal(qr.formatBits("M", 0), 0b101010000010010, "level M, mask 0 matches the published value");

    for (const level of LEVELS) {
        for (let mask = 0; mask < 8; mask++) {
            const bits = qr.formatBits(level, mask);

            assert.ok(bits >= 0 && bits < (1 << 15), `${level}/${mask} is 15 bits wide`);

            // unmask, then divide by the generator: a valid word leaves nothing
            let remainder = bits ^ 0x5412;
            const encoded = remainder;
            for (let i = 14; i >= 10; i--) {
                if ((remainder >> i) & 1) {
                    remainder ^= 0x537 << (i - 10);
                }
            }
            assert.equal(remainder, 0, `${level}/${mask} is divisible by the format generator`);
            assert.equal(encoded >> 10, (qr.EC_LEVELS[level] << 3) | mask, `${level}/${mask} reads back its own level and mask`);
        }
    }
});

test("the version information is a valid BCH word carrying its version", () => {
    const { wx } = loadRuntime();
    const qr = wx.BarcodeQR;

    for (let version = 7; version <= 10; version++) {
        const bits = qr.versionBits(version);

        assert.equal(bits >> 12, version, `version ${version} reads back`);

        let remainder = bits;
        for (let i = 17; i >= 12; i--) {
            if ((remainder >> i) & 1) {
                remainder ^= 0x1f25 << (i - 12);
            }
        }
        assert.equal(remainder, 0, `version ${version} is divisible by the version generator`);
    }
});

test("the matrix carries the function patterns the standard prescribes", () => {
    const { wx } = loadRuntime();
    const encoded = wx.BarcodeQR.encode("WebExpress", "M");

    assert.ok(encoded, "the value encodes");
    assert.equal(encoded.size, encoded.version * 4 + 17, "the symbol has the size of its version");

    const at = (row, column) => encoded.modules[row][column];
    const size = encoded.size;

    // the three finder patterns, each a dark ring around a dark core
    for (const [row, column] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
        for (let i = 0; i < 7; i++) {
            assert.equal(at(row, column + i), true, "the finder has a solid top edge");
            assert.equal(at(row + 6, column + i), true, "and a solid bottom edge");
        }
        assert.equal(at(row + 1, column + 1), false, "the ring around the core is light");
        assert.equal(at(row + 3, column + 3), true, "the core is dark");
    }

    // the timing patterns alternate between the finders
    for (let i = 8; i < size - 8; i++) {
        assert.equal(at(6, i), i % 2 === 0, "the horizontal timing pattern alternates");
        assert.equal(at(i, 6), i % 2 === 0, "the vertical timing pattern alternates");
    }

    assert.equal(at(size - 8, 8), true, "the module that is always dark is dark");
});

test("the encoded payload decodes back to the value", () => {
    const { wx } = loadRuntime();
    const qr = wx.BarcodeQR;

    for (const value of ["1", "WebExpress", "https://webexpress-framework.github.io/", "Grüße aus Mêlée Island"]) {
        for (const level of LEVELS) {
            const bytes = qr._toUtf8(value);
            const version = qr._pickVersion(bytes.length, level);
            assert.ok(version, `${value} fits at level ${level}`);

            const interleaved = qr._buildCodewords(bytes, version, level);
            const [ecPerBlock, group1Blocks, group1Size, group2Blocks, group2Size] = qr.BLOCKS[version][level];

            // undo the interleaving the encoder applied
            const sizes = [];
            for (let i = 0; i < group1Blocks; i++) { sizes.push(group1Size); }
            for (let i = 0; i < group2Blocks; i++) { sizes.push(group2Size); }

            const blocks = sizes.map(() => []);
            let index = 0;
            for (let i = 0; i < Math.max(group1Size, group2Size); i++) {
                for (let block = 0; block < sizes.length; block++) {
                    if (i < sizes[block]) {
                        blocks[block].push(interleaved[index++]);
                    }
                }
            }

            const data = blocks.flat();
            const bits = data.map((codeword) => codeword.toString(2).padStart(8, "0")).join("");

            assert.equal(parseInt(bits.slice(0, 4), 2), 4, "the mode is byte mode");
            const countBits = version < 10 ? 8 : 16;
            const count = parseInt(bits.slice(4, 4 + countBits), 2);
            assert.equal(count, bytes.length, "the character count matches the payload");

            const payload = [];
            for (let i = 0; i < count; i++) {
                payload.push(parseInt(bits.slice(4 + countBits + i * 8, 12 + countBits + i * 8), 2));
            }
            assert.deepEqual(payload, bytes, `${value} at level ${level} round-trips`);

            // the error correction codewords follow the data, one set per block
            assert.equal(interleaved.length, data.length + sizes.length * ecPerBlock, "every block contributed its remainder");
        }
    }
});

test("a value that exceeds the supported versions is refused rather than truncated", () => {
    const { wx } = loadRuntime();

    assert.equal(wx.BarcodeQR.encode("x".repeat(5000), "H"), null, "an oversized value does not encode");
    assert.equal(wx.BarcodeQR.encode("", "M"), null, "an empty value does not encode");
});

// ------------------------------------------------------------------- linear

test("EAN-13 computes and verifies the published check digit", () => {
    const { wx } = loadRuntime();
    const linear = wx.BarcodeLinear;

    // the check digit of 400638133393 is 1
    assert.equal(linear.encode("400638133393", "ean13").text, "4006381333931", "the missing check digit is computed");
    assert.equal(linear.encode("4006381333931", "ean13").text, "4006381333931", "a correct check digit is accepted");
    assert.equal(linear.encode("4006381333932", "ean13"), null, "a wrong check digit is refused");
    assert.equal(linear.encode("40063813339A", "ean13"), null, "a non-digit is refused");

    // structure: quiet guards, two halves of six digits, the centre guard
    const encoded = linear.encode("4006381333931", "ean13");
    assert.equal(encoded.modules.length, 95, "the symbol is 95 modules wide");
    assert.equal(encoded.modules.slice(0, 3), "101", "it opens with the guard");
    assert.equal(encoded.modules.slice(45, 50), "01010", "the centre guard splits the halves");
    assert.equal(encoded.modules.slice(-3), "101", "and it closes with the guard");
});

test("EAN-8 computes and verifies the published check digit", () => {
    const { wx } = loadRuntime();
    const linear = wx.BarcodeLinear;

    // the check digit of 9638507 is 4
    assert.equal(linear.encode("9638507", "ean8").text, "96385074", "the missing check digit is computed");
    assert.equal(linear.encode("96385074", "ean8").text, "96385074", "a correct check digit is accepted");
    assert.equal(linear.encode("96385075", "ean8"), null, "a wrong check digit is refused");

    assert.equal(linear.encode("96385074", "ean8").modules.length, 67, "the symbol is 67 modules wide");
});

test("Code 128 frames the value and closes with the stop pattern", () => {
    const { wx } = loadRuntime();
    const encoded = wx.BarcodeLinear.encode("WX-2026", "code128");

    assert.ok(encoded, "the value encodes");
    assert.equal(encoded.text, "WX-2026", "the human readable text is the value");
    assert.equal(encoded.modules.slice(-13), "1100011101011", "it closes with the stop pattern");

    // start + data + checksum, eleven modules each, plus the stop pattern
    assert.equal((encoded.modules.length - 13) % 11, 0, "every symbol is eleven modules wide");
    assert.equal(encoded.modules[0], "1", "a symbol starts with a bar");

    assert.equal(wx.BarcodeLinear.encode("", "code128"), null, "an empty value does not encode");
    assert.equal(wx.BarcodeLinear.encode("Grüße", "code128"), null, "a value outside the code set does not encode");
});

test("Code 128 switches to the numeric code set for long digit runs", () => {
    const { wx } = loadRuntime();
    const linear = wx.BarcodeLinear;

    // twelve digits pack into six symbols in set C, against twelve in set B
    const packed = linear.encode("123456789012", "code128");
    const symbols = (packed.modules.length - 13) / 11;

    assert.equal(symbols, 8, "start, six pairs and the checksum");
});

test("Code 39 delimits the value and rejects what it cannot express", () => {
    const { wx } = loadRuntime();
    const linear = wx.BarcodeLinear;

    const encoded = linear.encode("WX-2026", "code39");
    assert.ok(encoded, "the value encodes");
    assert.equal(encoded.text, "WX-2026", "the human readable text is the value");

    // nine characters (the value framed by the delimiter), twelve modules each,
    // joined by the narrow gap between characters
    assert.equal(encoded.modules.length, 9 * 12 + 8, "the symbol has the width its characters add up to");

    assert.equal(linear.encode("lower", "code39").text, "LOWER", "lower case is folded, since the alphabet is upper case");
    assert.equal(linear.encode("no,commas", "code39"), null, "a character outside the alphabet is refused");
});

// --------------------------------------------------------------- the control

test("the control draws a linear symbology as bars", () => {
    const rt = loadRuntime();
    const barcode = makeBarcode(rt, { "data-value": "WX-2026", "data-type": "code128" });

    const svg = barcode.element.querySelector(".wx-barcode-graphic");
    assert.ok(svg, "a graphic is drawn");
    assert.ok(barcode.element.querySelectorAll("rect").length > 0, "the bars are rectangles");
    assert.match(barcode.element.getAttribute("aria-label") || "", /WX-2026/, "the value is announced");
});

test("the control draws a QR code as a matrix", () => {
    const rt = loadRuntime();
    const barcode = makeBarcode(rt, { "data-value": "https://webexpress-framework.github.io/", "data-type": "qr" });

    assert.ok(barcode.element.querySelector(".wx-barcode-graphic"), "a graphic is drawn");
    assert.ok(barcode.element.querySelectorAll("rect").length > 0, "the modules are rectangles");
    assert.equal(barcode.element.classList.contains("wx-barcode-invalid"), false, "the value encodes");
});

test("the control reports a value it cannot encode instead of drawing a broken symbol", () => {
    const rt = loadRuntime();

    const events = [];
    const barcode = makeBarcode(rt, { "data-value": "12345", "data-type": "ean13" });
    barcode.element.addEventListener(rt.wx.Event.DATA_ERROR_EVENT, (e) => events.push(e.detail));

    // five digits are neither a full EAN-13 nor one short of it
    barcode.ctrl.render();

    assert.equal(barcode.element.classList.contains("wx-barcode-invalid"), true, "the failure is marked");
    assert.equal(barcode.element.querySelector(".wx-barcode-graphic"), null, "and nothing scannable is drawn");
    assert.equal(events.length, 1, "the failure is announced");
});

test("a palette color and a custom color both reach the symbol", () => {
    const rt = loadRuntime();

    // the modules take their color from the host through currentColor, so both
    // forms only have to reach the host element
    const palette = makeBarcode(rt, { "data-value": "WX-1", "data-color-css": "text-primary", "data-bgcolor-css": "bg-light" });
    assert.equal(palette.element.classList.contains("text-primary"), true, "the palette class colors the modules");
    assert.equal(palette.element.classList.contains("bg-light"), true, "and the quiet zone");

    const custom = makeBarcode(rt, { "data-value": "WX-1", "data-color-style": "color:#123456;", "data-bgcolor-style": "background-color:gold;" });
    assert.match(custom.element.style.cssText || "", /#123456/, "a custom color reaches the modules");
    assert.match(custom.element.style.cssText || "", /gold/, "and the quiet zone");
});

test("the colors can be set at runtime", () => {
    const rt = loadRuntime();
    const barcode = makeBarcode(rt, { "data-value": "WX-1" });

    barcode.ctrl.color = "#0d6efd";
    barcode.ctrl.backgroundColor = "#fff8e1";

    assert.equal(barcode.ctrl.color, "#0d6efd", "the color reads back");
    assert.equal(barcode.ctrl.backgroundColor, "#fff8e1", "and so does the ground");
    assert.match(barcode.element.style.cssText || "", /#0d6efd/);
    assert.ok(barcode.element.querySelector(".wx-barcode-graphic"), "the symbol survives the recoloring");

    barcode.ctrl.color = null;
    assert.equal(barcode.ctrl.color, null, "and can be handed back to the default");
});

test("a value that cannot be encoded drops the colors it was given", () => {
    const rt = loadRuntime();

    // the colors were chosen for a symbol; a light one would leave the error
    // message unreadable on the light ground
    const barcode = makeBarcode(rt, {
        "data-type": "ean13",
        "data-value": "12345",
        "data-color-css": "text-white",
        "data-color-style": "color:#ffffff;"
    });

    assert.equal(barcode.element.classList.contains("wx-barcode-invalid"), true, "the failure is marked");
    assert.equal(barcode.element.classList.contains("text-white"), false, "the palette class is withdrawn");
    assert.doesNotMatch(barcode.element.style.cssText || "", /#ffffff/, "and so is the custom color");

    // and they come back with a value that does encode
    barcode.ctrl.value = "4006381333931";

    assert.equal(barcode.element.classList.contains("wx-barcode-invalid"), false);
    assert.equal(barcode.element.classList.contains("text-white"), true, "the palette class is restored");
    assert.match(barcode.element.style.cssText || "", /#ffffff/, "and so is the custom color");
});

test("setting the value redraws and announces the change", () => {
    const rt = loadRuntime();
    const barcode = makeBarcode(rt, { "data-value": "first", "data-type": "code128" });

    const events = [];
    barcode.element.addEventListener(rt.wx.Event.CHANGE_VALUE_EVENT, (e) => events.push(e.detail));

    barcode.ctrl.value = "second";

    assert.equal(barcode.ctrl.value, "second");
    assert.equal(events.length, 1, "the change is announced");
    assert.ok(barcode.element.querySelector(".wx-barcode-graphic"), "the symbol is redrawn");

    barcode.ctrl.value = "second";
    assert.equal(events.length, 1, "setting the same value again changes nothing");
});
