import Otp from './Otp'
import type OTP from './types'


/**
 * HMAC-Based One-Time Password.
 * 
 * **References**
 *
 * - https://github.com/yeojz/otplib
 * - https://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
 * - https://tools.ietf.org/html/rfc4226
 */
class Hotp extends Otp
{
	/**
	 * Verify a HOTP token.
	 * 
	 * @param	options The HOTP options. @see {@link OTP.HOTP.GetDeltaOptions}
	 * @returns	True if the given HOTP token is valid, false otherwise.
	 */
	static Verify( options: OTP.HOTP.GetDeltaOptions )
	{
		return Hotp.GetDelta( options ) != null
	}


	/**
	 * Get OTP token delta.
	 * 
	 * If the token is valid, the delta will match the step on which the given token has been validated with the given counter.
	 * 
	 * @param	options			The HOTP options. @see {@link OTP.HOTP.GetDeltaOptions}
	 * @param	twoSidedWindow	( Optional ) If set to `true` the function will check codes in the future against the provided passcode, e.g. if window = 10, and counter = 5,
	 * 							this function will check the passcode against all One Time Passcodes between (counter - window) and (counter + window), inclusive.
	 * 							⚠️ This flag is provisioned for TOTP use only! ⚠️
	 * @returns	The delta number, null otherwise.
	 */
	static GetDelta( options: OTP.HOTP.GetDeltaOptions, twoSidedWindow: boolean = false )
	{
		let token: OTP.Token = options.token.toString()

		if ( ! token ) throw new Error( 'No token has been provided.' )

		options.counter	||= 0
		options.window	||= 0
		options.digits	||= Hotp.Digits
		
		const { digits } = options
		const counter = (
			! twoSidedWindow
				? options.counter
				: options.counter - options.window
		)
		const window = (
			! twoSidedWindow
				? options.window
				: options.window * 2
		)
	
		/** Fail if token is not of correct length */
		if ( token.length !== digits ) return null
	
		/** Parse token to integer */
		token = parseInt( token, 10 )
	
		/** Fail if token is NaN */
		if ( isNaN( token ) ) return null
		
		/** Loop from counter to ( counter + window ) inclusive */
		for ( let i = counter; i <= counter + window; ++i ) {

			options.counter = i
			const _token = parseInt( Hotp.GetToken( options ), 10 )

			if ( _token === token ) {

				const delta = i - counter
				
				return (
					! twoSidedWindow
						? delta
						: delta - options.window
				)

			}
		}
	
		return null
	}


	/**
	 * Get HOTP details.
	 * 
	 * @param	options The HOTP.GetTokenOptions and the OTP.AuthURLOptions object.
	 * @returns	A detailed representation of the current HOTP.
	 */
	static Get( options: OTP.HOTP.GetTokenOptions & Omit<OTP.AuthURLOptions<'hotp'>, 'type'> )
	{
		options.counter ||= 0

		return (
			{
				code		: Hotp.GetToken( options ),
				counter		: options.counter,
				authUrl		: Hotp.AuthURL( options ),
				digits		: options.digits,
				secret		: options.secret,
				secrets		: Hotp.GetSecrets( options ),
			}
		)
	}


	/**
	 * Generates a HMAC-Based One-Time Password (HOTP)
	 * 
	 * @param	options The HOTP options. @see {@link OTP.HOTP.GetTokenOptions}
	 * @returns	The HOTP token.
	 */
	static GetToken( options: OTP.HOTP.GetTokenOptions )
	{
		options.digits	||= Hotp.Digits

		return (
			Hotp.DigestToToken(
				Hotp.Digest( options ), options.digits
			)
		)
	}

	
	/**
	 * Resolve options with default values if necessary.
	 * 
	 * @param	options The options object.
	 * @returns A non nullable options object.
	 */
	static ResolveOptions<
		T extends OTP.HOTP.GetTokenOptions
	>( options: T )
	{
		options.secret.algorithm||= Hotp.Algorithm
		options.secret.encoding	||= Hotp.Encoding
		options.digits			||= Hotp.Digits
		options.counter 		??= 0

		return options as NonNullableFields<DeepFull<T>>
	}


	/**
	 * Generates a HMAC digest.
	 *
	 * @param	options The HOTP options. @see {@link OTP.HOTP.GetTokenOptions}
	 * @returns The HMAC digest Buffer.
	 */
	static Digest( options: Omit<OTP.HOTP.GetTokenOptions, 'digits'> )
	{
		options.secret.algorithm||= Hotp.Algorithm
		options.secret.encoding	||= Hotp.Encoding
		options.counter			||= 0

		return (
			Hotp.createDigest(
				options.secret.algorithm,
				Hotp.HmacKey( options.secret.key, options.secret.encoding ), Hotp.Counter( options.counter )
			)
		)
	}


	/**
	 * Formats a given counter into a string counter.
	 *
	 * @param counter The HOTP counter.
	 */
	static Counter( counter: number )
	{
		return (
			Hotp.padStart(
				counter.toString( 16 ), // convert counter to hexadecimal string
				16, '0'
			)
		)
	}

	
	/**
	 * Get the otpauth URL string.
	 * 
	 * https://docs.yubico.com/yesdk/users-manual/application-oath/uri-string-format.html
	 * 
	 * @param	options The AuthURLOptions object.
	 * @returns	The otpauth URL string.
	 */
	static AuthURL( options: Omit<OTP.AuthURLOptions<'hotp'>, 'type'> )
	{
		options.counter ??= 0

		return (
			Otp.GetAuthURL( { ...options, type: 'hotp' } )
		)
	}
}

export default Hotp