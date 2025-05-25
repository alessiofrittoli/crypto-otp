import { Totp } from '@/Totp'
import type { OTP } from '@/types'

const hexSecret		= 'DC0E3D9E461BC0341F6C451B848B312DE9537EB7'
const base64Secret	= Buffer.from( hexSecret, 'hex' ).toString( 'base64url' )
const base32Secret	= 'L5WNCK5A5SHCZNOIUTFHJ7GNCFWEGGY5'

/**
 * ⚠️ in the following unit tests we are required to pass a static `time` so we can statically check results. ⚠️
 */


describe( 'Totp.GetToken()', () => {

	const options: OTP.TOTP.GetTokenOptions = {
		secret: { key: hexSecret },
	}

	it( 'generates a 6 digits token', () => {
		const token = Totp.GetToken( { ...options } )
		expect( token.length ).toBe( 6 )
	} )


	it( 'generates a 7 digits token', () => {
		const token = (
			Totp.GetToken( { ...options, digits: 7 } )
		)
		expect( token.length ).toBe( 7 )
	} )


	it( 'generates a 8 digits token', () => {
		const token = (
			Totp.GetToken( { ...options, digits: 8 } )
		)
		expect( token.length ).toBe( 8 )
	} )


	it( 'generates different tokens overtime', () => {
		const token1 = (
			Totp.GetToken( { ...options, time: new Date( '2024-12-13T16:00:00.000Z' ).getTime() / 1000 } )
		)
		const token2 = (
			Totp.GetToken( { ...options, time: new Date( '2024-12-13T16:00:30.000Z' ).getTime() / 1000 } )
		)
		
		expect( token1 ).not.toBe( token2 )
	} )


	it( 'supports 15 seconds period', () => {
		const token1 = (
			Totp.GetToken( { ...options, period: 15, time: new Date( '2024-12-13T16:00:00.000Z' ).getTime() / 1000 } )
		)
		const token2 = (
			Totp.GetToken( { ...options, period: 15, time: new Date( '2024-12-13T16:00:14.000Z' ).getTime() / 1000 } )
		)
		const token3 = (
			Totp.GetToken( { ...options, period: 15, time: new Date( '2024-12-13T16:00:15.000Z' ).getTime() / 1000 } )
		)
		
		expect( token1 ).toBe( token2 )
		expect( token1 ).not.toBe( token3 )
	} )


	it( 'supports 30 seconds period', () => {
		const token1 = (
			Totp.GetToken( { ...options, time: new Date( '2024-12-13T16:00:00.000Z' ).getTime() / 1000 } )
		)
		const token2 = (
			Totp.GetToken( { ...options, time: new Date( '2024-12-13T16:00:29.000Z' ).getTime() / 1000 } )
		)
		const token3 = (
			Totp.GetToken( { ...options, time: new Date( '2024-12-13T16:00:30.000Z' ).getTime() / 1000 } )
		)
		
		expect( token1 ).toBe( token2 )
		expect( token1 ).not.toBe( token3 )
	} )


	it( 'supports 60 seconds period', () => {
		const token1 = (
			Totp.GetToken( { ...options, period: 60, time: new Date( '2024-12-13T16:00:00.000Z' ).getTime() / 1000 } )
		)
		const token2 = (
			Totp.GetToken( { ...options, period: 60, time: new Date( '2024-12-13T16:00:59.000Z' ).getTime() / 1000 } )
		)
		const token3 = (
			Totp.GetToken( { ...options, period: 60, time: new Date( '2024-12-13T16:01:00.000Z' ).getTime() / 1000 } )
		)
		
		expect( token1 ).toBe( token2 )
		expect( token1 ).not.toBe( token3 )
	} )


	it( 'supports base32 secret key', () => {
		const token = (
			Totp.GetToken( {
				time	: new Date( '2024-12-13T16:00:00.000Z' ).getTime() / 1000,
				secret	: {
					key			: base32Secret,
					encoding	: 'base32',
				},
			} )
		)
		expect( token ).toBe( '458577' )
	} )


	it( 'supports base64url secret key', () => {
		const token = (
			Totp.GetToken( {
				time	: new Date( '2024-12-13T16:00:00.000Z' ).getTime() / 1000,
				secret	: {
					key			: base64Secret,
					encoding	: 'base64url',
				},
			} )
		)
		expect( token ).toBe( '525594' )
	} )

} )


describe( 'Totp.Counter()', () => {

	it( 'generates a counter based on current Date timestamp', () => {
		expect( Totp.Counter() )
			.toBeGreaterThan( 0 )
	} )


	it( 'generates a different counter for different time spans', () => {
		const counter1 = Totp.Counter( {
			time: new Date( '2024-12-13T16:00:00.000Z' ).getTime() / 1000
		} )
		const counter2 = Totp.Counter( {
			time: new Date( '2024-12-13T16:00:30.000Z' ).getTime() / 1000
		} )

		expect( counter1 ).not.toBe( counter2 )
	} )
	
} )


