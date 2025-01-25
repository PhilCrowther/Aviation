/*
 * Warfare.js (vers 25.01.25)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

//= GRID MAPS ==================================================================

import {
	BufferGeometry,
	Line,
	LineBasicNodeMaterial,
	Spherical,
	Vector3,
	// makMsh
	BoxGeometry,
	Mesh,
	MeshBasicNodeMaterial
} from 'three';

import {color} from "three/tsl";

//= ERR ========================//==============================================
//	Lines 92-93 Link SndMsh to Specific Bullets

//= CONSTANTS ==================//==============================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians

//= LOAD =======================================================================

//- Load My Bullets ------------------------------------------------------------
function loadBullet(myg_,scene) {
	// Line
	let line = 0
	let points = [];
		points.push(new Vector3(0,0,-10));
		points.push(new Vector3(0,0,10));
	let BltGeo = new BufferGeometry().setFromPoints(points);
	let BulMtL = new LineBasicNodeMaterial({colorNode: color(0xff80ff)});
	let BulMtD = new LineBasicNodeMaterial({colorNode: color(0x804080)});
	// Note: MeshBasicNodeMaterial not allow envMap
	let xp = 2;
	for (let i = 0; i < myg_.BulNum; i ++) {
		// Create Bullet Meshes - 2 Double Lines
		myg_.BulPtr[i] = new makMsh();
		// Left
		line = new Line(BltGeo,BulMtL); // Lite Color
		line.position.x = -xp-0.1;
		myg_.BulPtr[i].add(line);
		line = new Line(BltGeo,BulMtD); // Dark Color
		line.position.x = -xp;
		myg_.BulPtr[i].add(line);
		// Rite
		line = new Line(BltGeo,BulMtL); // Lite Color
		line.position.x = xp+0.1;
		myg_.BulPtr[i].add(line);
		line = new Line(BltGeo,BulMtD); // Dark Color
		line.position.x = xp;
		myg_.BulPtr[i].add(line);
		//
		scene.add(myg_.BulPtr[i]);
		myg_.BulPtr[i].visible = false;
		// Initialize Speed and Position
		myg_.BulMpS[i] = new Vector3();
	}
}

//= MOVE =======================================================================

//- Fire My Bullets ------------------------------------------------------------
function moveBullet(myg_,DLTime,GrvDLT,MYGFlg) {
	let BulSV3 = new Vector3();
	let	BulSpT = myg_.BulSpd * DLTime;
	myg_.BulSp2 = myg_.BulSp2 - DLTime;
	if (myg_.BulSp2 < 0) myg_.BulSp2 = 0;
	for (let i = 0; i < myg_.BulNum; i ++) {
		// Start New Bullets
		if (!myg_.BulTim[i] && !myg_.BulSp2 && MYGFlg) {
			// Set Initial Position
			myg_.BulPtr[i].position.set(0,0,0);
			// Set Initial Rotation
			myg_.BulPtr[i].rotation.copy(air_.AirObj.rotation);
			// Set Initial Speed
			BulSV3 = new Spherical(BulSpT,(90-air_.AirRot.x)*DegRad,Mod360(-air_.AirRot.y)*DegRad);
			BulSV3 = new Vector3().setFromSpherical(BulSV3);
			myg_.BulMpS[i].copy(BulSV3);
			//
			myg_.BulTim[i] = DLTime;
			myg_.BulSp2 = myg_.BulSpc;
			myg_.BulPtr[i].visible = true;
		}
		// Continue Bullets
		myg_.BulTim[i] = myg_.BulTim[i] + DLTime;
		// End Bullet
		if (myg_.BulTim[i] > myg_.BulDLT) {
			myg_.BulTim[i] = 0;
			myg_.BulPtr[i].visible = false;
		}
		// Continue Bullet
		else {
			// Speed lost due to Drag (approx)
			myg_.BulMpS[i].multiplyScalar(.995);
			// New Relative Position
			myg_.BulPtr[i].position.x = myg_.BulPtr[i].position.x - myg_.BulMpS[i].x;
			myg_.BulPtr[i].position.y = myg_.BulPtr[i].position.y + myg_.BulMpS[i].y - GrvDLT; // Bullet drop
			myg_.BulPtr[i].position.z = myg_.BulPtr[i].position.z - myg_.BulMpS[i].z;
		}
	} // end i
}

//= EXTRA ======================================================================

/* Converts degrees to 360 */
function Mod360(deg) {
	while (deg < 0) deg = deg + 360;	// Make deg a positive number
	deg = deg % 360;					// Compute remainder of any number divided by 360
return deg;}

//- Make Mesh ------------------------------------------------------------------
function makMsh() {
	let geometry = new BoxGeometry(0.01,0.01,0.01); 
	let material = new MeshBasicNodeMaterial({colorNode:color("black"),transparent:true,opacity:0});
	let mesh = new Mesh(geometry,material);
return mesh;}

//= EXPORTS ====================================================================

export {loadBullet,moveBullet};

/*= REVISIONS ==================================================================
 * 250125:	Created
*/
