/*
 * Display.js (vers 25.04.15)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

/*******************************************************************************
*
*	NOTES
*
*******************************************************************************/
/*
This currently includes a modified pointer lock control
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	BackSide,
	SphereGeometry,
	MeshBasicNodeMaterial,
	Mesh,
} from 'three';

import {color,texture} from "three/tsl";

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

/*******************************************************************************
*
*	FADE 2 BLACK
*
*******************************************************************************/
//	Use this to fade to/from black or other color
//	In flight, this can emulate black-out, gray-out or red-out	

//=	INIT FADE2BLK ==============//==============================================
function initFad2Blk(camera,f2b_) {
	let geometry = new SphereGeometry(0.15,64,64);
	f2b_.Mat = new MeshBasicNodeMaterial({
		side:BackSide,
		colorNode:color(f2b_.Col),
		opacity:f2b_.Beg,
//		depthTest:false,		// No effect
//		depthWrite:false,		// NG - prop shines through
		transparent:true,
	});
	f2b_.Msh = new Mesh(geometry,f2b_.Mat);
	camera.add(f2b_.Msh);
	//- Range and Visibility Tests
	if (f2b_.Beg < f2b_.Flr) FedBeg = f2b_.Flr;
	if (f2b_.Beg == f2b_.Flr) f2b_.Msh.visible = false;
	else {f2b_.Msh.visible = true};
}

//=	MOVE FADE2BLK ==============//==============================================
function moveFad2Blk(f2b_) {
	// Set Color
	f2b_.Mat.colorNode = color(f2b_.Col);
	// Limit Range (f2b_.Flr to 1)
	if (f2b_.Beg < f2b_.Flr) f2b_.Beg = f2b_.Flr;
	if (f2b_.End < f2b_.Flr) f2b_.End = f2b_.Flr;
	if (f2b_.Beg > 1) f2b_.Beg = 1;
	if (f2b_.End > 1) f2b_.Beg = 1;
	//
	f2b_.Msh.visible = true;
	// If Black to Clear
	if (f2b_.End < f2b_.Beg) {
		f2b_.Beg = f2b_.Beg - f2b_.Spd/f2b_.Beg;
		if (f2b_.Beg < f2b_.End) {
			f2b_.Beg = f2b_.End;
//			if (f2b_.Beg == f2b_.End) f2b_.Msh.visible = false;
		}
	}
	// If Fade to Black
	else {
		f2b_.Beg = f2b_.Beg + f2b_.Spd/f2b_.Beg;
		if (f2b_.Beg > f2b_.End) f2b_.Beg = f2b_.End;
	}
	// Set Opacity
	f2b_.Mat.opacity = f2b_.Beg;
	if (f2b_.Beg == f2b_.Flr) f2b_.Msh.visible = false;
	else {f2b_.Msh.visible = true};
}

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {initFad2Blk,moveFad2Blk};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/
/*
250407:	In Development
*/
