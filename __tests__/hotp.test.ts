import Hotp from '@/Hotp'
import type OTP from '@/types'

const hexSecret		= 'DC0E3D9E461BC0341F6C451B848B312DE9537EB7'
const base64Secret	= Buffer.from( hexSecret, 'hex' ).toString( 'base64url' )
const base32Secret	= 'L5WNCK5A5SHCZNOIUTFHJ7GNCFWEGGY5'


describe( 'Hotp.Get()', () => {

	it( 'returns all details', () => {
		const hotp = Hotp.Get( {
			secret	: { key: hexSecret },
			label	: 'Issuer:email@example.com',
			counter	: 10,
		} )

		expect( 'code' in hotp ).toBe( true )
		expect( 'counter' in hotp ).toBe( true )
		expect( 'authUrl' in hotp ).toBe( true )
		expect( 'digits' in hotp ).toBe( true )
		expect( 'secret' in hotp ).toBe( true )
		expect( 'secrets' in hotp ).toBe( true )
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


	it( 'throws a new Exception when no token is provided', () => {
		let pass = false

		try {
			// @ts-expect-error negative testing
			Hotp.GetDelta( { ...options, counter: 8 } )
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch ( error ) {
			pass = true
		}

		expect( pass ).toBe( true )
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

	it( 'parses Auth URL correctly', () => {
		const secrets = Hotp.GetSecrets( {
			secret: { key: hexSecret }
		} )

		const url = new URL( Hotp.AuthURL( {
			label	: 'Issuer:example@email.com',
			digits	: 8,
			counter	: 10,
			secret	: { key: hexSecret },
			issuer	: 'Issuer',
		} ) )
		const params = url.searchParams		
		
		expect( url.protocol ).toBe( 'otpauth:' )
		expect( url.host ).toBe( 'hotp' )
		expect( url.pathname ).toBe( '/Issuer:example@email.com' )
		expect( params.get( 'secret' ) ).toBe( secrets.base32 )
		expect( params.get( 'algorithm' ) ).toBe( 'SHA1' )
		expect( params.get( 'digits' ) ).toBe( '8' )
		expect( params.get( 'counter' ) ).toBe( '10' )
		expect( params.get( 'issuer' ) ).toBe( 'Issuer' )

	} )
} )