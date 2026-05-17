# SVG Icon Guidelines for the Light Theme

This document describes the design principles, technical requirements and export workflow for all SVG icons used in the light theme. The goal is to ensure a consistent and lightweight icon set that integrates cleanly into the user interface without requiring any post‑processing. All icons are created on a canvas of twenty‑one by twenty‑one pixels, and the viewBox is set to "0 0 21 21". The drawing area should not contain additional margins or offsets, and all shapes must remain within these boundaries.

The visual style of the icons is based entirely on strokes. Icons are drawn without any filled areas, and every element uses a uniform stroke thickness that typically measures one and a half pixels. In cases where an icon requires a more delicate appearance, a stroke width of one and a quarter pixels may be used. Line caps and line joins are always rounded to maintain a soft and visually coherent appearance. The default color is pure black, which is later overridden by the theme system through CSS. Icons should be constructed with clean geometry and minimal path complexity, avoiding unnecessary anchor points, masks, filters or effects.

The structure of each SVG file must remain as minimal as possible. Only the essential SVG elements are allowed, such as the root `<svg>` element and simple geometric primitives like `<path>`, `<line>`, `<circle>` or `<rect>`, provided they use stroke attributes and no fill attributes. The files must not contain embedded style tags, metadata blocks, editor‑specific attributes or unused namespaces.

When exporting icons from **Inkscape**, the file must always be saved as an Optimized SVG. This is done by choosing “Save As” and selecting the Optimized SVG format. In the optimization dialog, metadata removal, editor data removal and the removal of unused namespaces must be enabled. The XML declaration should also be removed to keep the header minimal. Indentation should be disabled to prevent **Inkscape** from reformatting the file. Options that convert styles into attributes or shorten color values should remain disabled, since the icons rely on explicit stroke attributes and predictable color definitions. These settings ensure that **Inkscape** does not rewrite the header or introduce additional markup that would break the consistency of the icon set.

A typical SVG header for an icon in this project consists only of the namespace declaration, the width and height attributes and the viewBox definition. A minimal example would look like this:

```svg
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="21" height="21" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
```

The naming of icon files follows a simple and predictable pattern. All file names use lowercase letters and hyphens, and they describe the icon’s purpose as clearly as possible. Examples include “icon-add.svg”, “icon-user.svg” or “icon-settings.svg”. This naming scheme ensures that icons can be referenced easily in code and remain discoverable within the repository.
