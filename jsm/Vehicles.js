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
	AnimationClip,
	AnimationMixer,
} from 'three';

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

function loadXSHVeh(gltfLoader,xsh_) {
	for (let n = 0; n < xsh_.ObjNum; n ++) {
		gltfLoader.load(xsh_.ObjSrc[n], function (gltf) {
			gltf.scene.traverse(function (child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});
			xsh_.ObjAdr[n] = gltf.scene;
			xsh_.ObjAdr[n].scale.setScalar(xsh_.ObjSiz[n]); // Scale
			// Animated Radar
			if (n == 0) {		// if CVE
				// Radar
				let clip = AnimationClip.findByName(gltf.animations, "RadarAction");
				xsh_.MixRdr[n] = new AnimationMixer(xsh_.ObjAdr[n]);
				let actun = xsh_.MixRdr[n].clipAction(clip);
				actun.play();
				if (xsh_.MixRdr[n]) xsh_.MixRdr[n].setTime(xsh_.AnmRdr[n]/anm_.anmfps);
			}
			xsh_.ObjAdr[n].position.set(0,0,0); // position within group is always 0,0,0
		});
	}
}

//=	INIT SHIPS =================//==============================================

function initXSHVeh(xsh_,air_,scene) {
// Always use group
	let X, Y, Z;
	for (let n = 0; n < xsh_.ObjNum; n ++) {
		xsh_.ObjGrp[n].rotation.order = "YXZ";
		// Compute Relative Position
		// (cause Objects to elevate above water as we climb to prevent flicker)
		X = xsh_.MapPos[n].x-air_.MapPos.x;
		Y = xsh_.MapPos[n].y-gen_.AltDif;
		Z = air_.MapPos.z-xsh_.MapPos[n].z;
		xsh_.ObjGrp[n].position.set(X,Y,Z);
		xsh_.ObjGrp[n].add(xsh_.ObjAdr[n]);
		scene.add(xsh_.ObjGrp[n]);		// Uses position of CVE to compute relative position
	}
}

//=	MOVE SHIPS =================//==============================================

function moveXSHVeh(xsh_,air_) {
	let X,Y,Z;
	for (let n = 0; n < xsh_.ObjNum; n ++) {
		// Change in Heading
		let XSHSpd = 0;		// for now
		let XSHPit = 0;
		XSHSpd = XSHSpd * tim_.DLTime;
		xsh_.ObjRot[n].y = xsh_.ObjRot[n].y + XSHSpd;	
		// Rock the boat
		if (n == 0) {
			xsh_.ShpPit[n] = Mod360(xsh_.ShpPit[n] + 0.5);
			let PitAdj = 1.5*DegRad*Math.sin(xsh_.ShpPit[n]*DegRad);
			xsh_.ObjRot[n].x = PitAdj;
			xsh_.ObjGrp[n].rotation.copy(xsh_.ObjRot[n]);
		}
		// Speed (Only Horizontal)
		let SpdMPF = xsh_.SpdMPS[n] * tim_.DLTime; // Speed (u/t)
		xsh_.MapSpd[n].z = -SpdMPF * Math.cos(xsh_.ObjRot[n].y*DegRad);
		xsh_.MapSpd[n].x = -SpdMPF * Math.sin(xsh_.ObjRot[n].y*DegRad);
		// Recompute Map Postion
		xsh_.MapPos[n].x = xsh_.MapPos[n].x + xsh_.MapSpd[n].x;
		xsh_.MapPos[n].z = xsh_.MapPos[n].z - xsh_.MapSpd[n].z;
		// Compute New Relative Position
		X = xsh_.MapPos[n].x-air_.MapPos.x;
		Y = xsh_.MapPos[n].y-gen_.AltDif;
		Z = air_.MapPos.z-xsh_.MapPos[n].z;
		xsh_.ObjGrp[n].position.set(X,Y,Z);
		// Compute Distance (for Viz Tests)
		X = xsh_.ObjGrp[n].position.x;
		Z = xsh_.ObjGrp[n].position.z;
		xsh_.ObjDst[n] = Math.sqrt(X*X+Z*Z); // Compute distance
		// Attached Objects
		if (n == 0) {
			// Radar
			xsh_.AnmRdr[n] = xsh_.AnmRdr[n] - 0.1;
			if (xsh_.AnmRdr[n] < 0) xsh_.AnmRdr[n] = 359;
			if (xsh_.MixRdr[n]) xsh_.MixRdr[n].setTime(xsh_.AnmRdr[n]/anm_.anmfps);
		}
	}
};

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

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {loadXACVeh,initXACVeh,
		loadXSHVeh,initXSHVeh,moveXSHVeh
};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/
/*
250416:	In development
*/
