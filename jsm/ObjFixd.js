/*
 * ObjFixd.js (vers 25.04.13)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

/* NOTES:
This currently includes animated objects which are attached to the scenery
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	// Island
	MeshLambertNodeMaterial,
	// makMsh
	BoxGeometry,
	MeshBasicNodeMaterial,
} from 'three';

import {color,texture} from "three/tsl";

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= CONSTANTS ==================//==============================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians

//= VARIABLES ==================//==============================================

/*******************************************************************************
*
*	ISLANDS
*
*******************************************************************************/

//=	LOAD ISLANDS ===============//==============================================
function loadIsland(scene,isl_,air_,gen_,txtrLoader,gltfLoader) {
	for (let i = 0; i < isl_.ObjNum; i++) {
		isl_.ObjGrp[i].position.copy(isl_.MapPos[i]);
		scene.add(isl_.ObjGrp[i]);
	}
	for (let i = 0; i < isl_.ObjNum; i++) {
	// Transparent Island Objects
		txtrLoader.load(isl_.ObjTxt[i], function (IslTxt) {	
			let mat = new MeshLambertNodeMaterial({colorNode: texture(IslTxt), transparent: true});
			gltfLoader.load(isl_.ObjSrc[i], function (gltf) {
				gltf.scene.traverse(function (child) {
				// Note: Blender island must include a UV map
					if (child.isMesh) {
						child.material = mat;
						child.receiveShadow = true;
					}
				});
				isl_.ObjAdr[i] = gltf.scene;
				isl_.ObjAdr[i].scale.setScalar(isl_.ObjSiz[i]);
				isl_.ObjAdr[i].rotation.copy(isl_.ObjRot[i]);
				isl_.ObjGrp[i].add(isl_.ObjAdr[i]);
			});
		});
	}
}

//=	INIT ISLANDS ===============//==============================================
function initIsland(isl_,air_,gen_) {
	moveIsland(isl_,air_,gen_);
}

//=	MOVE ISLANDS ===============//==============================================

function moveIsland(isl_,air_,gen_) {
	let X,Y,Z;
	for (let i = 0; i < isl_.ObjNum; i ++) {
		// Compute New Relative Position
		// (cause Islands to elevate above water as we climb to prevent flicker)
		X = isl_.MapPos[i].x-air_.MapPos.x;
		Y = isl_.MapPos[i].y-gen_.AltDif;
		Z = air_.MapPos.z-isl_.MapPos[i].z;
		isl_.ObjGrp[i].position.set(X,Y,Z);
	}
}

/*******************************************************************************
*
*	FIXED OBJECTS - Only Objects Attached to Islands (for Now)
*
*******************************************************************************/

//=	LOAD OBJECTS ===============//==============================================
function loadFxdObj(scene,fxd_,gltfLoader) {
	for (let i = 0; i < fxd_.ObjNum; i++) {
		gltfLoader.load(fxd_.ObjSrc[i], function (gltf) {
			fxd_.ObjAdr[i] = gltf.scene;
			fxd_.ObjAdr[i].scale.setScalar(fxd_.ObjSiz[i]);
			fxd_.ObjAdr[i].rotation.copy(fxd_.ObjRot[i]);
			fxd_.ObjAdr[i].position.copy(fxd_.MapPos[i]);
			fxd_.ObjRef[i].add(fxd_.ObjAdr[i]);
		});
	}
}

//=	INIT OBJECTS ===============//==============================================
function initFxdObj(fxd_,air_,gen_) {
	moveFxdObj(fxd_,air_,gen_);
}

//=	MOVE OBJECTS ===============//==============================================
function moveFxdObj(fxd_,air_,gen_) {
	// Change Altitude on Linked Objects to Prevent Flicker
	for (let i = 0; i < fxd_.ObjNum; i++) {
		fxd_.ObjAdr[i].position.y = fxd_.MapPos[i].y + gen_.AltDif*0.01;
	}
}

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

export {loadIsland,initIsland,moveIsland,loadFxdObj,initFxdObj,moveFxdObj};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/
/*
250413:	In development
*/
