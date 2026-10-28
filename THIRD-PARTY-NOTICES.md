# Third-party notices

WebExpress.WebUI is published under the MIT licence, see [LICENSE](LICENSE).
This file names its direct dependencies - what its own projects reference or ship - not what those bring in turn; each WebExpress package carries its own notices.

## Third-party components

| Component | Version | Used by | Licence |
|---|---|---|---|
| [.NET runtime](https://github.com/dotnet/runtime) | 10.0 | WebExpress.WebUI | [MIT](https://spdx.org/licenses/MIT.html) |
| [flag-icons (country flags, 249 drawings)](https://github.com/lipis/flag-icons) | 7.2.3 | WebExpress.WebUI (Assets/flags) | [MIT](https://spdx.org/licenses/MIT.html) |
| [libphonenumber-js (metadata of the telephone numbering plans)](https://gitlab.com/catamphetamine/libphonenumber-js) | 1.12.10 | WebExpress.WebUI (PhoneCatalog, webexpress.webui.phone.js) | [MIT](https://spdx.org/licenses/MIT.html) |

## WebExpress packages

Parts of the same framework, published by the same authors under the MIT licence.

| Package | Version | Used by |
|---|---|---|
| [WebExpress.WebCore](https://github.com/webexpress-framework/WebExpress.WebCore) | 2.0.0-alpha | WebExpress.WebUI |

## Build and test only

Used to build and test the projects; not part of what is distributed.

| Component | Version | Used by | Licence |
|---|---|---|---|
| [xunit.v3](https://github.com/xunit/xunit) | 4.0.2 | WebExpress.WebUI.Test | [Apache-2.0](https://spdx.org/licenses/Apache-2.0.html) |

## Licence texts

### MIT License

Applies to the components above marked MIT, under these copyright notices:

- .NET runtime: Copyright (c) .NET Foundation and Contributors
- flag-icons (country flags, 249 drawings): Copyright (c) 2013 Panayiotis Lipiridis
- libphonenumber-js (metadata of the telephone numbering plans): Copyright (c) 2016 @catamphetamine

```
Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

The build and test components are not distributed; their licences are linked in the table above.
