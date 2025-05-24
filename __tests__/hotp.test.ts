import { Hotp } from '@/Hotp'
import type { OTP } from '@/types'

const hexSecret		= 'DC0E3D9E461BC0341F6C451B848B312DE9537EB7'
const base64Secret	= Buffer.from( hexSecret, 'hex' ).toString( 'base64url' )
const base32Secret	= 'L5WNCK5A5SHCZNOIUTFHJ7GNCFWEGGY5'


describe( 'Hotp.Get()', () => {

	it( 'returns all details', () => {
		// @ts-expect-error testing default values
		const hotp = Hotp.Get( {
			secret	: { key: hexSecret },
			label	: 'email@example.com',
			issuer	: 'Issuer',
		} )

		expect( hotp.code ).toBe( '522465' ) // this may fail if secret changes
		expect( hotp.counter ).toBe( 0 )
		expect( hotp.digits ).toBe( 6 )
		expect( hotp.label ).toBe( 'email@example.com' )
		expect( hotp.issuer ).toBe( 'Issuer' )
		expect( hotp.authUrl ).toBe( 'otpauth://hotp/email@example.com?secret=3QHD3HSGDPADIH3MIUNYJCZRFXUVG7VX&algorithm=SHA1&digits=6&issuer=Issuer&counter=0' )
		expect( hotp.secret ).toEqual( {
			key			: hexSecret,
        	algorithm	: 'SHA-1',
        	encoding	: 'hex'
		} )
		expect( hotp.secrets ).toEqual( {
			ascii		: '\\\x0E=\x1EF\x1B@4\x1FlE\x1B\x04\x0B1-iS~7',
			hex			: hexSecret,
			base64url	: '3A49nkYbwDQfbEUbhIsxLelTfrc',
			base32		: '3QHD3HSGDPADIH3MIUNYJCZRFXUVG7VX'
      	} )

	} )
	
} )


describe( 'Hotp.GetToken()', () => {

	const options: OTP.HOTP.GetTokenOptions = {
		secret: { key: hexSecret },
	}

	it( 'generates a 6 digits token', () => {
		const token = Hotp.GetToken( options )
		expect( token ).toBe( '522465' )
		expect( token.length ).toBe( 6 )
	} )


	it( 'generates a 7 digits token', () => {
		const token = (
			Hotp.GetToken( { ...options, digits: 7 } )
		)
		expect( token ).toBe( '8522465' )
		expect( token.length ).toBe( 7 )
	} )


	it( 'generates a 8 digits token', () => {
		const token = (
			Hotp.GetToken( { ...options, digits: 8 } )
		)
		expect( token ).toBe( '48522465' )
		expect( token.length ).toBe( 8 )
	} )


	it( 'generates different tokens with different counters', () => {
		const token1 = (
			Hotp.GetToken( { ...options, counter: 10 } )
		)
		const token2 = (
			Hotp.GetToken( { ...options, counter: 11 } )
		)
		expect( token1 ).not.toBe( token2 )
	} )


	it( 'supports very large counter', () => {
		const token = (
			Hotp.GetToken( { ...options, counter: 2345434545234e+8 } )
		)
		expect( token ).toBe( '503834' )
	} )


	it( 'supports base32 secret key', () => {
		const token = (
			Hotp.GetToken( {
				counter	: 1,
				secret	: {
					key			: base32Secret,
					encoding	: 'base32',
				},
			} )
		)
		expect( token ).toBe( '949958' )
	} )


	it( 'supports base64url secret key', () => {
		const token = (
			Hotp.GetToken( {
				counter	: 1,
				secret	: {
					key			: base64Secret,
					encoding	: 'base64url',
				},
			} )
		)
		expect( token ).toBe( '059312' )
	} )

} )


describe( 'Hotp.Counter()', () => {

	it( 'returns the formatted counter', () => {
		expect( Hotp.Counter( 10 ) )
			.toBe( '000000000000000a' )
	} )


	it( 'supports very large numbers', () => {
		expect( Hotp.Counter( 2345434545234e+8 ) )
			.toBe( 'cb6f1bd397c3e0000' )
	} )

} )