describe( 'Totp.NextTick()', () => {	
	
	it( 'returns the next Date object when the counter will be updated', () => {

		expect( Totp.NextTick() )
			.toBeInstanceOf( Date )
		
		const date		= new Date( '2024-12-13T16:00:00.000Z' )
		const time		= date.getTime() / 1000
		const expected	= new Date( date.getTime() + ( Totp.Period * 1000 ) )

		expect( Totp.NextTick( { time } ).getTime() )
			.toBe( expected.getTime() )
			
	} )

} )


describe( 'Totp.AuthURL()', () => {

	it( 'parses Auth URL correctly', () => {
		const secrets = Totp.GetSecrets( {
			secret: { key: hexSecret }
		} )
		const counter = Totp.Counter( {
			time: new Date( '2024-12-13T16:00:00.000Z' ).getTime() / 1000
		} )

		const url = new URL( Totp.AuthURL( {
			label	: 'example@email.com',
			digits	: 8,
			counter	: counter,
			period	: 60,
			secret	: { key: hexSecret },
			issuer	: 'Issuer',
		} ) )
		const params = url.searchParams		
		
		expect( url.protocol ).toBe( 'otpauth:' )
		expect( url.host ).toBe( 'totp' )
		expect( url.pathname ).toBe( '/example%40email.com' )
		expect( params.get( 'secret' ) ).toBe( secrets.base32 )
		expect( params.get( 'algorithm' ) ).toBe( 'SHA1' )
		expect( params.get( 'digits' ) ).toBe( '8' )
		expect( params.get( 'counter' ) ).toBe( null )
		expect( params.get( 'issuer' ) ).toBe( 'Issuer' )
		expect( params.get( 'period' ) ).toBe( '60' )

	} )

} )


describe( 'Totp.GetDelta()', () => {

	const options: OTP.TOTP.GetTokenOptions = {
		secret: { key: hexSecret },
	}

	const time = new Date( '2024-12-13T16:00:00.000Z' ).getTime() / 1000

	it( 'returns 0 with the same time', () => {
		expect( Totp.GetDelta( {
			...options,
			token	: Totp.GetToken( { ...options, time } ),
			time	: time,
		} ) ).toBe( 0 )
	} )


	it( 'handles window', () => {
		expect( Totp.GetDelta( {
			...options,
			token	: Totp.GetToken( { ...options, time } ),
			time	: time - 31,
			window	: 2,
		} ) ).toBe( 2 )

		expect( Totp.GetDelta( {
			...options,
			token	: Totp.GetToken( { ...options, time } ),
			time	: time - 61,
			window	: 2,
		} ) ).toBe( null )

	} )


	it( 'handles 2 sided window', () => {
		expect( Totp.GetDelta( {
			...options,
			token	: Totp.GetToken( { ...options, time } ),
			time	: time + 30,
			window	: 3,
		} ) ).toBe( -1 )
	} )


	it( 'throws a new Exception when no token is provided', () => {
		let pass = false

		try {
			// @ts-expect-error negative testing
			Totp.GetDelta( { ...options } )
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch ( error ) {
			pass = true
		}

		expect( pass ).toBe( true )
	} )

} )


describe( 'Totp.Verify()', () => {

	const options: OTP.HOTP.GetTokenOptions = {
		secret: { key: hexSecret },
	}

	const time = new Date( '2024-12-13T16:00:00.000Z' ).getTime() / 1000

	it( 'validates a token correctly', () => {
		expect( Totp.Verify( {
			...options,
			token	: Totp.GetToken( { ...options, time } ),
			time	: time,
		} ) ).toBe( true )

		expect( Totp.Verify( {
			...options,
			token	: Totp.GetToken( { ...options, time } ),
			time	: time + 29,
		} ) ).toBe( true )
		
		expect( Totp.Verify( {
			...options,
			token	: Totp.GetToken( { ...options, time } ),
			time	: time - 31,
		} ) ).toBe( false )

		expect( Totp.Verify( {
			...options,
			token	: Totp.GetToken( { ...options, time } ),
			time	: time + 30,
		} ) ).toBe( false )
	} )


	it( 'handles window', () => {
		expect( Totp.Verify( {
			...options,
			token	: Totp.GetToken( { ...options, time } ),
			time	: time - 29,
			window	: 1,
		} ) ).toBe( true )

		expect( Totp.Verify( {
			...options,
			token	: Totp.GetToken( { ...options, time } ),
			time	: time + 30,
			window	: 1,
		} ) ).toBe( true )
	} )

} )