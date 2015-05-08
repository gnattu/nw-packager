
_frame.app_main.processing_running = false

_frame.app_main.processing_init = function( wrapper ){
	_g.gen_title( 'h2', 'Packaging...' ).appendTo( wrapper )

	_frame.app_main.processing_dombody = wrapper.parent()
	_frame.app_main.processing_domwrapper = wrapper
	_frame.app_main.processing_domlog = $('<div class="log"/>').appendTo( wrapper )
}


_frame.app_main.processing_on = function(){
	console.log( 'processing: ON' )

	// 如果 package_path 变量非法，表明项目目录未正确选择，以下步骤不予执行
	// 如果正在运行，则不予执行
		if( !package_path || _frame.app_main.processing_running )
			return false

	_frame.app_main.processing_running = true

	var zipped_files = []
		,zip_folder = null
		,__options = {}

	// 如果使用 Launcher
		function step_launcher( next_step ){
			function step_launcher_init( _next_step ){
				// 将原始的 package.json 重命名为 package-app.json
					node.fs.renameSync(
						node.path.join(package_path, 'package.json'),
						node.path.join(package_path, 'package-app.json')
					)
					_frame.app_main.processing_log('package.json renamed to package-app.json.');

				// 如果有 Splash，复制
					if( builderOptions['launcherSplash'] ){
						ncp(
							builderOptions['launcherSplash']
							, node.path.join( package_path, '/____launcher____' )
							, function (err) {
								if (err) {
									return console.error(err);
								}
								_frame.app_main.processing_log('launcher splash image copied.');
								_next_step()
							}
						);
					}else{
						_next_step()
					}
			}

			function step_launcher_copy( _next_step ){
				_frame.app_main.processing_log('copying launcher related files...');
				ncp(
					node.path.join( _g.root, '/app/launcher' )
					, node.path.join( package_path )
					, function (err) {
						if (err) {
							return console.error(err);
						}
						_frame.app_main.processing_log('launcher related files copied.');

						// 处理新的 package.json
							new_packageJSON = node.jsonfile.readFileSync( node.path.join( package_path, '/package.json' ) )
							new_packageJSON['name'] = packageJSON['name']
							new_packageJSON['version'] = packageJSON['version']
							node.jsonfile.writeFileSync(
								node.path.join( package_path, '/package.json' ),
								new_packageJSON
							)

						_next_step()
					}
				);
			}

			function step_launcher_zip( _next_step ){
				var dataRelative = builderOptions['dataRelative'] || []
					,complete_count = 0
					,completed = false

				zip_folder = node.path.join( node.gui.App.dataPath, '/___zip___' )
				node.mkdirp.sync( zip_folder )

				function generate_zip( name ){
					var zip 		= new node.archiver('zip',{
											'comment': 	builderOptions['dataVersion'][name]
										})
						,zipfile 	= node.path.join( zip_folder, name + '.nwjs-data' )
						,stream 	= node.fs.createWriteStream(zipfile)
										.on('finish',function(err){
											_frame.app_main.processing_log(name + '.nwjs-data generated.')
											complete_count++
											complete_check()
										})
					zip.directory(
						node.path.join(package_path, '/' + name),
						name
					);
					zip.pipe( stream )
					zip.finalize();

					zipped_files.push( zipfile )
				}

				function complete_check(){
					if( !completed && complete_count >= dataRelative.length ){
						completed = true
						_frame.app_main.processing_log('all data (.nwjs-data) files generated.')
						_next_step()
					}
				}

				for( var i in dataRelative ){
					generate_zip( dataRelative[i] )
				}
			}

			if( builderOptions['enableLauncher'] ){
				step_launcher_init(function(){
					step_launcher_copy(function(){
						step_launcher_zip( next_step )
					})
				})
				//step_launcher_zip( next_step )
			}else{
				next_step()
			}
		}

	// 处理选项
		function step_parse_options(){
			$.extend(__options, builderOptions)

			// files，编译文件列表
			// glob 格式
				//__options['files'] = package_path.replace(/\\/g, '/') + '/**'
				__options['files'] = []
				for( var i in __options['filesRelative'] ){
					__options['files'].push(
						node.path.join(package_path, '/' + __options['filesRelative'][i]).replace(/\\/g, '/')
							+ ( $.inArray(__options['filesRelative'][i], _frame.app_main.files_select_folders) > -1 ? '/**' : '' )
					)
				}
				if( builderOptions['enableLauncher'] ){
					__options['files'].push( node.path.join(package_path, '/____launcher____.html').replace(/\\/g, '/') )
					__options['files'].push( node.path.join(package_path, '/package-app.json').replace(/\\/g, '/') )
					if( builderOptions['launcherSplash'] ){
						__options['files'].push( node.path.join(package_path, '/____launcher____').replace(/\\/g, '/') )
					}
				}

			// 遍历选项，处理其他 glob 格式
				for( var i in __options ){
					switch( i ){
						case 'buildDir':
						case 'winIco':
							__options[i] = __options[i].replace(/\\/g, '/')
							break;
					}
				}

			// 删除 nwbuild 不使用的项目
				delete __options['enableLauncher']
				delete __options['launcherSplash']
				delete __options['filesRelative']
				delete __options['dataRelative']
				delete __options['dataVersion']

			// Log
				console.log( __options )

			// 执行下一步
				step_build()
		}

	// 使用 node-webkit-builder 进行编译
		function step_build(){
			var builder = new NwBuilder(__options);
			//Log stuff you want
				builder.on('log', _frame.app_main.processing_log);
			// Build returns a promise
				builder.build().then(function () {
					_frame.app_main.processing_log('builder done!');
					step_last()
				}).catch(function (error) {
					console.error(error);
				});
		}

	// “善后”处理
		function step_last(){
			if( builderOptions['enableLauncher'] ){
				// 删除 launcher 相关文件
					node.fs.unlinkSync( node.path.join(package_path, '____launcher____') )
					node.fs.unlinkSync( node.path.join(package_path, '____launcher____.html') )
					node.fs.unlinkSync( node.path.join(package_path, 'package.json') )
					_frame.app_main.processing_log('launcher related files deleted.');

				// 复制数据文件
					if( zipped_files.length ){
						for( var i in __options['platforms'] ){
							var platform = __options['platforms'][i]
							switch( platform ){
								case 'osx32':
								case 'osx64':
									node['fs-extra'].copySync(
										zip_folder,
										node.path.join(
											builderOptions['buildDir']
											, packageJSON['name']
											, platform
											, packageJSON['name'] + '.app'
											, 'Contents/Resources/app.nw'
											, 'data'
										)
									)
									break;
								default:
									node['fs-extra'].copySync(
										zip_folder,
										node.path.join(
											builderOptions['buildDir']
											, packageJSON['name']
											, platform
											, 'data'
										)
									)
									break;
							}
							_frame.app_main.processing_log('data files copied for ' + platform + '.');
						}
					}

				// 删除数据文件
					// zipped_files

				// 将原始的 package-app.json 重命名为 package.json
					node.fs.renameSync(
						node.path.join(package_path, 'package-app.json'),
						node.path.join(package_path, 'package.json')
					)
					_frame.app_main.processing_log('package-app.json renamed to package.json.');
			}

			_frame.app_main.processing_log('all process completed!');
			_frame.app_main.processing_running = false
		}


	// 开始流程
		step_launcher( step_parse_options )
}



_frame.app_main.processing_log = function( content ){
	console.log( content )

	var now = new Date()
		,allLines = _frame.app_main.processing_domlog.children('p')

	if( allLines.length > 100 )
		allLines.eq(0).remove()

	_frame.app_main.processing_domlog
		.append(
			$('<p/>').html(
				'<em>'+_g.formatTime(new Date(), '%H:%i:%s')+'</em>'
				+ '<span>'+content+'</span>'
			)
		)

	_frame.app_main.processing_dombody.scrollTop(_frame.app_main.processing_domwrapper[0].clientHeight)
}