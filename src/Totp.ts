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
		options.counter ??= Totp.Counter( options )

		return (
			Hotp.GetDelta( options, true )
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
		options.counter ??= Totp.Counter( options )

		return (
			{
				code		: Hotp.GetToken( options ),
				counter		: options.counter,
				time		: options.time!,
				period		: options.period,
				epoch		: options.epoch,
				window		: options.window,
				authUrl		: Totp.AuthURL( options ),
				digits		: options.digits,
				secret		: options.secret,
				secrets		: Totp.GetSecrets( options ),
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
		options.counter ??= Totp.Counter( options )

		return (
			Hotp.GetToken( options )
		)
	}


	/**
	 * Resolve options with default values if necessary.
	 * 
	 * @param	options The options object.
	 * @returns A non nullable options object.
	 */
	static ResolveOptions<
		T extends OTP.TOTP.CounterOptions & OTP.TOTP.GetTokenOptions
	>( options: T )
	{
		options.secret.algorithm||= Totp.Algorithm
		options.secret.encoding	||= Totp.Encoding
		options.digits			||= Totp.Digits
		options.counter 		??= Totp.Counter( options )
		options.period			||= Totp.Period
		options.time			??= ( Date.now() / 1000 )
		options.epoch			??= 0

		return options as NonNullableFields<DeepFull<T>>
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
		options.period	||= Totp.Period
		options.time	??= ( Date.now() / 1000 )
		options.epoch	??= 0

		const step	= options.period
		const time	= options.time * 1000
		const epoch	= options.epoch * 1000
	
		return Math.floor( ( time - epoch ) / step / 1000 )
	}


	
	/**
	 * Calculates the Date object representing the next time tick for a TOTP counter.
	 *
	 * @param	options The TOTP counter options. @see {@link OTP.TOTP.CounterOptions}
	 * @returns A `Date` object representing the start of the next TOTP time step.
	 */
	static NextTick( options: OTP.TOTP.CounterOptions = {} )
	{
		options.period	||= Totp.Period
		options.time	??= ( Date.now() / 1000 )
		options.epoch	??= 0

		const step		= options.period
		const epoch		= options.epoch * 1000
		const counter	= Totp.Counter( options )
		const nextTick	= epoch + ( counter + 1 ) * step * 1000

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