describe( 'Hotp.AuthURL()', () => {

	it( 'uses default values for `counter` and `digits`', () => {
		const secrets = Hotp.GetSecrets( {
			secret: { key: hexSecret }
		} )

		// @ts-expect-error testing default values
		const url = new URL( Hotp.AuthURL( {
			label	: 'example@email.com',
			secret	: { key: hexSecret },
			issuer	: 'Issuer',
		} ) )
		const params = url.searchParams		
		
		expect( url.protocol ).toBe( 'otpauth:' )
		expect( url.host ).toBe( 'hotp' )
		expect( url.pathname ).toBe( '/example@email.com' )
		expect( params.get( 'secret' ) ).toBe( secrets.base32 )
		expect( params.get( 'algorithm' ) ).toBe( 'SHA1' )
		expect( params.get( 'digits' ) ).toBe( '6' )
		expect( params.get( 'counter' ) ).toBe( '0' )
		expect( params.get( 'issuer' ) ).toBe( 'Issuer' )

	} )


	it( 'parses Auth URL correctly', () => {
		const secrets = Hotp.GetSecrets( {
			secret: { key: hexSecret }
		} )

		const url = new URL( Hotp.AuthURL( {
			label	: 'example@email.com',
			digits	: 8,
			counter	: 10,
			secret	: { key: hexSecret },
			issuer	: 'Issuer',
		} ) )
		const params = url.searchParams		
		
		expect( url.protocol ).toBe( 'otpauth:' )
		expect( url.host ).toBe( 'hotp' )
		expect( url.pathname ).toBe( '/example@email.com' )
		expect( params.get( 'secret' ) ).toBe( secrets.base32 )
		expect( params.get( 'algorithm' ) ).toBe( 'SHA1' )
		expect( params.get( 'digits' ) ).toBe( '8' )
		expect( params.get( 'counter' ) ).toBe( '10' )
		expect( params.get( 'issuer' ) ).toBe( 'Issuer' )

	} )
	
} )


describe( 'Hotp.GetDelta()', () => {

	const options: OTP.HOTP.GetTokenOptions = {
		secret: { key: hexSecret },
	}

	it( 'returns 0 with the same counter', () => {
		expect( Hotp.GetDelta( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 11 } ),
			counter	: 11,
		} ) ).toBe( 0 )
	} )


	it( 'handles window', () => {
		expect( Hotp.GetDelta( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 11 } ),
			counter	: 9,
			window	: 2,
		} ) ).toBe( 2 )

		expect( Hotp.GetDelta( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 12 } ),
			counter	: 9,
			window	: 2,
		} ) ).toBe( null )

		expect( Hotp.GetDelta( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 9 } ),
			counter	: 12,
			window	: 3,
		} ) ).toBe( null )
	} )


	it( 'handles 2 sided window', () => {
		expect( Hotp.GetDelta( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 9 } ),
			counter	: 12,
			window	: 3,
		}, true ) ).toBe( -3 )
	} )


	it( 'sets default counter to 0', () => {

		expect(
			Hotp.GetDelta( {
				...options,
				token: Hotp.GetToken( { ...options } )
			} )
		).toBe( 0 )
		
	} )


	it( 'returns `null` if given token length is different than expected digits', () => {

		expect(
			Hotp.GetDelta( {
				...options,
				digits	: 8,
				token	: Hotp.GetToken( { ...options, digits: 7 } )
			} )
		).toBe( null )
		
	} )


	it( 'returns `null` if given token has non-numeric value', () => {

		expect(
			Hotp.GetDelta( {
				...options,
				digits	: 7,
				token	: 'non-num'
			} )
		).toBe( null )
		
	} )


	it( 'throws a new Exception when no token is provided', () => {

		expect( () => {
			// @ts-expect-error negative testing
			Hotp.GetDelta( { ...options, counter: 8 } )
		} ).toThrow( 'No token has been provided.' )
		
	} )

} )


describe( 'Hotp.Verify()', () => {

	const options: OTP.HOTP.GetTokenOptions = {
		secret: { key: hexSecret },
	}

	it( 'validates a token correctly', () => {
		expect( Hotp.Verify( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 9 } ),
			counter	: 9,
		} ) ).toBe( true )


		expect( Hotp.Verify( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 9 } ),
			counter	: 8,
		} ) ).toBe( false )


		expect( Hotp.Verify( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 9 } ),
			counter	: 10,
		} ) ).toBe( false )
	} )


	it( 'handles window', () => {
		expect( Hotp.Verify( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 11 } ),
			counter	: 9,
			window	: 2,
		} ) ).toBe( true )

		expect( Hotp.Verify( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 12 } ),
			counter	: 9,
			window	: 2,
		} ) ).toBe( false )

		expect( Hotp.Verify( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 9 } ),
			counter	: 12,
			window	: 3,
		} ) ).toBe( false )
	} )


	it( 'doesn\'t allow older counters', () => {
		expect( Hotp.Verify( {
			...options,
			token	: Hotp.GetToken( { ...options, counter: 9 } ),
			counter	: 12,
			window	: 3,
		} ) ).toBe( false )
	} )

} )


describe( 'Hotp.ResolveOptions()', () => {

	const options: OTP.HOTP.GetTokenOptions = {
		secret	: { key: hexSecret },
	}

	it( 'resolves defaults options', () => {
		const resolved		= Hotp.ResolveOptions( options )
		const { secret }	= resolved

		expect( 'secret' in resolved ).toBe( true )
		expect( 'digits' in resolved ).toBe( true )
		expect( 'counter' in resolved ).toBe( true )

		expect( 'key' in secret ).toBe( true )
		expect( 'algorithm' in secret ).toBe( true )
		expect( 'encoding' in secret ).toBe( true )

		expect( secret.key ).toBe( hexSecret )
		expect( secret.algorithm ).toBe( 'SHA-1' )
		expect( secret.encoding ).toBe( 'hex' )

		expect( resolved.digits ).toBe( 6 )
		expect( resolved.counter ).toBe( 0 )
	} )
	
} )