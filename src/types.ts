import type { Algo } from '@alessiofrittoli/crypto-algorithm/types'


/**
 * One-Time Password (OTP) namespace.
 * 
 * Includes types and interfaces for HOTP (RFC 4226) and TOTP (RFC 6238) authentication.
 * 
 * [RFC 4226 - IETF](https://datatracker.ietf.org/doc/html/rfc4226)
 * 
 * [RFC 6238 - IETF](https://datatracker.ietf.org/doc/html/rfc6238)
 */
export namespace OTP
{
	/**
	 * The OTP type: either counter-based (HOTP) or time-based (TOTP).
	 * 
	 */
	export type Type = 'hotp' | 'totp'


	/**
	 * The number of digits in a generated OTP token.
	 * 
	 * Typical values are 6 (default), 7, or 8.
	 */
	export type Digits = 6 | 7 | 8


	/**
	 * A one-time password (OTP) token string.
	 * 
	 * Typically a numeric string of the specified length.
	 */
	export type Token = string


	/**
	 * Supported encodings for the secret key.
	 * 
	 * These define how the key is serialized before being decoded into bytes.
	 */
	export type Encoding = 'ascii' | 'hex' | 'base64url' | 'base32'
	

	/**
	 * Secret key configuration used in OTP generation.
	 * 
	 */
	export interface Secret
	{
		/**
		 * The secret key as a string, encoded using the specified encoding.
		 * 
		 */
		key: string
		/**
		 * The encoding used to interpret the secret key string.
		 * 
		 * @default 'hex'
		 */
		encoding?: OTP.Encoding
		/**
		 * The hash algorithm used for HMAC generation.
		 * 
		 * Defaults to SHA-1 for compatibility with
		 * [RFC 4226](https://datatracker.ietf.org/doc/html/rfc4226) and [RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238),
		 * but SHA-256 and SHA-512 are also supported.
		 * 
		 * @default 'SHA-1'
		 */
		algorithm?: Algo.Hash
	}


	/**
	 * A mapping of secret keys in all supported encoding formats.
	 * 
	 */
	export type Secrets = Record<OTP.Encoding, string>


	/**
	 * Options for creating an OTP Auth URI (`otpauth://`) used in QR codes or OTP apps.
	 *
	 * Format reference:
	 * 
	 * @link https://github.com/google/google-authenticator/wiki/Key-Uri-Format
	 * @link https://docs.yubico.com/yesdk/users-manual/application-oath/uri-string-format.html
	 */
	export type AuthURLOptions<T extends Type = 'hotp'> = OTP.GenericOptions & (
		{
			/**
			 * The label is used to identify which account a key is associated with.
			 * 
			 * It contains an account name, which is automatically URI-encoded, optionally prefixed by an issuer string
			 * identifying the provider or service managing that account.
			 * This issuer prefix can be used to prevent collisions between different accounts with different providers that might be
			 * identified using the same account name, e.g. the user's email address.
			 *
			 * The issuer prefix and account name should be separated by a literal colon,
			 * and optional spaces may precede the account name.
			 * Neither issuer nor account name may themselves contain a colon.
			 * Represented in ABNF according to [RFC 5234](https://datatracker.ietf.org/doc/html/rfc5234).
			 *
			 * Valid values might include `Example:alice@gmail.com`, `Provider1:Alice%20Smith` or `Big%20Corporation%3A%20alice%40bigco.com`.
			 * 
			 * ⚠️ The label is now automatically URI-encoded since version 3.0.0.
			 */
			label: string
			/**
			 * The OTP issuer.
			 * 
			 * The issuer parameter is an optional but recommended string value indicating the provider or service the credential is associated with.
			 * It is URL-encoded according to [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986).
			 * If the issuer parameter is absent, issuer information may be taken from the issuer prefix of the label.
			 *
			 * Valid values corresponding to the label prefix would be: `issuer=Example`, `issuer=Provider1`, and `issuer=Big%20Corporation`.
			 */
			issuer?: string
		} & (
			T extends 'hotp' ?
			{
				/** The OTP type needed to distinguish whether the key will be used for counter-based HOTP or for TOTP. */
				type: 'hotp'
				/** The HOTP counter. */
				counter: number
			} :
			{
				/** The OTP type needed to distinguish whether the key will be used for counter-based HOTP or for TOTP. */
				type: 'totp'
			} & Pick<TOTP.CounterOptions, 'period'>
		)
	)
	
	
	/**
	 * Base options shared across HOTP and TOTP configurations.
	 * 
	 */
	export interface GenericOptions
	{
		/**
		 * The shared secret key and associated encoding/algorithm.
		 * 
		 */
		secret: OTP.Secret
		/**
		 * Number of digits for the generated OTP token.
		 * 
		 * @default 6
		 */
		digits?: OTP.Digits
	}


