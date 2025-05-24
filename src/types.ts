import type { Algo } from '@alessiofrittoli/crypto-algorithm/types'

export namespace OTP
{
	/**
	 * The OTP type.
	 * 
	 */
	export type Type = 'hotp' | 'totp'


	/**
	 * The supported digits.
	 * 
	 */
	export type Digits = 6 | 7 | 8


	/**
	 * The output token (otp).
	 * 
	 */
	export type Token = string


	/**
	 * The supported secret key encoding.
	 * 
	 */
	export type Encoding = 'ascii' | 'hex' | 'base64url' | 'base32'
	

	/**
	 * Defines the accepted data for a secret key management.
	 * 
	 */
	export interface Secret
	{
		/**
		 * The secret key.
		 * 
		 */
		key: string
		/**
		 * The secret key encoding.
		 * 
		 * @default 'hex'
		 */
		encoding?: OTP.Encoding
		/**
		 * The hash algorithm used by the credential.
		 * 
		 * @default 'SHA-1'
		 */
		algorithm?: Algo.Hash
	}


	/**
	 * An object containing secret keys in all supported encoding formats.
	 * 
	 */
	export type Secrets = Record<OTP.Encoding, string>


	/**
	 * OTP Auth URL options.
	 *
	 * @link https://github.com/google/google-authenticator/wiki/Key-Uri-Format
	 */
	export type AuthURLOptions<T extends Type = 'hotp'> = OTP.GenericOptions & (
		{
			/**
			 * The label is used to identify which account a key is associated with.
			 * It contains an account name, which is a URI-encoded string, optionally prefixed by an issuer string
			 * identifying the provider or service managing that account.
			 * This issuer prefix can be used to prevent collisions between different accounts with different providers that might be
			 * identified using the same account name, e.g. the user's email address.
			 *
			 * The issuer prefix and account name should be separated by a literal or url-encoded colon,
			 * and optional spaces may precede the account name.
			 * Neither issuer nor account name may themselves contain a colon.
			 * Represented in ABNF according to [RFC 5234](https://datatracker.ietf.org/doc/html/rfc5234).
			 *
			 * Valid values might include `Example:alice@gmail.com`, `Provider1:Alice%20Smith` or `Big%20Corporation%3A%20alice%40bigco.com`.
			 */
			label: string
			/**
			 * The OTP issuer.
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
			} & Pick<TOTP.CounterOptions, 'period'> & Pick<TOTP.GetTokenOptions, 'counter'>
		)
	)
	
	
	export interface GenericOptions
	{
		/**
		 * The secret key object.
		 * 
		 */
		secret: OTP.Secret
		/**
		 * The OTP token length.
		 * 
		 * @default 6
		 */
		digits?: OTP.Digits
	}


	/**
	 * Defines the options required to retrieve secrets in other encoding.
	 * 
	 */
	export type GetSecretsOptions = Pick<OTP.GenericOptions, 'secret'>


	export namespace HOTP
	{
		/**
		 * Defines the options required to generate a HOTP token.
		 * 
		 */
		export interface GetTokenOptions extends GenericOptions
		{
			/** The HOTP counter. */
			counter?: number
		}


		/**
		 * Defines the options required to retrieve the delta value.
		 * 
		 */
		export interface GetDeltaOptions extends GetTokenOptions
		{
			/** The HOTP token. */
			token: Token
			/**
			 * The allowable margin for the counter.
			 * 
			 * The function will check codes in the future against the provided passcode,
			 * e.g. if window = 10, and counter = 5.
			 * 
			 * @default 0
			 */
			window?: number
		}
	}


	export namespace TOTP
	{
		/**
		 * Defines a period that a TOTP code will be valid for, in seconds.
		 * 
		 */
		export type Period = 15 | 30 | 60

		/**
		 * Defines the options required to generate the TOTP counter.
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
		export type GetTokenOptions = HOTP.GetTokenOptions & CounterOptions
		

		/**
		 * Defines the options required to retrieve the delta value.
		 * 
		 */
		export interface GetDeltaOptions extends GetTokenOptions, HOTP.GetDeltaOptions
		{
			/**
			 * The allowable margin for the counter.
			 * 
			 * The function will check codes in the future against the provided passcode,
			 * e.g. if window = 10, and counter = 5,
			 * this function will check the passcode against all One Time Passcodes between (counter - window) and (counter + window), inclusive.
			 * 
			 * @default 0
			 */
			window?: number
		}
	}
}