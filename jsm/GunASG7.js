/*
 * Warfare.js (vers 25.01.29)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/


/* NOTES:
	Bul refers to aircraft bullets with double lines
	AAA refers to anti-aircraft bullets with singles lines
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

//**************************************|****************************************
//																				*
//									 IMPORTS									*
//																				*
//===============================================================================

import {
	// Common
	BufferGeometry,
	Line,
	LineBasicNodeMaterial,
	Spherical,
	Vector3,
	// AA Smoke
	Sprite,
	SpriteNodeMaterial,
	// makMsh
	BoxGeometry,
	Mesh,
	MeshBasicNodeMaterial
} from 'three';

import {color,texture} from "three/tsl";

//**************************************|****************************************
//																				*
//								    VARIABLES									*
//																				*
//===============================================================================

//= CONSTANTS ==========================//=======================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians

//**************************************|****************************************
//																				*
//								    MY BULLETS									*
//																				*
//===============================================================================

// One object
// Bullet = 4 Lines: 2 X Single Type of Line X 2 Colors (Parallel)
// No Smoke
// Gun Object = Airplane

//= LOAD MY BULLETS ====================//=======================================

function loadBullet(myg_,scene) {
	// Line	
	let line = 0
	let points = [];
		points.push(new Vector3(0,0,-10));
		points.push(new Vector3(0,0,10));
	let BltGeo = new BufferGeometry().setFromPoints(points);
	let BulMtL = new LineBasicNodeMaterial({colorNode: color(myg_.BulClr.x)});
	let BulMtD = new LineBasicNodeMaterial({colorNode: color(myg_.BulClr.y)});
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

//= MOVE MY BULLETS ====================//=======================================

function moveBullet(myg_,air_,DLTime,GrvDLT,MYGFlg) {
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

//**************************************|****************************************
//																				*
//							     OTHER AIRPLANES								*
//																				*
//*******************************************************************************

// Many objects
// Bullet = 2 Lines: Each Line = 2 Types of Different Colored Lines
// No Smoke
// Gun Object = Airplane

//= LOAD XAC BULLETS ===================//=======================================

function loadXACBul(xac_,scene) {
	let line = 0
	//- Front Line
	let lnF = 6;
	let point0 = [];
		point0.push(new Vector3(0,0,-lnF));
		point0.push(new Vector3(0,0,lnF));
	let BulGeL = new BufferGeometry().setFromPoints(point0);
	//- Back Line
	let lnB = 6;
	let point1 = [];
		point1.push(new Vector3(0,0,-lnB));
		point1.push(new Vector3(0,0,lnB));
	let BulGeD = new BufferGeometry().setFromPoints(point1);	
	let BulMtL = new LineBasicNodeMaterial({colorNode: color(xac_.BulClr.x)});
	let BulMtD = new LineBasicNodeMaterial({colorNode: color(xac_.BulClr.y)});
	let xp = 2;
	// For Each Gun
	for (let n = 0; n < xac_.ObjNum; n ++) {
		// Load Bullets
		for (let i = 0; i < xac_.BulNum; i ++) {	
			// Create Bull Meshes - Double Line 2 Colors
			xac_.BulPtr[n][i] = new makMsh();
			// Left
			line = new Line(BulGeL,BulMtL); // Lite Color
			line.position.z = -lnF;
			line.position.x = -xp;
			xac_.BulPtr[n][i].add(line);
			line = new Line(BulGeD,BulMtD); // Dark Color
			line.position.z = lnB;
			line.position.x = -xp;
			xac_.BulPtr[n][i].add(line);
			// Rite
			line = new Line(BulGeL,BulMtL); // Lite Color
			line.position.z = -lnF;
			line.position.x = xp;
			xac_.BulPtr[n][i].add(line);
			line = new Line(BulGeD,BulMtD); // Dark Color
			line.position.z = lnB;
			line.position.x = xp;
			xac_.BulPtr[n][i].add(line);
			xac_.BulPtr[n][i].rotation.order = "YXZ";
		//
			scene.add(xac_.BulPtr[n][i]);
			xac_.BulPtr[n][i].visible = false;
			// Initialize Speed and Position
			xac_.BulMpS[n][i] = new Vector3();
			xac_.BulMpP[n][i] = new Vector3();
		} // end i
	} // end n
}

//= MOVE XAC BULLETS =====================//=====================================

function moveXACBul(xac_,air_,AltDif,DLTime,GrvDLT) {
	let BulSV3 = new Vector3();
	let	BulSpT = xac_.BulSpd * DLTime;
	for (let n = 0; n < xac_.ObjNum; n ++) {
		xac_.BulSp2[n] = xac_.BulSp2[n] - DLTime;
		if (xac_.BulSp2[n] < 0) xac_.BulSp2[n] = 0;
		for (let i = 0; i < xac_.BulNum; i ++) {
			// Start New Bullets
			if (!xac_.BulTim[n][i] && !xac_.BulSp2[n] && xac_.BulFlg[n]) {		
				// Set Initial Rotation
				xac_.BulPtr[n][i].rotation.x = xac_.ObjRot[n].x*DegRad; // Latitude
				xac_.BulPtr[n][i].rotation.y = xac_.ObjRot[n].y*DegRad; // Longitude
				// Initial Map Position
				xac_.BulMpP[n][i].copy(xac_.MapPos[n]);		
				// Set Initial Speed
				BulSV3 = new Spherical(BulSpT,(90-xac_.ObjRot[n].x)*DegRad,Mod360(-xac_.ObjRot[n].y)*DegRad);
				BulSV3 = new Vector3().setFromSpherical(BulSV3);
				xac_.BulMpS[n][i].copy(BulSV3);
				//
				xac_.BulTim[n][i] = DLTime;
				xac_.BulSp2[n] = xac_.BulSpc;
				xac_.BulPtr[n][i].visible = true;
			}
			// Continue Bullets
			xac_.BulTim[n][i] = xac_.BulTim[n][i] + DLTime;
			// Stop
			if (xac_.BulTim[n][i] > xac_.BulDLT) {
				xac_.BulTim[n][i] = 0;
				xac_.BulPtr[n][i].visible = false;
			}
			// Continue Bullet
			else {
				// Speed lost due to Drag (approx)
				xac_.BulMpS[n][i].multiplyScalar(.995);
				// New Map Position
				xac_.BulMpP[n][i].x = xac_.BulMpP[n][i].x + xac_.BulMpS[n][i].x;
				xac_.BulMpP[n][i].y = xac_.BulMpP[n][i].y + xac_.BulMpS[n][i].y - GrvDLT;
				xac_.BulMpP[n][i].z = xac_.BulMpP[n][i].z + xac_.BulMpS[n][i].z;
				// Relative Position
				xac_.BulPtr[n][i].position.x = xac_.BulMpP[n][i].x - air_.MapPos.x;
				xac_.BulPtr[n][i].position.y = xac_.BulMpP[n][i].y - AltDif;
				xac_.BulPtr[n][i].position.z = air_.MapPos.z - xac_.BulMpP[n][i].z;
			}
		} // end i
	} // end n
}

//**************************************|****************************************
//																				*
//								  MOVING SHIPS AA								*
//																				*
//*******************************************************************************

// Many objects
// Bullet = Single Lines - 2 Color (Series)
// Smoke
// Gun Object = Gun at Relative Position to Ship

//= LOAD XSH AA ========================//=======================================

function loadXSHBul(xsg_,air_,AltDif,scene) {
	let MapPos = new Vector3();
	let scale = 2.5;					// Smoke Scale
	let line = 0;
	//- Front Line
	let lnF = 2;
	let point0 = [];
		point0.push(new Vector3(0,0,-lnF));
		point0.push(new Vector3(0,0,lnF));
	let AAAGeL = new BufferGeometry().setFromPoints(point0);
	//- Back Line
	let lnB = 10;
	let point1 = [];
		point1.push(new Vector3(0,0,-lnB));
		point1.push(new Vector3(0,0,lnB));
	let AAAGeD = new BufferGeometry().setFromPoints(point1);	
	let AAAMtL = new LineBasicNodeMaterial({colorNode: color(xsg_.AAAClr.x)});
	let AAAMtD = new LineBasicNodeMaterial({colorNode: color(xsg_.AAAClr.y)});
	//- For Each Gun
	for (let n = 0; n < xsg_.ObjNum; n ++) {
		// Gun Object Rotation (for show only)
		xsg_.GunPtr[n].rotation.x = xsg_.GunRot[n].x*DegRad; // Latitude
		xsg_.GunPtr[n].rotation.y = xsg_.GunRot[n].y*DegRad; // Longitude
		// Combined Map Position of Parent plus Gun
		MapPos.copy(xsg_.GunRef[n].position).add(xsg_.GunPos[n]);
		// Compute Gun Relative Position (for show only)
		xsg_.GunPtr[n].position.x = MapPos.x-air_.MapPos.x;
		xsg_.GunPtr[n].position.y = MapPos.y-AltDif;
		xsg_.GunPtr[n].position.z = air_.MapPos.z-MapPos.z;
		scene.add(xsg_.GunPtr[n]);
		// Load Bullets
		for (let i = 0; i < xsg_.AAANum; i ++) {
			// Create AAA Meshes - 1 Double Line
			xsg_.AAAPtr[n][i] = new makMsh();
			line = new Line(AAAGeL,AAAMtL); // Lite Color
			line.position.z = -lnF;
			xsg_.AAAPtr[n][i].add(line);
			line = new Line(AAAGeD,AAAMtD); // Dark Color
			line.position.z = lnB;
			xsg_.AAAPtr[n][i].add(line);
			xsg_.AAAPtr[n][i].scale.set(scale,scale,scale);
			xsg_.AAAPtr[n][i].rotation.order = "YXZ";
			// 
			scene.add(xsg_.AAAPtr[n][i]);
			xsg_.AAAPtr[n][i].visible = false;
			// Initialize Values
			xsg_.AAAMpS[n][i] = new Vector3();
			xsg_.AAAMpP[n][i] = new Vector3();
		}
		// Smoke
		xsg_.SmkMat[n] = new SpriteNodeMaterial({
			colorNode: color(0xffffff),
			colorNode: texture(xsg_.SmkMap),
			transparent:true,
			opacity: 1.0,
			depthTest:false,
			depthWrite:false,
		});
		xsg_.SmkPtr[n] = new Sprite(xsg_.SmkMat[n]);
		xsg_.SmkPtr[n].scale.set(100,100,100);	
		scene.add(xsg_.SmkPtr[n]);
		xsg_.SmkPtr[n].visible = false;
	} // end of n
}

//= MOVE XSH AA ========================//=======================================

function moveXSHBul(xsg_,air_,AltDif,DLTime,GrvDLT,SndFlg) {
	let MapPos = new Vector3();
	let AAASV3 = new Vector3();
	let	AAASpT = xsg_.AAASpd * DLTime;
	for (let n = 0; n < xsg_.ObjNum; n ++) {
		// Update Gun Object Rotation (for show only)
		xsg_.GunPtr[n].rotation.x = xsg_.GunRot[n].x*DegRad; // Latitude
		xsg_.GunPtr[n].rotation.y = xsg_.GunRot[n].y*DegRad; // Longitude
		// Combined Map Position of Parent plus Gun
		MapPos.copy(xsg_.GunRef[n].position).add(xsg_.GunPos[n]);
		// Compute Gun Relative Position (for show only)
		xsg_.GunPtr[n].position.x = MapPos.x-air_.MapPos.x;
		xsg_.GunPtr[n].position.y = MapPos.y-AltDif;
		xsg_.GunPtr[n].position.z = air_.MapPos.z-MapPos.z;
		// For Each Bullet String	
		xsg_.AAASp2[n] = xsg_.AAASp2[n] - DLTime; // When reach 0, fire next bullet
		if (xsg_.AAASp2[n] < 0) xsg_.AAASp2[n] = 0; // Ready to fire next bullet
		for (let i = 0; i < xsg_.AAANum; i ++) {
			// Start New Bullets
			if (!xsg_.AAATim[n][i] && !xsg_.AAASp2[n] && xsg_.AAAFlg[n]) {
			// AAATim = time in flight (reset to zero at end); AAASp2 = delay (reset to zero when time passed)
				// Set Initial Rotation
				xsg_.AAAPtr[n][i].rotation.x = xsg_.GunRot[n].x*DegRad; // Latitude
				xsg_.AAAPtr[n][i].rotation.y = xsg_.GunRot[n].y*DegRad; // Longitude
				// Initial Map Position
				xsg_.AAAMpP[n][i].copy(MapPos);
				// Set Initial Speed
				AAASV3 = new Spherical(AAASpT,(90-xsg_.GunRot[n].x)*DegRad,Mod360(-xsg_.GunRot[n].y)*DegRad);
				AAASV3 = new Vector3().setFromSpherical(AAASV3);
				xsg_.AAAMpS[n][i] = AAASV3;
				//
				xsg_.AAATim[n][i] = DLTime; // First jump
				xsg_.AAASp2[n] = xsg_.AAASpc; // restart delay
				xsg_.AAAPtr[n][i].visible = true;
				// End Smoke When Bullet0 Begins
				if (!i) xsg_.SmkPtr[n].visible = false;
			}
			// Continue Bullets
			xsg_.AAATim[n][i] = xsg_.AAATim[n][i] + DLTime;
			// Stop
			if (xsg_.AAATim[n][i] > xsg_.AAADLT) {
				xsg_.AAATim[n][i] = 0;
				xsg_.AAAPtr[n][i].visible = false;
				// Start Smoke When Bullet0 Ends
				if (n == 0 && i == 0) {
					xsg_.SmkMpP[n].copy(xsg_.AAAMpP[n][i]); // Bullet0 MapPos
					xsg_.SmkPtr[n].visible = true;
					xsg_.SmkMat[n].opacity = 1.0;
					xsg_.SmkRot[n] = Mod360(xsg_.SmkRot[n] + 163); // Change appearance
					if (SndFlg && xsg_.SndFlg[n]) xsg_.SndPtr[n].play();
				}
				if (n == 1 && i == 2) {
					xsg_.SmkMpP[n].copy(xsg_.AAAMpP[n][i]); // Bullet0 MapPos
					xsg_.SmkPtr[n].visible = true;
					xsg_.SmkMat[n].opacity = 1.0;
					xsg_.SmkRot[n] = Mod360(xsg_.SmkRot[n] - 197); // Change appearance
					if (SndFlg && xsg_.SndFlg[n]) xsg_.SndPtr[n].play();
				}
			}
			// Continue
			else {
				// Speed lost due to Drag (approx)
				xsg_.AAAMpS[n][i].multiplyScalar(.995);
				// New Map Position
				xsg_.AAAMpP[n][i].x = xsg_.AAAMpP[n][i].x + xsg_.AAAMpS[n][i].x;
				xsg_.AAAMpP[n][i].y = xsg_.AAAMpP[n][i].y + xsg_.AAAMpS[n][i].y - GrvDLT;
				xsg_.AAAMpP[n][i].z = xsg_.AAAMpP[n][i].z + xsg_.AAAMpS[n][i].z;
				// Relative Position
				xsg_.AAAPtr[n][i].position.x = xsg_.AAAMpP[n][i].x - air_.MapPos.x;
				xsg_.AAAPtr[n][i].position.y = xsg_.AAAMpP[n][i].y - AltDif;
				xsg_.AAAPtr[n][i].position.z = air_.MapPos.z - xsg_.AAAMpP[n][i].z;
			}
		} // end of i
		// Smoke Relative Position
		if (xsg_.SmkPtr[n].visible = true) {
			xsg_.SmkPtr[n].position.x = xsg_.SmkMpP[n].x - air_.MapPos.x;
			xsg_.SmkPtr[n].position.y = xsg_.SmkMpP[n].y - AltDif;
			xsg_.SmkPtr[n].position.z = air_.MapPos.z - xsg_.SmkMpP[n].z;
			xsg_.SmkMat[n].rotation = Mod360((air_.AirRot.z + xsg_.SmkRot[n])) * DegRad;
			xsg_.SmkMat[n].opacity = xsg_.SmkMat[n].opacity - 0.005;
			if (xsg_.SmkMat[n].opacity < 0) {
				xsg_.SmkMat[n].opacity = 0;
				xsg_.SndPtr[n].stop();	// Reset for next explosion
			}
		}
	} // end of n
}

//**************************************|****************************************
//																				*
//								   ANTI-AIRCRAFT								*
//																				*
//*******************************************************************************

// Many objects
// Bullet = Single Lines - 2 Color (Series)
// Smoke
// Gun Object = Gun at Absolute Position

//= LOAD AAA GUNS ======================//=======================================

function loadGunObj(gun_,scene) {
	// Make Bullets
	let scale = 2.5;					// Smoke Scale
	let line = 0
	let point0 = [];
		point0.push(new Vector3(0,0,-2));
		point0.push(new Vector3(0,0,2));
	let AAAGeL = new BufferGeometry().setFromPoints(point0);
	let point1 = [];
		point1.push(new Vector3(0,0,-10));
		point1.push(new Vector3(0,0,10));
	let AAAGeD = new BufferGeometry().setFromPoints(point1);	
	let AAAMtL = new LineBasicNodeMaterial({colorNode: color(gun_.AAAClr.x)});
	let AAAMtD = new LineBasicNodeMaterial({colorNode: color(gun_.AAAClr.y)});
	// For Each Gun
	for (let n = 0; n < gun_.ObjNum; n ++) {
		gun_.ObjAdr[n].rotation.copy(gun_.ObjRot[n]);
		gun_.ObjAdr[n].position.copy(gun_.MapPos[n]);
		scene.add(gun_.ObjAdr[n]);
		// Load Bullets
		for (let i = 0; i < gun_.AAANum; i ++) {
			// Create AAA Meshes - 1 Double Line
			gun_.AAAPtr[n][i] = new makMsh();
			line = new Line(AAAGeL,AAAMtL); // Lite Color
			line.position.z = -2;
			gun_.AAAPtr[n][i].add(line);
			line = new Line(AAAGeD,AAAMtD); // Dark Color
			line.position.z = 10;
			gun_.AAAPtr[n][i].add(line);
			gun_.AAAPtr[n][i].scale.set(scale,scale,scale);
			gun_.AAAPtr[n][i].rotation.order = "YXZ";
			// 
			scene.add(gun_.AAAPtr[n][i]);
			gun_.AAAPtr[n][i].visible = false;
			// Initialize Values
			gun_.AAAMpS[n][i] = new Vector3();
			gun_.AAAMpP[n][i] = new Vector3();
		}
		// Smoke
		gun_.SmkMat[n] = new SpriteNodeMaterial({
			colorNode: color(0xffffff),
			colorNode: texture(gun_.SmkMap),
			transparent:true,
			opacity: 1.0,
			depthTest:false,
			depthWrite:false,
		});
		gun_.SmkPtr[n] = new Sprite(gun_.SmkMat[n]);
		gun_.SmkPtr[n].scale.set(100,100,100);	
		scene.add(gun_.SmkPtr[n]);
		gun_.SmkPtr[n].visible = false;
	} // end of n
}

//= MOVE AAA GUNS =====================//========================================

function moveGunObj(gun_,air_,AltDif,DLTime,GrvDLT,SndFlg) {
	let AAASV3 = new Vector3();
	let	AAASpT = gun_.AAASpd * DLTime;
	for (let n = 0; n < gun_.ObjNum; n ++) {
		// Update Gun Object Rotation (for show only)
		gun_.ObjAdr[n].rotation.x = gun_.ObjRot[n].x*DegRad; // Latitude
		gun_.ObjAdr[n].rotation.y = gun_.ObjRot[n].y*DegRad; // Longitude
		// Compute Gun Relative Position (for show only)
		gun_.ObjAdr[n].position.x = gun_.MapPos[n].x-air_.MapPos.x;
		gun_.ObjAdr[n].position.y = gun_.MapPos[n].y-AltDif;
		gun_.ObjAdr[n].position.z = air_.MapPos.z-gun_.MapPos[n].z;
		// For Each Bullet String	
		gun_.AAASp2[n] = gun_.AAASp2[n] - DLTime; // When reach 0, fire next bullet
		if (gun_.AAASp2[n] < 0) gun_.AAASp2[n] = 0; // Ready to fire next bullet
		for (let i = 0; i < gun_.AAANum; i ++) {
			// Start New Bullets
			if (!gun_.AAATim[n][i] && !gun_.AAASp2[n] && gun_.AAAFlg[n]) {
			// AAATim = time in flight (reset to zero at end); AAASp2 = delay (reset to zero when time passed)
				// Set Initial Rotation
				gun_.AAAPtr[n][i].rotation.x = gun_.ObjRot[n].x*DegRad; // Latitude
				gun_.AAAPtr[n][i].rotation.y = gun_.ObjRot[n].y*DegRad; // Longitude
				// Initial Map Position
				gun_.AAAMpP[n][i].copy(gun_.MapPos[n]);
				// Set Initial Speed
				AAASV3 = new Spherical(AAASpT,(90-gun_.ObjRot[n].x)*DegRad,Mod360(-gun_.ObjRot[n].y)*DegRad);
				AAASV3 = new Vector3().setFromSpherical(AAASV3);
				gun_.AAAMpS[n][i] = AAASV3;
				//
				gun_.AAATim[n][i] = DLTime; // First jump
				gun_.AAASp2[n] = gun_.AAASpc; // restart delay
				gun_.AAAPtr[n][i].visible = true;
				// End Smoke When Bullet0 Begins
				if (!i) gun_.SmkPtr[n].visible = false;
			}
			// Continue Bullets
			gun_.AAATim[n][i] = gun_.AAATim[n][i] + DLTime;
			// Stop
			if (gun_.AAATim[n][i] > gun_.AAADLT) {
				gun_.AAATim[n][i] = 0;
				gun_.AAAPtr[n][i].visible = false;
				// Start Smoke When Bullet0 Ends
				if (n == 0 && i == 0) {
					gun_.SmkMpP[n].copy(gun_.AAAMpP[n][i]); // Bullet0 MapPos
					gun_.SmkPtr[n].visible = true;
					gun_.SmkMat[n].opacity = 1.0;
					gun_.SmkRot[n] = Mod360(gun_.SmkRot[n] + 163); // Change appearance
					if (SndFlg && gun_.SndFlg[n]) gun_.SndPtr[n].play();
				}
				if (n == 1 && i == 2) {
					gun_.SmkMpP[n].copy(gun_.AAAMpP[n][i]); // Bullet0 MapPos
					gun_.SmkPtr[n].visible = true;
					gun_.SmkMat[n].opacity = 1.0;
					gun_.SmkRot[n] = Mod360(gun_.SmkRot[n] - 197); // Change appearance
					if (SndFlg && gun_.SndFlg[n]) gun_.SndPtr[n].play();
				}
			}
			// Continue
			else {
				// Speed lost due to Drag (approx)
				gun_.AAAMpS[n][i].multiplyScalar(.995);
				// New Map Position
				gun_.AAAMpP[n][i].x = gun_.AAAMpP[n][i].x + gun_.AAAMpS[n][i].x;
				gun_.AAAMpP[n][i].y = gun_.AAAMpP[n][i].y + gun_.AAAMpS[n][i].y - GrvDLT;
				gun_.AAAMpP[n][i].z = gun_.AAAMpP[n][i].z + gun_.AAAMpS[n][i].z;
				// Relative Position
				gun_.AAAPtr[n][i].position.x = gun_.AAAMpP[n][i].x - air_.MapPos.x;
				gun_.AAAPtr[n][i].position.y = gun_.AAAMpP[n][i].y - AltDif;
				gun_.AAAPtr[n][i].position.z = air_.MapPos.z - gun_.AAAMpP[n][i].z;
			}
		} // end of i
		// Smoke Relative Position
		if (gun_.SmkPtr[n].visible = true) {
			gun_.SmkPtr[n].position.x = gun_.SmkMpP[n].x - air_.MapPos.x;
			gun_.SmkPtr[n].position.y = gun_.SmkMpP[n].y - AltDif;
			gun_.SmkPtr[n].position.z = air_.MapPos.z - gun_.SmkMpP[n].z;
			gun_.SmkMat[n].rotation = Mod360((air_.AirRot.z + gun_.SmkRot[n])) * DegRad;
			gun_.SmkMat[n].opacity = gun_.SmkMat[n].opacity - 0.005;
			if (gun_.SmkMat[n].opacity < 0) {
				gun_.SmkMat[n].opacity = 0;
				gun_.SndPtr[n].stop();  // Reset for next explosion
			}
		}
	} // end of n
}

//**************************************|****************************************
//																				*
//								  SUBROUTINES									*
//																				*
//*******************************************************************************

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


//**************************************|****************************************
//																				*
//									 EXPORTS									*
//																				*
//*******************************************************************************

export {loadBullet,moveBullet,loadXACBul,moveXACBul,loadXSHBul,moveXSHBul,loadGunObj,moveGunObj};

//**************************************|****************************************
//																				*
//								    REVISIONS									*
//																				*
//*******************************************************************************

// * 250125:	Created
