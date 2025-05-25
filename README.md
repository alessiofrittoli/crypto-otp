# Crypto OTP 🟢

[![NPM Latest Version][version-badge]][npm-url] [![Coverage Status][coverage-badge]][coverage-url] [![Socket Status][socket-badge]][socket-url] [![NPM Monthly Downloads][downloads-badge]][npm-url] [![Dependencies][deps-badge]][deps-url]

[![GitHub Sponsor][sponsor-badge]][sponsor-url]

[version-badge]: https://img.shields.io/npm/v/%40alessiofrittoli%2Fcrypto-otp
[npm-url]: https://npmjs.org/package/%40alessiofrittoli%2Fcrypto-otp
[coverage-badge]: https://coveralls.io/repos/github/alessiofrittoli/crypto-otp/badge.svg
[coverage-url]: https://coveralls.io/github/alessiofrittoli/crypto-otp
[socket-badge]: https://socket.dev/api/badge/npm/package/@alessiofrittoli/crypto-otp
[socket-url]: https://socket.dev/npm/package/@alessiofrittoli/crypto-otp/overview
[downloads-badge]: https://img.shields.io/npm/dm/%40alessiofrittoli%2Fcrypto-otp.svg
[deps-badge]: https://img.shields.io/librariesio/release/npm/%40alessiofrittoli%2Fcrypto-otp
[deps-url]: https://libraries.io/npm/%40alessiofrittoli%2Fcrypto-otp

[sponsor-badge]: https://img.shields.io/static/v1?label=Fund%20this%20package&message=%E2%9D%A4&logo=GitHub&color=%23DB61A2
[sponsor-url]: https://github.com/sponsors/alessiofrittoli

## Lightweight TypeScript HOTP/TOTP library

### Table of Contents

