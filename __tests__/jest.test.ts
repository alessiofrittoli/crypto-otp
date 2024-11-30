describe( 'Jest', () => {

	it( 'loads .env files correctly', () => {
		// Arrange ...
		const envVar = process.env.VAR_LOADED

		// Act ...
		const isLoaded = envVar === 'true'

		// Assert ...
		expect( isLoaded ).toBe( true )
	} )

} )