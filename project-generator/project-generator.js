/*
  ZillaLib
  Copyright (C) 2010-2018 Bernhard Schelling

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

/**
 * @license
 * zlib.js
 * JavaScript Zlib Library
 * https://github.com/imaya/zlib.js
 *
 * The MIT License
 *
 * Copyright (c) 2012 imaya
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

function parse_project_zip(field, oldprojfile_contents)
{
	var isValid = false;
	if (!oldprojfile_contents)
	{
		var file = (field && field.files && field.files.length > 0 ? field.files[0] : undefined)
		if (file && file.size > 0 && file.size < 30000)
		{
			var reader = new FileReader();
			reader.onloadend = function(evt) { parse_project_zip(field, evt.target.result); };
			reader.readAsText(file);
			return;
		}
	}
	else
	{
		var form = field.form, matches;
		if (matches = oldprojfile_contents.match(new RegExp(
			'<ProjectName>([^<]+)</ProjectName>'+ //vcxproj
			'|Project File - Name="([^"]+)" - Package Owner'+ //dsp
			'|PRODUCT_NAME = ([^;]+);', //pbxproj
			'i'))) { isValid = true; form['proj'].value = matches.filter(function(n){return !!n}).slice(-1)[0].replace(/[^a-zA-Z0-9_]/g, ''); form['proj'].onchange(); }
		if (form['appname'].value == '') form['appname'].value = form['proj'].value;

		if (matches = oldprojfile_contents.match(new RegExp(
			'<ZillaLibDir>([^<]+)</ZillaLibDir>'+ //vcxproj
			'|ADD LINK32 "(.+?)/Debug-vc6/ZillaLib.lib"'+ //dsp
			'|path = "(.+?)/ZillaLib-iOS.xcodeproj"'+ //pbxproj
			'|path = "(.+?)/ZillaLib-OSX.xcodeproj"', //pbxproj
			'i'))) form['zillalibbase'].value = matches.filter(function(n){return !!n}).slice(-1)[0].replace(/[\"\']/g, '').replace(/\\/g, '/').replace(/[ \/]+$/, '').replace(/^ +/, '');

		if (matches = oldprojfile_contents.match(new RegExp('<ProjectGuid>{([^}]+)}</ProjectGuid>', 'i')))
			form['vcprojguid'].value = matches.filter(function(n){return !!n}).slice(-1)[0];

		form['with_chipmunk'].checked = false;
		form['with_spine'].checked = false;
		form['with_fluidsynth'].checked = false;
		form['with_midi'].checked = false;
		var add_srcfiles = [];
		var re = new RegExp(
			'<(?:ClCompile|ClInclude|Text|None) Include=["\']([^"\']+)'+ //vcxproj
			'|[\\r\\n]SOURCE=([^\\s\\n\\r]+)'+ //dsp
			'|lastKnownFileType\\s*=\\s*sourcecode\\.[hcpobjm\\.]+;[^}]*?path\\s*=\\s*["\']([^"\']+)'+ //pbxproj
			'|path\\s*=\\s*["\']([^"\']+)[^}]*?lastKnownFileType\\s*=\\s*sourcecode\\.[hcpobjm\\.]+;', //pbxproj
			'ig');
		while (matches = re.exec(oldprojfile_contents))
		{
			var add_srcfile = matches.filter(function(n){return !!n}).slice(-1)[0];
			add_srcfile = add_srcfile.replace(/\\/g, '/').replace(/^\.\//, '');
			if (!add_srcfile || add_srcfile.match(/\.rc$/i)) continue;
			if (add_srcfile.match(/\/Opt\/chipmunk\/chipmunk\./)       ) { form['with_chipmunk'].checked   = true; continue; }
			if (add_srcfile.match(/\/Opt\/spine\/spine\./)             ) { form['with_spine'].checked      = true; continue; }
			if (add_srcfile.match(/\/Opt\/fluidsynth\/ZL_FluidSynth\./)) { form['with_fluidsynth'].checked = true; continue; }
			if (add_srcfile.match(/\/Opt\/model\/ZL_Model\./)          ) { form['with_model'].checked      = true; continue; }
			if (add_srcfiles.indexOf(add_srcfile) < 0) add_srcfiles.push(add_srcfile);
		}
		form['add_srcfiles'].value = add_srcfiles.join('\n');

		var add_assets = [];
		var re = new RegExp(
			'<DataAssets(>[^<]+)'+ //vcxproj
			'|lastKnownFileType\\s*=\\s*(?:folder|file);[^}]*?path\\s*=\\s*["\']([^"\']+)'+ //pbxproj
			'|path\\s*=\\s*["\']([^"\']+)[^}]*?lastKnownFileType\\s*=\\s*(?:folder|file);', //pbxproj
			'ig');
		while (matches = re.exec(oldprojfile_contents))
		{
			var assets = matches.filter(function(n){return !!n}).slice(-1)[0];
			assets = (assets.charAt(0) == '>' ? assets.substr(1).split(/ +/) : [assets]);
			for (var asset in assets)
			{
				asset = assets[asset].replace(/\\/g, '/').replace(/^\.\//, '');
				if (!asset) continue;
				add_assets.push(asset);
			}
		}
		form['add_assets'].value = add_assets.join('\n');
	}
	if (!isValid) alert('Invalid project file selected - Make sure it is a ZillaLib project file (with file extension .vcxproj, .pbxproj or .dsp).');
}

function generate_project_zip(form)
{
	var proj = form['proj'].value.replace(/[^a-zA-Z0-9_]/g, '');
	if (!proj) proj = 'ZillaApp';

	var zillalibbase = form['zillalibbase'].value.replace(/[\"\']/g, '').replace(/\\/g, '/').replace(/[ \/]+$/, '').replace(/^ +/, '');
	if (!zillalibbase) zillalibbase = '../ZillaLib';
	var zillalibbase_is_relative = (zillalibbase.substr(0,2) == '..' || zillalibbase.substr(0,1) == '/' || zillalibbase.substr(1,1) == ':');

	var appname = form['appname'].value.replace(/[\"\']/g, '')
	if (!appname) appname = proj;

	var package_identifier_base = form['package_identifier_base'].value.replace(/[^a-zA-Z0-9_\.]/g, '').replace(/^[\. ]+|[\. ]+$/g, '');
	if (!package_identifier_base) package_identifier_base = 'org.zillalib';

	var assets_embed = form['assets_embed'].checked;
	var assets_mode = (form['assets_mode'].value ? form['assets_mode'].value : 'NONE');

	var with_scene = form['with_scene'].checked;
	var with_font  = form['with_font'].checked;
	var with_world = form['with_world'].checked;
	var with_todo  = form['with_todo'].checked;

	var for_vc6            = form['for_vc6'].checked;
	var for_vc9            = form['for_vc9'].checked;
	var for_vs             = form['for_vs'].checked;
	var for_linux          = form['for_linux'].checked;
	var for_osx            = form['for_osx'].checked;
	var for_android        = form['for_android'].checked;
	var for_androideclipse = false; //form['for_androideclipse'].checked;
	var for_ios            = form['for_ios'].checked;
	var for_wp8            = false; //form['for_wp8'].checked;
	var for_nacl           = form['for_nacl'].checked;
	var for_emscripten     = form['for_emscripten'].checked;

	var gen_makefile    = form['gen_makefile'].checked;
	var package_identifier = (package_identifier_base+'.'+proj.toLowerCase());
	var android_targetsdk = (form['android_targetsdk'] && form['android_targetsdk'].value && (form['android_targetsdk'].value|0) ? (form['android_targetsdk'].value|0) : 15);
	var smp_internet    = form['smp_internet'].checked;
	var android_vibrate = form['android_vibrate'].checked;
	var android_ads     = false;
	var sc_gitignore    = form['sc_gitignore'].checked;

	var with_chipmunk   = form['with_chipmunk'].checked;
	var with_spine      = form['with_spine'].checked;
	var with_fluidsynth = form['with_fluidsynth'].checked;
	var with_midi       = form['with_midi'].checked;
	var with_touchinput = form['with_touchinput'].checked;
	var with_model      = form['with_model'].checked;

	var srcfiles = [ 'include.h', 'main.cpp' ];
	if (with_scene)      srcfiles.push('SceneGame.cpp');
	if (with_world)      srcfiles.push('world.h', 'world.cpp');
	if (with_todo)       srcfiles.push('ToDo.txt');
	if (with_chipmunk)   srcfiles.push(zillalibbase+'/Opt/chipmunk/chipmunk.cpp');
	if (with_spine)      srcfiles.push(zillalibbase+'/Opt/spine/spine.cpp');
	if (with_fluidsynth) srcfiles.push(zillalibbase+'/Opt/fluidsynth/ZL_FluidSynth.cpp');
	if (with_model)      srcfiles.push(zillalibbase+'/Opt/model/ZL_Model.cpp');

	var font_file = 'fntMain.png';
	var assetdirs = [], assetfiles = [];
	if (assets_mode == 'DATA') assetdirs = ['Data'];
	else if (assets_mode == 'SOUNDTEX') assetdirs = ['Textures', 'Sounds'];
	if (!assetdirs) assetfiles.push(font_file);
	var font_dir = (assetdirs ? assetdirs[0]+'/' : '');

	var is_update_existing = (form['zipmode'] && form['zipmode'].value == 'EXI');
	var vcprojguid;
	if (is_update_existing)
	{
		vcprojguid = form['vcprojguid'].value;
		if (form['add_assets'].value)
		{
			var add_assets = form['add_assets'].value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '').split(/[ \t\r\n]+/)
			for (var add_asset in add_assets)
			{
				add_asset = add_assets[add_asset];
				var is_file = !!add_asset.match(/\..{1,4}$/);
				if (is_file && assetfiles.indexOf(add_asset) < 0) assetfiles.push(add_asset);
				if (!is_file && assetdirs.indexOf(add_asset) < 0) assetdirs.push(add_asset);
			}
		}
		if (form['add_srcfiles'].value)
		{
			srcfiles = form['add_srcfiles'].value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '').split(/[ \t\r\n]+/);
		}
	}

	var zip = new Zlib.Zip();
	var ziproot = proj+'/';

	var nl = ((for_vc6 || for_vc9 || for_vs) ? "\r\n" : "\n");

	var zipAddTextFile = function(text, filename, addbom)
	{
		zip.addFile(StringUTF8ToUint8(text, addbom), { filename: StringAsciiToUint8(filename) });
	};
	var zipAddBase64File = function(base64data, filename)
	{
		zip.addFile(Base64ToUint8(base64data), { filename: StringAsciiToUint8(filename) });
	};
	var makeRandomGuid = function()
	{
		var hex = '';
		while (hex.length < 32) hex += (Math.random()*0xFFFFFFF|0).toString(16);
		return hex.toUpperCase().replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/g, '$1-$2-$3-$4-$5')
	};

	if (!is_update_existing)
	{
		var generated_srcfiles = [];

		/**********************************************************************************************************************
		* include.h
		**********************************************************************************************************************/
		zipAddTextFile(
			'#ifndef _'+proj.toUpperCase()+'_INCLUDE_'+nl+
			'#define _'+proj.toUpperCase()+'_INCLUDE_'+nl+
			nl+
			'#include <ZL_Application.h>'+nl+
			'#include <ZL_Display.h>'+nl+
			'#include <ZL_Surface.h>'+nl+
			'#include <ZL_Signal.h>'+nl+
			'#include <ZL_Audio.h>'+nl+
			'#include <ZL_Font.h>'+nl+
			'#include <ZL_Scene.h>'+nl+
			'//#include <ZL_Display3D.h>'+nl+
			'//#include <ZL_Timer.h>'+nl+
			'//#include <ZL_Network.h>'+nl+
			'//#include <ZL_Input.h>'+nl+
			'//#include <ZL_Particles.h>'+nl+
			'//#include <ZL_SynthImc.h>'+nl+
			(with_midi       ? '#include <../Opt/ZL_Midi.h>'+nl : '')+
			(with_touchinput ? '#include <../Opt/ZL_TouchInput.h>'+nl : '')+
			(with_chipmunk   ? '#include <../Opt/chipmunk/chipmunk.h>'+nl : '')+
			(with_spine      ? '#include <../Opt/spine/spine.h>'+nl : '')+
			(with_fluidsynth ? '#include <../Opt/fluidsynth/ZL_FluidSynth.h>'+nl : '')+
			(with_model      ? '#include <../Opt/model/ZL_Model.h>'+nl : '')+
			nl+
			'#include <iostream>'+nl+
			'#include <map>'+nl+
			'#include <vector>'+nl+
			'#include <list>'+nl+
			'#include <algorithm>'+nl+
			'using namespace std;'+nl+
			nl+
			(!with_font ? '' :
				'extern ZL_Font fntMain;'+nl+
				nl)+
			(!with_scene ? '' :
				'#define SCENE_GAME 5'+nl+
				nl)+
			'#endif //_'+proj.toUpperCase()+'_INCLUDE_'+nl
		, ziproot+'include.h');
		generated_srcfiles.push('include.h');

		/**********************************************************************************************************************
		* main.cpp
		**********************************************************************************************************************/
		zipAddTextFile(
			'#include "include.h"'+nl+
			(!with_world ? '' :
				'#include "world.h"'+nl)+
			nl+
			(!with_font ? '' :
				'ZL_Font fntMain;'+nl+
				nl)+
			(!with_midi && !with_touchinput ? '' :
				'#define ZL_OPT_DO_IMPLEMENTATION'+nl+
				(with_midi       ? '#include <../Opt/ZL_Midi.h>'+nl : '')+
				(with_touchinput ? '#include <../Opt/ZL_TouchInput.h>'+nl : '')+
				nl)+
			'static struct s'+proj+' : public ZL_Application'+nl+
			'{'+nl+
			'	s'+proj+'() : ZL_Application(60) { }'+nl+
			''+nl+
			'	virtual void Load(int argc, char *argv[])'+nl+
			'	{'+nl+
			(assets_embed ?
				'		if (!ZL_Application::LoadReleaseDesktopDataBundle()) return;'+nl : 
				'		//if (!ZL_Application::LoadReleaseDesktopDataBundle("'+proj+'.dat")) return;'+nl)+
			'		if (!ZL_Display::Init("'+appname+'", 1280, 720, ZL_DISPLAY_ALLOWRESIZEHORIZONTAL)) return;'+nl+
			'		ZL_Display::ClearFill(ZL_Color::White);'+nl+
			'		ZL_Display::SetAA(true);'+nl+
			'		ZL_Audio::Init();'+nl+
			'		ZL_Application::SettingsInit("'+proj+'");'+nl+
			(!with_font ? '' :
				'		'+nl+
				'		fntMain = ZL_Font("'+font_dir+font_file+'");'+nl+
				'')+ //'		ZL_UI::Init(fntMain);'+nl)+
			(with_scene ? '' :
				'		'+nl+
				'		ZL_Display::sigKeyDown.connect(this, &s'+proj+'::OnKeyDown);'+nl)+
			(!with_world ? '' :
				'		'+nl+
				'		World.InitGlobal();'+nl)+
			(!with_scene ? '' :
				'		'+nl+
				'		ZL_SceneManager::Init(SCENE_GAME);'+nl)+
			'	}'+nl+
			(with_scene ? '' :
				''+nl+
				'	void OnKeyDown(ZL_KeyboardEvent& e)'+nl+
				'	{'+nl+
				'		if (e.key == ZLK_ESCAPE) Quit();'+nl+
				'	}'+nl)+
			(with_scene ? '' :
				''+nl+
				'	virtual void AfterFrame()'+nl+
				'	{'+nl+
				'		ZL_Display::FillGradient(0, 0, ZLWIDTH, ZLHEIGHT, ZLRGB(0,0,.3), ZLRGB(0,0,.3), ZLRGB(.4,.4,.4), ZLRGB(.4,.4,.4));'+nl+
				(!with_world ? '' :
					'		World.Draw();'+nl)+
				(!with_font ? '' :
					'		fntMain.Draw(ZLFROMW(50), ZLFROMH(30), ZL_String::format("%d", FPS));'+nl)+
				'	}'+nl)+
			(!with_scene || !with_font ? '' :
				''+nl+
				'	//display fps'+nl+
				'	//virtual void AfterFrame() { fntMain.Draw(ZLFROMW(50), ZLFROMH(30), ZL_String::format("%d", FPS)); }'+nl)+
			'} '+proj+';'+nl
		, ziproot+'main.cpp');
		generated_srcfiles.push('main.cpp');

		if (with_scene)
		{
			/**********************************************************************************************************************
			* SceneGame.cpp
			**********************************************************************************************************************/
			zipAddTextFile(
				'#include "include.h"'+nl+
				(!with_world ? '' :
				'#include "world.h"'+nl)+
				''+nl+
				'static struct sSceneGame : public ZL_Scene'+nl+
				'{'+nl+
				'	sSceneGame() : ZL_Scene(SCENE_GAME) { }'+nl+
				''+nl+
				'	void InitGlobal()'+nl+
				'	{'+nl+
				'	}'+nl+
				''+nl+
				'	void StartGame()'+nl+
				'	{'+nl+
				(!with_world ? '' :
				'		World.Init();'+nl)+
				'	}'+nl+
				''+nl+
				'	void InitAfterTransition()'+nl+
				'	{'+nl+
				'		ZL_Display::sigPointerDown.connect(this, &sSceneGame::OnPointerDown);'+nl+
				'		ZL_Display::sigPointerUp.connect(this, &sSceneGame::OnPointerUp);'+nl+
				'		ZL_Display::sigPointerMove.connect(this, &sSceneGame::OnPointerMove);'+nl+
				'		ZL_Display::sigKeyDown.connect(this, &sSceneGame::OnKeyDown);'+nl+
				'		ZL_Display::sigKeyUp.connect(this, &sSceneGame::OnKeyUp);'+nl+
				'		ZL_Display::sigActivated.connect(this, &sSceneGame::OnActivated);'+nl+
				'		StartGame();'+nl+
				'	}'+nl+
				''+nl+
				'	void DeInitLeave(ZL_SceneType SceneTypeTo)'+nl+
				'	{'+nl+
				'		ZL_Display::AllSigDisconnect(this);'+nl+
				'	}'+nl+
				''+nl+
				'	void OnPointerDown(ZL_PointerPressEvent& e)'+nl+
				'	{'+nl+
				'	}'+nl+
				''+nl+
				'	void OnPointerUp(ZL_PointerPressEvent& e)'+nl+
				'	{'+nl+
				'	}'+nl+
				''+nl+
				'	void OnPointerMove(ZL_PointerMoveEvent& e)'+nl+
				'	{'+nl+
				'	}'+nl+
				''+nl+
				'	void OnKeyDown(ZL_KeyboardEvent& e)'+nl+
				'	{'+nl+
				'		if (e.key == ZLK_ESCAPE) ZL_Application::Quit();'+nl+
				'	}'+nl+
				''+nl+
				'	void OnKeyUp(ZL_KeyboardEvent& e)'+nl+
				'	{'+nl+
				'	}'+nl+
				''+nl+
				'	void OnActivated(ZL_WindowActivateEvent& e)'+nl+
				'	{'+nl+
				'	}'+nl+
				''+nl+
				'	void Calculate()'+nl+
				'	{'+nl+
				(!with_world ? '' :
				'		World.Calculate();'+nl)+
				'	}'+nl+
				''+nl+
				'	void Draw()'+nl+
				'	{'+nl+
				'		ZL_Display::FillGradient(0, 0, ZLWIDTH, ZLHEIGHT, ZLRGB(0,0,.3), ZLRGB(0,0,.3), ZLRGB(.4,.4,.4), ZLRGB(.4,.4,.4));'+nl+
				(!with_world ? '' :
					'		World.Draw();'+nl)+
				(!with_font ? '' :
					'		fntMain.Draw(ZLFROMW(170), ZLFROMH(45), "Game Scene");'+nl)+
				'	}'+nl+
				'} SceneGame;'+nl
			, ziproot+'SceneGame.cpp');
			generated_srcfiles.push('SceneGame.cpp');
		}

		if (with_world)
		{
			/**********************************************************************************************************************
			* world.h
			**********************************************************************************************************************/
			zipAddTextFile(
				'#ifndef _'+proj.toUpperCase()+'_WORLD_'+nl+
				'#define _'+proj.toUpperCase()+'_WORLD_'+nl+
				nl+
				'#include "include.h"'+nl+
				nl+
				'struct sWorld'+nl+
				'{'+nl+
				'	void InitGlobal();'+nl+
				'	void Init();'+nl+
				'	void Calculate();'+nl+
				'	void Draw();'+nl+
				'};'+nl+
				nl+
				'extern sWorld World;'+nl+
				nl+
				'#endif //_'+proj.toUpperCase()+'_WORLD_'+nl
			, ziproot+'world.h');
			generated_srcfiles.push('world.h');

			/**********************************************************************************************************************
			* world.cpp
			**********************************************************************************************************************/
			zipAddTextFile(
				'#include "world.h"'+nl+
				nl+
				'sWorld World;'+nl+
				nl+
				'void sWorld::InitGlobal()'+nl+
				'{'+nl+
				'}'+nl+
				nl+
				'void sWorld::Init()'+nl+
				'{'+nl+
				'}'+nl+
				nl+
				'void sWorld::Calculate()'+nl+
				'{'+nl+
				'}'+nl+
				nl+
				'void sWorld::Draw()'+nl+
				'{'+nl+
				'	ZL_Display::DrawRect(s(100), s(100), s(200), s(200), ZL_Color::Yellow, ZL_Color::Green);'+nl+
				'}'+nl
			, ziproot+'world.cpp');
			generated_srcfiles.push('world.cpp');
		}

		if (with_todo)
		{
			/**********************************************************************************************************************
			* ToDo.txt
			**********************************************************************************************************************/
			zipAddTextFile(appname+' Todo:'+nl+nl, ziproot+'ToDo.txt');
			generated_srcfiles.push('ToDo.txt');
		}

		/**********************************************************************************************************************
		* Additional Source Files To be Included in Projects
		**********************************************************************************************************************/
		for (var srcfile in srcfiles)
		{
			srcfile = srcfiles[srcfile];
			if (generated_srcfiles.indexOf(srcfile) >= 0) continue;
			if (srcfile.indexOf('..') != 0) zipAddTextFile('', ziproot+srcfile);
		}
		generated_srcfiles = undefined;

		if (with_font)
		{
			/**********************************************************************************************************************
			* Font File: fntMain.png
			**********************************************************************************************************************/
			var fnt_data = 'iVBORw0KGgoAAAANSUhEUgAAATQAAAB4CAMAAABLsv4OAAABg1BMVEUAAAD'+
				'///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////'+
				'+AgID///+o5cZcAAAAgHRSTlMAcgL9v/Pv9wrHuz6HWvtCBgTT+a8MfvUIMuPxm8vPFHbDLucmEBgOtxynSm6zOBIs1+lOgyCXKDBQGmYk5du13RZUIpOrdGoq60bhekA0TGAezZE2Ot9Wn1zV2am5xUSjrVLtXkiPydFkpWJYgWw8cIWZsaGNnb14fGiViYvBBJW8OiQAACExSURBVHhe7ZyHU9vc2m+XJTeasTHGBtMNGNNM77333gm9l0ACoYSUs//0iyVr9hjHLyGcd3K/OayZ2I+2pC1nhU2YR+iHiMJv886/Ie1d2giJeZc2biJkKpnRJN1O0/kFUD4V2XoOwTe52g/Q/4jO9nXzIkCTaQBoWON2ACJVB4nJWgI8Bw8NCgD2SaDv/OEgSKToKNzGYC8doDLCNFpZ2FEAlDboeCL1+UO/C4CC04dtfo/p253PJWiERporcj81YdBmsgNwYDKZPh3MoeE5v/7ydQBYiYyeFz+XtipIF'+
				'ytDVsDnKOE8D7j2Zk18UCvJLZrtSgNfVzYaB47cascSUCkaoK9+jtmfQFnN4+1oCwlwepugvXfixn/vBJQhG4xb6nYn6lshxZ+R6e/RJXClDgJzIkI54Nmy3vTuF8OS0OmE0frlzLGTUiKnTmSObfp4Gc7Vzc9J7hnAnus4Ppr8saXe6aqw+x0dAGTYcnICDscpwPiYtXoox30KRe6cnC6b2AzGSVsSDTsBoMYK375Bqfqo5DP/E+8VD8kwvItOfgUsXwPb4hDuvgEbF3A4UT9mvQR47CSO8Q1gaN3OgN8EZZvChtJVAb6kPOjNhBb3KQDBCccg0CDa7Xa7E/jWFcKZfw/YnxioXwB6Tny0W7+Dq+veScHyD2JoypZ1OhhivgDVXRCcP24FoDU/yQnArGU1X5eWCdiHbGEotmUGwfVFnabIDCgX3p5Yac2CsGiZNHNVOVhXWZnxbZoSka7kU2ZHtNCRj6d+FJ2tfMVj/QjMiTlCjmJgOAMo'+
				'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';
			zipAddBase64File(fnt_data, ziproot+font_dir+font_file);
			fnt_data = undefined;
		}

		/**********************************************************************************************************************
		* Asset Dirs: Data / Textures / Sounds
		**********************************************************************************************************************/
		for (var assetdir in assetdirs)
		{
			assetdir = assetdirs[assetdir];
			if (with_font && font_dir == assetdir+'/') continue;
			zipAddTextFile('store binary resources in this directory', ziproot+assetdir+'/'+assetdir+'.txt');
		}
	}
	else
	{
		/**********************************************************************************************************************
		* Additional Source Files To be Included in Projects
		**********************************************************************************************************************/
		if (with_midi || with_touchinput || with_chipmunk || with_spine || with_fluidsynth || with_model)
			zipAddTextFile(''+
				(with_midi       ? '#include <../Opt/ZL_Midi.h>'+nl : '')+
				(with_touchinput ? '#include <../Opt/ZL_TouchInput.h>'+nl : '')+
				(with_chipmunk   ? '#include <../Opt/chipmunk/chipmunk.h>'+nl : '')+
				(with_spine      ? '#include <../Opt/spine/spine.h>'+nl : '')+
				(with_fluidsynth ? '#include <../Opt/fluidsynth/ZL_FluidSynth.h>'+nl : '')+
				(with_model      ? '#include <../Opt/model/ZL_Model.h>'+nl : '')+
				'', ziproot+'include_UPDATE.h');
		if (with_midi || with_touchinput)
			zipAddTextFile('#define ZL_OPT_DO_IMPLEMENTATION'+nl+
				(with_midi       ? '#include <../Opt/ZL_Midi.h>'+nl : '')+
				(with_touchinput ? '#include <../Opt/ZL_TouchInput.h>'+nl : '')+
				'', ziproot+'main_UPDATE.cpp');
	}

	if (for_vc6)
	{
		nl = "\r\n";

		/**********************************************************************************************************************
		* <PROJ>-vc6.dsp
		**********************************************************************************************************************/
		var dsp = '# Microsoft Developer Studio Project File - Name="'+proj+'" - Package Owner=<4>'+nl;
		dsp += '# Microsoft Developer Studio Generated Build File, Format Version 6.00'+nl;
		dsp += '# ** DO EDIT **'+nl;
		dsp += '# TARGTYPE "Win32 (x86) Console Application" 0x0103'+nl;
		if (for_nacl || for_emscripten)
			dsp += '# TARGTYPE "Win32 (x86) External Target" 0x0106'+nl;
		dsp += 'CFG='+proj+' - Win32 Debug'+nl;
		dsp += '!MESSAGE NMAKE /f "'+proj+'.mak".'+nl;
		dsp += '!MESSAGE NMAKE /f "'+proj+'.mak" CFG="'+proj+' - Win32 Debug"'+nl;
		dsp += '!MESSAGE "'+proj+' - Win32 Release" (based on  "Win32 (x86) Console Application")'+nl;
		dsp += '!MESSAGE "'+proj+' - Win32 Debug" (based on  "Win32 (x86) Console Application")'+nl;
		if (for_nacl)
		{
			dsp += '!MESSAGE "'+proj+' - NACL Release" (based on  "Win32 (x86) External Target")'+nl;
			dsp += '!MESSAGE "'+proj+' - NACL Debug" (based on  "Win32 (x86) External Target")'+nl;
		}
		if (for_emscripten)
		{
			dsp += '!MESSAGE "'+proj+' - Emscripten Release" (based on  "Win32 (x86) External Target")'+nl;
			dsp += '!MESSAGE "'+proj+' - Emscripten Debug" (based on  "Win32 (x86) External Target")'+nl;
		}
		if (for_android)
		{
			dsp += '!MESSAGE "'+proj+' - Android Release" (based on  "Win32 (x86) External Target")'+nl;
			dsp += '!MESSAGE "'+proj+' - Android Debug" (based on  "Win32 (x86) External Target")'+nl;
		}
		dsp += '# Begin Project'+nl;
		dsp += '# PROP AllowPerConfigDependencies 0'+nl;
		dsp += '# PROP Scc_ProjName ""'+nl;
		dsp += '# PROP Scc_LocalPath ""'+nl;
		dsp += 'CPP=cl.exe'+nl;
		dsp += 'RSC=rc.exe'+nl;

		dsp += nl+'!IF  "$(CFG)" == "'+proj+' - Win32 Release"'+nl+nl;
		dsp += '# PROP BASE Use_MFC 0'+nl;
		dsp += '# PROP BASE Use_Debug_Libraries 0'+nl;
		dsp += '# PROP BASE Output_Dir "Release"'+nl;
		dsp += '# PROP BASE Intermediate_Dir "Release"'+nl;
		dsp += '# PROP BASE Target_Dir ""'+nl;
		dsp += '# PROP Use_MFC 0'+nl;
		dsp += '# PROP Use_Debug_Libraries 0'+nl;
		dsp += '# PROP Output_Dir "Release-vc6"'+nl;
		dsp += '# PROP Intermediate_Dir "Release-vc6"'+nl;
		dsp += '# PROP Ignore_Export_Lib 0'+nl;
		dsp += '# PROP Target_Dir ""'+nl;
		dsp += '# ADD BASE CPP /nologo /W3 /GX /O2 /D "WIN32" /D "NDEBUG" /D "_CONSOLE" /D "_MBCS" /YX /FD /c'+nl;
		dsp += '# ADD CPP /nologo /MT /W3 /O2 /I "'+zillalibbase+'/Include" /D "WIN32" /D "NDEBUG" /D "_MBCS" /FD /c'+nl;
		dsp += '# SUBTRACT CPP /YX'+nl;
		dsp += '# ADD BASE RSC /l 0x807 /d "NDEBUG"'+nl;
		dsp += '# ADD RSC /l 0x807 /d "NDEBUG"'+nl;
		dsp += 'BSC32=bscmake.exe'+nl;
		dsp += '# ADD BASE BSC32 /nologo'+nl;
		dsp += '# ADD BSC32 /nologo'+nl;
		dsp += 'LINK32=link.exe'+nl;
		dsp += '# ADD BASE LINK32 kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib /nologo /subsystem:console /machine:I386'+nl;
		dsp += '# ADD LINK32 "'+zillalibbase+'/Release-vc6/ZillaLib.lib" /nologo /subsystem:windows /pdb:"Release-vc6/'+proj+'.pdb" /map:"Release-vc6/'+proj+'.map" /machine:I386 /out:"Release-vc6/'+proj+'.exe" /opt:ref /opt:nowin98'+nl;
		dsp += '# SUBTRACT LINK32 /pdb:none'+nl;

		dsp += nl+'!ELSEIF  "$(CFG)" == "'+proj+' - Win32 Debug"'+nl+nl;
		dsp += '# PROP BASE Use_MFC 0'+nl;
		dsp += '# PROP BASE Use_Debug_Libraries 1'+nl;
		dsp += '# PROP BASE Output_Dir "Debug"'+nl;
		dsp += '# PROP BASE Intermediate_Dir "Debug"'+nl;
		dsp += '# PROP BASE Target_Dir ""'+nl;
		dsp += '# PROP Use_MFC 0'+nl;
		dsp += '# PROP Use_Debug_Libraries 1'+nl;
		dsp += '# PROP Output_Dir "Debug-vc6"'+nl;
		dsp += '# PROP Intermediate_Dir "Debug-vc6"'+nl;
		dsp += '# PROP Ignore_Export_Lib 0'+nl;
		dsp += '# PROP Target_Dir ""'+nl;
		dsp += '# ADD BASE CPP /nologo /W3 /Gm /GX /ZI /Od /D "WIN32" /D "_DEBUG" /D "_CONSOLE" /D "_MBCS" /YX /FD /GZ /c'+nl;
		dsp += '# ADD CPP /nologo /MTd /W3 /Gm /ZI /Od /I "'+zillalibbase+'/Include" /D "WIN32" /D "_DEBUG" /D "_CONSOLE" /D "_MBCS" /D "ZILLALOG" /FD /GZ /c'+nl;
		dsp += '# SUBTRACT CPP /YX'+nl;
		dsp += '# ADD BASE RSC /l 0x807 /d "_DEBUG"'+nl;
		dsp += '# ADD RSC /l 0x807 /d "_DEBUG"'+nl;
		dsp += 'BSC32=bscmake.exe'+nl;
		dsp += '# ADD BASE BSC32 /nologo'+nl;
		dsp += '# ADD BSC32 /nologo'+nl;
		dsp += 'LINK32=link.exe'+nl;
		dsp += '# ADD BASE LINK32 kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib /nologo /subsystem:console /debug /machine:I386 /pdbtype:sept'+nl;
		dsp += '# ADD LINK32 "'+zillalibbase+'/Debug-vc6/ZillaLib.lib" /nologo /subsystem:console /incremental:yes /pdb:"Debug-vc6/'+proj+'.pdb" /debug /machine:I386 /out:"Debug-vc6/'+proj+'.exe" /pdbtype:sept'+nl;
		if (for_nacl)
		{
			dsp += nl+'!ELSEIF  "$(CFG)" == "'+proj+' - NACL Release"'+nl+nl;
			dsp += '# PROP Output_Dir "Release-nacl"'+nl;
			dsp += '# PROP Intermediate_Dir "Release-nacl"'+nl;
			dsp += '# PROP Cmd_Line "python '+zillalibbase+'/NACL/ZillaLibNACL.py build -rel -vc '+proj+'"'+nl;
			dsp += '# PROP Rebuild_Opt "-clean"'+nl;
			dsp += '# PROP Target_File "Release-nacl/'+proj+'_x86_64.nexe.gz.exe"'+nl;
			dsp += nl+'!ELSEIF  "$(CFG)" == "'+proj+' - NACL Debug"'+nl+nl;
			dsp += '# PROP Output_Dir "Debug-nacl"'+nl;
			dsp += '# PROP Intermediate_Dir "Debug-nacl"'+nl;
			dsp += '# PROP Cmd_Line "python '+zillalibbase+'/NACL/ZillaLibNACL.py build -vc '+proj+'"'+nl;
			dsp += '# PROP Rebuild_Opt "-clean"'+nl;
			dsp += '# PROP Target_File "Debug-nacl/'+proj+'_x86_64.nexe.gz.exe"'+nl;
		}
		if (for_emscripten)
		{
			dsp += nl+'!ELSEIF  "$(CFG)" == "'+proj+' - Emscripten Release"'+nl+nl;
			dsp += '# PROP Output_Dir "Release-emscripten"'+nl;
			dsp += '# PROP Intermediate_Dir "Release-emscripten"'+nl;
			dsp += '# PROP Cmd_Line "python '+zillalibbase+'/Emscripten/ZillaLibEmscripten.py build -rel -vc '+proj+'"'+nl;
			dsp += '# PROP Rebuild_Opt "-clean"'+nl;
			dsp += '# PROP Target_File "Release-emscripten/'+proj+'.js.exe"'+nl;
			dsp += nl+'!ELSEIF  "$(CFG)" == "'+proj+' - Emscripten Debug"'+nl+nl;
			dsp += '# PROP Output_Dir "Debug-emscripten"'+nl;
			dsp += '# PROP Intermediate_Dir "Debug-emscripten"'+nl;
			dsp += '# PROP Cmd_Line "python '+zillalibbase+'/Emscripten/ZillaLibEmscripten.py build -vc '+proj+'"'+nl;
			dsp += '# PROP Rebuild_Opt "-clean"'+nl;
			dsp += '# PROP Target_File "Debug-emscripten/'+proj+'.js.exe"'+nl;
		}
		if (for_android)
		{
			dsp += nl+'!ELSEIF  "$(CFG)" == "'+proj+' - Android Release"'+nl+nl;
			dsp += '# PROP Output_Dir "Android/bin"'+nl;
			dsp += '# PROP Intermediate_Dir "Android/obj"'+nl;
			dsp += '# PROP Cmd_Line "'+zillalibbase+'/Tools/make.exe -f ../'+zillalibbase+'/Android/ZillaApp.mk ZLDEBUG=0 ZillaApp='+proj+'"'+nl;
			dsp += '# PROP Rebuild_Opt "-B"'+nl;
			dsp += '# PROP Target_File "Android/bin/'+proj+'.apk"'+nl;
			dsp += nl+'!ELSEIF  "$(CFG)" == "'+proj+' - Android Debug"'+nl+nl;
			dsp += '# PROP Output_Dir "Android/bin"'+nl;
			dsp += '# PROP Intermediate_Dir "Android/obj"'+nl;
			dsp += '# PROP Cmd_Line "'+zillalibbase+'/Tools/make.exe -f ../'+zillalibbase+'/Android/ZillaApp.mk ZLDEBUG=1 ZillaApp='+proj+'"'+nl;
			dsp += '# PROP Rebuild_Opt "-B"'+nl;
			dsp += '# PROP Target_File "Android/bin/'+proj+'.apk"'+nl;
		}
		dsp += nl+'!ENDIF'+nl+nl;
		dsp += '# Begin Target'+nl;
		dsp += '# Name "'+proj+' - Win32 Release"'+nl;
		dsp += '# Name "'+proj+' - Win32 Debug"'+nl;
		if (for_nacl)
		{
			dsp += '# Name "'+proj+' - NACL Release"'+nl;
			dsp += '# Name "'+proj+' - NACL Debug"'+nl;
		}
		if (for_emscripten)
		{
			dsp += '# Name "'+proj+' - Emscripten Release"'+nl;
			dsp += '# Name "'+proj+' - Emscripten Debug"'+nl;
		}
		if (for_android)
		{
			dsp += '# Name "'+proj+' - Android Release"'+nl;
			dsp += '# Name "'+proj+' - Android Debug"'+nl;
		}
		for (var srcfile in srcfiles)
			dsp += '# Begin Source File'+nl+'SOURCE=./'+srcfiles[srcfile]+nl+'# End Source File'+nl;
		dsp += '# Begin Source File'+nl+'SOURCE=./'+proj+'.rc'+nl+'# End Source File'+nl;
		dsp += '# End Target'+nl;
		dsp += '# End Project'+nl;
		zipAddTextFile(dsp, ziproot+proj+'-vc6.dsp');
		dsp = undefined;

		/**********************************************************************************************************************
		* <PROJ>-vc6.dsw
		**********************************************************************************************************************/
		var dsw = 'Microsoft Developer Studio Workspace File, Format Version 6.00'+nl;
		dsw += 'Project: "'+proj+'"='+proj+'-vc6.dsp - Package Owner=<4>'+nl;
		dsw += 'Package=<5>'+nl+'{{{'+nl+'}}}'+nl;
		dsw += 'Package=<4>'+nl+'{{{'+nl+'Begin Project Dependency'+nl+'Project_Dep_Name ZillaLib'+nl+'End Project Dependency'+nl+'}}}'+nl;
		dsw += 'Project: "ZillaLib"='+zillalibbase+'/ZillaLib-vc6.dsp - Package Owner=<4>'+nl;
		dsw += 'Package=<5>'+nl+'{{{'+nl+'}}}'+nl+'Package=<4>'+nl+'{{{'+nl+'}}}'+nl;
		dsw += 'Global:'+nl+'Package=<5>'+nl+'{{{'+nl+'}}}'+nl+'Package=<3>'+nl+'{{{'+nl+'}}}'+nl;
		zipAddTextFile(dsw, ziproot+proj+'-vc6.dsw');
		dsw = undefined;
	}

	if (for_vc9)
	{
		nl = "\r\n";
		var vc9projguid = makeRandomGuid(), vc9slnguid = makeRandomGuid();

		/**********************************************************************************************************************
		* <PROJ>-vc9.vcproj
		**********************************************************************************************************************/
		var vc9proj = '<?xml version="1.0" encoding="utf-8"?>'+nl;
		vc9proj += '<VisualStudioProject ProjectType="Visual C++" Version="9.00" Name="'+proj+'" ProjectGUID="{'+vc9projguid+'}" RootNamespace="'+proj+'" TargetFrameworkVersion="196613">'+nl;
		vc9proj += '	<Platforms><Platform Name="Win32"/></Platforms>'+nl;
		vc9proj += '	<ToolFiles></ToolFiles>'+nl;
		vc9proj += '	<Configurations>'+nl;
		vc9proj += '		<Configuration Name="Debug|Win32" OutputDirectory="Debug-vc9" IntermediateDirectory="Debug-vc9" ConfigurationType="1" InheritedPropertySheets="$(VCInstallDir)VCProjectDefaults\\UpgradeFromVC60.vsprops" UseOfMFC="0" ATLMinimizesCRunTimeLibraryUsage="false" CharacterSet="2">'+nl;
		vc9proj += '			<Tool Name="VCPreBuildEventTool"/>'+nl;
		vc9proj += '			<Tool Name="VCCustomBuildTool"/>'+nl;
		vc9proj += '			<Tool Name="VCXMLDataGeneratorTool"/>'+nl;
		vc9proj += '			<Tool Name="VCWebServiceProxyGeneratorTool"/>'+nl;
		vc9proj += '			<Tool Name="VCMIDLTool" TypeLibraryName="Debug-vc9/'+proj+'.tlb" HeaderFileName=""/>'+nl;
		vc9proj += '			<Tool Name="VCCLCompilerTool" Optimization="0" AdditionalIncludeDirectories="'+zillalibbase+'/Include" PreprocessorDefinitions="WIN32;_DEBUG;_CONSOLE" MinimalRebuild="true" BasicRuntimeChecks="3" RuntimeLibrary="1" PrecompiledHeaderFile="Debug-vc9/'+proj+'.pch" AssemblerListingLocation="Debug-vc9/" ObjectFile="Debug-vc9/" ProgramDataBaseFileName="Debug-vc9/'+proj+'.pdb" WarningLevel="3" SuppressStartupBanner="true" DebugInformationFormat="4" ExceptionHandling="false"/>'+nl;
		vc9proj += '			<Tool Name="VCManagedResourceCompilerTool"/>'+nl;
		vc9proj += '			<Tool Name="VCResourceCompilerTool" PreprocessorDefinitions="_DEBUG" Culture="2055"/>'+nl;
		vc9proj += '			<Tool Name="VCPreLinkEventTool"/>'+nl;
		vc9proj += '			<Tool Name="VCLinkerTool" AdditionalDependencies="'+zillalibbase+'/Debug-vc9/ZillaLib.lib" OutputFile="Debug-vc9/'+proj+'.exe" LinkIncremental="2" SuppressStartupBanner="true" GenerateManifest="false" IgnoreDefaultLibraryNames="libcmt" GenerateDebugInformation="true" ProgramDatabaseFile="Debug-vc9/'+proj+'.pdb" SubSystem="1" RandomizedBaseAddress="1" DataExecutionPrevention="0" TargetMachine="1"/>'+nl;
		vc9proj += '			<Tool Name="VCALinkTool"/>'+nl;
		vc9proj += '			<Tool Name="VCManifestTool"/>'+nl;
		vc9proj += '			<Tool Name="VCXDCMakeTool"/>'+nl;
		vc9proj += '			<Tool Name="VCBscMakeTool" SuppressStartupBanner="true" OutputFile="Debug-vc9/'+proj+'.bsc"/>'+nl;
		vc9proj += '			<Tool Name="VCFxCopTool"/>'+nl;
		vc9proj += '			<Tool Name="VCAppVerifierTool"/>'+nl;
		vc9proj += '			<Tool Name="VCPostBuildEventTool"/>'+nl;
		vc9proj += '		</Configuration>'+nl;
		vc9proj += '		<Configuration Name="Release|Win32" OutputDirectory="Release-vc9" IntermediateDirectory="Release-vc9" ConfigurationType="1" InheritedPropertySheets="$(VCInstallDir)VCProjectDefaults\\UpgradeFromVC60.vsprops" UseOfMFC="0" ATLMinimizesCRunTimeLibraryUsage="false" CharacterSet="2">'+nl;
		vc9proj += '			<Tool Name="VCPreBuildEventTool"/>'+nl;
		vc9proj += '			<Tool Name="VCCustomBuildTool"/>'+nl;
		vc9proj += '			<Tool Name="VCXMLDataGeneratorTool"/>'+nl;
		vc9proj += '			<Tool Name="VCWebServiceProxyGeneratorTool"/>'+nl;
		vc9proj += '			<Tool Name="VCMIDLTool" TypeLibraryName="Release-vc9/'+proj+'.tlb" HeaderFileName=""/>'+nl;
		vc9proj += '			<Tool Name="VCCLCompilerTool" Optimization="2" InlineFunctionExpansion="1" AdditionalIncludeDirectories="'+zillalibbase+'/Include" PreprocessorDefinitions="WIN32;NDEBUG;_CONSOLE" StringPooling="true" RuntimeLibrary="0" EnableFunctionLevelLinking="true" PrecompiledHeaderFile="Release-vc9/'+proj+'.pch" AssemblerListingLocation="Release-vc9/" ObjectFile="Release-vc9/" ProgramDataBaseFileName="Release-vc9/'+proj+'.pdb" WarningLevel="3" SuppressStartupBanner="true" ExceptionHandling="false"/>'+nl;
		vc9proj += '			<Tool Name="VCManagedResourceCompilerTool"/>'+nl;
		vc9proj += '			<Tool Name="VCResourceCompilerTool" PreprocessorDefinitions="NDEBUG" Culture="2055"/>'+nl;
		vc9proj += '			<Tool Name="VCPreLinkEventTool"/>'+nl;
		vc9proj += '			<Tool Name="VCLinkerTool" AdditionalDependencies="'+zillalibbase+'/Release-vc9/ZillaLib.lib" OutputFile="Release-vc9/'+proj+'.exe" LinkIncremental="1" SuppressStartupBanner="true" GenerateManifest="false" ProgramDatabaseFile="Release-vc9/'+proj+'.pdb" GenerateMapFile="true" MapFileName="Release-vc9/'+proj+'.map" SubSystem="2" RandomizedBaseAddress="1" DataExecutionPrevention="0" TargetMachine="1"/>'+nl;
		vc9proj += '			<Tool Name="VCALinkTool"/>'+nl;
		vc9proj += '			<Tool Name="VCManifestTool"/>'+nl;
		vc9proj += '			<Tool Name="VCXDCMakeTool"/>'+nl;
		vc9proj += '			<Tool Name="VCBscMakeTool" SuppressStartupBanner="true" OutputFile="Release-vc9/'+proj+'.bsc"/>'+nl;
		vc9proj += '			<Tool Name="VCFxCopTool"/>'+nl;
		vc9proj += '			<Tool Name="VCAppVerifierTool"/>'+nl;
		vc9proj += '			<Tool Name="VCPostBuildEventTool"/>'+nl;
		vc9proj += '		</Configuration>'+nl;

		if (for_nacl)
		{
			vc9proj += '		<Configuration Name="NACL-Debug|Win32" OutputDirectory="Debug-nacl" IntermediateDirectory="Debug-nacl" ConfigurationType="0">'+nl;
			vc9proj += '			<Tool Name="VCNMakeTool"'+nl;
			vc9proj += '				BuildCommandLine="python '+zillalibbase+'/NACL/ZillaLibNACL.py build -vc"'+nl;
			vc9proj += '				ReBuildCommandLine="python '+zillalibbase+'/NACL/ZillaLibNACL.py build -vc -B"'+nl;
			vc9proj += '				CleanCommandLine="python '+zillalibbase+'/NACL/ZillaLibNACL.py build -vc -clean"'+nl;
			vc9proj += '				Output="" PreprocessorDefinitions="" IncludeSearchPath="" ForcedIncludes="" AssemblySearchPath="" ForcedUsingAssemblies="" CompileAsManaged=""/>'+nl;
			vc9proj += '		</Configuration>'+nl;
			vc9proj += '		<Configuration Name="NACL-Release|Win32" OutputDirectory="Release-nacl" IntermediateDirectory="Release-nacl" ConfigurationType="0">'+nl;
			vc9proj += '			<Tool Name="VCNMakeTool"'+nl;
			vc9proj += '				BuildCommandLine="python '+zillalibbase+'/NACL/ZillaLibNACL.py build -rel -vc"'+nl;
			vc9proj += '				ReBuildCommandLine="python '+zillalibbase+'/NACL/ZillaLibNACL.py build -rel -vc -B"'+nl;
			vc9proj += '				CleanCommandLine="python '+zillalibbase+'/NACL/ZillaLibNACL.py build -rel -vc -clean"'+nl;
			vc9proj += '				Output="" PreprocessorDefinitions="" IncludeSearchPath="" ForcedIncludes="" AssemblySearchPath="" ForcedUsingAssemblies="" CompileAsManaged=""/>'+nl;
			vc9proj += '		</Configuration>'+nl;
		}
		if (for_emscripten)
		{
			vc9proj += '		<Configuration Name="Emscripten-Debug|Win32" OutputDirectory="Debug-emscripten" IntermediateDirectory="Debug-emscripten" ConfigurationType="0">'+nl;
			vc9proj += '			<Tool Name="VCNMakeTool"'+nl;
			vc9proj += '				BuildCommandLine="python '+zillalibbase+'/Emscripten/ZillaLibEmscripten.py build -vc"'+nl;
			vc9proj += '				ReBuildCommandLine="python '+zillalibbase+'/Emscripten/ZillaLibEmscripten.py build -vc -B"'+nl;
			vc9proj += '				CleanCommandLine="python '+zillalibbase+'/Emscripten/ZillaLibEmscripten.py build -vc -clean"'+nl;
			vc9proj += '				Output="" PreprocessorDefinitions="" IncludeSearchPath="" ForcedIncludes="" AssemblySearchPath="" ForcedUsingAssemblies="" CompileAsManaged=""/>'+nl;
			vc9proj += '		</Configuration>'+nl;
			vc9proj += '		<Configuration Name="Emscripten-Release|Win32" OutputDirectory="Release-emscripten" IntermediateDirectory="Release-emscripten" ConfigurationType="0">'+nl;
			vc9proj += '			<Tool Name="VCNMakeTool"'+nl;
			vc9proj += '				BuildCommandLine="python '+zillalibbase+'/Emscripten/ZillaLibEmscripten.py build -rel -vc"'+nl;
			vc9proj += '				ReBuildCommandLine="python '+zillalibbase+'/Emscripten/ZillaLibEmscripten.py build -rel -vc -B"'+nl;
			vc9proj += '				CleanCommandLine="python '+zillalibbase+'/Emscripten/ZillaLibEmscripten.py build -rel -vc -clean"'+nl;
			vc9proj += '				Output="" PreprocessorDefinitions="" IncludeSearchPath="" ForcedIncludes="" AssemblySearchPath="" ForcedUsingAssemblies="" CompileAsManaged=""/>'+nl;
			vc9proj += '		</Configuration>'+nl;
		}

		vc9proj += '	</Configurations>'+nl;
		vc9proj += '	<References>'+nl;
		vc9proj += '	</References>'+nl;
		vc9proj += '	<Files>'+nl;
		for (var srcfile in srcfiles)
			vc9proj += '		<File RelativePath="'+srcfiles[srcfile]+'"/>'+nl;
		vc9proj += '		<File RelativePath="'+proj+'.rc"/>'+nl;
		vc9proj += '	</Files>'+nl;
		vc9proj += '	<Globals>'+nl;
		vc9proj += '	</Globals>'+nl;
		vc9proj += '</VisualStudioProject>'+nl;
		zipAddTextFile(vc9proj, ziproot+proj+'-vc9.vcproj', true);
		vc9proj = undefined;

		/**********************************************************************************************************************
		* <PROJ>-vc9.sln
		**********************************************************************************************************************/
		var vc9sln = 'Microsoft Visual Studio Solution File, Format Version 10.00'+nl;
		vc9sln += '# Visual Studio 2008'+nl;
		vc9sln += 'Project("{'+vc9slnguid+'}") = "'+proj+'", "'+proj+'-vc9.vcproj", "{'+vc9projguid+'}"'+nl;
		vc9sln += '	ProjectSection(ProjectDependencies) = postProject'+nl;
		vc9sln += '		{2177A217-7A21-77A2-177A-2177A2177777} = {2177A217-7A21-77A2-177A-2177A2177777}'+nl;
		vc9sln += '	EndProjectSection'+nl;
		vc9sln += 'EndProject'+nl;
		vc9sln += 'Project("{'+vc9slnguid+'}") = "ZillaLib", "'+zillalibbase+'/ZillaLib-vc9.vcproj", "{2177A217-7A21-77A2-177A-2177A2177777}"'+nl;
		vc9sln += 'EndProject'+nl;
		vc9sln += 'Global'+nl;
		vc9sln += '	GlobalSection(SolutionConfigurationPlatforms) = preSolution'+nl;
		vc9sln += '		Debug|Win32 = Debug|Win32'+nl;
		vc9sln += '		Release|Win32 = Release|Win32'+nl;
		vc9sln += '	EndGlobalSection'+nl;
		vc9sln += '	GlobalSection(ProjectConfigurationPlatforms) = postSolution'+nl;
		vc9sln += '		{'+vc9projguid+'}.Debug|Win32.ActiveCfg = Debug|Win32'+nl;
		vc9sln += '		{'+vc9projguid+'}.Debug|Win32.Build.0 = Debug|Win32'+nl;
		vc9sln += '		{'+vc9projguid+'}.Release|Win32.ActiveCfg = Release|Win32'+nl;
		vc9sln += '		{'+vc9projguid+'}.Release|Win32.Build.0 = Release|Win32'+nl;
		vc9sln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug|Win32.ActiveCfg = Debug|Win32'+nl;
		vc9sln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug|Win32.Build.0 = Debug|Win32'+nl;
		vc9sln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release|Win32.ActiveCfg = Release|Win32'+nl;
		vc9sln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release|Win32.Build.0 = Release|Win32'+nl;
		vc9sln += '	EndGlobalSection'+nl;
		vc9sln += '	GlobalSection(SolutionProperties) = preSolution'+nl;
		vc9sln += '		HideSolutionNode = FALSE'+nl;
		vc9sln += '	EndGlobalSection'+nl;
		vc9sln += 'EndGlobal'+nl;
		zipAddTextFile(vc9sln, ziproot+proj+'-vc9.sln');
		vc9sln = undefined, vc9projguid = undefined, vc9slnguid = undefined;
	}

	if (for_vs)
	{
		nl = "\r\n";
		if (!vcprojguid) vcprojguid = makeRandomGuid();
		var vcslnguid = makeRandomGuid();

		/**********************************************************************************************************************
		* <PROJ>-vs.vcproj
		**********************************************************************************************************************/
		var vcprojx  = '<?xml version="1.0" encoding="utf-8"?>'+nl;
		vcprojx += '<Project DefaultTargets="Build" ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">'+nl;
		vcprojx += '  <PropertyGroup Label="Globals">'+nl;
		vcprojx += '    <ProjectName>'+proj+'</ProjectName>'+nl;
		if (assets_embed) vcprojx += '    <DataAssets>'+assetdirs.concat(assetfiles).join(' ')+'</DataAssets>'+nl;
		vcprojx += '    <ZillaLibDir>'+zillalibbase+'</ZillaLibDir>'+nl;
		vcprojx += '    <ProjectGuid>{'+vcprojguid+'}</ProjectGuid>'+nl;
		vcprojx += '  </PropertyGroup>'+nl;
		vcprojx += '  <ItemGroup Label="ProjectConfigurations">'+nl;
		vcprojx += '    <ProjectConfiguration Include="Debug|Win32">'+nl;
		vcprojx += '      <Configuration>Debug</Configuration>'+nl;
		vcprojx += '      <Platform>Win32</Platform>'+nl;
		vcprojx += '    </ProjectConfiguration>'+nl;
		vcprojx += '    <ProjectConfiguration Include="Release|Win32">'+nl;
		vcprojx += '      <Configuration>Release</Configuration>'+nl;
		vcprojx += '      <Platform>Win32</Platform>'+nl;
		vcprojx += '    </ProjectConfiguration>'+nl;
		vcprojx += '    <ProjectConfiguration Include="Debug|x64">'+nl;
		vcprojx += '      <Configuration>Debug</Configuration>'+nl;
		vcprojx += '      <Platform>x64</Platform>'+nl;
		vcprojx += '    </ProjectConfiguration>'+nl;
		vcprojx += '    <ProjectConfiguration Include="Release|x64">'+nl;
		vcprojx += '      <Configuration>Release</Configuration>'+nl;
		vcprojx += '      <Platform>x64</Platform>'+nl;
		vcprojx += '    </ProjectConfiguration>'+nl;
		if (for_emscripten)
		{
			vcprojx += '    <ProjectConfiguration Include="Emscripten-Debug|Win32">'+nl;
			vcprojx += '      <Configuration>Emscripten-Debug</Configuration>'+nl;
			vcprojx += '      <Platform>Win32</Platform>'+nl;
			vcprojx += '    </ProjectConfiguration>'+nl;
			vcprojx += '    <ProjectConfiguration Include="Emscripten-Release|Win32">'+nl;
			vcprojx += '      <Configuration>Emscripten-Release</Configuration>'+nl;
			vcprojx += '      <Platform>Win32</Platform>'+nl;
			vcprojx += '    </ProjectConfiguration>'+nl;
		}
		if (for_nacl)
		{
			vcprojx += '    <ProjectConfiguration Include="NACL-Debug|Win32">'+nl;
			vcprojx += '      <Configuration>NACL-Debug</Configuration>'+nl;
			vcprojx += '      <Platform>Win32</Platform>'+nl;
			vcprojx += '    </ProjectConfiguration>'+nl;
			vcprojx += '    <ProjectConfiguration Include="NACL-Release|Win32">'+nl;
			vcprojx += '      <Configuration>NACL-Release</Configuration>'+nl;
			vcprojx += '      <Platform>Win32</Platform>'+nl;
			vcprojx += '    </ProjectConfiguration>'+nl;
		}
		if (for_android)
		{
			vcprojx += '    <ProjectConfiguration Include="Android-Debug|Win32">'+nl;
			vcprojx += '      <Configuration>Android-Debug</Configuration>'+nl;
			vcprojx += '      <Platform>Win32</Platform>'+nl;
			vcprojx += '    </ProjectConfiguration>'+nl;
			vcprojx += '    <ProjectConfiguration Include="Android-Release|Win32">'+nl;
			vcprojx += '      <Configuration>Android-Release</Configuration>'+nl;
			vcprojx += '      <Platform>Win32</Platform>'+nl;
			vcprojx += '    </ProjectConfiguration>'+nl;
		}
		vcprojx += '  </ItemGroup>'+nl;
		vcprojx += '  <Import Project="$(ZillaLibDir)/ZillaApp-vs.props" />'+nl;
		vcprojx += '  <ItemGroup>'+nl;
		for (var srcfile in srcfiles)
		{
			srcfile = srcfiles[srcfile];
			vcprojx += '    <'+
					(srcfile.substr(-4).toLowerCase() == '.cpp' || srcfile.substr(-2).toLowerCase() == '.c' ? 'ClCompile' :
					(srcfile.substr(-4).toLowerCase() == '.hpp' || srcfile.substr(-2).toLowerCase() == '.h' ? 'ClInclude' :
					(srcfile.substr(-4).toLowerCase() == '.inl' ? 'None' : 'Text')))+
				' Include="'+srcfile+'" />'+nl;
		}
		vcprojx += '    <ResourceCompile Include="'+proj+'.rc" />'+nl;
		vcprojx += '  </ItemGroup>'+nl;
		vcprojx += '</Project>';
		zipAddTextFile(vcprojx, ziproot+proj+'-vs.vcxproj', true);
		vcproj = undefined;

		/**********************************************************************************************************************
		* <PROJ>-vs.sln
		**********************************************************************************************************************/
		var vcsln  = 'Microsoft Visual Studio Solution File, Format Version 11.00'+nl;
		vcsln += '# Visual Studio 2012'+nl;
		vcsln += 'VisualStudioVersion = 14.0.0.0'+nl;
		vcsln += 'MinimumVisualStudioVersion = 12.0.0.0'+nl;
		vcsln += 'Project("{'+vcslnguid+'}") = "'+proj+'", "'+proj+'-vs.vcxproj", "{'+vcprojguid+'}"'+nl;
		vcsln += 'EndProject'+nl;
		vcsln += 'Project("{'+vcslnguid+'}") = "ZillaLib", "'+zillalibbase.replace(/\//g, '\\')+'\\ZillaLib-vs.vcxproj", "{2177A217-7A21-77A2-177A-2177A2177777}"'+nl;
		vcsln += 'EndProject'+nl;
		vcsln += 'Global'+nl;
		vcsln += '	GlobalSection(SolutionConfigurationPlatforms) = preSolution'+nl;
		vcsln += '		Debug|Win32 = Debug|Win32'+nl;
		vcsln += '		Release|Win32 = Release|Win32'+nl;
		vcsln += '		Debug|x64 = Debug|x64'+nl;
		vcsln += '		Release|x64 = Release|x64'+nl;
		if (for_android)
		{
			vcsln += '		Android-Debug|Win32 = Android-Debug|Win32'+nl;
			vcsln += '		Android-Debug|x64 = Android-Debug|x64'+nl;
			vcsln += '		Android-Release|Win32 = Android-Release|Win32'+nl;
			vcsln += '		Android-Release|x64 = Android-Release|x64'+nl;
		}
		if (for_emscripten)
		{
			vcsln += '		Emscripten-Debug|Win32 = Emscripten-Debug|Win32'+nl;
			vcsln += '		Emscripten-Debug|x64 = Emscripten-Debug|x64'+nl;
			vcsln += '		Emscripten-Release|Win32 = Emscripten-Release|Win32'+nl;
			vcsln += '		Emscripten-Release|x64 = Emscripten-Release|x64'+nl;
		}
		if (for_nacl)
		{
			vcsln += '		NACL-Debug|Win32 = NACL-Debug|Win32'+nl;
			vcsln += '		NACL-Debug|x64 = NACL-Debug|x64'+nl;
			vcsln += '		NACL-Release|Win32 = NACL-Release|Win32'+nl;
			vcsln += '		NACL-Release|x64 = NACL-Release|x64'+nl;
		}
		vcsln += '	EndGlobalSection'+nl;
		vcsln += '	GlobalSection(ProjectConfigurationPlatforms) = postSolution'+nl;
		vcsln += '		{'+vcprojguid+'}.Debug|Win32.ActiveCfg = Debug|Win32'+nl;
		vcsln += '		{'+vcprojguid+'}.Debug|Win32.Build.0 = Debug|Win32'+nl;
		vcsln += '		{'+vcprojguid+'}.Release|Win32.ActiveCfg = Release|Win32'+nl;
		vcsln += '		{'+vcprojguid+'}.Release|Win32.Build.0 = Release|Win32'+nl;
		vcsln += '		{'+vcprojguid+'}.Debug|x64.ActiveCfg = Debug|x64'+nl;
		vcsln += '		{'+vcprojguid+'}.Debug|x64.Build.0 = Debug|x64'+nl;
		vcsln += '		{'+vcprojguid+'}.Release|x64.ActiveCfg = Release|x64'+nl;
		vcsln += '		{'+vcprojguid+'}.Release|x64.Build.0 = Release|x64'+nl;
		if (for_android)
		{
			vcsln += '		{'+vcprojguid+'}.Android-Debug|Win32.ActiveCfg = Android-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Android-Debug|Win32.Build.0 = Android-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Android-Debug|x64.ActiveCfg = Android-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Android-Debug|x64.Build.0 = Android-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Android-Release|Win32.ActiveCfg = Android-Release|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Android-Release|Win32.Build.0 = Android-Release|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Android-Release|x64.ActiveCfg = Android-Release|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Android-Release|x64.Build.0 = Android-Release|Win32'+nl;
		}
		if (for_emscripten)
		{
			vcsln += '		{'+vcprojguid+'}.Emscripten-Debug|Win32.ActiveCfg = Emscripten-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Emscripten-Debug|Win32.Build.0 = Emscripten-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Emscripten-Debug|x64.ActiveCfg = Emscripten-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Emscripten-Debug|x64.Build.0 = Emscripten-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Emscripten-Release|Win32.ActiveCfg = Emscripten-Release|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Emscripten-Release|Win32.Build.0 = Emscripten-Release|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Emscripten-Release|x64.ActiveCfg = Emscripten-Release|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.Emscripten-Release|x64.Build.0 = Emscripten-Release|Win32'+nl;
		}
		if (for_nacl)
		{
			vcsln += '		{'+vcprojguid+'}.NACL-Debug|Win32.ActiveCfg = NACL-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.NACL-Debug|Win32.Build.0 = NACL-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.NACL-Debug|x64.ActiveCfg = NACL-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.NACL-Debug|x64.Build.0 = NACL-Debug|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.NACL-Release|Win32.ActiveCfg = NACL-Release|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.NACL-Release|Win32.Build.0 = NACL-Release|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.NACL-Release|x64.ActiveCfg = NACL-Release|Win32'+nl;
			vcsln += '		{'+vcprojguid+'}.NACL-Release|x64.Build.0 = NACL-Release|Win32'+nl;
		}
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug|Win32.ActiveCfg = Debug|Win32'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug|Win32.Build.0 = Debug|Win32'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release|Win32.ActiveCfg = Release|Win32'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release|Win32.Build.0 = Release|Win32'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug|x64.ActiveCfg = Debug|x64'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug|x64.Build.0 = Debug|x64'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release|x64.ActiveCfg = Release|x64'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release|x64.Build.0 = Release|x64'+nl;
		if (for_android)
		{
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Android-Debug|Win32.ActiveCfg = Android-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Android-Debug|Win32.Build.0 = Android-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Android-Debug|x64.ActiveCfg = Android-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Android-Debug|x64.Build.0 = Android-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Android-Release|Win32.ActiveCfg = Android-Release|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Android-Release|Win32.Build.0 = Android-Release|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Android-Release|x64.ActiveCfg = Android-Release|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Android-Release|x64.Build.0 = Android-Release|Win32'+nl;
		}
		if (for_emscripten)
		{
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Emscripten-Debug|Win32.ActiveCfg = Emscripten-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Emscripten-Debug|Win32.Build.0 = Emscripten-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Emscripten-Debug|x64.ActiveCfg = Emscripten-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Emscripten-Debug|x64.Build.0 = Emscripten-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Emscripten-Release|Win32.ActiveCfg = Emscripten-Release|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Emscripten-Release|Win32.Build.0 = Emscripten-Release|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Emscripten-Release|x64.ActiveCfg = Emscripten-Release|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Emscripten-Release|x64.Build.0 = Emscripten-Release|Win32'+nl;
		}
		if (for_nacl)
		{
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.NACL-Debug|Win32.ActiveCfg = NACL-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.NACL-Debug|Win32.Build.0 = NACL-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.NACL-Debug|x64.ActiveCfg = NACL-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.NACL-Debug|x64.Build.0 = NACL-Debug|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.NACL-Release|Win32.ActiveCfg = NACL-Release|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.NACL-Release|Win32.Build.0 = NACL-Release|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.NACL-Release|x64.ActiveCfg = NACL-Release|Win32'+nl;
			vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.NACL-Release|x64.Build.0 = NACL-Release|Win32'+nl;
		}
		vcsln += '	EndGlobalSection'+nl;
		vcsln += '	GlobalSection(SolutionProperties) = preSolution'+nl;
		vcsln += '		HideSolutionNode = FALSE'+nl;
		vcsln += '	EndGlobalSection'+nl;
		vcsln += 'EndGlobal'+nl;
		zipAddTextFile(vcsln, ziproot+proj+'-vs.sln');
		vcsln = undefined, vcprojguid = undefined, vcslnguid = undefined;
	}

	if (for_vc6 || for_vc9 || for_vs)
	{
		var rc = 'ZL ICON DISCARDABLE "'+proj+'.ico"'+nl;
		zipAddTextFile(rc, ziproot+proj+'.rc');
		rc = undefined;

		if (!is_update_existing)
		{
			/**********************************************************************************************************************
			* <PROJ>.ico
			**********************************************************************************************************************/
			var win_icon = 'AAABAAIAICACAAEAAQAwAQAAJgAAABAQAgABAAEAsAAAAFYBAAAoAAAAIAAAAEAAAAABAAEAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKampgAAAAAAAAAAAB////g////8MAD'+
				'ADDAAwAwwAMAMMADADDAAwAwwAMAMMP/H/Dh/x/w8P8f8PD/H/D4fx/w+H8f8Pw/H/D8Px/w/h8f8P4fH/D/Dx/w/4cf8MAHH/DABx/wwAcf8MAHH/DABx/wwAcf8P////B////gAAA'+
				'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'+
				'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAABAAAAAgAAAAAQABAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmpqYAAAAAAD/8AAB//gAAQIIAAECCAABPngAAZ54A'+
				'AHOeAABzngAAeZ4AAHyeAABAngAAQJ4AAH/+AAA//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
			zipAddBase64File(win_icon, ziproot+proj+'.ico');
			win_icon = undefined;
		}
	}

	if (for_linux || for_android || for_nacl || for_emscripten)
	{
		zipAddTextFile('ASSETS := '+assetdirs.concat(assetfiles).join(' ')+"\n", ziproot+'assets.mk');

		var sourcesmk = '';
		for (var srcfile in srcfiles)
			if (srcfiles[srcfile].indexOf('/') > 0)
				sourcesmk += ' '+srcfiles[srcfile];
		if (sourcesmk)
			zipAddTextFile('ZL_ADD_SRC_FILES :='+sourcesmk+"\n", ziproot+'sources.mk');
		sourcesmk = undefined;
	}

	if (for_android)
	{
		nl = "\n";

		/**********************************************************************************************************************
		* Android/AndroidManifest.xml
		**********************************************************************************************************************/
		var and_mani = '<?xml version="1.0" encoding="utf-8"?>'+nl;
		and_mani += '<manifest xmlns:android="http://schemas.android.com/apk/res/android"'+nl;
		and_mani += '		package="'+package_identifier+'"'+nl;
		and_mani += '		android:versionCode="100" android:versionName="1.0">'+nl;
		and_mani += '	<'+(smp_internet ? '' : '!-- ')+'uses-permission android:name="android.permission.INTERNET" /'+(smp_internet ? '' : ' --')+'>'+nl;
		and_mani += '	<'+(android_vibrate  ? '' : '!-- ')+'uses-permission android:name="android.permission.VIBRATE" /'+(android_vibrate  ? '' : ' --')+'>'+nl;
		and_mani += '	<uses-feature android:glEsVersion="0x00020000" />'+nl;
		and_mani += '	<uses-feature android:name="android.hardware.touchscreen" />'+nl;
		and_mani += '	<uses-sdk android:minSdkVersion="9" android:targetSdkVersion="'+android_targetsdk+'" />'+nl;
		and_mani += '	<supports-screens android:anyDensity="true" android:resizeable="true" android:largeScreens="true" android:normalScreens="true" android:smallScreens="true"></supports-screens>'+nl;
		and_mani += '	<application android:label="'+appname+'" android:icon="@drawable/icon"'+nl;
		and_mani += '			android:debuggable="false" android:theme="@android:style/Theme.Black.NoTitleBar.Fullscreen">'+nl;
		and_mani += '		<activity android:name=".'+proj+'" android:label="'+proj+'"'+nl;
		and_mani += '				android:launchMode="singleTop" android:multiprocess="false" android:screenOrientation="sensor"'+nl;
		and_mani += '				android:configChanges="mcc|mnc|locale|touchscreen|keyboard|keyboardHidden|navigation|orientation|screenLayout|fontScale|screenSize">'+nl;
		and_mani += '			<intent-filter>'+nl;
		and_mani += '				<action android:name="android.intent.action.MAIN" />'+nl;
		and_mani += '				<category android:name="android.intent.category.LAUNCHER" />'+nl;
		and_mani += '			</intent-filter>'+nl;
		and_mani += '		</activity>'+nl;
		if (android_ads)
			and_mani += '		<activity android:name="com.google.ads.AdActivity" android:configChanges="keyboard|keyboardHidden|orientation" />'+nl;
		and_mani += '	</application>'+nl;
		and_mani += '</manifest>'+nl;
		zipAddTextFile(and_mani, ziproot+'Android/AndroidManifest.xml');
		and_mani = undefined;

		/**********************************************************************************************************************
		* Android/project.properties
		**********************************************************************************************************************/
		var and_projprop = 'target=android-'+android_targetsdk+nl;
		zipAddTextFile(and_projprop, ziproot+'Android/project.properties');
		and_projprop = undefined;

		/**********************************************************************************************************************
		* Android/jni/Application.mk
		**********************************************************************************************************************/
		var and_appmk = '# APP_ABI := armeabi armeabi-v7a #enable on performance issues'+nl;
		and_appmk += '# APP_OPTIM := debug # better set android:debuggable in manifest'+nl;
		zipAddTextFile(and_appmk, ziproot+'Android/jni/Application.mk');
		and_appmk = undefined;

		/**********************************************************************************************************************
		* Android/jni/Android.mk
		**********************************************************************************************************************/
		var and_andmk = '# Everything is handled inside shared master makefile'+nl;
		and_andmk += 'include '+(zillalibbase_is_relative ? '$(call my-dir)/../../' : '')+zillalibbase+'/Android/SharedAndroid.mk'+nl;
		zipAddTextFile(and_andmk, ziproot+'Android/jni/Android.mk');
		and_andmk = undefined;

		if (for_androideclipse)
		{
			/**********************************************************************************************************************
			* Android/build.xml
			**********************************************************************************************************************/
			var and_buildxml = '<?xml version="1.0" encoding="UTF-8"?>'+nl;
			and_buildxml += '<project name="'+appname+'" default="build">'+nl;
			and_buildxml += '	<loadfile srcfile="Makefile" property="ZILLALIB_PATH"><filterchain>'+nl;
			and_buildxml += '		<linecontainsregexp><regexp pattern="ZILLALIB_PATH\\s*:?="/></linecontainsregexp>'+nl;
			and_buildxml += '		<replaceregex pattern=".*=\\s*(.*?)\\s*" replace="\\1"/><striplinebreaks/>'+nl;
			and_buildxml += '	</filterchain></loadfile>'+nl;
			and_buildxml += '	<property name="ZillaApp" value="${ZILLALIB_PATH}/Android/ZillaAppBuild.xml"/>'+nl;
			and_buildxml += '	<import file="${ZillaApp}" />'+nl;
			and_buildxml += '</project>'+nl;
			zipAddTextFile(and_buildxml, ziproot+'Android/build.xml');
			and_buildxml = undefined;

			/**********************************************************************************************************************
			* Android/.project
			**********************************************************************************************************************/
			var up2zillanum = 0;
			var up2zillaloc = zillalibbase;
			while (up2zillaloc.substr(0, 2) == '..') { up2zillanum++; up2zillaloc = up2zillaloc.substr(3); }
			var and_proj = '<?xml version="1.0" encoding="UTF-8"?>'+nl;
			and_proj += '<projectDescription>'+nl;
			and_proj += '	<name>'+proj+'</name><comment></comment><projects></projects>'+nl;
			and_proj += '	<buildSpec><buildCommand><name>org.eclipse.jdt.core.javabuilder</name><arguments></arguments></buildCommand></buildSpec>'+nl;
			and_proj += '	<natures><nature>com.android.ide.eclipse.adt.AndroidNature</nature><nature>org.eclipse.jdt.core.javanature</nature></natures>'+nl;
			and_proj += '	<linkedResources>'+nl;
			and_proj += '		<link><name>Java</name><type>2</type><locationURI>virtual:/virtual</locationURI></link>'+nl;
			and_proj += '		<link><name>GameSource</name><type>2</type><locationURI>virtual:/virtual</locationURI></link>'+nl;
			and_proj += '		<link><name>ZillaLibSrc</name><type>2</type><locationURI>virtual:/virtual</locationURI></link>'+nl;
			and_proj += '		<link><name>Java/'+package_identifier.replace(/\./g, '/')+'/'+proj+'.java</name><type>1</type><locationURI>%7BPROJECT_LOC%7D/'+proj+'.java</locationURI></link>'+nl;
			for (var srcfile in srcfiles)
				and_proj += '		<link><name>GameSource/'+srcfiles[srcfile]+'</name><type>1</type><locationURI>%257BPARENT-1-PROJECT_LOC%257D/'+srcfiles[srcfile]+'</locationURI></link>'+nl;
			and_proj += '		<link><name>ZillaLibSrc/org/zillalib</name><type>2</type><locationURI>'+(up2zillanum ? '%7BPARENT-'+(1+up2zillanum)+'-PROJECT_LOC%7D/' : '')+up2zillaloc+'/Android/java</locationURI></link>'+nl;
			and_proj += '	</linkedResources>'+nl;
			and_proj += '	<filteredResources>'+nl;
			and_proj += '		<filter><id>1</id><name></name><type>10</type><matcher><id>org.eclipse.ui.ide.multiFilter</id><arguments>1.0-name-matches-false-false-bin</arguments></matcher></filter>'+nl;
			and_proj += '		<filter><id>2</id><name></name><type>10</type><matcher><id>org.eclipse.ui.ide.multiFilter</id><arguments>1.0-name-matches-false-false-libs</arguments></matcher></filter>'+nl;
			and_proj += '		<filter><id>3</id><name></name><type>10</type><matcher><id>org.eclipse.ui.ide.multiFilter</id><arguments>1.0-name-matches-false-false-obj</arguments></matcher></filter>'+nl;
			and_proj += '		<filter><id>4</id><name></name><type>6</type><matcher><id>org.eclipse.ui.ide.multiFilter</id><arguments>1.0-name-matches-false-false-'+proj+'.java</arguments></matcher></filter>'+nl;
			and_proj += '		<filter><id>5</id><name>ZillaLibSrc/org/zillalib</name><type>26</type><matcher><id>org.eclipse.ui.ide.multiFilter</id><arguments>1.0-name-matches-false-false-.svn</arguments></matcher></filter>'+nl;
			and_proj += '	</filteredResources>'+nl;
			and_proj += '</projectDescription>'+nl;
			zipAddTextFile(and_proj, ziproot+'Android/.project');
			and_proj = undefined, up2zillanum = undefined, up2zillaloc = undefined;

			/**********************************************************************************************************************
			* Android/.classpath
			**********************************************************************************************************************/
			var and_classpath = '<?xml version="1.0" encoding="UTF-8"?>'+nl;
			and_classpath += '<classpath>'+nl;
			and_classpath += '	<classpathentry kind="src" path="Java"/>'+nl;
			and_classpath += '	<classpathentry kind="src" path="ZillaLibSrc"/>'+nl;
			and_classpath += '	<classpathentry kind="con" path="com.android.ide.eclipse.adt.ANDROID_FRAMEWORK"/>'+nl;
			and_classpath += '	<classpathentry kind="con" path="com.android.ide.eclipse.adt.LIBRARIES"/>'+nl;
			and_classpath += '	<classpathentry kind="output" path="bin/classes"/>'+nl;
			and_classpath += '</classpath>'+nl;
			zipAddTextFile(and_classpath, ziproot+'Android/.classpath');
			and_classpath = undefined;

			/**********************************************************************************************************************
			* Android/lint.xml
			**********************************************************************************************************************/
			var and_lint = '<?xml version="1.0" encoding="UTF-8"?>'+nl;
			and_lint += '<lint>'+nl;
			and_lint += '	<issue id="AllowBackup" severity="ignore" />'+nl;
			and_lint += '	<issue id="HardcodedDebugMode" severity="ignore" />'+nl;
			and_lint += '	<issue id="OldTargetApi" severity="ignore" />'+nl;
			and_lint += '</lint>'+nl;
			zipAddTextFile(and_lint, ziproot+'Android/lint.xml');
			and_lint = undefined;

			/**********************************************************************************************************************
			* Android/Zilla-Sign-APK.launch
			**********************************************************************************************************************/
			var and_andsign = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'+nl;
			and_andsign += '<launchConfiguration type="org.eclipse.ant.AntLaunchConfigurationType">'+nl;
			and_andsign += '<booleanAttribute key="org.eclipse.ant.ui.DEFAULT_VM_INSTALL" value="false"/>'+nl;
			and_andsign += '<listAttribute key="org.eclipse.debug.core.MAPPED_RESOURCE_TYPES"><listEntry value="1"/></listAttribute>'+nl;
			and_andsign += '<stringAttribute key="org.eclipse.jdt.launching.CLASSPATH_PROVIDER" value="org.eclipse.ant.ui.AntClasspathProvider"/>'+nl;
			and_andsign += '<stringAttribute key="org.eclipse.jdt.launching.SOURCE_PATH_PROVIDER" value="org.eclipse.ant.ui.AntClasspathProvider"/>'+nl;
			and_andsign += '<stringAttribute key="org.eclipse.ui.externaltools.ATTR_ANT_TARGETS" value="sign,"/>'+nl;
			and_andsign += '<booleanAttribute key="org.eclipse.ui.externaltools.ATTR_HIDE_INTERNAL_TARGETS" value="true"/>'+nl;
			and_andsign += '<stringAttribute key="org.eclipse.ui.externaltools.ATTR_LOCATION" value="${container_loc}/build.xml"/>'+nl;
			and_andsign += '<stringAttribute key="org.eclipse.ui.externaltools.ATTR_TOOL_ARGUMENTS" value="&quot;-DSIGN_OUTAPK=${file_prompt:SIGN_OUTAPK APK - File to generate:${container_loc}/${project_name}.apk}&quot; &quot;-DSIGN_KEYSTORE=${file_prompt:SIGN_KEYSTORE - File of the keystore}&quot; &quot;-DSIGN_STOREPASS=${password_prompt:SIGN_STOREPASS - Pass of the store:}&quot; &quot;-DSIGN_KEYALIAS=${string_prompt:SIGN_KEYALIAS - Name alias of the key}&quot; &quot;-DSIGN_KEYPASS=${password_prompt:SIGN_KEYPASS - Pass of the key:}&quot;"/>'+nl;
			and_andsign += '<stringAttribute key="process_factory_id" value="org.eclipse.ant.ui.remoteAntProcessFactory"/>'+nl;
			and_andsign += '</launchConfiguration>'+nl;
			zipAddTextFile(and_andsign, ziproot+'Android/Zilla-Sign-APK.launch');
			and_andsign = undefined;
		}

		if (!is_update_existing)
		{
			/**********************************************************************************************************************
			* Android/src/<package>/<proj>.java
			**********************************************************************************************************************/
			var and_java = 'package '+package_identifier+';'+nl;
			and_java += ''+nl;
			and_java += 'public class '+proj+' extends org.zillalib.ZillaActivity'+nl;
			and_java += '{'+nl;
			and_java += '	static { System.loadLibrary("'+proj+'"); }'+nl;
			and_java += '}'+nl;
			zipAddTextFile(and_java, ziproot+'Android/'+proj+'.java');
			and_java = undefined;

			/**********************************************************************************************************************
			* Android/res/drawable-mdpi/icon.png
			**********************************************************************************************************************/
			var and_icon48 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwAgMAAAAqbBEUAAAACVBMVEUAAAAAAACmpqaZftWgAAAA'+
				'AXRSTlMAQObYZgAAAGxJREFUeF6t0qERAzEMBVGHpIirJk1IwCWomhB1EAOryozJfS2/BZp5SOQP'+
				'9LK7z3jX3Xdcwm9cdiqL53H+JOANBkxhEyEsooQEvMGAKWwihEWUkIA3GDCFTYSwiBIS8AY7xTkP'+
				'A6PAXDik3h9wngh5kN8xoAAAAABJRU5ErkJggg==';
			zipAddBase64File(and_icon48, ziproot+'Android/res/drawable-mdpi/icon.png');
			and_icon48 = undefined;

			/**********************************************************************************************************************
			* Android/res/drawable-hdpi/icon.png
			**********************************************************************************************************************/
			var and_icon72 = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAABIAgMAAAAog1vUAAAACVBMVEUAAAAAAACmpqaZftWgAAAA'+
				'AXRSTlMAQObYZgAAAJBJREFUeF7V1LERAjEMBVGTUATV0IQcuARXQ+IOUGBVyRzDJcs2cBu+SIl+'+
				'swK1div0bHfSqz3i18zoB72vTnWUSgVaRp0URgO0lSYolQq0jDopjAbouAGUSgVaRp0URgO0lSYo'+
				'lQq0jDopSOcNoAlKpQIto04KowHaShOUSgVa/3TeUPow3y5OMmkyfDKP0gfUP3ATChel+AAAAABJ'+
				'RU5ErkJggg==';
			zipAddBase64File(and_icon72, ziproot+'Android/res/drawable-hdpi/icon.png');
			and_icon72 = undefined;
		}
	}

	var xvers = { 'iOS': for_ios, 'OSX': for_osx };
	for (var xver in xvers)
	{
		var for_x_checked = xvers[xver];
		if (!for_x_checked) continue;
		nl = "\n";

		/**********************************************************************************************************************
		* <proj>-<xver>.xcodeproj/Info.plist
		**********************************************************************************************************************/
		var plist = '<?xml version="1.0" encoding="UTF-8"?>'+nl;
		plist += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'+nl;
		plist += '<plist version="1.0"><dict>'+nl;
		plist += '<key>CFBundleVersion</key><string>1.0.0</string>'+nl;
		plist += '<key>CFBundleShortVersionString</key><string>1.0.0</string>'+nl;
		plist += '<key>CFBundleDisplayName</key><string>'+(proj == appname ? '${PRODUCT_NAME}' : appname)+'</string>'+nl;
		plist += '<key>CFBundleIdentifier</key><string>${PRODUCT_BUNDLE_IDENTIFIER}</string>'+nl;
		plist += '<key>CFBundleInfoDictionaryVersion</key><string>6.0</string>'+nl;
		plist += '<key>CFBundlePackageType</key><string>APPL</string>'+nl;
		plist += '<key>CFBundleDevelopmentRegion</key><string>en</string>'+nl;
		plist += '<key>CFBundleExecutable</key><string>${EXECUTABLE_NAME}</string>'+nl;
		plist += '<key>CFBundleName</key><string>${PRODUCT_NAME}</string>'+nl;
		if (xver == 'iOS')
		{
			plist += '<key>CFBundleIconFiles</key><array><string>Icon-72.png</string><string>Icon-114.png</string><string>Icon-144.png</string><string>Icon.png</string></array>'+nl;
			plist += '<key>UILaunchImages</key><array>'+nl;
			plist += '<dict><key>UILaunchImageMinimumOSVersion</key><string>9.0</string><key>UILaunchImageName</key><string>Default-Landscape</string><key>UILaunchImageOrientation</key><string>Landscape</string><key>UILaunchImageSize</key><string>{320, 480}</string></dict>'+nl;
			plist += '<dict><key>UILaunchImageMinimumOSVersion</key><string>9.0</string><key>UILaunchImageName</key><string>Default-Landscape</string><key>UILaunchImageOrientation</key><string>Landscape</string><key>UILaunchImageSize</key><string>{320, 568}</string></dict>'+nl;
			plist += '<dict><key>UILaunchImageMinimumOSVersion</key><string>9.0</string><key>UILaunchImageName</key><string>Default-Landscape</string><key>UILaunchImageOrientation</key><string>Landscape</string><key>UILaunchImageSize</key><string>{375, 667}</string></dict>'+nl;
			plist += '</array>'+nl;
			plist += '<key>UILaunchImages~ipad</key><array>'+nl;
			plist += '<dict><key>UILaunchImageMinimumOSVersion</key><string>7.0</string><key>UILaunchImageName</key><string>Default-Landscape</string><key>UILaunchImageOrientation</key><string>Landscape</string><key>UILaunchImageSize</key><string>{768, 1024}</string></dict>'+nl;
			plist += '<dict><key>UILaunchImageMinimumOSVersion</key><string>7.0</string><key>UILaunchImageName</key><string>Default-Landscape</string><key>UILaunchImageOrientation</key><string>Landscape</string><key>UILaunchImageSize</key><string>{748, 1024}</string></dict>'+nl;
			plist += '</array>'+nl;
			plist += '<key>UIRequiresFullScreen</key><true/>'+nl;
			plist += '<key>LSRequiresIPhoneOS</key><true/>'+nl;
			plist += '<key>UIPrerenderedIcon</key><true/>'+nl;
			plist += '<key>UIStatusBarHidden</key><true/>'+nl;
			plist += '<key>UIViewControllerBasedStatusBarAppearance</key><false/>'+nl;
			plist += '<key>UISupportedInterfaceOrientations</key><array><string>UIInterfaceOrientationLandscapeRight</string><string>UIInterfaceOrientationLandscapeLeft</string></array>'+nl;
		}
		if (xver == 'OSX')
		{
			plist += '<key>LSMinimumSystemVersion</key><string>${MACOSX_DEPLOYMENT_TARGET}</string>'+nl;
		}
		plist += '</dict></plist>'+nl;
		zipAddTextFile(plist, ziproot+proj+'-'+xver+'.xcodeproj/Info.plist');
		plist = undefined;

		/**********************************************************************************************************************
		* <proj>-<xver>.xcodeproj/project.pbxproj
		**********************************************************************************************************************/
		var pbxGroupSourcesRefIds = [];
		var pbxGroupSourcesBuildIds = [];
		var pbxGroupResourcesRefIds = [];
		var pbxGroupResourcesBuildIds = [];
		var pbxGroupFrameworksRefIds = [];
		var pbxGroupFrameworksBuildIds = [];

		var pbx = '// !$*UTF8*$!'+nl;
		pbx += '{ archiveVersion = 1; classes = { }; objectVersion = 46; objects = {'+nl;
		pbx += ''+nl;
		var i = 0;
		for (var srcfile in srcfiles)
		{
			srcfile = srcfiles[srcfile];
			if (srcfile.substr(-4).toLowerCase() == '.cpp' || srcfile.substr(-2).toLowerCase() == '.c' || srcfile.substr(-3).toLowerCase() == '.cc') continue;
			i++; var refid = '101'+('000'+i).slice(-3);
			pbx += '	'+refid+' = { isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = sourcecode.cpp.h; path = "'+srcfile+'"; sourceTree = "<group>"; };'+nl;
			pbxGroupSourcesRefIds.push(refid);
		}
		pbx += ''+nl;
		i = 0;
		for (var srcfile in srcfiles)
		{
			srcfile = srcfiles[srcfile];
			if (srcfile.substr(-4).toLowerCase() != '.cpp' && srcfile.substr(-2).toLowerCase() != '.c' && srcfile.substr(-3).toLowerCase() != '.cc') continue;
			i++; var buildid = '202'+('000'+i).slice(-3), refid = '201'+('000'+i).slice(-3);
			pbx += '	'+buildid+' = { isa = PBXBuildFile; fileRef = '+refid+'; }; '+refid+' = { isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = sourcecode.cpp.cpp; path = "'+srcfile+'"; sourceTree = "<group>"; };'+nl;
			pbxGroupSourcesRefIds.push(refid); pbxGroupSourcesBuildIds.push(buildid);
		}
		pbx += ''+nl;
		i = 0;
		for (var assetdir in assetdirs)
		{
			assetdir = assetdirs[assetdir];
			i++; var buildid = '302'+('000'+i).slice(-3), refid = '301'+('000'+i).slice(-3);
			pbx += '	'+buildid+' = { isa = PBXBuildFile; fileRef = '+refid+'; }; '+refid+' = { isa = PBXFileReference; lastKnownFileType = folder; path = "'+assetdir+'"; sourceTree = "<group>"; };'+nl;
			pbxGroupResourcesRefIds.push(refid); pbxGroupResourcesBuildIds.push(buildid);
		}
		for (var assetfile in assetfiles)
		{
			assetfile = assetfiles[assetfile];
			i++; var buildid = '302'+('000'+i).slice(-3), refid = '301'+('000'+i).slice(-3);
			pbx += '	'+buildid+' = { isa = PBXBuildFile; fileRef = '+refid+'; }; '+refid+' = { isa = PBXFileReference; lastKnownFileType = file; name = "'+assetfile.match(/[^\/]*$/)[0]+'"; path = "'+assetfile+'"; sourceTree = "<group>"; };'+nl;
			pbxGroupResourcesRefIds.push(refid); pbxGroupResourcesBuildIds.push(buildid);
		}
		pbx += ''+nl;
		i = 0;
		if (xver == 'iOS')
		{
			var appresources = ['Icon.png','Icon-72.png','Icon-114.png','Icon-144.png','Icon-60@2x.png','Default.png','Default@2x.png','Default-568h@2x.png','Default-Landscape@2x.png','Default-Landscape@2x~ipad.png','Default-Landscape~ipad.png'];
			for (var appresfile in appresources)
			{
				appresfile = appresources[appresfile];
				i++; var buildid = '402'+('000'+i).slice(-3), refid = '401'+('000'+i).slice(-3);
				pbx += '	'+buildid+' = { isa = PBXBuildFile; fileRef = '+refid+'; }; '+refid+' = { isa = PBXFileReference; lastKnownFileType = image.png; name = "'+appresfile+'"; path = "'+proj+'-'+xver+'.xcodeproj/'+appresfile+'"; sourceTree = "<group>"; };'+nl;
				pbxGroupResourcesRefIds.push(refid); pbxGroupResourcesBuildIds.push(buildid);
			}
		}
		if (xver == 'OSX')
		{
			i++; var buildid = '402'+('000'+i).slice(-3), refid = '401'+('000'+i).slice(-3);
			pbx += '	'+buildid+' = { isa = PBXBuildFile; fileRef = '+refid+'; }; '+refid+' = { isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; name = "Images.xcassets"; path = "'+proj+'-'+xver+'.xcodeproj/Images.xcassets"; sourceTree = "<group>"; };'+nl;
			pbxGroupResourcesRefIds.push(refid); pbxGroupResourcesBuildIds.push(buildid);
		}
		pbx += ''+nl;
		i = 0;
		var appframeworks;
		if (xver == 'iOS')
			appframeworks = ['Foundation.framework','UIKit.framework','CoreGraphics.framework','AudioToolbox.framework','CoreAudio.framework',
				'QuartzCore.framework','OpenGLES.framework','SystemConfiguration.framework','MessageUI.framework','AVFoundation.framework','libz.dylib'];
		if (xver == 'OSX')
			appframeworks = ['Cocoa.framework','OpenGL.framework','Carbon.framework','AudioUnit.framework','IOKit.framework','ForceFeedback.framework','CoreAudio.framework'];
		for (var appframework in appframeworks)
		{
			appframework = appframeworks[appframework];
			if (appframework.substr(-10).toLowerCase() != '.framework') continue;
			i++; var buildid = '502'+('000'+i).slice(-3), refid = '501'+('000'+i).slice(-3);
			pbx += '	'+buildid+' = { isa = PBXBuildFile; fileRef = '+refid+'; }; '+refid+' = { isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = '+appframework+'; path = System/Library/Frameworks/'+appframework+'; sourceTree = SDKROOT; };'+nl;
			pbxGroupFrameworksRefIds.push(refid); pbxGroupFrameworksBuildIds.push(buildid);
		}
		for (var appframework in appframeworks)
		{
			appframework = appframeworks[appframework];
			if (appframework.substr(-10).toLowerCase() == '.framework') continue;
			i++; var buildid = '502'+('000'+i).slice(-3), refid = '501'+('000'+i).slice(-3);
			pbx += '	'+buildid+' = { isa = PBXBuildFile; fileRef = '+refid+'; }; '+refid+' = { isa = PBXFileReference; lastKnownFileType = "compiled.mach-o.dylib"; name = '+appframework+'; path = usr/lib/'+appframework+'; sourceTree = SDKROOT; };'+nl;
			pbxGroupFrameworksRefIds.push(refid); pbxGroupFrameworksBuildIds.push(buildid);
		}
		pbx += ''+nl;
		pbx += '	600001 = { isa = PBXFileReference; lastKnownFileType = "wrapper.pb-project"; name = "ZillaLib-'+xver+'.xcodeproj"; path = "'+zillalibbase+'/ZillaLib-'+xver+'.xcodeproj"; sourceTree = SOURCE_ROOT; };'+nl;
		pbx += '	600002 = { isa = PBXReferenceProxy; fileType = archive.ar; path = "libZillaLib.a"; remoteRef = 600004; sourceTree = BUILT_PRODUCTS_DIR; };'+nl;
		pbx += '	600003 = { isa = PBXBuildFile; fileRef = 600002; };'+nl;
		pbx += '	600004 = { isa = PBXContainerItemProxy; containerPortal = 600001; proxyType = 2; remoteGlobalIDString = 2177A2177A2177A2177A00'+(xver == 'iOS' ? 23 : 45)+'; remoteInfo = "ZillaLib"; };'+nl;
		pbx += '	600005 = { isa = PBXContainerItemProxy; containerPortal = 600001; proxyType = 1; remoteGlobalIDString = 2177A2177A2177A2177A00'+(xver == 'iOS' ? 22 : 44)+'; remoteInfo = "ZillaLib"; };'+nl;
		pbx += '	600006 = { isa = PBXTargetDependency; name = "ZillaLib"; targetProxy = 600005; };'+nl;
		pbx += ''+nl;
		pbx += '	700000 = { isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = text.plist.xml; name = Info.plist; path = "'+proj+'-'+xver+'.xcodeproj/Info.plist"; sourceTree = "<group>"; };'+nl;
		pbx += '	800000 = { isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = '+proj+'.app; sourceTree = BUILT_PRODUCTS_DIR; };'+nl;
		pbx += ''+nl;
		pbx += '	A00001 = { isa = PBXGroup; name = Products; children = (800000); sourceTree = "<group>"; };'+nl;
		pbx += '	A00002 = { isa = PBXGroup; name = Sources; children = ('+pbxGroupSourcesRefIds.join(',')+'); sourceTree = "<group>"; };'+nl;
		pbx += '	A00003 = { isa = PBXGroup; name = Resources; children = ('+pbxGroupResourcesRefIds.join(',')+'); sourceTree = "<group>"; };'+nl;
		pbx += '	A00004 = { isa = PBXGroup; name = Frameworks; children = ('+pbxGroupFrameworksRefIds.join(',')+'); sourceTree = "<group>"; };'+nl;
		pbx += '	A00005 = { isa = PBXGroup; name = CustomTemplate; children = (600001,A00001,A00002,A00003,A00004); sourceTree = "<group>"; };'+nl;
		pbx += '	A00006 = { isa = PBXGroup; name = Products; children = (600002); sourceTree = "<group>"; };'+nl;
		pbx += ''+nl;
		pbx += '	C00001 = { isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = ('+pbxGroupResourcesBuildIds.join(',')+'); runOnlyForDeploymentPostprocessing = 0; };'+nl;
		pbx += '	C00002 = { isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = ('+pbxGroupSourcesBuildIds.join(',')+'); runOnlyForDeploymentPostprocessing = 0; };'+nl;
		pbx += '	C00003 = { isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = ('+pbxGroupFrameworksBuildIds.join(',')+',600003); runOnlyForDeploymentPostprocessing = 0; };'+nl;
		if (xver == 'OSX' && assets_embed)
		{
			pbx += '	C00004 = { isa = PBXShellScriptBuildPhase; buildActionMask = 2147483647; files = (); inputPaths = (); outputPaths = (); runOnlyForDeploymentPostprocessing = 0; showEnvVarsInLog = 0;'+nl;
			pbx += '		shellPath = /bin/sh;'+nl;
			pbx += '		shellScript = "'+nl;
			pbx += '			if [ \\"$CONFIGURATION\\" != \\"Release\\" ]; then exit; fi #only perform in Release builds'+nl;
			pbx += '			$TOOLCHAIN_DIR/usr/bin/strip $TARGET_BUILD_DIR/$EXECUTABLE_PATH #manual strip because regular strip can\'t run after appending zip'+nl;
			pbx += '			cd $TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH'+nl;
			pbx += '			zip -0 -m -r - * -x AppIcon.icns | cat >> $TARGET_BUILD_DIR/$EXECUTABLE_PATH'+nl;
			pbx += '		"; };'+nl;
		}
		pbx += ''+nl;
		if (xver == 'iOS')
		{
			pbx += '	D01001 = { isa = XCBuildConfiguration; buildSettings = { CODE_SIGN_IDENTITY = "iPhone Developer"; "CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Developer"; PROVISIONING_PROFILE = ""; }; name = Debug; };'+nl;
			pbx += '	D01002 = { isa = XCBuildConfiguration; buildSettings = { CODE_SIGN_IDENTITY = "iPhone Distribution"; "CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Developer"; PROVISIONING_PROFILE = ""; }; name = Release; };'+nl;
		}
		else
		{
			pbx += '	D01001 = { isa = XCBuildConfiguration; buildSettings = {}; name = Debug; };'+nl;
			pbx += '	D01002 = { isa = XCBuildConfiguration; buildSettings = {}; name = Release; };'+nl;
		}
		pbx += ''+nl;
		pbx += '	D02001 = { isa = XCBuildConfiguration; buildSettings = {'+nl;
		pbx += '			PRODUCT_NAME = '+proj+';'+nl;
		pbx += '			PRODUCT_BUNDLE_IDENTIFIER = '+package_identifier+';'+nl;
		pbx += '			INFOPLIST_FILE = "'+proj+'-'+xver+'.xcodeproj/Info.plist";'+nl;
		if (xver == 'OSX') pbx += '			ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;'+nl;
		pbx += '			HEADER_SEARCH_PATHS = '+zillalibbase+'/Include;'+nl;
		pbx += '			OTHER_CFLAGS = ( "-DDEBUG", "-D_DEBUG", "-DZILLALOG" );'+nl;
		pbx += '			CLANG_CXX_LANGUAGE_STANDARD = "c++0x";'+nl;
		pbx += '			GCC_PREPROCESSOR_DEFINITIONS = $CmdLinePreprocessorDefinitions;'+nl;
		pbx += '			GCC_ENABLE_CPP_EXCEPTIONS = NO;'+nl;
		pbx += '			GCC_ENABLE_CPP_RTTI = NO;'+nl;
		pbx += '			GCC_OPTIMIZATION_LEVEL = 0;'+nl;
		pbx += '			COPY_PHASE_STRIP = NO;'+nl;
		pbx += '			ONLY_ACTIVE_ARCH = YES;'+nl;
		pbx += '			STRIP_INSTALLED_PRODUCT = NO;'+nl;
		if (xver == 'iOS')
		{
			pbx += '			CODE_SIGN_IDENTITY = "iPhone Developer";'+nl;
			pbx += '			ARCHS = armv7;'+nl;
			pbx += '			VALID_ARCHS = "armv7 i386";'+nl;
			pbx += '			IPHONEOS_DEPLOYMENT_TARGET = 4.3;'+nl;
			pbx += '			TARGETED_DEVICE_FAMILY = "1,2";'+nl;
			pbx += '			IPHONE_OPTIMIZE_OPTIONS = "-skip-PNGs";'+nl;
			pbx += '			ENABLE_BITCODE = NO;'+nl;
		}
		if (xver == 'OSX') pbx += '			MACOSX_DEPLOYMENT_TARGET = 10.5;'+nl;
		pbx += '			SDKROOT = '+(xver == 'iOS' ? 'iphoneos' : 'macosx')+';'+nl;
		pbx += '			OBJROOT = "'+proj+'-'+xver+'.xcodeproj/Debug";'+nl;
		pbx += '			SYMROOT = "'+proj+'-'+xver+'.xcodeproj/Debug";'+nl;
		pbx += '			BUILD_DIR = "'+proj+'-'+xver+'.xcodeproj/Debug";'+nl;
		pbx += '			CONFIGURATION_BUILD_DIR = "'+proj+'-'+xver+'.xcodeproj/Debug";'+nl;
		pbx += '			CONFIGURATION_TEMP_DIR = "'+proj+'-'+xver+'.xcodeproj/Debug";'+nl;
		pbx += '			SHARED_PRECOMPS_DIR = "'+proj+'-'+xver+'.xcodeproj/Debug";'+nl;
		pbx += '		}; name = Debug; };'+nl;
		pbx += ''+nl;
		pbx += '	D02002 = { isa = XCBuildConfiguration; buildSettings = {'+nl;
		pbx += '			PRODUCT_NAME = '+proj+';'+nl;
		pbx += '			PRODUCT_BUNDLE_IDENTIFIER = '+package_identifier+';'+nl;
		pbx += '			INFOPLIST_FILE = "'+proj+'-'+xver+'.xcodeproj/Info.plist";'+nl;
		if (xver == 'OSX') pbx += '			ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;'+nl;
		pbx += '			HEADER_SEARCH_PATHS = '+zillalibbase+'/Include;'+nl;
		pbx += '			OTHER_CFLAGS = ( "-DNDEBUG", "-fvisibility=hidden", "-ffunction-sections", "-fdata-sections" );'+nl;
		pbx += '			CLANG_CXX_LANGUAGE_STANDARD = "c++0x";'+nl;
		pbx += '			GCC_PREPROCESSOR_DEFINITIONS = $CmdLinePreprocessorDefinitions;'+nl;
		pbx += '			GCC_ENABLE_CPP_EXCEPTIONS = NO;'+nl;
		pbx += '			GCC_ENABLE_CPP_RTTI = NO;'+nl;
		pbx += '			DEAD_CODE_STRIPPING = YES;'+nl;
		pbx += '			DEPLOYMENT_POSTPROCESSING = YES;'+nl;
		if (xver == 'iOS')
		{
			pbx += '			CODE_SIGN_IDENTITY = "iPhone Distribution";'+nl;
			pbx += '			ARCHS = armv7;'+nl;
			pbx += '			VALID_ARCHS = "armv7 i386";'+nl;
			pbx += '			IPHONEOS_DEPLOYMENT_TARGET = 4.3;'+nl;
			pbx += '			TARGETED_DEVICE_FAMILY = "1,2";'+nl;
			pbx += '			IPHONE_OPTIMIZE_OPTIONS = "-skip-PNGs";'+nl;
			pbx += '			ENABLE_BITCODE = NO;'+nl;
		}
		pbx += '			STRIP_INSTALLED_PRODUCT = '+(xver == 'OSX' && assets_embed ? 'NO' : 'YES')+';'+nl;
		if (xver == 'OSX') pbx += '			MACOSX_DEPLOYMENT_TARGET = 10.5;'+nl;
		pbx += '			SDKROOT = '+(xver == 'iOS' ? 'iphoneos' : 'macosx')+';'+nl;
		pbx += '			OBJROOT = "'+proj+'-'+xver+'.xcodeproj/Release";'+nl;
		pbx += '			SYMROOT = "'+proj+'-'+xver+'.xcodeproj/Release";'+nl;
		pbx += '			BUILD_DIR = "'+proj+'-'+xver+'.xcodeproj/Release";'+nl;
		pbx += '			CONFIGURATION_BUILD_DIR = "'+proj+'-'+xver+'.xcodeproj/Release";'+nl;
		pbx += '			CONFIGURATION_TEMP_DIR = "'+proj+'-'+xver+'.xcodeproj/Release";'+nl;
		pbx += '			SHARED_PRECOMPS_DIR = "'+proj+'-'+xver+'.xcodeproj/Release";'+nl;
		pbx += '		}; name = Release; };'+nl;
		pbx += ''+nl;
		pbx += '	E01000 = { isa = XCConfigurationList; buildConfigurations = (D01001,D01002); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; };'+nl;
		pbx += '	E02000 = { isa = XCConfigurationList; buildConfigurations = (D02001,D02002); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; };'+nl;
		pbx += ''+nl;
		pbx += '	F01000 = {'+nl;
		pbx += '		isa = PBXNativeTarget;'+nl;
		pbx += '		buildConfigurationList = E01000;'+nl;
		pbx += '		buildPhases = (C00001,C00002,C00003'+((xver == 'OSX' && assets_embed) ? ',C00004' : '')+');'+nl;
		pbx += '		buildRules = ();'+nl;
		pbx += '		dependencies = (600006);'+nl;
		pbx += '		name = '+proj+';'+nl;
		pbx += '		productName = "___PROJECTNAME___";'+nl;
		pbx += '		productReference = 800000;'+nl;
		pbx += '		productType = "com.apple.product-type.application";'+nl;
		pbx += '	};'+nl;
		pbx += ''+nl;
		pbx += '	F02000 = {'+nl;
		pbx += '		isa = PBXProject;'+nl;
		pbx += '		attributes = { LastUpgradeCheck = 0700; };'+nl;
		pbx += '		buildConfigurationList = E02000;'+nl;
		pbx += '		compatibilityVersion = "Xcode 3.2";'+nl;
		pbx += '		developmentRegion = English;'+nl;
		pbx += '		hasScannedForEncodings = 1;'+nl;
		pbx += '		knownRegions = (en);'+nl;
		pbx += '		mainGroup = A00005;'+nl;
		pbx += '		projectReferences = ( { ProductGroup = A00006; ProjectRef = 600001; }, );'+nl;
		pbx += '		projectDirPath = "";'+nl;
		pbx += '		projectRoot = ..;'+nl;
		pbx += '		targets = (F01000);'+nl;
		pbx += '	};'+nl;
		pbx += ''+nl;
		pbx += '}; rootObject = F02000; }'+nl;
		zipAddTextFile(pbx, ziproot+proj+'-'+xver+'.xcodeproj/project.pbxproj');
		pbx = undefined, pbxGroupSourcesRefIds = undefined, pbxGroupSourcesBuildIds = undefined, pbxGroupResourcesRefIds = undefined, pbxGroupResourcesBuildIds = undefined, pbxGroupFrameworksRefIds = undefined, pbxGroupFrameworksBuildIds = undefined;

		if (!is_update_existing && xver == 'iOS')
		{
			/**********************************************************************************************************************
			* <proj>-iOS.xcodeproj/Icon.png
			**********************************************************************************************************************/
			var ios_icon57 = 'iVBORw0KGgoAAAANSUhEUgAAADkAAAA5BAMAAAB+Np62AAAAElBMVEUAAAAAAAAAAAAAAACmpqYAAAC4Cce+AAAABHRSTlMAw2HaOpovrwAAAH'+
				'1JREFUeF7d1aENA0EQQ9ElaSCdXA8efsDuv5VowUoBsT4ISj59Mp1ZVD53PTc+VJqtVuve07wlTeIz/lU9famuOqiqGlJXHVRVDamrDqqqhtRV'+
				'B1VVQ+qqg6qqIXXVQVXVkLrqoKpqSF11UFU1qKetJ/+hwm2nv7BSuhf0Aow0rqPDOjvjAAAAAElFTkSuQmCCRU5ErkJggg==';
			zipAddBase64File(ios_icon57, ziproot+proj+'-iOS.xcodeproj/Icon.png');
			ios_icon57 = undefined;

			/**********************************************************************************************************************
			* <proj>-iOS.xcodeproj/Icon-72.png
			**********************************************************************************************************************/
			var ios_icon72 = 'iVBORw0KGgoAAAANSUhEUgAAAEgAAABIAgMAAAAog1vUAAAACVBMVEUAAAAAAACmpqaZftWgAAAAAXRSTlMAQObYZgAAAJBJREFUeF7V1LERAj'+
				'EMBVGTUATV0IQcuARXQ+IOUGBVyRzDJcs2cBu+SIl+swK1div0bHfSqz3i18zoB72vTnWUSgVaRp0URgO0lSYolQq0jDopjAbouAGUSgVaRp0U'+
				'RgO0lSYolQq0jDopSOcNoAlKpQIto04KowHaShOUSgVa/3TeUPow3y5OMmkyfDKP0gfUP3ATChel+AAAAABJRU5ErkJggg==';
			zipAddBase64File(ios_icon72, ziproot+proj+'-iOS.xcodeproj/Icon-72.png');
			ios_icon72 = undefined;

			/**********************************************************************************************************************
			* <proj>-iOS.xcodeproj/Icon-114.png
			**********************************************************************************************************************/
			var ios_icon114 = 'iVBORw0KGgoAAAANSUhEUgAAAHIAAAByAgMAAADys23uAAAACVBMVEUAAAAAAACmpqaZftWgAAAAAXRSTlMAQObYZgAAAMtJREFUeF7t16ERwz'+
				'AQRFGFpIOQVOMmJKASrpoQdRABXZWxwSZoszNL7QUazTz04RWxR2Xbdo1ke5VyS7p3KXeuq5TnqL/1zLG/4O3ceim+U2qYepSlqTs2U9cR5CiC'+
				'HEWQoQhyFEGmTqlBdUhNqlVpo7qkdqpTalAdUpNqVdqoLqmd6nQVuY4i11DkOoogRxHkKIIcRZCjCPJ0SA2qVWoyXVIb1Sm1Ux1Sg2qVmkyX1E'+
				'Z1Su1Uh9LfDv0uTq2XimvixvUtrhhxAf3dB0XOYeE/YqetAAAAAElFTkSuQmCC';
			zipAddBase64File(ios_icon114, ziproot+proj+'-iOS.xcodeproj/Icon-114.png');
			ios_icon114 = undefined;

			/**********************************************************************************************************************
			* <proj>-iOS.xcodeproj/Icon-144.png
			**********************************************************************************************************************/
			var ios_icon144 = 'iVBORw0KGgoAAAANSUhEUgAAAJAAAACQAQMAAADdiHD7AAAABlBMVEWmpqYAAAD9RWfTAAAA7UlEQVR4Xu3WsYnFQAyEYZkNHG4JLmVLs0tzdm34cA'+
				'MON1isA202DIy4l75JBF/4RzLHeZKGwZp1pM0epGq3z/XiV9D6OX1p3sroStDmZ4KaHwna3RLkb4IWHwkq3hO0+pOgyuhC2hidSI3'+
				'RgbQzMiQn9CItjAZSYdSRVkYPUtU0c0mKXJoilyZ3UxS5JEUuSZFLUrSRFG0kRRtN0UaTu0mKNppmG00daWX0IFVGF9LG6ERqjA6k'+
				'nZEhOaEXaWE0kAqjnqDIJSlySYpckiKXpMglyd8E/fpI0M1orhef+/mYvkTeO/YEDqT277fzD43lIwlAOAf4AAAAAElFTkSuQmCC';
			zipAddBase64File(ios_icon144, ziproot+proj+'-iOS.xcodeproj/Icon-144.png');
			ios_icon144 = undefined;

			/**********************************************************************************************************************
			* <proj>-iOS.xcodeproj/Icon-60@2x.png
			**********************************************************************************************************************/
			var ios_icon60x2 = 'iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4AQMAAAADqqSRAAAABlBMVEWmpqYAAAD9RWfTAAAAwElEQVR4Xu3VsQ0DIRAEwEMfEFICpVAalEbmNrC+AUICxFkvO/Cy0lnOf5PTBJveimJ+esp3kgxwlA4O'+
				'cr57Jeplv/l2u04mi2ldpp1O04cO01676aDNdNRqOmkxnckC1t0L7MgTfJAH2JM7OJAbOJIrOJELOJMFrLsX2JEn+CAPsCd3cCA3cCRXcCIXcCYLWHcvsCNP8EEeYE/u4EBu4Eiu4EQu4EwWsO5e4KdO'+
				'0+fH/I+uPNC3ac8GONIe/rmnL9tLA07dor5fAAAAAElFTkSuQmCC';
			zipAddBase64File(ios_icon60x2, ziproot+proj+'-iOS.xcodeproj/Icon-60@2x.png');
			ios_icon60x2 = undefined;

			/**********************************************************************************************************************
			* <proj>-iOS.xcodeproj/Default.png
			**********************************************************************************************************************/
			var ios_default = 'iVBORw0KGgoAAAANSUhEUgAAAUAAAAHgAgMAAACp4lzXAAAACVBMVEUAAABjY2PDw8OLUf7aAAAEdElEQVR4Xu3dTW4sNwwE4DKBbHgUnuIdIZu3yWn6KNoEEHjKrAIZ6R+KdMFoOKy18Zkye6bVGmmM'+
				'9we/qQE+uOAv/MEF/wQf/MuJ+bvB/TTYID4nJwysyDUIOghjgzA2CGWDUDYIYYMQNgjQQdBBGBuEsUEoG4SyQQgbBOgg6CCMDcLYILQOeiDmQT8uRSmDgVgBfeAyddBnIKbAJ9HKoHsgJsBnUatg0OwS'+
				'6CMQN8FQRAl8bHYFDJqdBWMxDUbN1iwYi1kwvnySYNxsSYKxiCwYNzsLxq2xJBiLqIM+2KAPNuiTDbrTQaeDfrBBP9igDzbokw36ZIPudNAPNugHG/TBBn2wQZ9s0J0OOh30IwHmkwF7hbPBBic4ke8E'+
				'G2ywwQYb9Hq8wQYbbLDBBhusp8EGG2ywwQZ72bnBBhtssMEGG2ywP3lssMEGG+wPChtssMEGG2ywwQYbbLDBBhvs9UP8G62A8VE/K4J4iKXBgSiWArET3QUnNiN74MB+dkCkYiE4kBQD8EA2+giiEH0A'+
				'ByqRW3CiFrkBJ6qRS3CiHr0CD9QjJ/CxQIsvAjuDgRVdWifwssDUyeAFnn6odET/v2DAxVXqAi9/paUPWS/wosVaOBtsCzwXWDm/rJ/BIxxv3G1Z4MU55IpoC5yFAZ8vXr0Di6eXIQscuQ6vzBvwOBVY'+
				'KnGB2Y6sjBg09+qYjQD6CWSeUterSbvwQcJ3SFLBBvldBgEkvFJ44IxBTYEjfi0L4/3wKI85uAWkS5xbNykrjtju7stSKxD3MwcrFYiHuY1WCpSn2dce+DBZcuRnN+N2fngzIQ0SzGBnZu3jsgJb4N00'+
				'3BIcZOuxAhpoK/oJDJ7M9h74/QQ6vhK/AAfv4fHrJdol6Kh7V2B90PeLGDVP70GfxfGewfqoxa/Aeo0ar84l+xGAuWGLB2CySPMAzK3SZVeJR9SLFJh4RwvAqFL9Od/Gb2wQEDYIgA4CygYBoYErxgYB'+
				'pYErdBBQNggIDVwxNggoDVyhg4CxQUBo4IrRwMqHrWPXTNwCDhBGXpsfSgiuzNTIqZ+N6haY+3PSQcDYICA0cIUOAsoGAdkHNfHesQfuX++yB66quaC700H3SQNXDhq4QgfdBw1cOdig++SCg1shtymT'+
				'2+UDIIKT+0oZABMEQAQHwAQP7EQ3wcm4BWQjr76NvmgqUp8sgTqdm9wJ5+BOiQ/qpH1yHysG78En8ep/88OjvPoB/NWLGPbmhSB982KavnlBUl69qPvqhXH78d980iA4kZ8ENthggw16LuPHgQ022KB+'+
				'D2g58Pj/gd9yPuVUdyIzBoWx635w/hWlL7DalbkDavGiAQhHw/A5ktx1H2/UC3bdZwcMu991b4X6gKdd95KvD/K06x7QZHmABpvkoSkOuDuIGrZn4jISHJVNx4LTwdlocH45HSPvupdv2XVf74uSz9Er'+
				'+aQ/yJvkxe/A2gVufgXWi+TuaYcmNkGR97SnehGDccOr64fBSHvJtMF6GvxNDR/EBxf8BXBBvD//ACF+MKJA4Z1lAAAAAElFTkSuQmCC';
			zipAddBase64File(ios_default, ziproot+proj+'-iOS.xcodeproj/Default.png');
			zipAddBase64File(ios_default, ziproot+proj+'-iOS.xcodeproj/Default@2x.png');
			zipAddBase64File(ios_default, ziproot+proj+'-iOS.xcodeproj/Default-568h@2x.png');
			ios_default = undefined;

			var ios_default = 'iVBORw0KGgoAAAANSUhEUgAAAeAAAAFAAgMAAAAZpkfoAAAACVBMVEUAAABjY2PDw8OLUf7aAAAEl0lEQVR4XuTNMQEAAAjDsHLgCwk8828FGT2IgfBQFFBRDB3FWvGxc3e5buMwFIAJAvPCpXA189zV'+
				'cCl8KSBwlTPpdcvazg9t07J05fOQWMyhvg0E/h/+YRfkZ6/wDd/wDd+wwCz0NcEVUB6FZ4DQEng02Q+/kgj7nJ7AtICBs2EBwAgMnAb7OARDJjytcwjmVHhaisCUBPsUMARjPgwcgSET1mkrBHMiPG1j'+
				'CKZEGByeN/FcuMCUEIxXwZAHK0zhq2AKwZwGy0Ww34pXwRCC6SoYs+DiMDcAK3h1DkP3sDYAU1VYHMYQzEkwNADDEHBpDBY3ljCdAPMIsPYD43eCKQJDDixNwDgo7BS1BXMKDE3AMB7M1eDSE0zfDvYx'+
				'foI9ug9m9TtfwGamn2COw/obiMAm2TCZySfYx5gHs5lGYMuGH1QIlpewbIP9JsuAbSvsTx9gzYXJ7/wAl0thSIN5slxS+MoStpfwtB2GYSMsqfDssVFY02DvyRG4XApTHC4Om44Dk2PAr2EHOBcuDptM'+
				'MEdhTYRlM8xB2Ptx2G54iuyBLQu2fbC1DUsejH/D1DRMaxgOwy6pH2MwboDlNYz1YOkQLufD+hqmjTDZFK0J3zDug/VSmA/CUw/LdFzD2DnMz2F6DpensGyF4W+49ApbBfiG4TAM+2FMgPUBO/fdYDsO'+
				'l0yYu4GpeXh9jsLQDKwVYGsP5gRYHvD0eRqMCbCMCVsSbG/gG4YhYcyA4Q9MV8BaAfYl3gGXS2HqHcYeYB0T5i5gfQJPNZy+moZlF0y9wzYSDJkw9QJj17A6DFfAFoTLmDCNBOuYMGfBPBQsDgN/hiUd'+
				'lh5gGwmGmvANYxps7cMlCXbHf24YppFgrQrfMHcE41FYdsDlGezTB4xXwKUD2C6AoSZ8w9gpDHvg0ju8fJkCtA3TSLCOCfNIsHQHwwqWGcxNw9YnXHbBUAkuV8LYDIxbYTsOlw5hbgaGWSgAU8cwboW1'+
				'KnzDfAzWPbDsh2l4uMxhnMPaFGybYTkMQ02YToDpClj2wrgPxiNw6RqGCCx5MLQCK8zzGaYLYN0JazMwNw3zAuZjcAnBMIflCMyDwOsXCvUH2zFYJlgWML+D4QiMa5idcdhvOAG2OSynwtAdPB3xIAwR'+
				'WFNhrg+bwyUEy0kwRmBcwHQM1t8wLGB6A+sxmOIw5MPyDNZTYOdWsL2AywkwRGCdwdM674bhD0wfYEmG2ayE4KmUCWsELtkwmkEAVljD86wm6PC8p9NDeQ97UmEPm5UljKfA5T1cmoL5G8JYHbZqsA0O'+
				'Ywi2c2BdwnAFbOfBMhysm2H8TjBNMFWAy2aYToB5OPhByQrmU2B7D8sNA3A+jFVhaQCmEGxJsD6BuTLMERiz4LKAYQXTDKY6sFaBrSpsG2HOgr2KV8FUGdZtsKXBZROMJ8AcgSkPtjVsdWGvLP76fTKM'+
				'IZgT4alLIdgSYf2COQJjGuxTi8CUCdtUicCcCusDoxBsWbBjHIE5FzbH3sNoc3iVMOyyxeNwRoaEb/iGb/i/8uaYAAAAhGHYOPCFBJ76t4KMHsRAUIhxoZgERf45/N2GcM4nt2IAAAAASUVORK5CYII=';
			zipAddBase64File(ios_default, ziproot+proj+'-iOS.xcodeproj/Default-Landscape@2x.png');
			zipAddBase64File(ios_default, ziproot+proj+'-iOS.xcodeproj/Default-Landscape@2x~ipad.png');
			zipAddBase64File(ios_default, ziproot+proj+'-iOS.xcodeproj/Default-Landscape~ipad.png');
			ios_default = undefined;
		}
		if (!is_update_existing && xver == 'OSX')
		{
			/**********************************************************************************************************************
			* <proj>-OSX.xcodeproj/Images.xcassets/*
			**********************************************************************************************************************/
			var osx_iconjson  = '{"info" : { "version" : 1, "author" : "xcode" } }';
			zipAddTextFile(osx_iconjson, ziproot+proj+'-OSX.xcodeproj/Images.xcassets/Contents.json');
			osx_iconjson = undefined;

			var osx_icon16 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAB3RJTUUH3woeEyM5KgbeFwAAAAlwSFlzAAAK8AAACvABQqw0mAAAAARnQU1BAACxjwv8YQUAA'+
				'AAGUExURaampgAAAP1FZ9MAAAAxSURBVHjaY/j/n+EAM0MDI8P+RBBqT2RoS2ToS2ToSWSYk8iwAyhYC0JABUBl//8DAJX+EP5x+C4IAAAAAElFTkSuQmCC';
			zipAddBase64File(osx_icon16, ziproot+proj+'-OSX.xcodeproj/Images.xcassets/AppIcon.appiconset/Icon-16.png');
			osx_icon16 = undefined;

			var osx_icon32 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgAQMAAABJtOi3AAAAB3RJTUUH3woeEyAOuZYo2wAAAAlwSFlzAAAK8AAACvABQqw0mAAAAARnQU1BAACxjwv8YQUAAAAGUExURaampgAAAP1FZ9MAAAA7SURB'+
				'VHjaY/gPBAxg4gEDAzvD+X81zLiJA3ZwogZO/IARBz/AiMMPYMTxAzDifAOc+Ff/GTcBdgbcVQBR6E4rEIIYawAAAABJRU5ErkJggg==';
			zipAddBase64File(osx_icon32, ziproot+proj+'-OSX.xcodeproj/Images.xcassets/AppIcon.appiconset/Icon-32.png');
			zipAddBase64File(osx_icon32, ziproot+proj+'-OSX.xcodeproj/Images.xcassets/AppIcon.appiconset/Icon-33.png');
			osx_icon32 = undefined;

			var osx_iconjson  = '{"images" : ['+nl;
			osx_iconjson += '{"size" : "16x16", "idiom" : "mac", "filename" : "Icon-16.png", "scale" : "1x"},'+nl;
			osx_iconjson += '{"size" : "16x16", "idiom" : "mac", "filename" : "Icon-32.png", "scale" : "2x"},'+nl;
			osx_iconjson += '{"size" : "32x32", "idiom" : "mac", "filename" : "Icon-33.png", "scale" : "1x"},'+nl;
			osx_iconjson += '{"idiom" : "mac", "size" : "32x32", "scale" : "2x"},'+nl;
			osx_iconjson += '{"idiom" : "mac", "size" : "128x128", "scale" : "1x"},'+nl;
			osx_iconjson += '{"idiom" : "mac", "size" : "128x128", "scale" : "2x"},'+nl;
			osx_iconjson += '{"idiom" : "mac", "size" : "256x256", "scale" : "1x"},'+nl;
			osx_iconjson += '{"idiom" : "mac", "size" : "256x256", "scale" : "2x"},'+nl;
			osx_iconjson += '{"idiom" : "mac", "size" : "512x512", "scale" : "1x"},'+nl;
			osx_iconjson += '{"idiom" : "mac", "size" : "512x512", "scale" : "2x"}'+nl;
			osx_iconjson += '], "info" : { "version" : 1, "author" : "xcode" } }'+nl;
			zipAddTextFile(osx_iconjson, ziproot+proj+'-OSX.xcodeproj/Images.xcassets/AppIcon.appiconset/Contents.json');
			osx_iconjson = undefined;
		}
	}

	if (for_linux || gen_makefile || (assets_embed && (for_nacl || for_emscripten)))
	{
		zipAddTextFile('ZillaApp = '+proj+"\n"+
				(for_linux && assets_embed ? 'ZLLINUX_ASSETS_EMBED = 1'+"\n" : '')+
				(for_nacl && assets_embed ? 'ZLNACL_ASSETS_EMBED = 1'+"\n" : '')+
				(for_emscripten && assets_embed ? 'ZLEMSCRIPTEN_ASSETS_EMBED = 1'+"\n" : '')+
				'ZILLALIB_PATH = '+zillalibbase+"\n"+
				'include $(ZILLALIB_PATH)/Makefile'+"\n",
			ziproot+'Makefile');
	}

	if (for_wp8)
	{
		nl = "\r\n";

		var vcprojguid = makeRandomGuid(), vcslnguid = makeRandomGuid();

		/**********************************************************************************************************************
		* WP8/<PROJ>-vs2012wp8.vcproj
		**********************************************************************************************************************/
		var vcproj = '<?xml version="1.0" encoding="utf-8"?>'+nl;
		vcproj += '<Project DefaultTargets="Build" ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">'+nl;
		vcproj += '	<ItemGroup Label="ProjectConfigurations">'+nl;
		vcproj += '		<ProjectConfiguration Include="Debug|Win32"><Configuration>Debug</Configuration><Platform>Win32</Platform></ProjectConfiguration>'+nl;
		vcproj += '		<ProjectConfiguration Include="Debug|ARM"><Configuration>Debug</Configuration><Platform>ARM</Platform></ProjectConfiguration>'+nl;
		vcproj += '		<ProjectConfiguration Include="Release|Win32"><Configuration>Release</Configuration><Platform>Win32</Platform></ProjectConfiguration>'+nl;
		vcproj += '		<ProjectConfiguration Include="Release|ARM"><Configuration>Release</Configuration><Platform>ARM</Platform></ProjectConfiguration>'+nl;
		vcproj += '	</ItemGroup>'+nl;
		vcproj += '	<PropertyGroup Label="Globals">'+nl;
		vcproj += '		<ProjectGuid>{'+vcprojguid+'}</ProjectGuid>'+nl;
		vcproj += '		<RootNamespace>'+proj+'-vs2012wp8</RootNamespace>'+nl;
		vcproj += '		<XapFilename>'+proj+'-vs2012wp8_$(Configuration)_$(Platform).xap</XapFilename>'+nl;
		vcproj += '		<TargetName>'+proj+'</TargetName>'+nl;
		vcproj += '		<GeneratedFilesDir>./$(Configuration)-$(Platform)/</GeneratedFilesDir>'+nl;
		vcproj += '		<XapOutputs>true</XapOutputs>'+nl;
		vcproj += '		<WinMDAssembly>true</WinMDAssembly>'+nl;
		vcproj += '	</PropertyGroup>'+nl;
		vcproj += '	<Import Project="$(VCTargetsPath)\\Microsoft.Cpp.Default.props" />'+nl;
		vcproj += '	<PropertyGroup Label="Configuration">'+nl;
		vcproj += '		<ConfigurationType>Application</ConfigurationType>'+nl;
		vcproj += '		<PlatformToolset>v110_wp80</PlatformToolset>'+nl;
		vcproj += '	</PropertyGroup>'+nl;
		vcproj += '	<PropertyGroup Condition="\'$(Configuration)\'==\'Debug\'" Label="Configuration">'+nl;
		vcproj += '		<UseDebugLibraries>true</UseDebugLibraries>'+nl;
		vcproj += '	</PropertyGroup>'+nl;
		vcproj += '	<PropertyGroup Condition="\'$(Configuration)\'==\'Release\'" Label="Configuration">'+nl;
		vcproj += '		<UseDebugLibraries>false</UseDebugLibraries>'+nl;
		vcproj += '		<WholeProgramOptimization>true</WholeProgramOptimization>'+nl;
		vcproj += '	</PropertyGroup>'+nl;
		vcproj += '	<Import Project="$(VCTargetsPath)\\Microsoft.Cpp.props" />'+nl;
		vcproj += '	<PropertyGroup>'+nl;
		vcproj += '		<OutDir>./$(Configuration)-$(Platform)/</OutDir>'+nl;
		vcproj += '		<IntDir>./$(Configuration)-$(Platform)/</IntDir>'+nl;
		vcproj += '	</PropertyGroup>'+nl;
		vcproj += '	<ItemDefinitionGroup>'+nl;
		vcproj += '		<ClCompile>'+nl;
		vcproj += '			<PreprocessorDefinitions>$(CmdLinePreprocessorDefinitions);%(PreprocessorDefinitions)</PreprocessorDefinitions>'+nl;
		vcproj += '			<PrecompiledHeader>NotUsing</PrecompiledHeader>'+nl;
		vcproj += '			<AdditionalIncludeDirectories>$(ProjectDir);../'+zillalibbase+'/Include;%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>'+nl;
		vcproj += '		</ClCompile>'+nl;
		vcproj += '		<Link>'+nl;
		vcproj += '			<AdditionalDependencies>d3d11.lib;XAudio2.lib;XAPOBASE.lib;%(AdditionalDependencies)</AdditionalDependencies>'+nl;
		vcproj += '			<GenerateWindowsMetadata>false</GenerateWindowsMetadata>'+nl;
		vcproj += '			<IgnoreSpecificDefaultLibraries>ole32.lib;%(IgnoreSpecificDefaultLibraries)</IgnoreSpecificDefaultLibraries>'+nl;
		vcproj += '		</Link>'+nl;
		vcproj += '	</ItemDefinitionGroup>'+nl;
		vcproj += '	<ItemDefinitionGroup Condition="\'$(Configuration)\'==\'Debug\'">'+nl;
		vcproj += '		<ClCompile><PreprocessorDefinitions>ZILLALOG;%(PreprocessorDefinitions)</PreprocessorDefinitions></ClCompile>'+nl;
		vcproj += '	</ItemDefinitionGroup>'+nl;
		vcproj += '	<ItemDefinitionGroup Condition="\'$(Configuration)|$(Platform)\'==\'Debug|Win32\'"><Link><AdditionalDependencies>../'+zillalibbase+'/WP8/ZillaLib-vs2012wp8-win32-static-debug.lib;%(AdditionalDependencies)</AdditionalDependencies></Link></ItemDefinitionGroup>'+nl;
		vcproj += '	<ItemDefinitionGroup Condition="\'$(Configuration)|$(Platform)\'==\'Debug|ARM\'"><Link><AdditionalDependencies>../'+zillalibbase+'/WP8/ZillaLib-vs2012wp8-arm-static-debug.lib;%(AdditionalDependencies)</AdditionalDependencies></Link></ItemDefinitionGroup>'+nl;
		vcproj += '	<ItemDefinitionGroup Condition="\'$(Configuration)|$(Platform)\'==\'Release|Win32\'"><Link><AdditionalDependencies>../'+zillalibbase+'/WP8/ZillaLib-vs2012wp8-win32-static.lib;%(AdditionalDependencies)</AdditionalDependencies></Link></ItemDefinitionGroup>'+nl;
		vcproj += '	<ItemDefinitionGroup Condition="\'$(Configuration)|$(Platform)\'==\'Release|ARM\'"><Link><AdditionalDependencies>../'+zillalibbase+'/WP8/ZillaLib-vs2012wp8-arm-static.lib;%(AdditionalDependencies)</AdditionalDependencies></Link></ItemDefinitionGroup>'+nl;
		vcproj += '	<Import Project="$(VCTargetsPath)\\Microsoft.Cpp.targets" />'+nl;
		vcproj += '	<Import Project="$(MSBuildExtensionsPath)\\Microsoft\\WindowsPhone\\v$(TargetPlatformVersion)\\Microsoft.Cpp.WindowsPhone.$(TargetPlatformVersion).targets" />'+nl;
		vcproj += '	<ItemGroup>'+nl;
		vcproj += '		<Reference Include="platform.winmd"><IsWinMDFile>true</IsWinMDFile><Private>false</Private></Reference>'+nl;
		vcproj += '		<Xml Include="WMAppManifest.xml"><SubType>Designer</SubType></Xml>'+nl;
		vcproj += '		<Image Include="ApplicationIcon.png" />'+nl;
		vcproj += '		<Image Include="IconicTileMediumLarge.png" />'+nl;
		vcproj += '		<Image Include="IconicTileSmall.png" />'+nl;
		vcproj += '		<ClInclude Include="../*.h" />'+nl;
		vcproj += '		<ClCompile Include="../*.cpp" />'+nl;
		for (var assetdir in assetdirs) vcproj += '		<XapFilesInputCollection Include="../'+assetdirs[assetdir]+'/*.*"><TargetPath>'+assetdirs[assetdir]+'/%(Filename)%(Extension)</TargetPath></XapFilesInputCollection>'+nl;
		for (var assetfile in assetfiles) vcproj += '		<XapFilesInputCollection Include="../'+assetfiles[assetfile]+'"><TargetPath>'+assetfiles[assetfile]+'</TargetPath></XapFilesInputCollection>'+nl;
		vcproj += '	</ItemGroup>'+nl;
		vcproj += '</Project>'+nl;

		zipAddTextFile(vcproj, ziproot+'WP8/'+proj+'-vs2012wp8.vcxproj', true);
		vcproj = undefined;

		/**********************************************************************************************************************
		* WP8/<PROJ>-vs2012wp8.sln
		**********************************************************************************************************************/
		var vcsln = 'Microsoft Visual Studio Solution File, Format Version 12.00'+nl;
		vcsln += '# Visual Studio 2012'+nl;
		vcsln += 'Project("{'+vcslnguid+'}") = "'+proj+'", "'+proj+'-vs2012wp8.vcxproj", "{'+vcprojguid+'}"'+nl;
		vcsln += '	ProjectSection(ProjectDependencies) = postProject'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777} = {2177A217-7A21-77A2-177A-2177A2177777}'+nl;
		vcsln += '	EndProjectSection'+nl;
		vcsln += 'EndProject'+nl;
		vcsln += 'Project("{'+vcslnguid+'}") = "ZillaLib", "../'+zillalibbase+'/WP8/ZillaLib-vs2012wp8.vcxproj", "{2177A217-7A21-77A2-177A-2177A2177777}"'+nl;
		vcsln += 'EndProject'+nl;
		vcsln += 'Global'+nl;
		vcsln += '	GlobalSection(SolutionConfigurationPlatforms) = preSolution'+nl;
		vcsln += '		Debug-WP8|ARM = Debug-WP8|ARM'+nl;
		vcsln += '		Debug-WP8|Win32 = Debug-WP8|Win32'+nl;
		vcsln += '		Release-WP8|ARM = Release-WP8|ARM'+nl;
		vcsln += '		Release-WP8|Win32 = Release-WP8|Win32'+nl;
		vcsln += '	EndGlobalSection'+nl;
		vcsln += '	GlobalSection(ProjectConfigurationPlatforms) = postSolution'+nl;
		vcsln += '		{'+vcprojguid+'}.Debug-WP8|Win32.ActiveCfg = Debug|Win32'+nl;
		vcsln += '		{'+vcprojguid+'}.Debug-WP8|Win32.Build.0 = Debug|Win32'+nl;
		vcsln += '		{'+vcprojguid+'}.Debug-WP8|Win32.Deploy.0 = Debug|Win32'+nl;
		vcsln += '		{'+vcprojguid+'}.Release-WP8|Win32.ActiveCfg = Release|Win32'+nl;
		vcsln += '		{'+vcprojguid+'}.Release-WP8|Win32.Build.0 = Release|Win32'+nl;
		vcsln += '		{'+vcprojguid+'}.Release-WP8|Win32.Deploy.0 = Release|Win32'+nl;
		vcsln += '		{'+vcprojguid+'}.Debug-WP8|ARM.ActiveCfg = Debug|ARM'+nl;
		vcsln += '		{'+vcprojguid+'}.Debug-WP8|ARM.Build.0 = Debug|ARM'+nl;
		vcsln += '		{'+vcprojguid+'}.Debug-WP8|ARM.Deploy.0 = Debug|ARM'+nl;
		vcsln += '		{'+vcprojguid+'}.Release-WP8|ARM.ActiveCfg = Release|ARM'+nl;
		vcsln += '		{'+vcprojguid+'}.Release-WP8|ARM.Build.0 = Release|ARM'+nl;
		vcsln += '		{'+vcprojguid+'}.Release-WP8|ARM.Deploy.0 = Release|ARM'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug-WP8|Win32.ActiveCfg = Debug|Win32'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug-WP8|Win32.Build.0 = Debug|Win32'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug-WP8|Win32.Deploy.0 = Debug|Win32'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release-WP8|Win32.ActiveCfg = Release|Win32'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release-WP8|Win32.Build.0 = Release|Win32'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release-WP8|Win32.Deploy.0 = Release|Win32'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug-WP8|ARM.ActiveCfg = Debug|ARM'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug-WP8|ARM.Build.0 = Debug|ARM'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Debug-WP8|ARM.Deploy.0 = Debug|ARM'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release-WP8|ARM.ActiveCfg = Release|ARM'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release-WP8|ARM.Build.0 = Release|ARM'+nl;
		vcsln += '		{2177A217-7A21-77A2-177A-2177A2177777}.Release-WP8|ARM.Deploy.0 = Release|ARM'+nl;
		vcsln += '	EndGlobalSection'+nl;
		vcsln += '	GlobalSection(SolutionProperties) = preSolution'+nl;
		vcsln += '		HideSolutionNode = FALSE'+nl;
		vcsln += '	EndGlobalSection'+nl;
		vcsln += 'EndGlobal'+nl;
		zipAddTextFile(vcsln, ziproot+'WP8/'+proj+'-vs2012wp8.sln');
		vcsln = undefined;

		/**********************************************************************************************************************
		* WP8/WMAppManifest.xml
		**********************************************************************************************************************/
		var wp8_mani = '<?xml version="1.0" encoding="utf-8"?>'+nl;
		wp8_mani += '<Deployment xmlns="http://schemas.microsoft.com/windowsphone/2012/deployment" AppPlatformVersion="8.0">'+nl;
		wp8_mani += '	<DefaultLanguage xmlns="" code="en-US"/>'+nl;
		wp8_mani += '	<App xmlns="" ProductID="{'+vcprojguid+'}" Title="'+appname+'" RuntimeType="Modern Native" Version="1.0.0.0" Genre="apps.normal" Author="'+appname+' Author" Description="ZillaLib based app" Publisher="'+appname+' Publisher" PublisherID="{6776a820-fa71-4c84-9e50-d4884372b289}">'+nl;
		wp8_mani += '	<IconPath IsRelative="true" IsResource="false">ApplicationIcon.png</IconPath>'+nl;
		wp8_mani += '	<Capabilities><'+(smp_internet ? '' : '!-- ')+'Capability Name="ID_CAP_NETWORKING" /'+(smp_internet ? '' : ' --')+'></Capabilities>'+nl;
		wp8_mani += '	<Tasks><DefaultTask Name="_default" ImagePath="'+proj+'.exe" ImageParams="" /></Tasks>'+nl;
		wp8_mani += '	<Tokens>'+nl;
		wp8_mani += '			<PrimaryToken TokenID="'+proj+'Token" TaskName="_default">'+nl;
		wp8_mani += '				<TemplateIconic>'+nl;
		wp8_mani += '					<SmallImageURI IsRelative="true" IsResource="false">IconicTileSmall.png</SmallImageURI>'+nl;
		wp8_mani += '					<IconImageURI IsRelative="true" IsResource="false">IconicTileMediumLarge.png</IconImageURI>'+nl;
		wp8_mani += '					<Title>'+appname+'</Title>'+nl;
		wp8_mani += '					<Message></Message>'+nl;
		wp8_mani += '					<BackgroundColor></BackgroundColor>'+nl;
		wp8_mani += '					<HasLarge>false</HasLarge>'+nl;
		wp8_mani += '					<LargeContent1></LargeContent1>'+nl;
		wp8_mani += '					<LargeContent2></LargeContent2>'+nl;
		wp8_mani += '					<LargeContent3></LargeContent3>'+nl;
		wp8_mani += '					<DeviceLockImageURI IsRelative="true" IsResource="false" />'+nl;
		wp8_mani += '				</TemplateIconic>'+nl;
		wp8_mani += '			</PrimaryToken>'+nl;
		wp8_mani += '		</Tokens>'+nl;
		wp8_mani += '		<ScreenResolutions>'+nl;
		wp8_mani += '			<ScreenResolution Name="ID_RESOLUTION_WVGA" />'+nl;
		wp8_mani += '			<ScreenResolution Name="ID_RESOLUTION_WXGA" />'+nl;
		wp8_mani += '			<ScreenResolution Name="ID_RESOLUTION_HD720P" />'+nl;
		wp8_mani += '		</ScreenResolutions>'+nl;
		wp8_mani += '	</App>'+nl;
		wp8_mani += '</Deployment>'+nl;
		zipAddTextFile(wp8_mani , ziproot+'WP8/WMAppManifest.xml');
		wp8_mani = undefined, vcprojguid = undefined, vcslnguid = undefined;

		if (!is_update_existing)
		{
			/**********************************************************************************************************************
			* WP8/ApplicationIcon.png
			**********************************************************************************************************************/
			var wp8_applicationicon = 'iVBORw0KGgoAAAANSUhEUgAAAGMAAABjAgMAAADyVVYGAAAACVBMVEUAAACmpqYAAADbQTfcAAAAAXRSTlMAQObYZgAAAJ9JREFUeF7t1bENQjEMhGFExyCM5Ai5ov'+
				'YULOERUthToocwQtH5OiSK/O3XuPKdftEulz5wlqVHyWWVe8k137lmHHL7ki1ypEwEixGJRpLIxDKYOBZlIliMSDSSRCaQOhqKMhEsRiQaSSITy2DiWJSJYDEi0Ug2'+
				'UkdjcSzKRLAYkWgkiUwsg4ljUSaCxVqpo4V9l1clW+Ay8TXDC/j/7Z75Oz4PmFnjrwAAAABJRU5ErkJggg';
			zipAddBase64File(wp8_applicationicon, ziproot+'WP8/ApplicationIcon.png');
			wp8_applicationicon = undefined;

			/**********************************************************************************************************************
			* WP8/IconicTileMediumLarge.png
			**********************************************************************************************************************/
			var wp8_tilemedium = 'iVBORw0KGgoAAAANSUhEUgAAAIYAAADKAQMAAABaLarFAAAABlBMVEUAAAD///+l2Z/dAAAAAXRSTlMAQObYZgAAAQdJREFUeF7t1bGNxCAQheGxHBBSAqVQGpRGKZRASICYk3ft1T3uSRPsnW4'+
				'D/wmjL5tJkHe6u/P6qBxTfkh4ShOJWr9LF0naHhKfMn5J5qfJu3sFW8SjXKUfotot2Zg0S3bVaoljUlA8k4wSmIglUacpichYRIl0lI1Js+Q4mCWOSUHxTDJKYCKWRCJzkURkLKJEOsrGpFmyM6kojklB8UwySmAi'+
				'lkQic5FEZCyiRDrKxqRZsjOpKI5JQfFMMkpgIpZEInORRGQsokQ6ysakWbIzqSiOSUHxTDJKYCKWRCITBH+io3q+Oi9pl+jfST6l/6s0EHuLeEq0RcIl51TFv+7sTvnI7u6+ABJQya8GvecMAAAAAElFTkSuQmCC';
			zipAddBase64File(wp8_tilemedium, ziproot+'WP8/IconicTileMediumLarge.png');
			wp8_tilemedium = undefined;

			/**********************************************************************************************************************
			* WP8/IconicTileSmall.png
			**********************************************************************************************************************/
			var wp8_tilesmall = 'iVBORw0KGgoAAAANSUhEUgAAAEcAAABuAQMAAABP3ZyiAAAABlBMVEUAAAD///+l2Z/dAAAAAXRSTlMAQObYZgAAAIlJREFUeF7dzbENxSAMhGGiFJSMwCiMBqMxCiNQUiD8gmTrjFw+pclfnL7u3AcK'+
				'7UEmIhc7q6TxghJr58kZBWiJIjRFCRpWGeoighrrUqqsW6mwvJIzCtASRWiKEjREGepW1Iwupcq6lQrLKzlWgJZVhKYosfRkqJ8iGo6e6qH5v+JWPlTC/vhcP0unCc8vefoUAAAAAElFTkSuQmCC';
			zipAddBase64File(wp8_tilesmall, ziproot+'WP8/IconicTileSmall.png');
			wp8_tilesmall = undefined;
		}
	}

	if (sc_gitignore)
	{
		var ignores = [];
		if (for_vc6)        ignores = ignores.concat(['*.ncb','*.opt','*.plg','*.aps']);
		if (for_vc9)        ignores = ignores.concat(['*.ipch','*.suo','*.user','*.sdf','*.opensdf']);
		if (for_vs)         ignores = ignores.concat(['*.suo','*.user','*.sdf','*.opensdf']);
		ignores = ignores.concat([proj+'.cfg']);
		if (for_vc6)        ignores = ignores.concat(['Debug-vc6/','Release-vc6/']);
		if (for_vc9)        ignores = ignores.concat(['Debug-vc9/','Release-vc9/']);
		if (for_vs)         ignores = ignores.concat(['.vs/','Debug-vs2012/','Debug-vs2012x64/','Debug-vs2013/','Debug-vs2013x64/','Debug-vs2015/','Debug-vs2015x64/','Release-vs2012/','Release-vs2012x64/','Release-vs2013/','Release-vs2013x64/','Release-vs2015/','Release-vs2015x64/']);
		if (for_linux)      ignores = ignores.concat(['Debug-linux/','Release-linux/']);
		if (for_nacl)       ignores = ignores.concat(['Debug-nacl/','Release-nacl/']);
		if (for_emscripten) ignores = ignores.concat(['Debug-emscripten/','Release-emscripten/']);
		zipAddTextFile(ignores.join('\n'), ziproot+'.gitignore');
		ignores = undefined;
		if (for_osx) zipAddTextFile('project.xcworkspace/\nxcuserdata/\nDebug/\nRelease/\n', ziproot+proj+'-OSX.xcodeproj/.gitignore');
		if (for_android) zipAddTextFile('obj/\nlibs/\nbin/\n', ziproot+'Android/.gitignore');
		if (for_ios) zipAddTextFile('project.xcworkspace/\nxcuserdata/\nDebug/\nRelease/\n', ziproot+proj+'-iOS.xcodeproj/.gitignore');
		if (for_wp8) zipAddTextFile('*.suo\n*.user\n*.sdf\n*.opensdf\nRelease-Win32/\nRelease-ARM/\nDebug-Win32/\nDebug-ARM/\n', ziproot+'WP8/.gitignore');
	}

	var zipname = proj+'.zip', zipblob = [zip.compress()], zipprops = {type: 'application/zip'};
	try { file = new File(zipblob, "", zipprops); }
	catch (e) { file = new Blob(zipblob, zipprops); }
	if (navigator && navigator.msSaveOrOpenBlob) { navigator.msSaveOrOpenBlob(file, zipname); return; } 
	var a = document.createElement('a');
	a.setAttribute('href', URL.createObjectURL(file));
	a.setAttribute('download', zipname);
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function Base64ToUint8(str)
{
	var base64inv = {'0':52,'1':53,'2':54,'3':55,'4':56,'5':57,'6':58,'7':59,'8':60,'9':61,'A':0,'B':1,'C':2,'D':3,'E':4,'F':5,'G':6,'H':7,'I':8,'J':9,'K':10,'L':11,'M':12,'N':13,'O':14,'P':15,'Q':16,'R':17,'S':18,'T':19,'U':20,'V':21,'W':22,'X':23,'Y':24,'Z':25,'a':26,'b':27,'c':28,'d':29,'e':30,'f':31,'g':32,'h':33,'i':34,'j':35,'k':36,'l':37,'m':38,'n':39,'o':40,'p':41,'q':42,'r':43,'s':44,'t':45,'u':46,'v':47,'w':48,'x':49,'y':50,'z':51,'+':62,'/':63};
	var pad = 0;
	for (var i = str.length - 1; i >= 0; --i) if (str.charAt(i) == '=') ++pad; else break;
	var buf = new (window.Uint8Array !== void 0 ? Uint8Array : Array)(str.length * 3 / 4 - pad);
	for (var i = 0, slp = str.length - pad; i < slp; i += 4)
	{
		var ii = i * 3 >> 2, c0 = base64inv[str.charAt(i)], c1 = base64inv[str.charAt(i + 1)], c2 = base64inv[str.charAt(i + 2)], c3 = base64inv[str.charAt(i + 3)];
		buf[ii] = c0 << 2 & 255 | c1 >>> 4;
		if (i + 2 < slp) buf[ii + 1] = c1 << 4 & 255 | c2 >>> 2;
		if (i + 3 < slp) buf[ii + 2] = c2 << 6 & 255 | c3;
	}
	return buf;
}

