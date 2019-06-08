/*
  ZillaLib
  Copyright (C) 2010-2016 Bernhard Schelling

  This software is provided 'as-is', without any express or implied
  warranty.  In no event will the authors be held liable for any damages
  arising from the use of this software.

  Permission is granted to anyone to use this software for any purpose,
  including commercial applications, and to alter it and redistribute it
  freely, subject to the following restrictions:

  1. The origin of this software must not be misrepresented; you must not
     claim that you wrote the original software. If you use this software
     in a product, an acknowledgment in the product documentation would be
     appreciated but is not required.
  2. Altered source versions must be plainly marked as such, and must not be
     misrepresented as being the original software.
  3. This notice may not be removed or altered from any source distribution.
*/

function LoadZillaLibApp(container_div_name, bin_base, max_width, funcStatus, funcError, funcUrl, funcControls)
{
	var L = function(id)
	{
		if (id ==    'NO_WEBGL') return 'Your browser or graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br>Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.';
		if (id ==     'IEWEBGL') return '<br><br>On Internet Explorer older than version 11 you can try the <a href="https://github.com/iewebgl/iewebgl" style="color:#000">IEWebGL</a> plugin.';
		if (id ==    'NO_PNACL') return 'Portable Native Client requires a newer version of Chromium or Google Chrome, please update.';
		if (id ==  'NACL_ERROR') return 'Error starting up Portable Native Client module.';
		if (id ==   'LOAD_GAME') return 'Loading Game...';
		if (id ==  'LOAD_ERROR') return 'Failed to load asset data.';
	};

	var container = document.getElementById(container_div_name);
	max_width = Math.min(max_width, Math.max(screen.width, screen.height))
	container.style.cssText = 'text-align:center';

	var disable_nacl = true;
	if (disable_nacl || !navigator.userAgent.match('Chrome/') || navigator.mimeTypes['application/x-pnacl'] == undefined)
	{
		var canvas = document.createElement('canvas');
		canvas.style.cssText = 'width:100%;max-width:'+max_width+'px';
		canvas.oncontextmenu = function(e) { e.preventDefault() };
		canvas.width = canvas.height = 0;
		container.appendChild(canvas);
		window.Module =
		{
			canvas: canvas,
			openUrl: function(url) { funcUrl(url); },
			print: function(text) { console.log(text); },
			postRun: function()
			{
				funcStatus(null);
				if (parseInt(navigator.userAgent.split('MSIE').slice(-1)[0]) < 11)
				{
					window.Module.canvas.outerHTML = '<object id="zliecanvas" type="application/x-webgl" style="' + window.Module.canvas.style.cssText + ' " oncontextmenu="event.preventDefault()" width="0" height="0"></object>';
					window.Module.canvas = document.getElementById('zliecanvas');
				}
				if (!window.Module.noExitRuntime) funcError(L('NO_WEBGL') + (parseInt(navigator.userAgent.split('MSIE').slice(-1)[0]) < 11 ? L('IEWEBGL') : ''));
				else if (funcControls) funcControls('<input type="button" value="fullscreen" onclick="try{_ZLJS_SetFullscreen(true)}catch(e){}">');
			}
		};
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = bin_base + '.js';
		(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
		funcStatus(L('LOAD_GAME'));
	}
	else
	{
		var url_pexe = bin_base + '.pexe';
		var module = document.createElement('embed');
		module.width = module.height = 1;
		module.type = 'application/x-pnacl';
		module.src = 'data:;,' + encodeURIComponent('{"program":{"portable":{"pnacl-translate":{"url":"' + url_pexe + '"}}}}');
		module.onerror = function(e) { funcError(L('NACL_ERROR')); }
		module.addEventListener('message', function(msg)
		{
			switch (msg.data.substr(0, 3))
			{
				case 'LOG':
					console.log(msg.data.substr(3));
					break;
				case 'NOG':
					funcError(L('NO_WEBGL'));
					break;
				case 'RDY':
					module.postMessage('PKG'+url_pexe);
					break;
				case 'PKE':
					funcError(L('LOAD_ERROR'));
					break;
				case 'PKD':
					module.postMessage('INI');
					break;
				case 'WIN':
					funcStatus(null);
					var size = msg.data.substr(3).match(/(\d+).(\d+)/);
					module.style.cssText = 'background:black;min-width:1px;min-height:1px;'+
						'width:100%;max-width:'+max_width+'px;height:' + Math.round(Math.min(container.clientWidth, max_width) * size[2] / size[1]) + 'px';
					module.width = size[1];
					module.height = size[2];
					module.postMessage('RUN');
					module.focus();
					if (funcControls) { window.Module = module; funcControls('<input type="button" value="fullscreen" onclick="window.Module.postMessage(\'FUL\')">'); }
					break;
				case 'URL':
					funcUrl(msg.data.substr(3));
					break;
				case 'GET':
					module.config = msg.data.substr(3);
					for (var a in localStorage) if (a.match('^'+module.config+' ')) module.postMessage('VAR'+(a.length-1-module.config.length)+a.substr(module.config.length)+localStorage[a]);
					break;
				case 'SET':
					var namelen = msg.data.match(/^SET(\d+) /);
					if (module.config) localStorage[module.config+' '+msg.data.substr(namelen[0].length, namelen[1])] = msg.data.substr(namelen[0].length+parseInt(namelen[1]));
					break;
				case 'DEL':
					if (module.config) localStorage.removeItem(module.config+' '+msg.data.substr(3));
					break;
			}
		}, true);
		window.addEventListener('resize', function(e)
		{
			if (!document['webkitFullScreenElement'] && !document['webkitFullscreenElement'] && !document['fullScreenElement'] && !document['fullscreenElement'])
				module.style.height = Math.round(module.clientWidth*module.height/module.width) + 'px';
		}, true);
		container.appendChild(module);
		if (module.readyState == undefined) { funcError(L('NO_PNACL')); return; }
		funcStatus(L('LOAD_GAME'));
	}
}
