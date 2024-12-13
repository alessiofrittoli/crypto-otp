# Crypto OTP 🟢

Version 0.1.0

## Lightweight TypeScript HOTP/TOTP library

### Table of Contents

- [Getting started](#getting-started)
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

### One Time Passwords

One-time password (OTP) systems provide a mechanism usefull for authorizations to a network or service using a unique password that can only be used once.

There are two types of OTP:

- HOTP - HMAC-Based One-Time Password ([RFC 4226](https://datatracker.ietf.org/doc/html/rfc4226));
- TOTP - Time-Based One-Time Password ([RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238));

Both consist of a short token of 6/7/8 digits number but the relying on a different algorithm for the token generation/verification.

#### Generate secrets

<details>

<summary><code>HMAC-SHA-1 HEX Secret Key</code></summary>

You can use the [`OTP.Seed`](/src/lib/api/classes/OTP/index.ts#L134) static method to generate a 20 bytes (160 bits) HMAC-SHA-1 HEX Secret Key.

You can optionally pass a string as the first and unique argument to the [`OTP.Seed`](/src/lib/api/classes/OTP/index.ts#L134) method (usually is a 8 digits USB key Serial Number).

```ts
import OTP from '@/lib/api/classes/OTP'

const secret = OTP.Seed( '45385623' )
```

</details>

<details>

<summary><code>ASCII Secret Key</code></summary>

You can use the [`OTP.GenerateSecretASCII`](/src/lib/api/classes/OTP/index.ts#L154) static method to generate a random ASCII Secret Key.

⚠️ Remember to specify `ascii` as `secret.encoding` in the subsequent operations.

```ts
import OTP from '@/lib/api/classes/OTP'

const secret = OTP.GenerateSecretASCII()
```

</details>

<details>

<summary><code>Obtain the Secret Key in a different supported encoding</code></summary>

Sometimes you need your Secret Key in a different encoding (e.g. `base32` required for adding the credential to an Authenticator App).
You can use the [`OTP.GetSecrets`](/src/lib/api/classes/OTP/index.ts#L232) static method to retrieve the Secret Key in different encodings.

```ts
import OTP from '@/lib/api/classes/OTP'

const { hex, ascii, base64url, base32 } = OTP.GetSecrets( {
	secret: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' }
} )
```

</details>

---

#### OTP Auth URL

You can add the HOTP/TOTP credential to an Authenticator App and using it as a client code generator.
To do so you need a OTP Auth URL which can be stored in a QR code.

- See [OTP.AuthURLOptions<'hotp'>](#HOTP.AuthURL-Options) for `HOTP.AuthURL` options details.
- See [OTP.AuthURLOptions<'totp'>](#TOTP.AuthURL-Options) for `TOTP.AuthURL` options details.

```ts
import HOTP from '@/lib/api/classes/HOTP'

const authUrl = HOTP.AuthURL( {
	secret	: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
	label	: 'The issuer:account@name.com',
} )
```

```ts
import TOTP from '@/lib/api/classes/TOTP'

const authUrl = TOTP.AuthURL( {
	secret	: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
	label	: 'The issuer:account@name.com',
} )
```

You should then use a third-pary module to generate the QR code (e.g. [`qrcode - npm`](https://www.npmjs.com/package/qrcode)).

```ts
import QrCode from 'qrcode'

QrCode.toDataURL( authUrl )
```

---

#### HOTP

You can use the [`HOTP "Static" Class`](/src/lib/api/classes/OTP/HOTP/index.ts) or the [`HOTP Class`](/src/lib/api/classes/OTP/HOTP/HmacBasedOTP.ts) to create or verify a HOTP Token.

<details>

<summary><code>Generate a token</code></summary>

- See [OTP.HOTP.GetTokenOptions](#HOTP.GetToken-Options) for `HOTP.GetToken` options details.

```ts
import type OTP from '@/lib/api/classes/OTP/types'
import HOTP from '@/lib/api/classes/OTP/HOTP'

const options: OTP.HOTP.GetTokenOptions = {
	secret: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' }
}

const token = HOTP.GetToken( options )
```

</details>

<details>

<summary><code>Verify a token</code></summary>

- See [OTP.HOTP.GetDeltaOptions](#HOTP.Verify/HOTP.GetDelta-Options) for `HOTP.Verify` options details.

```ts
import type OTP from '@/lib/api/classes/OTP/types'
import HOTP from '@/lib/api/classes/OTP/HOTP'

const options: OTP.HOTP.GetDeltaOptions = {
	secret	: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
	token	: token, // The token provided by the user.
	digits	: digits,
	counter	: counter, // The counter should be stored in a database and incremented on each credential verification.
}

const valid = HOTP.Verify( options ) // true | false
```

</details>

<details>

<summary><code>Calculate delta</code></summary>

A HOTP is incremented on every usage. You should then stored the incremented counter in a database for future verifications.

- See [OTP.HOTP.GetDeltaOptions](#HOTP.Verify/HOTP.GetDelta-Options) for `HOTP.GetDelta` options details.

```ts
import type OTP from '@/lib/api/classes/OTP/types'
import HOTP from '@/lib/api/classes/OTP/HOTP'

const options: OTP.HOTP.GetDeltaOptions = {
	secret	: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
	token	: token,		// The token provided by the user.
	counter	: counter + 1,	// The stored counter value in the database + 1.
}

/**
 * Returns `0` where the delta is the counter difference between the given token and the current counter + 1.
 * If `null` the given token is not valid and should not be accepted.
 * 
 */
const delta = HOTP.GetDelta( options )
```

</details>


<details>

<summary><code>Synchronize server counter</code></summary>

If the HOTP token is generated multiple times without server validation or if the token is being used on different applications (not recommended but is up to the user what to do with his tokens), the client counter could be different (higher) than the counter stored in the server database.
This will lead in synchronization mismatch and unwanted token rejects.

We could then offer to the user the possibility to synchorinze counters.

```ts
import type OTP from '@/lib/api/classes/OTP/types'
import HOTP from '@/lib/api/classes/OTP/HOTP'

const options: OTP.HOTP.GetDeltaOptions = {
	secret	: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
	token	: token, // The token provided by the user.
	window	: 500,
	counter	: counterStoredInDatabase,
}

const delta		= HOTP.GetDelta( options )
const counter	= options.counter // if delta is `null`, store the counter and use it in the next attempt.
```

</details>

---

#### TOTP

You can use the [`TOTP "Static" Class`](/src/lib/api/classes/OTP/TOTP/index.ts) or the [`TOTP Class`](/src/lib/api/classes/OTP/TOTP/HmacBasedOTP.ts) to create or verify a TOTP Token.

<details>

<summary><code>Generate a token</code></summary>

- See [OTP.TOTP.GetTokenOptions](#TOTP.GetToken-Options) for `TOTP.GetToken` options details.

```ts
import type OTP from '@/lib/api/classes/OTP/types'
import TOTP from '@/lib/api/classes/OTP/TOTP'

const options: OTP.TOTP.GetTokenOptions = {
	secret: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' }
}

const token = TOTP.GetToken( options )
```

</details>

<details>

<summary><code>Verify a token</code></summary>

- See [OTP.TOTP.GetDeltaOptions](#TOTP.Verify/TOTP.GetDelta-Options) for `TOTP.Verify` options details.

```ts
import type OTP from '@/lib/api/classes/OTP/types'
import TOTP from '@/lib/api/classes/OTP/TOTP'

const options: OTP.TOTP.GetDeltaOptions = {
	secret	: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
	token	: token, // The token provided by the user.
	digits	: digits,
}

const valid = TOTP.Verify( options ) // true | false
```

</details>

<details>

<summary><code>Calculate delta</code></summary>

A TOTP is incremented every step time-step seconds. By default, the time-step is 30 seconds. You may change the time-step using the `period` option, with units in seconds.

- See [OTP.TOTP.GetDeltaOptions](#TOTP.Verify/TOTP.GetDelta-Options) for `TOTP.GetDelta` options details.

```ts
import type OTP from '@/lib/api/classes/OTP/types'
import TOTP from '@/lib/api/classes/OTP/TOTP'

const options: OTP.TOTP.GetDeltaOptions = {
	secret	: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
	token	: token,	// The token provided by the user.
	period	: 60,		// Must be the same to the `period` value used while generating the token.
}

/**
 * Returns `0` where the delta is the time step difference between the given token and the current time.
 * If `null` the given token is not valid and should not be accepted.
 * 
 */
const delta = TOTP.GetDelta( options )
```

</details>

---

#### Window

The allowable margin for the counter. The function will check codes in the future against the provided passcode, e.g. if window = 10, and counter = 5, this function will check the passcode against all One Time Passcodes between (counter - window) and (counter + window), inclusive.

<details>

<summary><code>Specifying a window for verifying HOTP (example)</code></summary>

Verify a HOTP token with counter value 42 and a window of 10. HOTP has a one-sided window, so this will check counter values from 42 to 52, inclusive, and return a delta number representing the difference between the given counter value and the counter position at which the token was found, or `null` if it was not found within the window.


```ts
const options: OTP.HOTP.GetDeltaOptions = {
	secret	: { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' },
	counter	: 42,
	token	: '474687',
	window	: 10,
}

const delta = HOTP.GetDelta( options ) // 6
```

</details>


<details>

<summary><code>Specifying a window for verifying TOTP (example)</code></summary>

Verify a TOTP token at the current time with a window of 2. Since the default time step is 30 seconds, and TOTP has a two-sided window, this will check tokens between [current time minus two tokens before] and [current time plus two tokens after]. In other words, with a time step of 30 seconds, it will check the token at the current time, plus the tokens at the current time minus 30 seconds, minus 60 seconds, plus 30 seconds, and plus 60 seconds – basically, it will check tokens between a minute ago and a minute from now. It will return a delta number representing the difference between the current time step and the counter position at which the token was found, or `null` if it was not found within the window.


```ts
const secret: OTP.Secret = { key: '2E58D8285025A05094667561B3D1AA4EC9CFAB3B' }
const time1 = new Date( '2024-06-10T04:20:00.000Z' ).getTime() / 1000 // 1717993200
const time2 = time1 + 60 // 1717993260

/**
 * By way of example, we will force TOTP to return tokens at time `time1` and
 * at time `time2` (60 seconds ahead, or 2 steps ahead).
 */
const token1 = TOTP.GetToken( { secret, time: time1 } ) // 289254
const token2 = TOTP.GetToken( { secret, time: time2 } ) // 345152

/**
 * We can check the time at token 2, with token 1, but use a window of 2.
 * With a time step of 30 seconds, this will check all tokens from 60 seconds before the time to 60 seconds after the time.
 * 
 * The following example will return `-2`. This signifies that the given token, token1, is -2 steps away from the given time,
 * which means that it is the token for the value at (-2 * time step) = (-2 * 30 seconds) = 60 seconds ago.
 */
const delta = TOTP.GetDelta( { secret, token: token1, window: 2, time: time2 } )
```

</details>

---

#### Options and params

##### Generic Options

| Param             | Type       | Default value | Possible values                                | Description |
|-------------------|------------|---------------|------------------------------------------------|-------------|
| secret.key        | `required` |               | `String`                                       |             |
| secret.encoding   | `optional` | `hex`         | `hex` \| `ascii` \| `base64url` \| `base32`    |             |
| secret.algorithm  | `optional` | `SHA-1`       | `SHA-1` \| `SHA-256` \| `SHA-384` \| `SHA-512` |             |
| digits            | `optional` | `6`           | `6` \| `7` \| `8`                              |             |

##### HOTP.GetToken Options

Other inherited parameters from [`OTP.GenericOptions`](#Generic-Options).

| Param             | Type       | Default value | Possible values | Description |
|-------------------|------------|---------------|-----------------|-------------|
| counter           | `optional` | `0`           | `Number`        |             |


##### HOTP.Verify/HOTP.GetDelta Options

Other inherited parameters from [OTP.GetTokenOptions](#HOTP.GetToken-Options).

| Param             | Type       | Default value | Possible values      | Description                                                            |
|-------------------|------------|---------------|----------------------|------------------------------------------------------------------------|
| token             | `required` |               | `String` \| `Number` |                                                                        |
| window            | `optional` | `0`           | `Number`             | Please refer to [Window](#window) section for more informations about. |


##### TOTP.Verify/TOTP.GetDelta Options

Other inherited parameters from [`OTP.GenericOptions`](#Generic-Options).

| Param             | Type       | Default value     | Possible values      | Description                                                                           |
|-------------------|------------|-------------------|----------------------|---------------------------------------------------------------------------------------|
| period            | `optional` | `30`              | `15` \| `30` \| `60` | The period parameter defines a period that a TOTP code will be valid for, in seconds. |
| time              | `optional` | Current timestamp | `Number`             | Time in seconds with which to calculate counter value.                                |
| epoch             | `optional` | `0` (no offset)   | `Number`             | Initial time since the UNIX epoch from which to calculate the counter value.          |
| counter           | `optional` | Calculated        | `Number`             | By default, the counter get calculated based on the previous parameters.              |

##### HOTP.AuthURL Options

Other inherited parameters from [`OTP.GenericOptions`](#Generic-Options).

| Param				| Type       | Default value     | Possible values      | Description                                              |
|-------------------|------------|-------------------|----------------------|----------------------------------------------------------|
| label             | `required` |                   | `String`             | Used to identify which account a key is associated with. |
| counter           | `required` |                   | `Number`             | Used to synchronize the Authenticator App counter.       |
| issuer            | `optional` |                   | `String`             | The issuer parameter is an optional but recommended string value indicating the provider or service the credential is associated with. |

##### TOTP.AuthURL Options

Other inherited parameters from [`HOTP.AuthURLOptions`](#HOTP.AuthURL-Options).

| Param				| Type       | Default value     | Possible values      | Description                                                                           |
|-------------------|------------|-------------------|----------------------|---------------------------------------------------------------------------------------|
| period            | `optional` | `30`              | `15` \| `30` \| `60` | The period parameter defines a period that a TOTP code will be valid for, in seconds. |

---

<!-- ---

### Development

#### Install depenendencies

```bash
npm install
```

or using `pnpm`

```bash
pnpm i
```

#### Build your source code

Run the following command to build code for distribution.

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
pnpm test

# Run tests and watch file changes with jest-environment-jsdom.
pnpm test:jsdom

# Run tests in a CI environment.
pnpm test:ci

# Run tests in a CI environment with jest-environment-jsdom.
pnpm test:ci:jsdom
```

You can eventually run specific suits like so:

```bash
pnpm test:jest
pnpm test:jest:jsdom
```

-->

---

### Contributing

Contributions are truly welcome!\
Please refer to the [Contributing Doc](./CONTRIBUTING.md) for more information on how to start contributing to this project.

---

### Security

If you believe you have found a security vulnerability, we encourage you to **_responsibly disclose this and NOT open a public issue_**. We will investigate all legitimate reports. Email `security@alessiofrittoli.it` to disclose any security vulnerabilities.

### Made with ☕

<table style='display:flex;gap:20px;'>
	<tbody>
		<tr>
			<td>
				<img src='https://avatars.githubusercontent.com/u/35973186' style='width:60px;border-radius:50%;object-fit:contain;'>
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