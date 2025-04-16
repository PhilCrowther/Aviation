/*
 * Vehicles.js (vers 25.04.16)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

/* NOTES:
This contains subroutines to create moving airplanes and ships
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	// Airplanes
	AnimationClip,
	AnimationMixer,
} from 'three';

import {color,texture} from "three/tsl";

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= CONSTANTS ==================//==============================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians

/*******************************************************************************
*
*	AIRPLANES
*
*******************************************************************************/

//=	LOAD AIRPLANES =============//==============================================

function loadXACVeh(gltfLoader,xac_) {
	for (let n = 0; n < xac_.ObjNum; n ++) {
		gltfLoader.load(xac_.ObjSrc[n], function (gltf) {
			xac_.ObjAdr[n] = gltf.scene;
			// Convert from feet to meters
			xac_.ObjAdr[n].scale.setScalar(xac_.ObjSiz[n]);
			// Propeller
			let clip = AnimationClip.findByName(gltf.animations, "propellerAction");
			xac_.MixSpn[n] = new AnimationMixer(xac_.ObjAdr[n]);
			let actun = xac_.MixSpn[n].clipAction(clip);
			actun.play();
			if (xac_.MixSpn[n]) xac_.MixSpn[n].setTime(anm_.spnprp/anm_.anmfps);
			// Bank
			clip = AnimationClip.findByName(gltf.animations, "AC_BankAction");
			xac_.MixBnk[n] = new AnimationMixer(xac_.ObjAdr[n]);
			actun = xac_.MixBnk[n].clipAction(clip);
			actun.play();
			if (xac_.MixBnk[n]) xac_.MixBnk[n].setTime(xac_.AnmBnk[n]/anm_.anmfps);
			// Pitch
			clip = AnimationClip.findByName(gltf.animations, "AC_PtchAction");
			xac_.MixPit[n] = new AnimationMixer(xac_.ObjAdr[n]);
			actun = xac_.MixPit[n].clipAction(clip);
			actun.play();
			if (xac_.MixPit[n]) xac_.MixPit[n].setTime(xac_.AnmPit[n]/anm_.anmfps);
			// Rotation
			xac_.ObjAdr[n].rotation.order = "YXZ"; // Heading, Pitch, Bank
			xac_.ObjAdr[n].rotation.y = xac_.ObjRot[n].y*DegRad;
		});
	}

}

//=	INIT AIRPLANES =============//==============================================

function initXACVeh(xac_,air_,scene) {
	for (let n = 0; n < xac_.ObjNum; n ++) {
		// Compute Relative Position
		// (cause Objects to elevate above water as we climb to prevent flicker)
		let X = xac_.MapPos[n].x-air_.MapPos.x;
		let Y = xac_.MapPos[n].y-gen_.AltDif;
		let Z = air_.MapPos.z-xac_.MapPos[n].z;
		xac_.ObjAdr[n].position.set(X,Y,Z);
		scene.add(xac_.ObjAdr[n]);
	};
};

//=	MOVE AIRPLANES ===============//============================================


/*******************************************************************************
*
*	SHIPS
*
*******************************************************************************/

//=	LOAD SHIPS =================//==============================================


//=	INIT SHIPS =================//==============================================


//=	MOVE SHIPS =================//==============================================


/*******************************************************************************
*
*	SUBROUTINES
*
*******************************************************************************/

/* Converts degrees to 360 */
function Mod360(deg) {
	while (deg < 0) deg = deg + 360; // Make deg a positive number
	deg = deg % 360;				 // Compute remainder of any number divided by 360
return deg;}

//- Make Mesh ------------------------------------------------------------------
function makMsh() {
	let geometry = new BoxGeometry(0.01,0.01,0.01); 
	let material = new MeshBasicNodeMaterial({colorNode:color("black"),transparent:true,opacity:0});
	let mesh = new Mesh(geometry,material);
return mesh;}


/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {loadXACVeh,initXACVeh};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/
/*
250416:	In development
*/