	/**
	 * Options used to retrieve the secret in multiple encoding formats.
	 * 
	 */
	export type GetSecretsOptions = Pick<OTP.GenericOptions, 'secret'>


	/**
	 * HOTP (HMAC-based One-Time Password) specific types.
	 * 
	 * [RFC 4226 - IETF](https://datatracker.ietf.org/doc/html/rfc4226).
	 */
	export namespace HOTP
	{
		/**
		 * Defines the options required to generate a HOTP token.
		 * 
		 */
		export interface GetTokenOptions extends GenericOptions
		{
			/**
			 * The counter value used in HOTP generation.
			 * 
			 */
			counter?: number
		}


		/**
		 * Options for verifying a HOTP token and determining the delta from a given counter.
		 * 
		 */
		export interface GetDeltaOptions extends GetTokenOptions
		{
			/**
			 * The HOTP token to verify.
			 * 
			 */
			token: Token
			/**
			 * The number of counter values to check ahead of the expected counter during HOTP token verification.
			 *
			 * This accounts for possible counter desynchronization between the client and server, as described in
			 * [RFC 4226, section 7.2](https://datatracker.ietf.org/doc/html/rfc4226#section-7.2).
			 *
			 * For example, if the current counter is 100 and `window` is set to 10, the verification logic will check
			 * counters from 100 to 110 (inclusive).
			 *
			 * A larger window improves tolerance but increases the risk of token reuse and brute-force attacks.
			 * 
			 * [RFC 4226 - IETF](https://datatracker.ietf.org/doc/html/rfc4226#section-7.2)
			 *
			 * @default 0
			 */
			window?: number
		}
	}


	/**
	 * TOTP (Time-based One-Time Password) specific types.
	 * 
	 * [RFC 6238 - IETF](https://datatracker.ietf.org/doc/html/rfc6238).
	 */
	export namespace TOTP
	{
		/**
		 * Defines a period that a TOTP code will be valid for, in seconds.
		 * 
		 */
		export type Period = 15 | 30 | 60


		/**
		 * Options used to calculate the TOTP time-step counter.
		 * 
		 */
		export interface CounterOptions
		{
			/**
			 * Defines a period that a TOTP code will be valid for, in seconds.
			 * 
			 * @default 30
			 */
			period?: TOTP.Period
			/**
			 * Time in seconds used to calculate the counter value.
			 * 
			 * @default Date.now() / 1000
			 */
			time?: number
			/**
			 * Initial time since the UNIX epoch from which to calculate the counter value.
			 * 
			 * @default 0 // (no offset)
			 */
			epoch?: number
		}


		/**
		 * Defines the options required to generate a TOTP token.
		 * 
		 */
		export type GetTokenOptions = Omit<HOTP.GetTokenOptions, 'counter'> & TOTP.CounterOptions
		

		/**
		 * Options for verifying a TOTP token and determining the time-step delta.
		 * 
		 */
		export interface GetDeltaOptions extends TOTP.GetTokenOptions, HOTP.GetDeltaOptions
		{
			/**
			 * The number of time-step counter values to check before and after the expected counter during TOTP token verification.
			 *
			 * This helps accommodate clock drift or time synchronization issues between client and server, as recommended in
			 * [RFC 6238, section 5.2](https://datatracker.ietf.org/doc/html/rfc6238#section-5.2).
			 *
			 * For example, if `window = 1`, the algorithm will check the passcode for the current time step, the previous one,
			 * and the next one (i.e. `counter - 1` to `counter + 1`).
			 * 
			 * [RFC 6238 - IETF](https://datatracker.ietf.org/doc/html/rfc6238#section-5.2)
			 * 
			 * @default 0
			 */
			window?: number
		}
	}
}