function StringUTF8ToUint8(str, addbom)
{
	for (var len = 0, i = 0, il = str.length, cc = str.charCodeAt(0); i < il; cc = str.charCodeAt(++i))
		len += (cc < 0x80 ? 1 : (cc < 0x800 ? 2 : (cc < 0xd800 || cc >= 0xe000 ? 3 : 4)))
	var utf8 = new (window.Uint8Array !== void 0 ? Uint8Array : Array)(addbom ? len + 3 : len);
	if (addbom) { utf8[0] = 0xEF; utf8[1] = 0xBB; utf8[2] = 0xBF; }
	for (var o = (addbom ? 3 : 0), i = 0, il = str.length, cc = str.charCodeAt(0); i < il; cc = str.charCodeAt(++i))
	{
		if (cc < 0x80) utf8[o++] = cc;
		else if (cc < 0x800) { utf8[o++] = 0xc0 | (cc>>6); utf8[o++] = 0x80 | (cc & 0x3f); }
		else if (cc < 0xd800 || cc >= 0xe000) { utf8[o++] = 0xe0 | (cc>>12); utf8[o++] = 0x80 | ((cc>>6) & 0x3f); utf8[o++] = 0x80 | (cc & 0x3f); }
		else { cc = 0x10000 + (((cc & 0x3ff)<<10) | (str.charCodeAt(++i) & 0x3ff)); utf8[o++] = 0xf0 | (cc>>18); utf8[o++] = 0x80 | ((cc>>12) & 0x3f); utf8[o++] = 0x80 | ((cc>>6) & 0x3f); utf8[o++] = 0x80 | (cc & 0x3f); }
	}
	return utf8;
}

