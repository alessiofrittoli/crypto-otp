import { Otp } from './Otp'
import { Hotp } from './Hotp'
import type { OTP } from './types'


/**
 * Manage Time-Based One-Time Password.
 * 
 * **References**
 *
 * - https://github.com/speakeasyjs/speakeasy
 */
export class Totp extends Otp
{
	/**
	 * The TOTP default period.
	 * 
	 */
	static Period: OTP.TOTP.Period = 30


	/**
	 * Verify a TOTP token.
	 * 
	 * @param	options The TOTP options. @see {@link OTP.TOTP.GetDeltaOptions}
	 * @returns	True if the given TOTP token is valid, false otherwise.
	 */
	static Verify( options: OTP.TOTP.GetDeltaOptions )
	{
		return Totp.GetDelta( options ) != null
	}

	
	/**
	 * Get OTP token delta.
	 * If the token is valid, the delta will match the step on which the given token has been validated with the given counter.
	 * 
	 * @param	options The TOTP options. @see {@link OTP.TOTP.GetDeltaOptions}
	 * @returns	The delta number, null otherwise.
	 */
	static GetDelta( options: OTP.TOTP.GetDeltaOptions )
	{
		const {
			counter = Totp.Counter( options ), ...rest
		} = options

		return (
			Hotp.GetDelta( { ...rest, counter }, true )
		)
	}


	/**
	 * Get TOTP details.
	 * 
	 * @param	options The TOTP.GetTokenOptions and the OTP.AuthURLOptions object.
	 * @returns	A detailed representation of the current TOTP.
	 */
	static Get( options: OTP.TOTP.GetTokenOptions & Omit<OTP.AuthURLOptions<'totp'>, 'type'> )
	{
		const _options = Totp.ResolveOptions( options )

		return (
			{
				code		: Hotp.GetToken( _options ),
				authUrl		: Totp.AuthURL( _options ),
				secrets		: Totp.GetSecrets( _options ),
				..._options,
			}
		)
		
	}


	/**
	 * Generates a Time-Based One-Time Password (TOTP).
	 *
	 * @param	options The TOTP options. @see {@link Otp.TOTP.GetTokenOptions}
	 * @returns The TOTP token.
	 */
	static GetToken( options: OTP.TOTP.GetTokenOptions )
	{
		const {
			counter = Totp.Counter( options ), ...rest
		} = options

		return (
			Hotp.GetToken( { ...rest, counter } )
		)
	}


	/**
	 * Resolve options with default values if necessary.
	 * 
	 * @param	options The options object.
	 * @returns A non nullable options object.
	 */
	static ResolveOptions<
		T extends (
			OTP.TOTP.CounterOptions
			& OTP.TOTP.GetTokenOptions
			& Pick<OTP.TOTP.GetDeltaOptions, 'window'>
		)
	>( options: T )
	{
		const {
			secret: {
				key,
				algorithm	= Totp.Algorithm,
				encoding	= Totp.Encoding
			},
			counter	= Totp.Counter( options ),
			digits	= Totp.Digits,
			period	= Totp.Period,
			time	= Date.now() / 1000,
			epoch	= 0,
			window	= 0,
		} = options

		return {
			...options,
			secret: { key, algorithm, encoding },
			counter, digits, period, time, epoch, window,
		} as NonNullableFields<DeepFull<T>>
	}


	/**
	 * Calculate counter value based on given options.
	 * A counter value converts a TOTP time into a counter value by finding the number of time steps
	 * that have passed since the epoch to the current time.
	 *
	 * @param	options The TOTP counter options. @see {@link OTP.TOTP.CounterOptions}
	 * @returns	The calculated counter value.
	 */
	static Counter( options: OTP.TOTP.CounterOptions = {} )
	{
		const {
			period = Totp.Period, time = Date.now() / 1000, epoch = 0,
		} = options

		const _time		= time * 1000
		const _epoch	= epoch * 1000
	
		return Math.floor( ( _time - _epoch ) / period / 1000 )
	}


	
	/**
	 * Calculates the Date object representing the next time tick for a TOTP counter.
	 *
	 * @param	options The TOTP counter options. @see {@link OTP.TOTP.CounterOptions}
	 * @returns A `Date` object representing the start of the next TOTP time step.
	 */
	static NextTick( options: OTP.TOTP.CounterOptions = {} )
	{
		const {
			period = Totp.Period, epoch = 0, ...rest
		} = options

		const _epoch	= epoch * 1000
		const counter	= Totp.Counter( { period, epoch, ...rest } )
		const nextTick	= _epoch + ( counter + 1 ) * period * 1000

		return new Date( nextTick )
	}


	/**
	 * Get the otpauth URL string.
	 * 
	 * https://docs.yubico.com/yesdk/users-manual/application-oath/uri-string-format.html
	 * 
	 * @param	options The AuthURLOptions object.
	 * @returns	The otpauth URL string.
	 */
	static AuthURL( options: Omit<OTP.AuthURLOptions<'totp'>, 'type'> )
	{
		return (
			Otp.GetAuthURL( { ...options, type: 'totp' } )
		)
	}
}