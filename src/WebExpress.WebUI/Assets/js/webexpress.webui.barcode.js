/**
 * Barcode control: encodes a value as a scannable graphic, either as a linear
 * symbology (Code 128, Code 39, EAN-13, EAN-8) or as a two-dimensional QR code.
 *
 * The encoders are part of the control rather than a dependency, because a
 * barcode has to be drawn offline and inside a strict content policy: no CDN,
 * no external image service. Everything is rendered as inline SVG, which stays
 * crisp at any size and prints without artefacts.
 *
 * The two families share nothing but the host: a linear symbology turns the
 * value into a run of bar widths, a QR code into a matrix of modules. The
 * renderers are therefore separate, and the control only picks between them.
 *
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 * - webexpress.webui.Event.DATA_ERROR_EVENT
 */

/**
 * Linear (one-dimensional) symbologies. Each encoder turns a value into a
 * string of "1" and "0" characters, one per module, which the renderer draws as
 * bars and gaps of equal module width.
 */
webexpress.webui.BarcodeLinear = new class {

    // Code 128 code point patterns, index 0..106. Every pattern is six runs of
    // bars and spaces, 11 modules wide; the stop pattern is 13.
    CODE128_PATTERNS = [
        "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
        "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
        "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
        "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
        "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
        "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
        "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
        "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
        "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
        "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
        "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
        "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
        "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
        "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
        "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
        "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
        "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
        "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
        "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
        "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
        "10111101110", "11101011110", "11110101110", "11110100110", "11110010110",
        "11011011010", "11011010110", "11010110110", "11000100110", "11110101100"
    ];

    // Code 39: 43 characters plus the "*" delimiter, each nine elements wide
    // (five bars, four spaces) of which exactly three are wide.
    CODE39_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*";
    CODE39_PATTERNS = [
        "101001101101", "110100101011", "101100101011", "110110010101", "101001101011",
        "110100110101", "101100110101", "101001011011", "110100101101", "101100101101",
        "110101001011", "101101001011", "110110100101", "101011001011", "110101100101",
        "101101100101", "101010011011", "110101001101", "101101001101", "101011001101",
        "110101010011", "101101010011", "110110101001", "101011010011", "110101101001",
        "101101101001", "101010110011", "110101011001", "101101011001", "101011011001",
        "110010101011", "100110101011", "110011010101", "100101101011", "110010110101",
        "100110110101", "100101011011", "110010101101", "100110101101", "100100100101",
        "100100101001", "100101001001", "101001001001", "100101101101"
    ];

    // EAN digit patterns, seven modules each, per encoding set.
    EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
    EAN_G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
    EAN_R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];

    // which of the first six EAN-13 digits use the G set, selected by the
    // leading digit that is itself not encoded as bars
    EAN13_PARITY = [
        "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
        "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"
    ];

    /**
     * Encodes a value in the given symbology.
     * @param {string} value - The value to encode.
     * @param {string} type - "code128", "code39", "ean13" or "ean8".
     * @returns {object} { modules: string, text: string } - the module string
     *     and the human readable text, or null when the value cannot be encoded.
     */
    encode(value, type) {
        switch (type) {
            case "code39": return this._code39(value);
            case "ean13": return this._ean(value, 13);
            case "ean8": return this._ean(value, 8);
            default: return this._code128(value);
        }
    }

    /**
     * Encodes in Code 128, switching between code set B (printable ascii) and C
     * (pairs of digits). Runs of digits are worth the switch from four digits
     * on, because set C packs two digits into one symbol.
     * @param {string} value - The value to encode.
     * @returns {object} The encoded result, or null.
     */
    _code128(value) {
        const text = String(value ?? "");
        if (text.length === 0 || /[^\x20-\x7e]/.test(text)) {
            return null;
        }

        const patterns = this.CODE128_PATTERNS;
        const codes = [];
        let index = 0;
        let setC = this._digitRun(text, 0) >= 4;

        codes.push(setC ? 105 : 104);

        while (index < text.length) {
            if (setC) {
                if (this._digitRun(text, index) >= 2) {
                    codes.push(parseInt(text.substr(index, 2), 10));
                    index += 2;
                    continue;
                }
                codes.push(100);
                setC = false;
                continue;
            }

            if (this._digitRun(text, index) >= 4) {
                codes.push(99);
                setC = true;
                continue;
            }

            codes.push(text.charCodeAt(index) - 32);
            index++;
        }

        // the check symbol weights every code point by its position, the start
        // symbol counting once
        let checksum = codes[0];
        for (let i = 1; i < codes.length; i++) {
            checksum += codes[i] * i;
        }
        codes.push(checksum % 103);

        const modules = codes.map((code) => patterns[code]).join("") + "1100011101011";

        return { modules: modules, text: text };
    }

    /**
     * Returns how many digits follow at the given position, capped at four
     * because that is where the decision to switch code sets is already made.
     * @param {string} text - The value.
     * @param {number} index - The position to look at.
     * @returns {number} The digit run length.
     */
    _digitRun(text, index) {
        let run = 0;
        while (run < 4 && index + run < text.length && text[index + run] >= "0" && text[index + run] <= "9") {
            run++;
        }
        return run;
    }

    /**
     * Encodes in Code 39. The value is framed by the "*" delimiter, which is
     * part of the symbology rather than of the data.
     * @param {string} value - The value to encode.
     * @returns {object} The encoded result, or null.
     */
    _code39(value) {
        const text = String(value ?? "").toUpperCase();
        const alphabet = this.CODE39_ALPHABET;
        const patterns = this.CODE39_PATTERNS;

        if (text.length === 0) {
            return null;
        }

        const parts = [];
        for (const character of "*" + text + "*") {
            const position = alphabet.indexOf(character);
            if (position < 0) {
                return null;
            }
            parts.push(patterns[position]);
        }

        // the elements of adjacent characters are separated by a narrow space
        return { modules: parts.join("0"), text: text };
    }

    /**
     * Encodes in EAN-13 or EAN-8. A missing check digit is computed, a supplied
     * one has to match, so a typo is reported instead of silently corrected.
     * @param {string} value - The digits to encode.
     * @param {number} length - 13 or 8, the full length including the check digit.
     * @returns {object} The encoded result, or null.
     */
    _ean(value, length) {
        let digits = String(value ?? "").replace(/\s+/g, "");
        if (!/^\d+$/.test(digits)) {
            return null;
        }

        if (digits.length === length - 1) {
            digits += String(this._eanCheckDigit(digits, length));
        } else if (digits.length !== length || this._eanCheckDigit(digits.slice(0, -1), length) !== Number(digits.slice(-1))) {
            return null;
        }

        const L = this.EAN_L;
        const G = this.EAN_G;
        const R = this.EAN_R;
        const parts = ["101"];

        if (length === 13) {
            const parity = this.EAN13_PARITY[Number(digits[0])];
            for (let i = 1; i <= 6; i++) {
                parts.push(parity[i - 1] === "L" ? L[Number(digits[i])] : G[Number(digits[i])]);
            }
            parts.push("01010");
            for (let i = 7; i <= 12; i++) {
                parts.push(R[Number(digits[i])]);
            }
        } else {
            for (let i = 0; i < 4; i++) {
                parts.push(L[Number(digits[i])]);
            }
            parts.push("01010");
            for (let i = 4; i < 8; i++) {
                parts.push(R[Number(digits[i])]);
            }
        }

        parts.push("101");

        return { modules: parts.join(""), text: digits };
    }

    /**
     * Computes the EAN check digit, where every second digit counts three times.
     * @param {string} digits - The digits without the check digit.
     * @param {number} length - 13 or 8.
     * @returns {number} The check digit.
     */
    _eanCheckDigit(digits, length) {
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            // in EAN-13 the weighting starts at 1 and in EAN-8 at 3
            const weight = ((i + (length === 13 ? 0 : 1)) % 2) === 0 ? 1 : 3;
            sum += Number(digits[i]) * weight;
        }
        return (10 - (sum % 10)) % 10;
    }
};

