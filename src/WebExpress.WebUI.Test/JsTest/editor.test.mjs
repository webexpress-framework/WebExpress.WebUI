import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEditor } from "./editor.runtime.mjs";
import { editorCases } from "./editor.cases.mjs";
import { imageCases } from "./editor.image.cases.mjs";
import { tableCases } from "./editor.table.cases.mjs";
editorCases(test, assert, loadEditor);
imageCases(test, assert, loadEditor);
tableCases(test, assert, loadEditor);