function StringAsciiToUint8(str)
{
	var array = new (window.Uint8Array !== void 0 ? Uint8Array : Array)(str.length);
	for (var i = 0, il = str.length; i < il; ++i) array[i] = str.charCodeAt(i) & 0xff;
	return array;
}

//--- zlib.js ---
(function() {'use strict';var n=void 0,y=!0,aa=this;function G(e,b){var a=e.split("."),d=aa;!(a[0]in d)&&d.execScript&&d.execScript("var "+a[0]);for(var c;a.length&&(c=a.shift());)!a.length&&b!==n?d[c]=b:d=d[c]?d[c]:d[c]={}};var H="undefined"!==typeof Uint8Array&&"undefined"!==typeof Uint16Array&&"undefined"!==typeof Uint32Array&&"undefined"!==typeof DataView;function ba(e,b){this.index="number"===typeof b?b:0;this.f=0;this.buffer=e instanceof(H?Uint8Array:Array)?e:new (H?Uint8Array:Array)(32768);if(2*this.buffer.length<=this.index)throw Error("invalid index");this.buffer.length<=this.index&&ca(this)}function ca(e){var b=e.buffer,a,d=b.length,c=new (H?Uint8Array:Array)(d<<1);if(H)c.set(b);else for(a=0;a<d;++a)c[a]=b[a];return e.buffer=c}
ba.prototype.b=function(e,b,a){var d=this.buffer,c=this.index,f=this.f,l=d[c],p;a&&1<b&&(e=8<b?(L[e&255]<<24|L[e>>>8&255]<<16|L[e>>>16&255]<<8|L[e>>>24&255])>>32-b:L[e]>>8-b);if(8>b+f)l=l<<b|e,f+=b;else for(p=0;p<b;++p)l=l<<1|e>>b-p-1&1,8===++f&&(f=0,d[c++]=L[l],l=0,c===d.length&&(d=ca(this)));d[c]=l;this.buffer=d;this.f=f;this.index=c};ba.prototype.finish=function(){var e=this.buffer,b=this.index,a;0<this.f&&(e[b]<<=8-this.f,e[b]=L[e[b]],b++);H?a=e.subarray(0,b):(e.length=b,a=e);return a};
var da=new (H?Uint8Array:Array)(256),ha;for(ha=0;256>ha;++ha){for(var U=ha,ja=U,ka=7,U=U>>>1;U;U>>>=1)ja<<=1,ja|=U&1,--ka;da[ha]=(ja<<ka&255)>>>0}var L=da;function la(e){var b=n,a,d="number"===typeof b?b:b=0,c=e.length;a=-1;for(d=c&7;d--;++b)a=a>>>8^V[(a^e[b])&255];for(d=c>>3;d--;b+=8)a=a>>>8^V[(a^e[b])&255],a=a>>>8^V[(a^e[b+1])&255],a=a>>>8^V[(a^e[b+2])&255],a=a>>>8^V[(a^e[b+3])&255],a=a>>>8^V[(a^e[b+4])&255],a=a>>>8^V[(a^e[b+5])&255],a=a>>>8^V[(a^e[b+6])&255],a=a>>>8^V[(a^e[b+7])&255];return(a^4294967295)>>>0}
var ma=[0,1996959894,3993919788,2567524794,124634137,1886057615,3915621685,2657392035,249268274,2044508324,3772115230,2547177864,162941995,2125561021,3887607047,2428444049,498536548,1789927666,4089016648,2227061214,450548861,1843258603,4107580753,2211677639,325883990,1684777152,4251122042,2321926636,335633487,1661365465,4195302755,2366115317,997073096,1281953886,3579855332,2724688242,1006888145,1258607687,3524101629,2768942443,901097722,1119000684,3686517206,2898065728,853044451,1172266101,3705015759,
2882616665,651767980,1373503546,3369554304,3218104598,565507253,1454621731,3485111705,3099436303,671266974,1594198024,3322730930,2970347812,795835527,1483230225,3244367275,3060149565,1994146192,31158534,2563907772,4023717930,1907459465,112637215,2680153253,3904427059,2013776290,251722036,2517215374,3775830040,2137656763,141376813,2439277719,3865271297,1802195444,476864866,2238001368,4066508878,1812370925,453092731,2181625025,4111451223,1706088902,314042704,2344532202,4240017532,1658658271,366619977,
2362670323,4224994405,1303535960,984961486,2747007092,3569037538,1256170817,1037604311,2765210733,3554079995,1131014506,879679996,2909243462,3663771856,1141124467,855842277,2852801631,3708648649,1342533948,654459306,3188396048,3373015174,1466479909,544179635,3110523913,3462522015,1591671054,702138776,2966460450,3352799412,1504918807,783551873,3082640443,3233442989,3988292384,2596254646,62317068,1957810842,3939845945,2647816111,81470997,1943803523,3814918930,2489596804,225274430,2053790376,3826175755,
2466906013,167816743,2097651377,4027552580,2265490386,503444072,1762050814,4150417245,2154129355,426522225,1852507879,4275313526,2312317920,282753626,1742555852,4189708143,2394877945,397917763,1622183637,3604390888,2714866558,953729732,1340076626,3518719985,2797360999,1068828381,1219638859,3624741850,2936675148,906185462,1090812512,3747672003,2825379669,829329135,1181335161,3412177804,3160834842,628085408,1382605366,3423369109,3138078467,570562233,1426400815,3317316542,2998733608,733239954,1555261956,
3268935591,3050360625,752459403,1541320221,2607071920,3965973030,1969922972,40735498,2617837225,3943577151,1913087877,83908371,2512341634,3803740692,2075208622,213261112,2463272603,3855990285,2094854071,198958881,2262029012,4057260610,1759359992,534414190,2176718541,4139329115,1873836001,414664567,2282248934,4279200368,1711684554,285281116,2405801727,4167216745,1634467795,376229701,2685067896,3608007406,1308918612,956543938,2808555105,3495958263,1231636301,1047427035,2932959818,3654703836,1088359270,
936918E3,2847714899,3736837829,1202900863,817233897,3183342108,3401237130,1404277552,615818150,3134207493,3453421203,1423857449,601450431,3009837614,3294710456,1567103746,711928724,3020668471,3272380065,1510334235,755167117],V=H?new Uint32Array(ma):ma;function na(e){this.buffer=new (H?Uint16Array:Array)(2*e);this.length=0}na.prototype.getParent=function(e){return 2*((e-2)/4|0)};na.prototype.push=function(e,b){var a,d,c=this.buffer,f;a=this.length;c[this.length++]=b;for(c[this.length++]=e;0<a;)if(d=this.getParent(a),c[a]>c[d])f=c[a],c[a]=c[d],c[d]=f,f=c[a+1],c[a+1]=c[d+1],c[d+1]=f,a=d;else break;return this.length};
na.prototype.pop=function(){var e,b,a=this.buffer,d,c,f;b=a[0];e=a[1];this.length-=2;a[0]=a[this.length];a[1]=a[this.length+1];for(f=0;;){c=2*f+2;if(c>=this.length)break;c+2<this.length&&a[c+2]>a[c]&&(c+=2);if(a[c]>a[f])d=a[f],a[f]=a[c],a[c]=d,d=a[f+1],a[f+1]=a[c+1],a[c+1]=d;else break;f=c}return{index:e,value:b,length:this.length}};function pa(e,b){this.k=qa;this.l=0;this.input=H&&e instanceof Array?new Uint8Array(e):e;this.e=0;b&&(b.lazy&&(this.l=b.lazy),"number"===typeof b.compressionType&&(this.k=b.compressionType),b.outputBuffer&&(this.c=H&&b.outputBuffer instanceof Array?new Uint8Array(b.outputBuffer):b.outputBuffer),"number"===typeof b.outputIndex&&(this.e=b.outputIndex));this.c||(this.c=new (H?Uint8Array:Array)(32768))}var qa=2,sa=[],Y;
for(Y=0;288>Y;Y++)switch(y){case 143>=Y:sa.push([Y+48,8]);break;case 255>=Y:sa.push([Y-144+400,9]);break;case 279>=Y:sa.push([Y-256+0,7]);break;case 287>=Y:sa.push([Y-280+192,8]);break;default:throw"invalid literal: "+Y;}
pa.prototype.g=function(){var e,b,a,d,c=this.input;switch(this.k){case 0:a=0;for(d=c.length;a<d;){b=H?c.subarray(a,a+65535):c.slice(a,a+65535);a+=b.length;var f=b,l=a===d,p=n,k=n,q=n,w=n,u=n,m=this.c,h=this.e;if(H){for(m=new Uint8Array(this.c.buffer);m.length<=h+f.length+5;)m=new Uint8Array(m.length<<1);m.set(this.c)}p=l?1:0;m[h++]=p|0;k=f.length;q=~k+65536&65535;m[h++]=k&255;m[h++]=k>>>8&255;m[h++]=q&255;m[h++]=q>>>8&255;if(H)m.set(f,h),h+=f.length,m=m.subarray(0,h);else{w=0;for(u=f.length;w<u;++w)m[h++]=
f[w];m.length=h}this.e=h;this.c=m}break;case 1:var s=new ba(H?new Uint8Array(this.c.buffer):this.c,this.e);s.b(1,1,y);s.b(1,2,y);var t=ta(this,c),r,Q,z;r=0;for(Q=t.length;r<Q;r++)if(z=t[r],ba.prototype.b.apply(s,sa[z]),256<z)s.b(t[++r],t[++r],y),s.b(t[++r],5),s.b(t[++r],t[++r],y);else if(256===z)break;this.c=s.finish();this.e=this.c.length;break;case qa:var A=new ba(H?new Uint8Array(this.c.buffer):this.c,this.e),F,I,N,B,C,g=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],J,ea,O,W,X,oa=Array(19),
ya,Z,ia,D,za;F=qa;A.b(1,1,y);A.b(F,2,y);I=ta(this,c);J=ua(this.p,15);ea=va(J);O=ua(this.o,7);W=va(O);for(N=286;257<N&&0===J[N-1];N--);for(B=30;1<B&&0===O[B-1];B--);var Aa=N,Ba=B,P=new (H?Uint32Array:Array)(Aa+Ba),v,R,x,fa,M=new (H?Uint32Array:Array)(316),K,E,S=new (H?Uint8Array:Array)(19);for(v=R=0;v<Aa;v++)P[R++]=J[v];for(v=0;v<Ba;v++)P[R++]=O[v];if(!H){v=0;for(fa=S.length;v<fa;++v)S[v]=0}v=K=0;for(fa=P.length;v<fa;v+=R){for(R=1;v+R<fa&&P[v+R]===P[v];++R);x=R;if(0===P[v])if(3>x)for(;0<x--;)M[K++]=
0,S[0]++;else for(;0<x;)E=138>x?x:138,E>x-3&&E<x&&(E=x-3),10>=E?(M[K++]=17,M[K++]=E-3,S[17]++):(M[K++]=18,M[K++]=E-11,S[18]++),x-=E;else if(M[K++]=P[v],S[P[v]]++,x--,3>x)for(;0<x--;)M[K++]=P[v],S[P[v]]++;else for(;0<x;)E=6>x?x:6,E>x-3&&E<x&&(E=x-3),M[K++]=16,M[K++]=E-3,S[16]++,x-=E}e=H?M.subarray(0,K):M.slice(0,K);X=ua(S,7);for(D=0;19>D;D++)oa[D]=X[g[D]];for(C=19;4<C&&0===oa[C-1];C--);ya=va(X);A.b(N-257,5,y);A.b(B-1,5,y);A.b(C-4,4,y);for(D=0;D<C;D++)A.b(oa[D],3,y);D=0;for(za=e.length;D<za;D++)if(Z=
e[D],A.b(ya[Z],X[Z],y),16<=Z){D++;switch(Z){case 16:ia=2;break;case 17:ia=3;break;case 18:ia=7;break;default:throw"invalid code: "+Z;}A.b(e[D],ia,y)}var Ca=[ea,J],Da=[W,O],T,Ea,ga,ra,Fa,Ga,Ha,Ia;Fa=Ca[0];Ga=Ca[1];Ha=Da[0];Ia=Da[1];T=0;for(Ea=I.length;T<Ea;++T)if(ga=I[T],A.b(Fa[ga],Ga[ga],y),256<ga)A.b(I[++T],I[++T],y),ra=I[++T],A.b(Ha[ra],Ia[ra],y),A.b(I[++T],I[++T],y);else if(256===ga)break;this.c=A.finish();this.e=this.c.length;break;default:throw"invalid compression type";}return this.c};
function wa(e,b){this.length=e;this.n=b}
var xa=function(){function e(a){switch(y){case 3===a:return[257,a-3,0];case 4===a:return[258,a-4,0];case 5===a:return[259,a-5,0];case 6===a:return[260,a-6,0];case 7===a:return[261,a-7,0];case 8===a:return[262,a-8,0];case 9===a:return[263,a-9,0];case 10===a:return[264,a-10,0];case 12>=a:return[265,a-11,1];case 14>=a:return[266,a-13,1];case 16>=a:return[267,a-15,1];case 18>=a:return[268,a-17,1];case 22>=a:return[269,a-19,2];case 26>=a:return[270,a-23,2];case 30>=a:return[271,a-27,2];case 34>=a:return[272,
a-31,2];case 42>=a:return[273,a-35,3];case 50>=a:return[274,a-43,3];case 58>=a:return[275,a-51,3];case 66>=a:return[276,a-59,3];case 82>=a:return[277,a-67,4];case 98>=a:return[278,a-83,4];case 114>=a:return[279,a-99,4];case 130>=a:return[280,a-115,4];case 162>=a:return[281,a-131,5];case 194>=a:return[282,a-163,5];case 226>=a:return[283,a-195,5];case 257>=a:return[284,a-227,5];case 258===a:return[285,a-258,0];default:throw"invalid length: "+a;}}var b=[],a,d;for(a=3;258>=a;a++)d=e(a),b[a]=d[2]<<24|
d[1]<<16|d[0];return b}(),Ja=H?new Uint32Array(xa):xa;
function ta(e,b){function a(a,c){var b=a.n,d=[],e=0,f;f=Ja[a.length];d[e++]=f&65535;d[e++]=f>>16&255;d[e++]=f>>24;var g;switch(y){case 1===b:g=[0,b-1,0];break;case 2===b:g=[1,b-2,0];break;case 3===b:g=[2,b-3,0];break;case 4===b:g=[3,b-4,0];break;case 6>=b:g=[4,b-5,1];break;case 8>=b:g=[5,b-7,1];break;case 12>=b:g=[6,b-9,2];break;case 16>=b:g=[7,b-13,2];break;case 24>=b:g=[8,b-17,3];break;case 32>=b:g=[9,b-25,3];break;case 48>=b:g=[10,b-33,4];break;case 64>=b:g=[11,b-49,4];break;case 96>=b:g=[12,b-
65,5];break;case 128>=b:g=[13,b-97,5];break;case 192>=b:g=[14,b-129,6];break;case 256>=b:g=[15,b-193,6];break;case 384>=b:g=[16,b-257,7];break;case 512>=b:g=[17,b-385,7];break;case 768>=b:g=[18,b-513,8];break;case 1024>=b:g=[19,b-769,8];break;case 1536>=b:g=[20,b-1025,9];break;case 2048>=b:g=[21,b-1537,9];break;case 3072>=b:g=[22,b-2049,10];break;case 4096>=b:g=[23,b-3073,10];break;case 6144>=b:g=[24,b-4097,11];break;case 8192>=b:g=[25,b-6145,11];break;case 12288>=b:g=[26,b-8193,12];break;case 16384>=
b:g=[27,b-12289,12];break;case 24576>=b:g=[28,b-16385,13];break;case 32768>=b:g=[29,b-24577,13];break;default:throw"invalid distance";}f=g;d[e++]=f[0];d[e++]=f[1];d[e++]=f[2];var k,l;k=0;for(l=d.length;k<l;++k)m[h++]=d[k];t[d[0]]++;r[d[3]]++;s=a.length+c-1;u=null}var d,c,f,l,p,k={},q,w,u,m=H?new Uint16Array(2*b.length):[],h=0,s=0,t=new (H?Uint32Array:Array)(286),r=new (H?Uint32Array:Array)(30),Q=e.l,z;if(!H){for(f=0;285>=f;)t[f++]=0;for(f=0;29>=f;)r[f++]=0}t[256]=1;d=0;for(c=b.length;d<c;++d){f=p=
0;for(l=3;f<l&&d+f!==c;++f)p=p<<8|b[d+f];k[p]===n&&(k[p]=[]);q=k[p];if(!(0<s--)){for(;0<q.length&&32768<d-q[0];)q.shift();if(d+3>=c){u&&a(u,-1);f=0;for(l=c-d;f<l;++f)z=b[d+f],m[h++]=z,++t[z];break}0<q.length?(w=Ka(b,d,q),u?u.length<w.length?(z=b[d-1],m[h++]=z,++t[z],a(w,0)):a(u,-1):w.length<Q?u=w:a(w,0)):u?a(u,-1):(z=b[d],m[h++]=z,++t[z])}q.push(d)}m[h++]=256;t[256]++;e.p=t;e.o=r;return H?m.subarray(0,h):m}
function Ka(e,b,a){var d,c,f=0,l,p,k,q,w=e.length;p=0;q=a.length;a:for(;p<q;p++){d=a[q-p-1];l=3;if(3<f){for(k=f;3<k;k--)if(e[d+k-1]!==e[b+k-1])continue a;l=f}for(;258>l&&b+l<w&&e[d+l]===e[b+l];)++l;l>f&&(c=d,f=l);if(258===l)break}return new wa(f,b-c)}
function ua(e,b){var a=e.length,d=new na(572),c=new (H?Uint8Array:Array)(a),f,l,p,k,q;if(!H)for(k=0;k<a;k++)c[k]=0;for(k=0;k<a;++k)0<e[k]&&d.push(k,e[k]);f=Array(d.length/2);l=new (H?Uint32Array:Array)(d.length/2);if(1===f.length)return c[d.pop().index]=1,c;k=0;for(q=d.length/2;k<q;++k)f[k]=d.pop(),l[k]=f[k].value;p=La(l,l.length,b);k=0;for(q=f.length;k<q;++k)c[f[k].index]=p[k];return c}
function La(e,b,a){function d(a){var c=k[a][q[a]];c===b?(d(a+1),d(a+1)):--l[c];++q[a]}var c=new (H?Uint16Array:Array)(a),f=new (H?Uint8Array:Array)(a),l=new (H?Uint8Array:Array)(b),p=Array(a),k=Array(a),q=Array(a),w=(1<<a)-b,u=1<<a-1,m,h,s,t,r;c[a-1]=b;for(h=0;h<a;++h)w<u?f[h]=0:(f[h]=1,w-=u),w<<=1,c[a-2-h]=(c[a-1-h]/2|0)+b;c[0]=f[0];p[0]=Array(c[0]);k[0]=Array(c[0]);for(h=1;h<a;++h)c[h]>2*c[h-1]+f[h]&&(c[h]=2*c[h-1]+f[h]),p[h]=Array(c[h]),k[h]=Array(c[h]);for(m=0;m<b;++m)l[m]=a;for(s=0;s<c[a-1];++s)p[a-
1][s]=e[s],k[a-1][s]=s;for(m=0;m<a;++m)q[m]=0;1===f[a-1]&&(--l[0],++q[a-1]);for(h=a-2;0<=h;--h){t=m=0;r=q[h+1];for(s=0;s<c[h];s++)t=p[h+1][r]+p[h+1][r+1],t>e[m]?(p[h][s]=t,k[h][s]=b,r+=2):(p[h][s]=e[m],k[h][s]=m,++m);q[h]=0;1===f[h]&&d(h)}return l}
function va(e){var b=new (H?Uint16Array:Array)(e.length),a=[],d=[],c=0,f,l,p,k;f=0;for(l=e.length;f<l;f++)a[e[f]]=(a[e[f]]|0)+1;f=1;for(l=16;f<=l;f++)d[f]=c,c+=a[f]|0,c<<=1;f=0;for(l=e.length;f<l;f++){c=d[e[f]];d[e[f]]+=1;p=b[f]=0;for(k=e[f];p<k;p++)b[f]=b[f]<<1|c&1,c>>>=1}return b};function $(e){e=e||{};this.files=[];this.d=e.comment}var Ma=[80,75,1,2],Na=[80,75,3,4],Oa=[80,75,5,6];$.prototype.m=function(e,b){b=b||{};var a,d=e.length,c=0;H&&e instanceof Array&&(e=new Uint8Array(e));"number"!==typeof b.compressionMethod&&(b.compressionMethod=8);if(b.compress)switch(b.compressionMethod){case 0:break;case 8:c=la(e);e=(new pa(e,b.deflateOption)).g();a=y;break;default:throw Error("unknown compression method:"+b.compressionMethod);}this.files.push({buffer:e,a:b,j:a,r:!1,size:d,h:c})};
$.prototype.q=function(e){this.i=e};
$.prototype.g=function(){var e=this.files,b,a,d,c,f,l=0,p=0,k,q,w,u,m,h,s,t,r,Q,z,A,F,I,N,B,C,g,J;B=0;for(C=e.length;B<C;++B){b=e[B];t=b.a.filename?b.a.filename.length:0;r=b.a.comment?b.a.comment.length:0;if(!b.j)switch(b.h=la(b.buffer),b.a.compressionMethod){case 0:break;case 8:b.buffer=(new pa(b.buffer,b.a.deflateOption)).g();b.j=y;break;default:throw Error("unknown compression method:"+b.a.compressionMethod);}if(b.a.password!==n||this.i!==n){var ea=b.a.password||this.i,O=[305419896,591751049,878082192],
W=n,X=n;H&&(O=new Uint32Array(O));W=0;for(X=ea.length;W<X;++W)Pa(O,ea[W]&255);N=O;F=b.buffer;H?(I=new Uint8Array(F.length+12),I.set(F,12),F=I):F.unshift(0,0,0,0,0,0,0,0,0,0,0,0);for(g=0;12>g;++g)F[g]=Qa(N,11===B?b.h&255:256*Math.random()|0);for(J=F.length;g<J;++g)F[g]=Qa(N,F[g]);b.buffer=F}l+=30+t+b.buffer.length;p+=46+t+r}a=new (H?Uint8Array:Array)(l+p+(22+(this.d?this.d.length:0)));d=0;c=l;f=c+p;B=0;for(C=e.length;B<C;++B){b=e[B];t=b.a.filename?b.a.filename.length:0;r=b.a.comment?b.a.comment.length:
0;k=d;a[d++]=Na[0];a[d++]=Na[1];a[d++]=Na[2];a[d++]=Na[3];a[c++]=Ma[0];a[c++]=Ma[1];a[c++]=Ma[2];a[c++]=Ma[3];a[c++]=20;a[c++]=b.a.os||0;a[d++]=a[c++]=20;q=a[d++]=a[c++]=0;if(b.a.password||this.i)q|=1;a[d++]=a[c++]=q&255;a[d++]=a[c++]=q>>8&255;w=b.a.compressionMethod;a[d++]=a[c++]=w&255;a[d++]=a[c++]=w>>8&255;u=b.a.date||new Date;a[d++]=a[c++]=(u.getMinutes()&7)<<5|u.getSeconds()/2|0;a[d++]=a[c++]=u.getHours()<<3|u.getMinutes()>>3;a[d++]=a[c++]=(u.getMonth()+1&7)<<5|u.getDate();a[d++]=a[c++]=(u.getFullYear()-
1980&127)<<1|u.getMonth()+1>>3;m=b.h;a[d++]=a[c++]=m&255;a[d++]=a[c++]=m>>8&255;a[d++]=a[c++]=m>>16&255;a[d++]=a[c++]=m>>24&255;h=b.buffer.length;a[d++]=a[c++]=h&255;a[d++]=a[c++]=h>>8&255;a[d++]=a[c++]=h>>16&255;a[d++]=a[c++]=h>>24&255;s=b.size;a[d++]=a[c++]=s&255;a[d++]=a[c++]=s>>8&255;a[d++]=a[c++]=s>>16&255;a[d++]=a[c++]=s>>24&255;a[d++]=a[c++]=t&255;a[d++]=a[c++]=t>>8&255;a[d++]=a[c++]=0;a[d++]=a[c++]=0;a[c++]=r&255;a[c++]=r>>8&255;a[c++]=0;a[c++]=0;a[c++]=0;a[c++]=0;a[c++]=0;a[c++]=0;a[c++]=
0;a[c++]=0;a[c++]=k&255;a[c++]=k>>8&255;a[c++]=k>>16&255;a[c++]=k>>24&255;if(Q=b.a.filename)if(H)a.set(Q,d),a.set(Q,c),d+=t,c+=t;else for(g=0;g<t;++g)a[d++]=a[c++]=Q[g];if(z=b.a.extraField)if(H)a.set(z,d),a.set(z,c),d+=0,c+=0;else for(g=0;g<r;++g)a[d++]=a[c++]=z[g];if(A=b.a.comment)if(H)a.set(A,c),c+=r;else for(g=0;g<r;++g)a[c++]=A[g];if(H)a.set(b.buffer,d),d+=b.buffer.length;else{g=0;for(J=b.buffer.length;g<J;++g)a[d++]=b.buffer[g]}}a[f++]=Oa[0];a[f++]=Oa[1];a[f++]=Oa[2];a[f++]=Oa[3];a[f++]=0;a[f++]=
0;a[f++]=0;a[f++]=0;a[f++]=C&255;a[f++]=C>>8&255;a[f++]=C&255;a[f++]=C>>8&255;a[f++]=p&255;a[f++]=p>>8&255;a[f++]=p>>16&255;a[f++]=p>>24&255;a[f++]=l&255;a[f++]=l>>8&255;a[f++]=l>>16&255;a[f++]=l>>24&255;r=this.d?this.d.length:0;a[f++]=r&255;a[f++]=r>>8&255;if(this.d)if(H)a.set(this.d,f);else{g=0;for(J=r;g<J;++g)a[f++]=this.d[g]}return a};function Qa(e,b){var a,d=e[2]&65535|2;a=d*(d^1)>>8&255;Pa(e,b);return a^b}
function Pa(e,b){e[0]=(V[(e[0]^b)&255]^e[0]>>>8)>>>0;e[1]=(6681*(20173*(e[1]+(e[0]&255))>>>0)>>>0)+1>>>0;e[2]=(V[(e[2]^e[1]>>>24)&255]^e[2]>>>8)>>>0};function Ra(e,b){var a,d,c,f;if(Object.keys)a=Object.keys(b);else for(d in a=[],c=0,b)a[c++]=d;c=0;for(f=a.length;c<f;++c)d=a[c],G(e+"."+d,b[d])};G("Zlib.Zip",$);G("Zlib.Zip.prototype.addFile",$.prototype.m);G("Zlib.Zip.prototype.compress",$.prototype.g);G("Zlib.Zip.prototype.setPassword",$.prototype.q);Ra("Zlib.Zip.CompressionMethod",{STORE:0,DEFLATE:8});Ra("Zlib.Zip.OperatingSystem",{MSDOS:0,UNIX:3,MACINTOSH:7});}).call(this);
