_frame.app_main.nwbuild_options_init = function( wrapper ){
	_g.gen_title( 'h2', 'Packager options' ).appendTo( wrapper )

	_frame.app_main.nwbuild_options_form = $('<form/>')
				.on('submit',function(e){
					_frame.app_main.nwbuild_options_submit()
					e.preventDefault()
				}).appendTo(wrapper)

	_frame.app_main.fields['platforms']
		= _g.gen_form_line(
			'checkboxes',
			'platforms',
			'Platforms to build',
			[
				['win32', true],
				['win64', true],
				['osx32', true],
				['osx64', true],
				['linux32', false],
				['linux64', false]
			],
			null,
			{
				'onchange': 	function(e){
					var value = []
					_frame.app_main.fields['platforms'].children('input[name="platforms"]:checked').each(function(){
						value.push( $(this).val() )
					})
					_g.update_options({
						'platforms': 	value
					}, true)
				}
			}
		).appendTo( _frame.app_main.nwbuild_options_form )

	// appName
		// overrite original ?

	// appVersion
		// overrite original ?

	// buildType

	// macCredits

	_frame.app_main.fields['macIcns']
		= _g.gen_form_line(
			'file',
			'macIcns',
			'ICNS for icon, MAC ONLY',
			null,
			null,
			{
				'accept': 		'.icns',
				'onchange': 	function(e){
					_g.update_options({
						'macIcns': 	node.path.normalize( $(e.target).val() )
					})
				}
			}
		).appendTo( _frame.app_main.nwbuild_options_form )

	// macZip

	// macPlist

	_frame.app_main.fields['winIco']
		= _g.gen_form_line(
			'file',
			'winIco',
			'ICO for icon, WINDOWS ONLY',
			null,
			null,
			{
				'accept': 		'.ico',
				'onchange': 	function(e){
					_g.update_options({
						'winIco': 	node.path.normalize( $(e.target).val() )
					})
				}
			}
		).appendTo( _frame.app_main.nwbuild_options_form )

	// platformOverrides
}



_frame.app_main.nwbuild_options_on = function(){
	console.log( 'nwbuild_options: ON' )
}



_frame.app_main.nwbuild_options_submit = function(){
	console.log( 'nwbuild_options: SUBMIT' )
	return true
}
