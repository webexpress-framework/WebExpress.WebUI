![WebExpress](https://raw.githubusercontent.com/webexpress-framework/.github/main/docs/assets/img/banner.png)

# InputDomainCtrl

The `InputDomainCtrl` component takes an account in a domain: a button with the chosen domain, which opens a list of the domains offered, beside a field for the user name. The two are composed into the down-level logon name `DOMAIN\user` or the user principal name `user@domain.tld`, as a directory such as Active Directory knows them. Without domains to offer, the field takes the whole account as text.

```text
   ┌──────────────┬────────────────────────┐
   │ CONTOSO  [v] │ jdoe                   │
   └──────────────┴────────────────────────┘
```

## Configuration

| Attribute       | Description                                                                                                   |
|-----------------|---------------------------------------------------------------------------------------------------------------|
| `id`, `name`    | Moved onto the hidden input that posts the value.                                                             |
| `data-value`    | The account. An account of an offered domain selects that domain.                                             |
| `data-domain`   | The domain the picker starts with. Without it, the first domain offered.                                      |
| `data-format`   | `downlevel` or `principal` fixes the notation. Without it, a domain with a dot makes a principal name, one without a down-level name. |
| `placeholder`   | The text of the empty user field.                                                                             |
| nested options  | `<div class="wx-selection-item" id="CONTOSO" data-label="CONTOSO">` elements name the domains offered. A list of more than eight gets a filter. |

## Functionality

- **Composition**: The value is the account in its full notation. An account typed or pasted in full - `FABRIKAM\jdoe` - selects its domain where it is offered; one of another domain is kept as typed and reported.
- **Rules**: A NetBIOS domain has at most 15 characters (a DNS domain is accepted as well), a logon name at most 20 and none of the characters the directory reserves (`" / \ [ ] : ; | = , + * ? < > @`); a principal name has a user part of at most 64 characters and a DNS domain. `webexpress.webui.InputDomainCtrl.parse` applies them; the server applies the same in `DomainLogon`.
- **Validation**: `validate()` reports an account that breaks the rules or the fixed notation, and one of a domain not offered.
- **Password managers**: The user field carries `autocomplete="username"`, so a password manager pairs it with a password field beside it.

## Programmatic Control

```javascript
const ctrl = webexpress.webui.Controller.getInstanceByElement(document.getElementById('account'));

ctrl.domain = 'FABRIKAM';       // keeps the user name
ctrl.value = 'CONTOSO\\jdoe';   // selects CONTOSO; announces CHANGE_VALUE_EVENT
```

# Domain Input (C#)

`ControlFormItemInputDomain` renders the field. The page receives the account in its full notation.

| Property      | Description                                                                                                       |
|---------------|-------------------------------------------------------------------------------------------------------------------|
| `Domains`     | The domains offered, compared without regard to letter case; an account of another domain is refused. Left unset, the field takes any account as text. |
| `Domain`      | The domain the picker starts with. Without `Domains`, a bare user name is completed with it.                      |
| `Format`      | `TypeDomainFormat.Any`, `DownLevel` or `Principal`: the notation the account is composed in and must be written in. |
| `Account`     | The account shown while the form has no value of its own.                                                         |
| `Placeholder` | The text of the empty user field; left unset, an example of what the field asks for.                             |

```csharp
new ControlFormItemInputDomain("account")
{
    Label = _ => "Account",
    Domains = _ => ["CONTOSO", "FABRIKAM"],
    Domain = _ => "CONTOSO"
};
```
