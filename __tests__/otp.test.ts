import { Otp } from '@/Otp'

const hexSecret		= 'DC0E3D9E461BC0341F6C451B848B312DE9537EB7'
const base64Secret	= Buffer.from( hexSecret, 'hex' ).toString( 'base64url' )
const base32Secret	= 'IRBTARJTIQ4UKNBWGFBEGMBTGQYUMNSGIVJA===='

describe( 'Otp.Seed()', () => {

	const sn = '12345678'

	it( 'generates a 20 bytes HMAC-SHA-1 HEX secret', () => {
		
		expect( Otp.Seed( sn ).length )
			.toBe( 40 )
		
	} )


	it( 'produces always a unique result with the same input', () => {
		
		expect( Otp.Seed( sn ) )
			.not.toBe( Otp.Seed( sn ) )
		
	} )

} )


describe( 'Otp.GenerateSecretASCII()', () => {

	it( 'produces always a unique result', () => {
		
		expect( Otp.GenerateSecretASCII() )
			.not.toBe( Otp.GenerateSecretASCII() )
		
	} )


	it( 'supports symbols', () => {
		// eslint-disable-next-line no-useless-escape
		const format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

		expect( format.test( Otp.GenerateSecretASCII( undefined, true ) ) )
			.toBe( true )
		
	} )

} )


describe( 'Otp.HmacKey()', () => {

	it( 'derives a HEX key from HEX secret', () => {
		expect( Otp.HmacKey( hexSecret, 'hex' ) )
			.toBe( hexSecret.toLowerCase() )
	} )


	it( 'derives a HEX key from base32 secret', () => {
		expect( Otp.HmacKey( base32Secret, 'base32' ) )
			.toBe( '44433045334439453436314243303334314636464552' )
	} )


	it( 'derives a HEX key from base64url secret', () => {
		expect( Otp.HmacKey( base64Secret, 'base64url' ) )
			.toBe( hexSecret.toLowerCase() )
	} )
	
} )


describe( 'Otp.createDigest()', () => {
	
	it( 'creates a digest', () => {
		const zeroCounterDigest	= Otp.createDigest( 'SHA-256', Otp.HmacKey( hexSecret, 'hex' ), '0' )

		expect( zeroCounterDigest.toString( 'hex' ) )
			.toBe( 'dfb17b038bd02e5b52dc3701b85f0e219e4bc0ed4dff4d7ec249c31d15a3c80f' )
	} )


	it( 'creates different digests with different counters', () => {
		expect( Otp.createDigest( 'SHA-256', Otp.HmacKey( hexSecret, 'hex' ), '1' ) )
			.not.toBe( Otp.createDigest( 'SHA-256', Otp.HmacKey( hexSecret, 'hex' ), '2' ) )
	} )

} )


describe( 'Otp.DigestToToken()', () => {

	const zeroCounterDigest = Otp.createDigest( 'SHA-256', Otp.HmacKey( hexSecret, 'hex' ), '0' )

	it( 'generates a 6 digits token', () => {
		const token = (
			Otp.DigestToToken( zeroCounterDigest )
		)
		expect( token ).toBe( '022208' )
		expect( token.length ).toBe( 6 )
	} )


	it( 'generates a 7 digits token', () => {
		const token = (
			Otp.DigestToToken( zeroCounterDigest, 7 )
		)
		expect( token ).toBe( '4022208' )
		expect( token.length ).toBe( 7 )
	} )


	it( 'generates a 8 digits token', () => {
		const token = (
			Otp.DigestToToken( zeroCounterDigest, 8 )
		)
		expect( token ).toBe( '64022208' )
		expect( token.length ).toBe( 8 )
	} )


	it( 'generates different tokens with different counters', () => {
		const token1 = (
			Otp.DigestToToken( Otp.createDigest( 'SHA-256', Otp.HmacKey( hexSecret, 'hex' ), '10' ) )
		)
		const token2 = (
			Otp.DigestToToken( Otp.createDigest( 'SHA-256', Otp.HmacKey( hexSecret, 'hex' ), '11' ) )
		)
		expect( token1 ).not.toBe( token2 )
	} )

} )


describe( 'Otp.GetSecrets()', () => {

	it( 'retrieves secrets from HEX secret key', () => {
		const secrets = Otp.GetSecrets( {
			secret: { key: hexSecret }
		} )		
		expect( secrets.ascii ).toBe( '\\\x0E=\x1EF\x1B@4\x1FlE\x1B\x04\x0B1-iS~7' )
		expect( secrets.base64url ).toBe( base64Secret )
		expect( secrets.base32 ).toBe( '3QHD3HSGDPADIH3MIUNYJCZRFXUVG7VX' )
	} )


	it( 'retrieves secrets from base32 secret key', () => {
		const secrets = Otp.GetSecrets( {
			secret: { key: base32Secret, encoding: 'base32' }
		} )		
		expect( secrets.ascii ).toBe( 'DC0E3D9E461BC0341F6FER' )
		expect( secrets.hex ).toBe( '44433045334439453436314243303334314636464552' )
		expect( secrets.base64url ).toBe( 'REMwRTNEOUU0NjFCQzAzNDFGNkZFUg' )
	} )


	it( 'retrieves secrets from base64url secret key', () => {
		const secrets = Otp.GetSecrets( {
			secret: { key: base64Secret, encoding: 'base64url' }
		} )
		expect( secrets.ascii ).toBe( '\\\x0E=\x1EF\x1B@4\x1FlE\x1B\x04\x0B1-iS~7' )
		expect( secrets.hex ).toBe( hexSecret.toLowerCase() )
		expect( secrets.base32 ).toBe( '3QHD3HSGDPADIH3MIUNYJCZRFXUVG7VX' )
	} )

} )