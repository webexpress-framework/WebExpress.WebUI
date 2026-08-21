![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# Icons

WebExpress ships its own icon set. Every icon is a small stroke drawing on a 21×21 grid,
stored as an individual SVG file and applied to an `<i>` element as a CSS mask, so it takes
on the surrounding text colour through `currentColor` and scales with the font size.

There is no third-party icon font involved. All drawings follow the same licensing terms as
WebExpress itself.

## The three parts of an icon

An icon exists in three places, and the three have to agree on one name — the **symbolic
name**:

| Part | Location | Example |
|------|----------|---------|
| The drawing | `Assets/icons/<name>.svg` | `Assets/icons/anchor.svg` |
| The mask rule | `Assets/css/webexpress.webui.icon.css` | `.wx-icon-light-anchor { mask-image: url("../icons/anchor.svg") }` |
| The C# class | `WebIcon/Icon<Name>.cs` | `public class IconAnchor : Icon { public override string Symbol => "anchor"; }` |

The symbolic name is the file name of the drawing without its extension. It is lowercase
and hyphen-separated: `anchor`, `calendar-day`, `user-pen`.

An icon class contributes nothing but that name. The base class turns it into the class
pair the browser needs:

```csharp
public class IconAnchor : Icon
{
    public override string Symbol => "anchor";
}

// new IconAnchor().Class  ->  "wx-icon-light wx-icon-light-anchor"
```

The first class carries the mask geometry and the sizing; the second selects the drawing.
Keeping the name out of the markup and out of the call sites is what allows a drawing to be
replaced, or the whole set to be swapped later, without touching any caller.

## Using an icon

### From C#

Icons are passed as `IIcon` instances. Most controls take a `Func<IRenderControlContext, IIcon>`:

```csharp
new ControlIcon() { Icon = _ => new IconAnchor() };

new ControlButton() { Icon = _ => new IconFloppyDisk(), Text = _ => "Save" };
```

Pages, setting categories and fragments declare their icon through an attribute:

```csharp
[WebIcon<IconGear>]
public sealed class SettingsPage : IPage { }
```

An image can stand in for a drawn icon anywhere an `IIcon` is expected:

```csharp
new ControlIcon() { Icon = _ => ImageIcon.FromString("/assets/img/logo.svg") };
```

### From JavaScript

Controls resolve icons through the inherited `_iconClass()` helper:

```javascript
const icon = document.createElement("i");
icon.className = this._iconClass("anchor");
// -> "wx-icon-light wx-icon-light-anchor"
```

Stand-alone code calls the registry directly, and anything that builds a whole element uses
the factory, which resolves the reference itself and decides between an `<i>` and an `<img>`:

```javascript
webexpress.webui.IconSet.resolve("anchor");

webexpress.webui.Icon.create("anchor");            // -> <i class="wx-icon-light …">
webexpress.webui.Icon.create("/assets/img/a.png"); // -> <img class="wx-icon-img" …>
```

See [IconSet](js/webexpress.webui.md#iconset) for the full client-side reference.

### From markup

Controls that take an icon declaratively accept the symbolic name:

```html
<button data-icon="floppy-disk">Save</button>
```

## Adding a new icon

1. **Draw it.** Follow the contract in `Assets/icons/README.md`: a 21×21 canvas,
   `viewBox="0 0 21 21"`, strokes only, no fills, rounded caps and joins, no metadata or
   editor attributes. Save as Optimized SVG.
2. **Name it.** Lowercase, hyphen-separated, describing the subject rather than its use —
   `floppy-disk`, not `save`. Drop the file into `Assets/icons/`.
3. **Add the mask rule** to `Assets/css/webexpress.webui.icon.css`:

   ```css
   .wx-icon-light-my-symbol {
       -webkit-mask-image: url("../icons/my-symbol.svg");
       mask-image: url("../icons/my-symbol.svg");
   }
   ```

4. **Add the class** in `WebIcon/IconMySymbol.cs`:

   ```csharp
   namespace WebExpress.WebUI.WebIcon
   {
       /// <summary>
       /// Represents an icon for a my symbol.
       /// </summary>
       public class IconMySymbol : Icon
       {
           /// <summary>
           /// Returns the symbolic name the active icon set resolves to a css class.
           /// </summary>
           public override string Symbol => "my-symbol";
       }
   }
   ```

A missing mask rule is the failure mode to watch for: the class resolves, the element
renders, and nothing is drawn. That is silent, so the drawing and the rule are held against
each other by test.

## Several classes, one drawing

A drawing may back more than one class where the same picture answers to more than one
name — `IconCalendar` and `IconCalendarDays` both resolve to `calendar`. Prefer this over
duplicating a drawing under a second file name, so a later correction only has to be made
once.

## Legacy FontAwesome names

WebExpress used FontAwesome before it shipped its own set, and strings such as
`"fas fa-calendar-days"` survive in stored dashboards, add-on definitions and other user
data. `IconSet.resolve` and `Icon.create` still accept them and map them onto the current
name, so old data keeps rendering:

```javascript
webexpress.webui.IconSet.resolve("fas fa-calendar-days");
// -> "wx-icon-light wx-icon-light-calendar"
```

This is a courtesy to existing data, not a supported way to write new code. New call sites
use the symbolic name.

## Limits of the mask approach

Rendering the drawings as CSS masks keeps the markup to a single `<i>` and the styling to
one inherited colour, which is what makes an icon usable anywhere text is. It also sets the
boundaries of what an icon can do:

- The SVG geometry is not part of the document, so individual paths cannot be selected,
  scripted or animated.
- Colour comes from `currentColor` alone; gradients and per-path colours are not available.
- An icon carries no semantics of its own — no `<title>`, no role. Where an icon is the
  only content of a control, the accessible name has to come from the control, not from the
  icon. Controls that render an icon-only affordance set it themselves (see
  `ControlPanelDismissible.DismissAriaLabel`); a control that renders one from application
  code needs an explicit `aria-label` on the host element.
