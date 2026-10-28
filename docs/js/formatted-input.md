![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# Formatted Inputs

Some form fields take a value of a fixed notation: an e-mail address, a host name, an IP address. Each is a native `<input>` the browser fills and checks as far as it can; there is no client control behind it. The server brings the posted text into its normalized form, so the page processes one spelling of a value, and refuses a text that is no such value with a message saying why. An empty field is left to the required rule.

They share the base `ControlFormItemInputFormatted`, which renders the input with `autocomplete`, `spellcheck="false"` and `autocapitalize="off"` and shows an example of its notation as placeholder unless `Placeholder` sets one.

| Control                              | Notation                                   | Normalized as                                    | Rules                                                     |
|--------------------------------------|--------------------------------------------|--------------------------------------------------|-----------------------------------------------------------|
| `ControlFormItemInputEmail`          | `grace@example.com`                        | domain in lower case                             | `Domains`, see [EmailCtrl](email.md)                     |
| `ControlFormItemInputFqdn`           | `server.example.com`, `bücher.de`          | lower case, Unicode labels, no trailing dot      | `Wildcard`, `Domains`                                     |
| `ControlFormItemInputIp`             | `192.0.2.10`, `2001:db8::1`, `192.0.2.0/24` | IPv6 in canonical form (RFC 5952)                | `Version`, `AllowPrefix`                                  |

## Fully Qualified Domain Name

A name is checked in its ASCII form - labels of at most 63 characters of letters, digits and hyphens, at most 253 characters in all - so an internationalized name is accepted and stored with its Unicode labels. A single label (`localhost`) is no fully qualified name, and a name whose last label is numeric is an address rather than a host. `Wildcard` accepts a leading `*.` as a certificate may name it; `Domains` limits the names to those domains, the domains themselves included.

## IP Address

An IPv4 address must be written in dotted-decimal form with four parts and no leading zeros (`10.1` and `192.168.001.1` are refused, although the runtime parser would read them); an IPv6 address is stored in its canonical, compressed form, and a zone index (`fe80::1%eth0`) is refused. `Version` (`TypeIpVersion.Any`, `Version4`, `Version6`) asks for one version; `AllowPrefix` accepts a prefix length in CIDR notation, at most 32 for IPv4 and 128 for IPv6.

```csharp
new ControlFormItemInputIp("network")
{
    Label = _ => "Network",
    Version = _ => TypeIpVersion.Version4,
    AllowPrefix = _ => true
};
```

The rules are available without a form as well: `EmailAddress`, `HostName` and `IpAddress` normalize and check a value, and `IpAddress.Check` tells what is wrong with it.