- [Getting started](#getting-started)
- [One Time Passwords - API reference](#one-time-passwords---api-reference)
  - [OTP Auth URL](#otp-auth-url)
  - [HOTP](#hotp)
  - [TOTP](#totp)
- [Development](#development)
  - [ESLint](#eslint)
  - [Jest](#jest)
- [Contributing](#contributing)
- [Security](#security)
- [Credits](#made-with-)

---

### Getting started

Run the following command to start using `crypto-otp` in your projects:

```bash
npm i @alessiofrittoli/crypto-otp
```

or using `pnpm`

```bash
pnpm i @alessiofrittoli/crypto-otp
```

---

### One Time Passwords - API reference

One-time password (OTP) systems provide a mechanism usefull for authorizations to a network or service using a unique password that can only be used once.

There are two types of OTP:

- HOTP - HMAC-Based One-Time Password ([RFC 4226](https://datatracker.ietf.org/doc/html/rfc4226));
- TOTP - Time-Based One-Time Password ([RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238));

Both consist of a short token of 6/7/8 digits number but the relying on a different algorithm for the token generation/verification.

#### Generate secrets

<details>

<summary>HMAC-SHA-1 HEX Secret Key</summary>

You can use the `Otp.Seed()` static method to generate a 20 bytes (160 bits) HMAC-SHA-1 HEX Secret Key.

You can optionally pass a string as the first and unique argument to the `Otp.Seed()` method (usually is a 8 digits USB key Serial Number).

```ts
import { Otp } from '@alessiofrittoli/crypto-otp'

const secret = Otp.Seed( '45385623' )
```

</details>

---

<details>

<summary>ASCII Secret Key</summary>

You can use the `Otp.GenerateSecretASCII()` static method to generate a random ASCII Secret Key.

⚠️ Remember to specify `ascii` as `secret.encoding` in the subsequent operations.

```ts
import { Otp } from '@alessiofrittoli/crypto-otp'

const secret = Otp.GenerateSecretASCII()
```

</details>

---

<details>

<summary>Obtain the Secret Key in a different supported encoding</summary>

Sometimes you need your Secret Key in a different encoding (e.g. `base32` required for adding the credential to an Authenticator App).
You can use the `Otp.GetSecrets()` static method to retrieve the Secret Key in different encodings.

```ts
import { Otp } from '@alessiofrittoli/crypto-otp'

const { hex, ascii, base64url, base32 } = Otp.GetSecrets( {
  secret: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' }
} )
```

</details>

---

#### OTP Auth URL

You can add the HOTP/TOTP credential to an Authenticator App and using it as a client code generator.
To do so you need a OTP Auth URL which can be stored in a QR code.

- See [OTP.AuthURLOptions<'hotp'>](#hotpauthurl-options) for `Hotp.AuthURL` options details.
- See [OTP.AuthURLOptions<'totp'>](#totpauthurl-options) for `Totp.AuthURL` options details.

```ts
import { Hotp } from '@alessiofrittoli/crypto-otp'

const authUrl = Hotp.AuthURL( {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  counter : 256, // current credential counter retrieved from a database.
  label   : 'Provider:account@name.com',
} )
// or
const authUrl = Hotp.AuthURL( {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  counter : 256, // current credential counter retrieved from a database.
  label   : 'account@name.com',
  issuer  : 'Provider',
} )
```

```ts
import { Totp } from '@alessiofrittoli/crypto-otp'

const authUrl = Totp.AuthURL( {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  label   : 'Provider:account@name.com',
} )
// or
const authUrl = Totp.AuthURL( {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  label   : 'account@name.com',
  issuer  : 'Provider',
} )
```

You could then use a third-pary library to generate the QR code (e.g. [`qrcode - npm`](https://npmjs.com/package/qrcode)).

```ts
import QrCode from 'qrcode'

QrCode.toDataURL( authUrl )
```

---

#### HOTP

You can use the `Hotp` "Static" Class to create or verify a HOTP Token.

<details>

<summary>Generate a token</summary>

- See [OTP.HOTP.GetTokenOptions](#hotpgettoken-options) for `HOTP.GetToken` options details.

```ts
import { Hotp, type OTP } from '@alessiofrittoli/crypto-otp'

const options: OTP.HOTP.GetTokenOptions = {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  counter : 256, // current credential counter retrieved from a database.
}

const token = Hotp.GetToken( options )
```

</details>

---

<details>

<summary>Verify a token</summary>

- See [OTP.HOTP.GetDeltaOptions](#hotpverifyhotpgetdelta-options) for `Hotp.Verify()` options details.

```ts
import { Hotp, type OTP } from '@alessiofrittoli/crypto-otp'

const options: OTP.HOTP.GetDeltaOptions = {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  token   : token, // The token provided by the user.
  digits  : digits,
  counter : counter, // The counter should be stored in a database and incremented on each credential verification.
}

const valid = Hotp.Verify( options ) // true | false
```

</details>

---

<details>

<summary>Calculate delta</summary>

A HOTP is incremented on every usage. You should then stored the incremented counter in a database for future verifications.

- See [OTP.HOTP.GetDeltaOptions](#hotpverifyhotpgetdelta-options) for `Hotp.GetDelta()` options details.

```ts
import { Hotp, type OTP } from '@alessiofrittoli/crypto-otp'

const options: OTP.HOTP.GetDeltaOptions = {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  token   : token,        // The token provided by the user.
  counter : counter + 1,  // The stored counter value in the database + 1.
}

/**
 * Returns `0` where the delta is the counter difference between the given token and the current counter + 1.
 * If `null` the given token is not valid and should not be accepted.
 * 
 */
const delta = Hotp.GetDelta( options )
```

</details>

---

<details>

<summary>Synchronize server counter</summary>

If the HOTP token is generated multiple times without server validation or if the token is being used on different applications (not recommended but is up to the user what to do with his tokens), the client counter could be different (higher) than the counter stored in the server database.
This will lead in synchronization mismatch and unwanted token rejects.

We could then offer to the user the possibility to synchorinze counters.

```ts
import { Hotp, type OTP } from '@alessiofrittoli/crypto-otp'

const options: OTP.HOTP.GetDeltaOptions = {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  token   : token, // The token provided by the user.
  window  : 500, // window should not be greater than `10` during auth processes. only use high values after user has already been authenticated with a different auth method.
  counter : counterStoredInDatabase,
}

const delta   = Hotp.GetDelta( options )
const counter = options.counter // if delta is `null`, store the counter and use it in the next attempt.
```

</details>

---

#### TOTP

You can use the `Totp` "Static" Class to create or verify a TOTP Token.

<details>

<summary>Generate a token</summary>

```ts
import { Totp, type OTP } from '@alessiofrittoli/crypto-otp'

const options: OTP.TOTP.GetTokenOptions = {
  secret: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' }
}

const token = Totp.GetToken( options )
```

</details>

---

<details>

<summary>Verify a token</summary>

- See [OTP.TOTP.GetDeltaOptions](#totpverifytotpgetdelta-options) for `Totp.Verify()` options details.

```ts
import { Totp, type OTP } from '@alessiofrittoli/crypto-otp'

const options: OTP.TOTP.GetDeltaOptions = {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  token   : token, // The token provided by the user.
  digits  : digits,
}

const valid = Totp.Verify( options ) // true | false
```

</details>

---

<details>

<summary>Calculate delta</summary>

A TOTP is incremented every step time-step seconds. By default, the time-step is 30 seconds. You may change the time-step using the `period` option, with units in seconds.

- See [OTP.TOTP.GetDeltaOptions](#totpverifytotpgetdelta-options) for `Totp.GetDelta()` options details.

```ts
import { Totp, type OTP } from '@alessiofrittoli/crypto-otp'

const options: OTP.TOTP.GetDeltaOptions = {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  token   : token,  // The token provided by the user.
  period  : 60,     // Must be the same to the `period` value used while generating the token.
}

/**
 * Returns `0` where the delta is the time step difference between the given token and the current time.
 * If `null` the given token is not valid and should not be accepted.
 * 
 */
const delta = Totp.GetDelta( options )
```

</details>

---

<details>

<summary>Get next tick Date</summary>

If you need to display a counter indicating the remaining time for the TOTP validity you may need to know when the previous generated TOTP code will change.

To do so you can use the `Totp.NextTick()` method which returns the `Date` object representing the next time tick for a TOTP counter.

```ts
import { Totp } from '@alessiofrittoli/crypto-otp'

const date = Totp.NextTick()
```

</details>

---

#### Window

The number of counter values to check ahead of the expected counter during HOTP token verification.

This accounts for possible counter desynchronization between the client and server, as described in [RFC 4226, section 7.2](https://datatracker.ietf.org/doc/html/rfc4226#section-7.2).

For example, if the current counter is 100 and `window` is set to 10, the verification logic will check counters from 100 to 110 (inclusive).
A larger window improves tolerance but increases the risk of token reuse and brute-force attacks.

<details>

<summary>Specifying a window for verifying HOTP (example)</summary>

Verify a HOTP token with counter value 42 and a window of 10. HOTP has a one-sided window, so this will check counter values from 42 to 52, inclusive, and return a delta number representing the difference between the given counter value and the counter position at which the token was found, or `null` if it was not found within the window.

```ts
const options: OTP.HOTP.GetDeltaOptions = {
  secret  : { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
  counter : 42,
  token   : '474687',
  window  : 10,
}

const delta = Hotp.GetDelta( options ) // 6
```

</details>

---

<details>

<summary>Specifying a window for verifying TOTP (example)</summary>

Verify a TOTP token at the current time with a window of 2. Since the default time step is 30 seconds, and TOTP has a two-sided window, this will check tokens between [current time minus two tokens before] and [current time plus two tokens after]. In other words, with a time step of 30 seconds, it will check the token at the current time, plus the tokens at the current time minus 30 seconds, minus 60 seconds, plus 30 seconds, and plus 60 seconds – basically, it will check tokens between a minute ago and a minute from now. It will return a delta number representing the difference between the current time step and the counter position at which the token was found, or `null` if it was not found within the window.

```ts
const secret: OTP.Secret = { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' }
const time1 = new Date( '2024-06-10T04:20:00.000Z' ).getTime() / 1000 // 1717993200
const time2 = time1 + 60 // 1717993260

/**
 * By way of example, we will force TOTP to return tokens at time `time1` and
 * at time `time2` (60 seconds ahead, or 2 steps ahead).
 */
const token1 = Totp.GetToken( { secret, time: time1 } ) // 289254
const token2 = Totp.GetToken( { secret, time: time2 } ) // 345152

/**
 * We can check the time at token 2, with token 1, but use a window of 2.
 * With a time step of 30 seconds, this will check all tokens from 60 seconds before the time to 60 seconds after the time.
 * 
 * The following example will return `-2`. This signifies that the given token, token1, is -2 steps away from the given time,
 * which means that it is the token for the value at (-2 * time step) = (-2 * 30 seconds) = 60 seconds ago.
 */
const delta = Totp.GetDelta( { secret, token: token1, window: 2, time: time2 } )
```

</details>

---

#### Options and params

##### Generic Options

| Parameter          | Type                                     | Default value |
|--------------------|------------------------------------------|---------------|
| `secret.key`       | `string`                                 | -             |
| `secret.encoding`  | `hex \| ascii \| base64url \|base32`     | `hex`         |
| `secret.algorithm` | `SHA-1 \| SHA-256 \| SHA-384 \| SHA-512` | `SHA-1`       |
| `digits`           | `6 \| 7 \| 8`                            | `6`           |

##### `Hotp.GetToken()` Options

Other inherited parameters from [`OTP.GenericOptions`](#generic-options).

| Parameter | Type     | Default value |
|-----------|----------|---------------|
| `counter` | `number` | `0`           |

##### `Hotp.Verify()`/`Hotp.GetDelta()` Options

Other inherited parameters from [OTP.GetTokenOptions](#hotpgettoken-options).

| Parameter | Type     | Default value | Description                                                            |
|-----------|----------|---------------|------------------------------------------------------------------------|
| `token`   | `string` | -             |                                                                        |
| `window`  | `number` | `0`           | Please refer to [Window](#window) section for more informations about. |

##### `Totp.Verify()`/`Totp.GetDelta()` Options

Other inherited parameters from [`OTP.GenericOptions`](#generic-options).

| Parameter | Type             | Default value          | Description                                                                           |
|-----------|------------------|------------------------|---------------------------------------------------------------------------------------|
| `period`  | `15 \| 30 \| 60` | `30`                   | The period parameter defines a period that a TOTP code will be valid for, in seconds. |
| `time`    | `number`         | current timestamp      | Time in seconds with which to calculate counter value.                                |
| `epoch`   | `number`         | `0` (no offset)        | Initial time since the UNIX epoch from which to calculate the counter value.          |
| `counter` | `number`         | - calculated by `time` | By default, the counter get calculated based on the previous parameters.              |

##### `Hotp.AuthURL()` Options

Other inherited parameters from [`OTP.GenericOptions`](#generic-options).

| Parameter | Type       | Default value | Description                                              |
|-----------|------------|---------------|----------------------------------------------------------|
| `label`   | `string`   | -             | Used to identify which account a key is associated with. |
| `counter` | `number`   | -             | Used to synchronize the Authenticator App counter.       |
| `issuer`  | `string`   | -             | The issuer parameter is an optional but recommended string value indicating the provider or service the credential is associated with. |

##### `Totp.AuthURL()` Options

Other inherited parameters from [`HOTP.AuthURLOptions`](#hotpauthurl-options).

| Parameter | Type             | Default value | Description                                              |
|-----------|------------------|---------------|----------------------------------------------------------|
| `period`  | `15 \| 30 \| 60` | `30`          | The period parameter defines a period that a TOTP code will be valid for, in seconds. |

---

### Development

#### Install depenendencies

```bash
npm install
```

or using `pnpm`

```bash
pnpm i
```

#### Build the source code

Run the following command to test and build code for distribution.

```bash
pnpm build
```

#### [ESLint](https://www.npmjs.com/package/eslint)

warnings / errors check.

```bash
pnpm lint
```

#### [Jest](https://npmjs.com/package/jest)

Run all the defined test suites by running the following:

```bash
# Run tests and watch file changes.
pnpm test:watch

# Run tests in a CI environment.
pnpm test:ci
```

- See [`package.json`](./package.json) file scripts for more info.

Run tests with coverage.

An HTTP server is then started to serve coverage files from `./coverage` folder.

⚠️ You may see a blank page the first time you run this command. Simply refresh the browser to see the updates.

```bash
test:coverage:serve
```

---

### Contributing

Contributions are truly welcome!

Please refer to the [Contributing Doc](./CONTRIBUTING.md) for more information on how to start contributing to this project.

Help keep this project up to date with [GitHub Sponsor][sponsor-url].

[![GitHub Sponsor][sponsor-badge]][sponsor-url]

---

### Security

If you believe you have found a security vulnerability, we encourage you to **_responsibly disclose this and NOT open a public issue_**. We will investigate all legitimate reports. Email `security@alessiofrittoli.it` to disclose any security vulnerabilities.

### Made with ☕

<table style='display:flex;gap:20px;'>
  <tbody>
    <tr>
      <td>
        <img alt="avatar" src='https://avatars.githubusercontent.com/u/35973186' style='width:60px;border-radius:50%;object-fit:contain;'>
      </td>
      <td>
        <table style='display:flex;gap:2px;flex-direction:column;'>
          <tbody>
              <tr>
                <td>
                  <a href='https://github.com/alessiofrittoli' target='_blank' rel='noopener'>Alessio Frittoli</a>
                </td>
              </tr>
              <tr>
                <td>
                  <small>
                    <a href='https://alessiofrittoli.it' target='_blank' rel='noopener'>https://alessiofrittoli.it</a> |
                    <a href='mailto:info@alessiofrittoli.it' target='_blank' rel='noopener'>info@alessiofrittoli.it</a>
                  </small>
                </td>
              </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
