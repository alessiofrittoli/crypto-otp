import { timingSafeEqual } from 'crypto'
import { Exception } from '@alessiofrittoli/exception'
import { ErrorCode } from '@alessiofrittoli/exception/code'
import { Otp } from './Otp'
import type { OTP } from './types'


/**
 * HMAC-Based One-Time Password.
 * 
 * **References**
 *
 * - https://github.com/yeojz/otplib
 * - https://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
 * - https://tools.ietf.org/html/rfc4226
 */
export class Hotp extends Otp
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
	 * Get HOTP token delta.
	 * 
	 * If the token is valid, the delta will match the step on which the given token has been validated with the given counter.
	 * 
	 * @param	options The HOTP options. @see {@link OTP.HOTP.GetDeltaOptions}
	 * @returns	The delta number, null otherwise.
	 */
	static GetDelta( options: OTP.HOTP.GetDeltaOptions ): number | null
	
	
	/**
	 * Get TOTP token delta.
	 * 
	 * If the token is valid, the delta will match the step on which the given token has been validated with the given counter.
	 * 
	 * @param	options The TOTP options. @see {@link OTP.TOTP.GetDeltaOptions}
	 * @returns	The delta number, null otherwise.
	 */
	static GetDelta( options: OTP.TOTP.GetDeltaOptions, twoSidedWindow?: boolean ): number | null
	
	
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
	static GetDelta( options: OTP.HOTP.GetDeltaOptions, twoSidedWindow: boolean = false ): number | null
	{
		const { token } = options

		if ( ! token ) {
			throw new Exception( 'No token has been provided.', {
				code: ErrorCode.EMPTY_VALUE,
			} )
		}

		const {
			counter = 0, window = 0, digits = Hotp.Digits, ...rest
		} = options
		
		const _counter = (
			! twoSidedWindow
				? counter
				: counter - window
		)
		const _window = (
			! twoSidedWindow
				? window
				: window * 2
		)
	
		/** Fail if token is not of correct length */
		if ( token.length !== digits ) return null
		
		/** Loop from counter to ( counter + window ) inclusive */
		for ( let i = _counter; i <= _counter + _window; ++i ) {

			const _token = (
				Hotp.GetToken( { ...rest, digits, counter: i } )
			)
			
			const isValid = (
				timingSafeEqual( Buffer.from( _token ), Buffer.from( token ) )
			)

			if ( isValid ) {

				const delta = i - _counter
				
				return (
					! twoSidedWindow
						? delta
						: delta - window
				)

			}

		}
	
		return null
	}


	/**
	 * Generates a HMAC-Based One-Time Password (HOTP)
	 * 
	 * @param	options The HOTP options. @see {@link OTP.HOTP.GetTokenOptions}
	 * @returns	The HOTP token.
	 */
	static GetToken( options: OTP.HOTP.GetTokenOptions )
	{
		const { digits = Hotp.Digits } = options

		return (
			Hotp.DigestToToken(
				Hotp.Digest( options ), digits
			)
		)
	}


	/**
	 * Generates a HMAC digest.
	 *
	 * @param	options The HOTP options. @see {@link OTP.HOTP.GetTokenOptions}
	 * @returns The HMAC digest Buffer.
	 */
	static Digest( options: Omit<OTP.HOTP.GetTokenOptions, 'digits'> ): Buffer
	{
		const {
			counter = 0,
			secret: { key, algorithm = Hotp.Algorithm, encoding = Hotp.Encoding }
		} = options

		return (
			Hotp.createDigest(
				algorithm,
				Hotp.HmacKey( key, encoding ), Hotp.Counter( counter )
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
		const { counter = 0, ...rest } = options

		return (
			Otp.GetAuthURL( { counter, ...rest, type: 'hotp' } )
		)
	}
}