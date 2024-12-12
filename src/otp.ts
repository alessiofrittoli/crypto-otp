import crypto from 'crypto'
import { format, type UrlObject } from 'url'

import type Algo from '@alessiofrittoli/crypto-algorithm/types'
import Base32, { type Variant } from '@alessiofrittoli/crypto-encoder/Base32'
import { Hmac, generateKey } from '@alessiofrittoli/crypto-key'
import { padStart } from '@alessiofrittoli/math-utils/helpers'

import type OTP from './types'


class Otp
{
	static Digits: OTP.Digits = 6
	static Encoding: OTP.Encoding = 'hex'
	static Algorithm: Algo.Hash = 'SHA-1'
	static Base32Variant: Variant = Base32.VARIANT.RFC3548


	/**
	 * Converts a digest to a token of a specified length.
	 *
	 * @param	digest	The digest Buffer.
	 * @param	digits	( Optional ) The OTP token digits count ( usually 6 | 8 ). Default: `6`.
	 *
	 * @returns	The OTP token.
	 */
	static DigestToToken(
		digest: Buffer,
		digits: OTP.Digits = Otp.Digits,
	)
	{
		const offset = ( digest.at( -1 ) || 0 ) & 0xf
		const binary = (
			( ( ( digest[ offset ] || 0 ) & 0x7f ) << 24 ) |
			( ( ( digest[ offset + 1 ] || 0 ) & 0xff ) << 16 ) |
			( ( ( digest[ offset + 2 ] || 0 ) & 0xff ) << 8 ) |
			( ( digest[ offset + 3 ] || 0 ) & 0xff )
		)

		const token = binary % Math.pow( 10, digits )

		return Otp.padStart( String( token ), digits, '0' )
	}


	/**
	 * Takes a OTP secret and derives the HMAC key for use in token generation.
	 *
	 * @param secret	The OTP secret.
	 * @param encoding	The OTP secret encoding.
	 *
	 * @returns The HMAC HEX Key.
	 */
	static HmacKey(
		secret	: string,
		encoding: OTP.Encoding,
	)
	{
		if ( encoding !== 'base32' ) {
			return (
				Buffer.from( secret, encoding )
					.toString( 'hex' )
			)
		}
		return (
			Buffer.from(
				Base32.decode( secret, Otp.Base32Variant )
			).toString( 'hex' )
		)
	}


	/**
	 * Create HMAC digest.
	 *
	 * @param	algorithm	The HMAC algorithm. Usually `SHA-1` is used for the 20 bytes HEX secret key.
	 * @param	hmacKey		The HMAC key derived from OTP secret. @see {@link OTP.HmacKey}.
	 * @param	counter		The OTP counter number.
	 *
	 * @returns	The HMAC digest.
	 */
	static createDigest(
		algorithm	: Algo.Hash,
		hmacKey		: string,
		counter		: number,
	)
	{
		return (
			Hmac.digest(
				Buffer.from( counter.toString(), 'hex' ),
				Buffer.from( hmacKey, 'hex' ),
				algorithm
			)
		)
	}


	protected static padStart = padStart


	/**
	 * Generate 20 bytes HMAC-SHA-1 HEX secret associated with the given string.
	 *
	 * @param string ( Optional ) The string to encrypt into the HMAC secret key.
	 *
	 * @returns The 20 bytes SHA-1 HEX secret key.
	 */
	static Seed( string?: string )
	{
		return (
			Hmac.digest(
				string || generateKey( 4 ), generateKey(), 'SHA-1', 'hex'
			).toUpperCase()
		)
	}


	/**
	 * Generates a key of a certain length (default 32) from A-Z, a-z, 0-9, and symbols (if requested).
	 *
	 * @param	length	( Optional ) The lenght of the key. Default: `40`.
	 * @param	symbols	( Optional ) Whether to use symbols or not. Default: `false`.
	 *
	 * @returns	The generated key.
	 */
	static GenerateSecretASCII( length: number = 40, symbols: boolean = false )
	{
		const bytes = crypto.randomBytes( length )
		const set = (
			'0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz' + (
				symbols ? '!@#$%^&*()<>?/[]{},.:;' : ''
			)
		)

		let output = ''
		for ( let index = 0, l = bytes.length; index < l; index++ ) {
			output += (
				set[
					Math.floor( ( bytes[ index ] || 0 ) / 255 * ( set.length - 1 ) )
				]
			)
		}

		return output
	}


	/**
	 * Get the otpauth URL string.
	 *
	 * https://docs.yubico.com/yesdk/users-manual/application-oath/uri-string-format.html
	 *
	 * @param	options The AuthURLOptions object.
	 * @returns	The otpauth URL string.
	 */
	protected static GetAuthURL<T extends OTP.Type>( options: OTP.AuthURLOptions<T> )
	{
		options.secret.algorithm||= Otp.Algorithm
		options.secret.encoding	||= Otp.Encoding
		options.digits			||= Otp.Digits

		const { type }	= options
		let { key }		= options.secret
		const algorithm	= options.secret.algorithm.replace( /-/g, '' ).toUpperCase()


		if ( options.secret.encoding !== 'base32' ) {
			key = Base32.encode( Buffer.from( key, options.secret.encoding ), Otp.Base32Variant )
		}

		const query: UrlObject[ 'query' ] = {
			secret		: key.toString(),
			algorithm	: algorithm,
			digits		: options.digits,
		}
		if ( options.issuer ) query.issuer = options.issuer

		if ( type === 'hotp' ) {
			query.counter = options.counter
		}
		if ( type === 'totp' && options.period ) query.period = options.period

		return (
			format(
				{
					protocol: 'otpauth',
					hostname: type,
					// pathname: encodeURIComponent( options.label ),
					pathname: options.label,
					slashes	: true,
					query	: query,
				}
			)
		)
	}


	/**
	 * Retrieve the Secret Key in different encodings.
	 *
	 * @param	options The GetSecretsOptions object.
	 * @returns	An object with Secret Key in different encodings, indexed by encoding name.
	 */
	static GetSecrets( options: OTP.GetSecretsOptions )
	{
		options.secret.encoding ||= Otp.Encoding

		return (
			Object.fromEntries(
				( [ 'ascii', 'hex', 'base64url', 'base32' ] as OTP.Encoding[] )
					.map( enc => {

						if ( enc === options.secret.encoding ) {
							return [ enc, options.secret.key ]
						}

						if ( enc === 'base32' ) {
							// secret is not base32 so we need to decode from standard encoding and encode it in base32
							return (
								[ enc, Base32.encode(
									Buffer.from( options.secret.key, options.secret.encoding as BufferEncoding ),
									Otp.Base32Variant
								) ]
							)
						}

						if ( options.secret.encoding === 'base32' ) {
							// secret is base32 so we decode it and transform to the requested encoding.
							return (
								[ enc, (
									Buffer.from(
										Base32.decode( options.secret.key, Otp.Base32Variant )
									).toString( enc )
								) ]
							)
						}

						return (
							[ enc, (
								Buffer.from( options.secret.key, options.secret.encoding )
									.toString( enc )
							) ]
						)

					} )
			) as OTP.Secrets
		)

	}
}


export default Otp