/**
 * QR code encoder, byte mode, versions 1 to 10 and all four error correction
 * levels - which spans a handful of digits up to roughly 270 bytes and covers
 * what a user interface encodes: identifiers, urls, contact data.
 *
 * The implementation follows ISO/IEC 18004: the value becomes a bit stream,
 * the stream is split into blocks, every block gets its Reed-Solomon remainder,
 * the blocks are interleaved, and the result is written into the matrix along
 * the standard zig-zag with the mask that scores best.
 */
webexpress.webui.BarcodeQR = new class {

    // the two bit indicator the format information carries per error correction
    // level. The order is neither alphabetical nor by strength - it is the one
    // the standard fixes, and level M is the all-zero indicator.
    EC_LEVELS = { L: 1, M: 0, Q: 3, H: 2 };

    // per version and level: [ec codewords per block, blocks in group 1,
    // data codewords per block in group 1, blocks in group 2, data codewords
    // per block in group 2]. The blocks of group 2 hold exactly one codeword
    // more than those of group 1.
    BLOCKS = {
        1: { L: [7, 1, 19, 0, 0], M: [10, 1, 16, 0, 0], Q: [13, 1, 13, 0, 0], H: [17, 1, 9, 0, 0] },
        2: { L: [10, 1, 34, 0, 0], M: [16, 1, 28, 0, 0], Q: [22, 1, 22, 0, 0], H: [28, 1, 16, 0, 0] },
        3: { L: [15, 1, 55, 0, 0], M: [26, 1, 44, 0, 0], Q: [18, 2, 17, 0, 0], H: [22, 2, 13, 0, 0] },
        4: { L: [20, 1, 80, 0, 0], M: [18, 2, 32, 0, 0], Q: [26, 2, 24, 0, 0], H: [16, 4, 9, 0, 0] },
        5: { L: [26, 1, 108, 0, 0], M: [24, 2, 43, 0, 0], Q: [18, 2, 15, 2, 16], H: [22, 2, 11, 2, 12] },
        6: { L: [18, 2, 68, 0, 0], M: [16, 4, 27, 0, 0], Q: [24, 4, 19, 0, 0], H: [28, 4, 15, 0, 0] },
        7: { L: [20, 2, 78, 0, 0], M: [18, 4, 31, 0, 0], Q: [18, 2, 14, 4, 15], H: [26, 4, 13, 1, 14] },
        8: { L: [24, 2, 97, 0, 0], M: [22, 2, 38, 2, 39], Q: [22, 4, 18, 2, 19], H: [26, 4, 14, 2, 15] },
        9: { L: [30, 2, 116, 0, 0], M: [22, 3, 36, 2, 37], Q: [20, 4, 16, 4, 17], H: [24, 4, 12, 4, 13] },
        10: { L: [18, 2, 68, 2, 69], M: [26, 4, 43, 1, 44], Q: [24, 6, 19, 2, 20], H: [28, 6, 15, 2, 16] }
    };

    // centres of the alignment patterns per version; the pattern is omitted
    // where it would collide with a finder pattern
    ALIGNMENT = {
        1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
        6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
    };

    /**
     * Encodes a value as a QR matrix.
     * @param {string} value - The value to encode.
     * @param {string} level - The error correction level, "L", "M", "Q" or "H".
     * @returns {object} { size: number, modules: boolean[][], version: number }
     *     or null when the value does not fit into the supported versions.
     */
    encode(value, level) {
        const ecLevel = this.EC_LEVELS[level] === undefined ? "M" : level;
        const data = this._toUtf8(String(value ?? ""));
        if (data.length === 0) {
            return null;
        }

        const version = this._pickVersion(data.length, ecLevel);
        if (version === null) {
            return null;
        }

        const codewords = this._buildCodewords(data, version, ecLevel);
        const matrix = this._buildMatrix(version);
        this._writeData(matrix, codewords);

        const mask = this._pickMask(matrix, version, ecLevel);
        this._applyMask(matrix, mask);
        this._writeFormat(matrix, ecLevel, mask);
        this._writeVersion(matrix, version);

        return {
            size: matrix.size,
            version: version,
            modules: matrix.modules.map((row) => row.map((cell) => cell === 1))
        };
    }

    /**
     * Returns the number of data codewords available for a version and level.
     * @param {number} version - The version.
     * @param {string} level - The error correction level.
     * @returns {number} The data codeword count.
     */
    dataCodewords(version, level) {
        const [, group1Blocks, group1Size, group2Blocks, group2Size] = this.BLOCKS[version][level];
        return group1Blocks * group1Size + group2Blocks * group2Size;
    }

    /**
     * Returns the total number of codewords a version holds, derived from the
     * geometry rather than from a table: the modules of the symbol minus the
     * function patterns, divided into bytes. This is what the block table has
     * to add up to, which makes the two independent of each other.
     * @param {number} version - The version.
     * @returns {number} The total codeword count.
     */
    totalCodewords(version) {
        const matrix = this._buildMatrix(version);
        let free = 0;
        for (let row = 0; row < matrix.size; row++) {
            for (let column = 0; column < matrix.size; column++) {
                if (!matrix.reserved[row][column]) {
                    free++;
                }
            }
        }
        return Math.floor(free / 8);
    }

    /**
     * Encodes a string as utf-8 bytes, which is the byte mode payload.
     * @param {string} value - The value.
     * @returns {number[]} The bytes.
     */
    _toUtf8(value) {
        const bytes = [];
        for (const character of value) {
            let code = character.codePointAt(0);
            if (code < 0x80) {
                bytes.push(code);
            } else if (code < 0x800) {
                bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
            } else if (code < 0x10000) {
                bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
            } else {
                bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
            }
        }
        return bytes;
    }

    /**
     * Picks the smallest version that holds the payload.
     * @param {number} byteCount - The payload size in bytes.
     * @param {string} level - The error correction level.
     * @returns {number|null} The version, or null when it does not fit.
     */
    _pickVersion(byteCount, level) {
        for (let version = 1; version <= 10; version++) {
            // mode indicator (4 bits) + character count (8 bits up to version 9,
            // 16 from version 10 on in byte mode) + the payload
            const headerBits = 4 + (version < 10 ? 8 : 16);
            if (headerBits + byteCount * 8 <= this.dataCodewords(version, level) * 8) {
                return version;
            }
        }
        return null;
    }

    /**
     * Builds the final codeword sequence: the encoded bit stream, split into
     * blocks, each with its Reed-Solomon remainder, interleaved.
     * @param {number[]} data - The payload bytes.
     * @param {number} version - The version.
     * @param {string} level - The error correction level.
     * @returns {number[]} The interleaved codewords.
     */
    _buildCodewords(data, version, level) {
        const [ecPerBlock, group1Blocks, group1Size, group2Blocks, group2Size] = this.BLOCKS[version][level];
        const capacity = this.dataCodewords(version, level);
        const bits = [];

        const push = (value, count) => {
            for (let i = count - 1; i >= 0; i--) {
                bits.push((value >> i) & 1);
            }
        };

        push(4, 4);                                   // byte mode
        push(data.length, version < 10 ? 8 : 16);     // character count
        data.forEach((byte) => push(byte, 8));

        // terminator, up to four bits, then pad to a whole codeword
        for (let i = 0; i < 4 && bits.length < capacity * 8; i++) {
            bits.push(0);
        }
        while (bits.length % 8 !== 0) {
            bits.push(0);
        }

        const codewords = [];
        for (let i = 0; i < bits.length; i += 8) {
            codewords.push(parseInt(bits.slice(i, i + 8).join(""), 2));
        }
        // the remaining capacity is filled with the two alternating pad bytes
        const pad = [0xec, 0x11];
        while (codewords.length < capacity) {
            codewords.push(pad[(codewords.length - bits.length / 8) % 2]);
        }

        // split into blocks and compute the remainder of each
        const blocks = [];
        const remainders = [];
        let offset = 0;
        for (let i = 0; i < group1Blocks + group2Blocks; i++) {
            const size = i < group1Blocks ? group1Size : group2Size;
            const block = codewords.slice(offset, offset + size);
            offset += size;
            blocks.push(block);
            remainders.push(webexpress.webui.BarcodeReedSolomon.remainder(block, ecPerBlock));
        }

        // interleave: the n-th codeword of every block, then the n-th remainder
        const result = [];
        const longest = Math.max(group1Size, group2Size);
        for (let i = 0; i < longest; i++) {
            for (const block of blocks) {
                if (i < block.length) {
                    result.push(block[i]);
                }
            }
        }
        for (let i = 0; i < ecPerBlock; i++) {
            for (const remainder of remainders) {
                result.push(remainder[i]);
            }
        }

        return result;
    }

    /**
     * Builds the matrix with all function patterns in place and every module
     * they occupy marked as reserved, so the data placement can skip them.
     * @param {number} version - The version.
     * @returns {object} { size, modules, reserved }.
     */
    _buildMatrix(version) {
        const size = version * 4 + 17;
        const modules = Array.from({ length: size }, () => new Array(size).fill(0));
        const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

        const set = (row, column, value) => {
            modules[row][column] = value;
            reserved[row][column] = true;
        };

        // the three finder patterns with their separators
        for (const [originRow, originColumn] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
            for (let row = -1; row <= 7; row++) {
                for (let column = -1; column <= 7; column++) {
                    const r = originRow + row;
                    const c = originColumn + column;
                    if (r < 0 || r >= size || c < 0 || c >= size) {
                        continue;
                    }
                    const ring = Math.max(Math.abs(row - 3), Math.abs(column - 3));
                    set(r, c, (row >= 0 && row <= 6 && column >= 0 && column <= 6 && ring !== 2) ? 1 : 0);
                }
            }
        }

        // the timing patterns joining them
        for (let i = 8; i < size - 8; i++) {
            const value = i % 2 === 0 ? 1 : 0;
            set(6, i, value);
            set(i, 6, value);
        }

        // the alignment patterns, except where a finder already sits
        const centres = this.ALIGNMENT[version];
        for (const centreRow of centres) {
            for (const centreColumn of centres) {
                const nearFinder = (centreRow <= 8 && centreColumn <= 8)
                    || (centreRow <= 8 && centreColumn >= size - 9)
                    || (centreRow >= size - 9 && centreColumn <= 8);
                if (nearFinder) {
                    continue;
                }
                for (let row = -2; row <= 2; row++) {
                    for (let column = -2; column <= 2; column++) {
                        const ring = Math.max(Math.abs(row), Math.abs(column));
                        set(centreRow + row, centreColumn + column, ring === 1 ? 0 : 1);
                    }
                }
            }
        }

        // the format information areas and the module that is always dark
        for (let i = 0; i < 9; i++) {
            if (!reserved[8][i]) { set(8, i, 0); }
            if (!reserved[i][8]) { set(i, 8, 0); }
        }
        for (let i = 0; i < 8; i++) {
            if (!reserved[8][size - 1 - i]) { set(8, size - 1 - i, 0); }
            if (!reserved[size - 1 - i][8]) { set(size - 1 - i, 8, 0); }
        }
        set(size - 8, 8, 1);

        // from version 7 on the version information gets its own two blocks
        if (version >= 7) {
            for (let i = 0; i < 18; i++) {
                const row = Math.floor(i / 3);
                const column = size - 11 + (i % 3);
                set(row, column, 0);
                set(column, row, 0);
            }
        }

        return { size: size, modules: modules, reserved: reserved };
    }

    /**
     * Writes the codewords into the free modules, following the standard
     * zig-zag from the bottom right upwards in two-module wide columns.
     * @param {object} matrix - The matrix.
     * @param {number[]} codewords - The interleaved codewords.
     */
    _writeData(matrix, codewords) {
        const size = matrix.size;
        let bitIndex = 0;
        let upwards = true;

        for (let right = size - 1; right > 0; right -= 2) {
            // column 6 is the vertical timing pattern and is skipped entirely
            if (right === 6) {
                right--;
            }

            for (let step = 0; step < size; step++) {
                const row = upwards ? size - 1 - step : step;
                for (const column of [right, right - 1]) {
                    if (matrix.reserved[row][column]) {
                        continue;
                    }
                    const byte = codewords[bitIndex >> 3];
                    // the remainder bits past the last codeword stay light
                    matrix.modules[row][column] = byte === undefined ? 0 : (byte >> (7 - (bitIndex & 7))) & 1;
                    bitIndex++;
                }
            }

            upwards = !upwards;
        }
    }

    /**
     * Returns whether a module is flipped by a mask.
     * @param {number} mask - The mask number, 0 to 7.
     * @param {number} row - The row.
     * @param {number} column - The column.
     * @returns {boolean} True when the module is flipped.
     */
    _maskAt(mask, row, column) {
        switch (mask) {
            case 0: return (row + column) % 2 === 0;
            case 1: return row % 2 === 0;
            case 2: return column % 3 === 0;
            case 3: return (row + column) % 3 === 0;
            case 4: return (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0;
            case 5: return ((row * column) % 2) + ((row * column) % 3) === 0;
            case 6: return (((row * column) % 2) + ((row * column) % 3)) % 2 === 0;
            default: return (((row + column) % 2) + ((row * column) % 3)) % 2 === 0;
        }
    }

    /**
     * Applies a mask to every module that is not a function pattern.
     * @param {object} matrix - The matrix.
     * @param {number} mask - The mask number.
     */
    _applyMask(matrix, mask) {
        for (let row = 0; row < matrix.size; row++) {
            for (let column = 0; column < matrix.size; column++) {
                if (!matrix.reserved[row][column] && this._maskAt(mask, row, column)) {
                    matrix.modules[row][column] ^= 1;
                }
            }
        }
    }

    /**
     * Picks the mask with the lowest penalty, which is what keeps a symbol free
     * of the large uniform areas and finder-like runs that confuse a scanner.
     * @param {object} matrix - The matrix.
     * @param {number} version - The version.
     * @param {string} level - The error correction level.
     * @returns {number} The chosen mask.
     */
    _pickMask(matrix, version, level) {
        let best = 0;
        let bestPenalty = Infinity;

        for (let mask = 0; mask < 8; mask++) {
            this._applyMask(matrix, mask);
            this._writeFormat(matrix, level, mask);
            const penalty = this._penalty(matrix);
            this._applyMask(matrix, mask);

            if (penalty < bestPenalty) {
                bestPenalty = penalty;
                best = mask;
            }
        }

        return best;
    }

    /**
     * Scores a masked matrix by the four penalty rules of the standard.
     * @param {object} matrix - The matrix.
     * @returns {number} The penalty.
     */
    _penalty(matrix) {
        const size = matrix.size;
        const at = (row, column) => matrix.modules[row][column];
        let penalty = 0;

        // rule 1: runs of five or more modules of the same colour
        for (let i = 0; i < size; i++) {
            for (const horizontal of [true, false]) {
                let run = 1;
                for (let j = 1; j < size; j++) {
                    const current = horizontal ? at(i, j) : at(j, i);
                    const previous = horizontal ? at(i, j - 1) : at(j - 1, i);
                    if (current === previous) {
                        run++;
                    } else {
                        if (run >= 5) { penalty += run - 2; }
                        run = 1;
                    }
                }
                if (run >= 5) { penalty += run - 2; }
            }
        }

        // rule 2: blocks of the same colour, counted as two by two squares
        for (let row = 0; row < size - 1; row++) {
            for (let column = 0; column < size - 1; column++) {
                const value = at(row, column);
                if (value === at(row, column + 1) && value === at(row + 1, column) && value === at(row + 1, column + 1)) {
                    penalty += 3;
                }
            }
        }

        // rule 3: patterns that look like a finder
        const finder = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
        const reversed = finder.slice().reverse();
        for (let i = 0; i < size; i++) {
            for (let j = 0; j + 11 <= size; j++) {
                for (const horizontal of [true, false]) {
                    const window = [];
                    for (let k = 0; k < 11; k++) {
                        window.push(horizontal ? at(i, j + k) : at(j + k, i));
                    }
                    if (window.every((v, k) => v === finder[k]) || window.every((v, k) => v === reversed[k])) {
                        penalty += 40;
                    }
                }
            }
        }

        // rule 4: deviation from an even share of dark modules
        let dark = 0;
        for (let row = 0; row < size; row++) {
            for (let column = 0; column < size; column++) {
                dark += at(row, column);
            }
        }
        const share = (dark * 100) / (size * size);
        penalty += Math.floor(Math.abs(share - 50) / 5) * 10;

        return penalty;
    }

    /**
     * Writes the format information, twice, as the standard places it around
     * the upper left finder and split across the other two.
     * @param {object} matrix - The matrix.
     * @param {string} level - The error correction level.
     * @param {number} mask - The mask number.
     */
    _writeFormat(matrix, level, mask) {
        const size = matrix.size;
        const bits = this.formatBits(level, mask);
        const get = (index) => (bits >> (14 - index)) & 1;

        for (let i = 0; i <= 5; i++) {
            matrix.modules[8][i] = get(i);
            matrix.modules[i][8] = get(14 - i);
        }
        matrix.modules[8][7] = get(6);
        matrix.modules[8][8] = get(7);
        matrix.modules[7][8] = get(8);
        for (let i = 9; i <= 14; i++) {
            matrix.modules[14 - i][8] = get(i);
        }
        for (let i = 0; i <= 7; i++) {
            matrix.modules[8][size - 1 - i] = get(i);
        }
        for (let i = 8; i <= 14; i++) {
            matrix.modules[size - 15 + i][8] = get(i);
        }
    }

    /**
     * Computes the 15 bit format information: five bits of level and mask, ten
     * bits of BCH remainder, the whole masked so it is never all zero.
     * @param {string} level - The error correction level.
     * @param {number} mask - The mask number.
     * @returns {number} The format bits.
     */
    formatBits(level, mask) {
        const data = (this.EC_LEVELS[level] << 3) | mask;
        let remainder = data << 10;
        for (let i = 14; i >= 10; i--) {
            if ((remainder >> i) & 1) {
                remainder ^= 0x537 << (i - 10);
            }
        }
        return ((data << 10) | remainder) ^ 0x5412;
    }

    /**
     * Writes the version information, which versions 7 and up carry twice.
     * @param {object} matrix - The matrix.
     * @param {number} version - The version.
     */
    _writeVersion(matrix, version) {
        if (version < 7) {
            return;
        }

        const size = matrix.size;
        const bits = this.versionBits(version);

        for (let i = 0; i < 18; i++) {
            const bit = (bits >> i) & 1;
            const row = Math.floor(i / 3);
            const column = size - 11 + (i % 3);
            matrix.modules[row][column] = bit;
            matrix.modules[column][row] = bit;
        }
    }

    /**
     * Computes the 18 bit version information: six bits of version and twelve
     * bits of BCH remainder.
     * @param {number} version - The version.
     * @returns {number} The version bits.
     */
    versionBits(version) {
        let remainder = version << 12;
        for (let i = 17; i >= 12; i--) {
            if ((remainder >> i) & 1) {
                remainder ^= 0x1f25 << (i - 12);
            }
        }
        return (version << 12) | remainder;
    }
};

/**
 * Reed-Solomon over GF(256) with the QR code primitive polynomial, which is
 * what turns a block of data codewords into the remainder a scanner uses to
 * recover from damage.
 */
webexpress.webui.BarcodeReedSolomon = new class {
    /**
     * Creates the instance and builds the logarithm tables the field arithmetic
     * runs on, so a multiplication is two lookups and an addition.
     */
    constructor() {
        this._exp = new Array(512);
        this._log = new Array(256);

        let value = 1;
        for (let i = 0; i < 255; i++) {
            this._exp[i] = value;
            this._log[value] = i;
            value <<= 1;
            if (value & 0x100) {
                value ^= 0x11d;
            }
        }
        for (let i = 255; i < 512; i++) {
            this._exp[i] = this._exp[i - 255];
        }
    }

    /**
     * Multiplies two field elements.
     * @param {number} a - The first factor.
     * @param {number} b - The second factor.
     * @returns {number} The product.
     */
    multiply(a, b) {
        return (a === 0 || b === 0) ? 0 : this._exp[this._log[a] + this._log[b]];
    }

    /**
     * Builds the generator polynomial of the given degree.
     * @param {number} degree - The number of error correction codewords.
     * @returns {number[]} The coefficients, highest power first.
     */
    generator(degree) {
        let polynomial = [1];
        for (let i = 0; i < degree; i++) {
            const next = new Array(polynomial.length + 1).fill(0);
            for (let j = 0; j < polynomial.length; j++) {
                next[j] ^= polynomial[j];
                next[j + 1] ^= this.multiply(polynomial[j], this._exp[i]);
            }
            polynomial = next;
        }
        return polynomial;
    }

    /**
     * Computes the error correction codewords of a block.
     * @param {number[]} data - The data codewords.
     * @param {number} degree - The number of error correction codewords.
     * @returns {number[]} The remainder.
     */
    remainder(data, degree) {
        const generator = this.generator(degree);
        const result = new Array(degree).fill(0);

        for (const codeword of data) {
            const factor = codeword ^ result[0];
            result.shift();
            result.push(0);
            for (let i = 0; i < degree; i++) {
                result[i] ^= this.multiply(generator[i + 1], factor);
            }
        }

        return result;
    }
};

/**
 * A read-only barcode. It is purely a display control; to let the user edit the
 * encoded value use the barcode form input instead, which pairs a text field
 * with a live preview of this very control.
 */
webexpress.webui.BarcodeCtrl = class extends webexpress.webui.Ctrl {

    static SVG_NAMESPACE = "http://www.w3.org/2000/svg";

    _value = "";
    _type = "code128";
    _level = "M";
    _height = 60;
    _moduleWidth = 2;
    _showText = true;
    _quietZone = 4;

    // colors arrive either as a palette class or as an explicit css color, the
    // same pair every colorable control in the framework carries
    _colorCss = null;
    _colorStyle = null;
    _bgColorCss = null;
    _bgColorStyle = null;

    /**
     * Creates a new controller instance bound to the given element.
     * @param {HTMLElement} element - The host element.
     */
    constructor(element) {
        super(element);

        this._value = element.getAttribute("data-value") || "";
        this._type = (element.getAttribute("data-type") || "code128").toLowerCase();
        this._level = (element.getAttribute("data-level") || "M").toUpperCase();
        this._showText = element.getAttribute("data-text") !== "false";

        const height = parseInt(element.getAttribute("data-height"), 10);
        if (!isNaN(height) && height > 0) { this._height = height; }

        const moduleWidth = parseInt(element.getAttribute("data-module"), 10);
        if (!isNaN(moduleWidth) && moduleWidth > 0) { this._moduleWidth = moduleWidth; }

        this._colorCss = element.getAttribute("data-color-css") || null;
        this._colorStyle = element.getAttribute("data-color-style") || null;
        this._bgColorCss = element.getAttribute("data-bgcolor-css") || null;
        this._bgColorStyle = element.getAttribute("data-bgcolor-style") || null;

        ["data-value", "data-type", "data-level", "data-text", "data-height", "data-module",
            "data-color-css", "data-color-style", "data-bgcolor-css", "data-bgcolor-style"]
            .forEach((attribute) => element.removeAttribute(attribute));

        element.classList.add("wx-barcode");

        this.render();
    }

    /**
     * Gets the encoded value.
     * @returns {string} The value.
     */
    get value() {
        return this._value;
    }

    /**
     * Sets the encoded value and redraws.
     * @param {string} value - The new value.
     */
    set value(value) {
        const next = String(value ?? "");
        if (next === this._value) {
            return;
        }
        this._value = next;
        this.render();
        this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this._value });
    }

    /**
     * Gets the symbology.
     * @returns {string} The symbology.
     */
    get type() {
        return this._type;
    }

    /**
     * Sets the symbology and redraws.
     * @param {string} type - The symbology.
     */
    set type(type) {
        this._type = String(type || "code128").toLowerCase();
        this.render();
    }

    /**
     * Gets the error correction level used for QR codes.
     * @returns {string} The level.
     */
    get level() {
        return this._level;
    }

    /**
     * Sets the error correction level used for QR codes and redraws. A higher
     * level survives more damage to the printed symbol but holds less data.
     * @param {string} level - The level, "L", "M", "Q" or "H".
     */
    set level(level) {
        this._level = String(level || "M").toUpperCase();
        this.render();
    }

    /**
     * Gets the color of the modules as an explicit css color.
     * @returns {string|null} The color, or null when none was set.
     */
    get color() {
        return this._colorStyle ? this._colorStyle.replace(/^color:\s*|;$/g, "") : null;
    }

    /**
     * Sets the color of the modules to an explicit css color and redraws. Pass
     * null to fall back to the default. Scanners need a dark symbol on a light
     * ground, so a light color needs a dark background to stay readable.
     * @param {string|null} value - The css color.
     */
    set color(value) {
        this._colorCss = null;
        this._colorStyle = value ? `color:${value};` : null;
        this.render();
    }

    /**
     * Gets the color of the quiet zone as an explicit css color.
     * @returns {string|null} The color, or null when none was set.
     */
    get backgroundColor() {
        // the server states the ground as the background shorthand, a runtime
        // caller as the longhand; both name the same color
        return this._bgColorStyle ? this._bgColorStyle.replace(/^background(-color)?:\s*|;$/g, "") : null;
    }

    /**
     * Sets the color of the quiet zone to an explicit css color and redraws.
     * @param {string|null} value - The css color.
     */
    set backgroundColor(value) {
        this._bgColorCss = null;
        this._bgColorStyle = value ? `background-color:${value};` : null;
        this.render();
    }

    /**
     * Draws the barcode.
     */
    render() {
        this._element.innerHTML = "";

        if (this._value === "") {
            this._applyColors(true);
            return;
        }

        const graphic = this._type === "qr" ? this._renderMatrix() : this._renderLinear();

        if (!graphic) {
            // an unencodable value is reported rather than drawn as an empty box,
            // because a barcode that cannot be scanned is worse than none. The
            // configured colors are dropped with it: they were chosen for a
            // symbol, and a light one would hide the message on the light ground.
            this._applyColors(false);
            this._element.classList.add("wx-barcode-invalid");
            const message = document.createElement("span");
            message.className = "wx-barcode-error";
            message.textContent = this._i18n("webexpress.webui:barcode.invalid", "The value cannot be encoded.");
            this._element.appendChild(message);
            this._dispatch(webexpress.webui.Event.DATA_ERROR_EVENT, { value: this._value, type: this._type });
            return;
        }

        this._element.classList.remove("wx-barcode-invalid");
        this._applyColors(true);
        this._element.appendChild(graphic);
        this._element.setAttribute("aria-label", `${this._i18n("webexpress.webui:barcode", "Barcode")}: ${this._value}`);
    }

    /**
     * Applies or withdraws the configured colors. The modules take the text
     * color through currentColor and the quiet zone the background, so both
     * only have to reach the host element.
     * @param {boolean} apply - False to fall back to the defaults.
     */
    _applyColors(apply) {
        const classes = [this._colorCss, this._bgColorCss]
            .filter(Boolean)
            .flatMap((value) => value.split(/\s+/).filter(Boolean));

        for (const name of classes) {
            this._element.classList.toggle(name, apply);
        }

        this._element.style.color = "";
        this._element.style.backgroundColor = "";

        if (!apply) {
            return;
        }

        if (this._colorStyle) {
            this._element.style.cssText += this._colorStyle;
        }
        if (this._bgColorStyle) {
            this._element.style.cssText += this._bgColorStyle;
        }
    }

    /**
     * Draws a linear symbology as bars of equal module width.
     * @returns {SVGElement|null} The graphic, or null when the value does not encode.
     */
    _renderLinear() {
        const encoded = webexpress.webui.BarcodeLinear.encode(this._value, this._type);
        if (!encoded) {
            return null;
        }

        const modules = encoded.modules;
        const textHeight = this._showText ? 12 : 0;
        const width = (modules.length + this._quietZone * 2) * this._moduleWidth;
        const height = this._height + textHeight;
        const svg = this._createSvg(width, height);

        let index = 0;
        while (index < modules.length) {
            if (modules[index] === "0") {
                index++;
                continue;
            }
            let run = 0;
            while (index + run < modules.length && modules[index + run] === "1") {
                run++;
            }
            // adjacent dark modules are drawn as one bar, which keeps the
            // element count low and the edges free of seams
            const bar = document.createElementNS(webexpress.webui.BarcodeCtrl.SVG_NAMESPACE, "rect");
            bar.setAttribute("x", String((index + this._quietZone) * this._moduleWidth));
            bar.setAttribute("y", "0");
            bar.setAttribute("width", String(run * this._moduleWidth));
            bar.setAttribute("height", String(this._height));
            bar.setAttribute("fill", "currentColor");
            svg.appendChild(bar);
            index += run;
        }

        if (this._showText) {
            const text = document.createElementNS(webexpress.webui.BarcodeCtrl.SVG_NAMESPACE, "text");
            text.setAttribute("x", String(width / 2));
            text.setAttribute("y", String(height - 2));
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "10");
            text.setAttribute("fill", "currentColor");
            text.textContent = encoded.text;
            svg.appendChild(text);
        }

        return svg;
    }

    /**
     * Draws a QR code as a matrix of square modules.
     * @returns {SVGElement|null} The graphic, or null when the value does not encode.
     */
    _renderMatrix() {
        const encoded = webexpress.webui.BarcodeQR.encode(this._value, this._level);
        if (!encoded) {
            return null;
        }

        const quiet = 4;
        const extent = (encoded.size + quiet * 2) * this._moduleWidth;
        const svg = this._createSvg(extent, extent);

        for (let row = 0; row < encoded.size; row++) {
            // the dark modules of a row are drawn as runs, for the same reason
            // the bars of a linear symbology are
            let column = 0;
            while (column < encoded.size) {
                if (!encoded.modules[row][column]) {
                    column++;
                    continue;
                }
                let run = 0;
                while (column + run < encoded.size && encoded.modules[row][column + run]) {
                    run++;
                }
                const cell = document.createElementNS(webexpress.webui.BarcodeCtrl.SVG_NAMESPACE, "rect");
                cell.setAttribute("x", String((column + quiet) * this._moduleWidth));
                cell.setAttribute("y", String((row + quiet) * this._moduleWidth));
                cell.setAttribute("width", String(run * this._moduleWidth));
                cell.setAttribute("height", String(this._moduleWidth));
                cell.setAttribute("fill", "currentColor");
                svg.appendChild(cell);
                column += run;
            }
        }

        return svg;
    }

    /**
     * Creates the svg host of a graphic. The viewBox carries the geometry so the
     * symbol scales with its container without the modules drifting apart.
     * @param {number} width - The intrinsic width.
     * @param {number} height - The intrinsic height.
     * @returns {SVGElement} The svg element.
     */
    _createSvg(width, height) {
        const svg = document.createElementNS(webexpress.webui.BarcodeCtrl.SVG_NAMESPACE, "svg");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("width", String(width));
        svg.setAttribute("height", String(height));
        svg.setAttribute("role", "img");
        svg.setAttribute("shape-rendering", "crispEdges");
        svg.classList.add("wx-barcode-graphic");
        return svg;
    }
};

// register the class in the controller
webexpress.webui.Controller.registerClass("wx-webui-barcode", webexpress.webui.BarcodeCtrl);
