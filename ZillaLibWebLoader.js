/*
  ZillaLib
  Copyright (C) 2010-2019 Bernhard Schelling

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
		if (id ==       'BOOT') return 'Error during startup. Your browser might not support WebAssembly. Please update it to the latest version.';
		if (id ==      'WEBGL') return 'Your browser or graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br>Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.';
		if (id ==      'CRASH') return 'The game crashed.';
		if (id ==        'MEM') return 'The game ran out of memory.';
		if (id ==  'LOAD_GAME') return 'Loading Game...';
		if (id == 'LOAD_ERROR') return 'Failed to load asset data.';
	};

	var container = document.getElementById(container_div_name);
	max_width = Math.min(max_width, Math.max(screen.width, screen.height))
	container.style.cssText = 'text-align:center;line-height:0';

	var canvas = document.createElement('canvas');
	canvas.style.cssText = 'width:100%;max-width:'+max_width+'px;vertical-align:top';
	canvas.oncontextmenu = function(e) { e.preventDefault() };
	canvas.width = canvas.height = 0;
	container.appendChild(canvas);
	window.ZL =
	{
		canvas: canvas,
		openUrl: function(url) { funcUrl(url); },
		error: function(code, msg) { funcStatus(null); funcError(L(code) + '<br><br>(' + msg + ')'); },
		started: function()
		{
			funcStatus(null);
			if (funcControls) funcControls('<input type="button" value="fullscreen" onclick="try{ZL.SetFullscreen(true)}catch(e){}">');
		}
	};
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = bin_base + '.js';
	(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
	funcStatus(L('LOAD_GAME'));
}
