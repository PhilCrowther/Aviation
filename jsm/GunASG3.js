/*
 * Warfare.js (vers 25.01.30)
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

//= CONSTANTS ==================//===============================================

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

//= LOAD MY BULLETS ============//===============================================

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

//= MOVE MY BULLETS ============//===============================================

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

//= LOAD XAC BULLETS ===========//===============================================

function loadXACBul(xag_,scene) {
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
	let BulMtL = new LineBasicNodeMaterial({colorNode: color(xag_.BulClr.x)});
	let BulMtD = new LineBasicNodeMaterial({colorNode: color(xag_.BulClr.y)});
	let xp = 2;
	// For Each Gun
	for (let n = 0; n < xag_.ObjNum; n ++) {
		// Load Bullets
		for (let i = 0; i < xag_.BulNum; i ++) {	
			// Create Bull Meshes - Double Line 2 Colors
			xag_.BulPtr[n][i] = new makMsh();
			// Left
			line = new Line(BulGeL,BulMtL); // Lite Color
			line.position.z = -lnF;
			line.position.x = -xp;
			xag_.BulPtr[n][i].add(line);
			line = new Line(BulGeD,BulMtD); // Dark Color
			line.position.z = lnB;
			line.position.x = -xp;
			xag_.BulPtr[n][i].add(line);
			// Rite
			line = new Line(BulGeL,BulMtL); // Lite Color
			line.position.z = -lnF;
			line.position.x = xp;
			xag_.BulPtr[n][i].add(line);
			line = new Line(BulGeD,BulMtD); // Dark Color
			line.position.z = lnB;
			line.position.x = xp;
			xag_.BulPtr[n][i].add(line);
			xag_.BulPtr[n][i].rotation.order = "YXZ";
		//
			scene.add(xag_.BulPtr[n][i]);
			xag_.BulPtr[n][i].visible = false;
			// Initialize Speed and Position
			xag_.BulMpS[n][i] = new Vector3();
			xag_.BulMpP[n][i] = new Vector3();
		} // end i
	} // end n
}

//= MOVE XAC BULLETS ===========//===============================================

function moveXACBul(xag_,air_,AltDif,DLTime,GrvDLT) {
	let BulSV3 = new Vector3();
	let	BulSpT = xag_.BulSpd * DLTime;
	for (let n = 0; n < xag_.ObjNum; n ++) {
		xag_.BulSp2[n] = xag_.BulSp2[n] - DLTime;
		if (xag_.BulSp2[n] < 0) xag_.BulSp2[n] = 0;
		for (let i = 0; i < xag_.BulNum; i ++) {
			// Start New Bullets
			if (!xag_.BulTim[n][i] && !xag_.BulSp2[n] && xag_.BulFlg[n]) {		
				// Set Initial Rotation
				xag_.BulPtr[n][i].rotation.x = xag_.ObjRot[n].x*DegRad; // Latitude
				xag_.BulPtr[n][i].rotation.y = xag_.ObjRot[n].y*DegRad; // Longitude
				// Initial Map Position
				xag_.BulMpP[n][i].copy(xag_.GunRef[n]);	
				// Set Initial Speed
				BulSV3 = new Spherical(BulSpT,(90-xag_.ObjRot[n].x)*DegRad,Mod360(-xag_.ObjRot[n].y)*DegRad);
				BulSV3 = new Vector3().setFromSpherical(BulSV3);
				xag_.BulMpS[n][i].copy(BulSV3);
				//
				xag_.BulTim[n][i] = DLTime;
				xag_.BulSp2[n] = xag_.BulSpc;
				xag_.BulPtr[n][i].visible = true;
			}
			// Continue Bullets
			xag_.BulTim[n][i] = xag_.BulTim[n][i] + DLTime;
			// Stop
			if (xag_.BulTim[n][i] > xag_.BulDLT) {
				xag_.BulTim[n][i] = 0;
				xag_.BulPtr[n][i].visible = false;
			}
			// Continue Bullet
			else {
				// Speed lost due to Drag (approx)
				xag_.BulMpS[n][i].multiplyScalar(.995);
				// New Map Position
				xag_.BulMpP[n][i].x = xag_.BulMpP[n][i].x + xag_.BulMpS[n][i].x;
				xag_.BulMpP[n][i].y = xag_.BulMpP[n][i].y + xag_.BulMpS[n][i].y - GrvDLT;
				xag_.BulMpP[n][i].z = xag_.BulMpP[n][i].z + xag_.BulMpS[n][i].z;
				// Relative Position
				xag_.BulPtr[n][i].position.x = xag_.BulMpP[n][i].x - air_.MapPos.x;
				xag_.BulPtr[n][i].position.y = xag_.BulMpP[n][i].y - AltDif;
				xag_.BulPtr[n][i].position.z = air_.MapPos.z - xag_.BulMpP[n][i].z;
			}
		} // end i
	} // end n
}

//**************************************|****************************************
//																				*
//									 AA GUNS									*
//																				*
//*******************************************************************************

// Many objects
// Bullet = Single Lines - 2 Color (Series)
// Smoke
// Gun Object = Gun at Relative Position to Ship

//= LOAD AA GUNS ===============//===============================================

function loadAAGuns(aag_,air_,AltDif,scene) {
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
	let AAAMtL = new LineBasicNodeMaterial({colorNode: color(aag_.AAAClr.x)});
	let AAAMtD = new LineBasicNodeMaterial({colorNode: color(aag_.AAAClr.y)});
	//- For Each Gun
	for (let n = 0; n < aag_.ObjNum; n ++) {
		// Gun Object Rotation (for show only)
		aag_.GunPtr[n].rotation.x = aag_.GunRot[n].x*DegRad; // Latitude
		aag_.GunPtr[n].rotation.y = aag_.GunRot[n].y*DegRad; // Longitude
		// Combined Map Position of Parent plus Gun
		MapPos.copy(aag_.GunRef[n]).add(aag_.GunPos[n]);
		// Compute Gun Relative Position (for show only)
		aag_.GunPtr[n].position.x = MapPos.x-air_.MapPos.x;
		aag_.GunPtr[n].position.y = MapPos.y-AltDif;
		aag_.GunPtr[n].position.z = air_.MapPos.z-MapPos.z;
		scene.add(aag_.GunPtr[n]);
		// Load Bullets
		for (let i = 0; i < aag_.AAANum; i ++) {
			// Create AAA Meshes - 1 Double Line
			aag_.AAAPtr[n][i] = new makMsh();
			line = new Line(AAAGeL,AAAMtL); // Lite Color
			line.position.z = -lnF;
			aag_.AAAPtr[n][i].add(line);
			line = new Line(AAAGeD,AAAMtD); // Dark Color
			line.position.z = lnB;
			aag_.AAAPtr[n][i].add(line);
			aag_.AAAPtr[n][i].scale.set(scale,scale,scale);
			aag_.AAAPtr[n][i].rotation.order = "YXZ";
			// 
			scene.add(aag_.AAAPtr[n][i]);
			aag_.AAAPtr[n][i].visible = false;
			// Initialize Values
			aag_.AAAMpS[n][i] = new Vector3();
			aag_.AAAMpP[n][i] = new Vector3();
		}
		// Smoke
		aag_.SmkMat[n] = new SpriteNodeMaterial({
			colorNode: color(0xffffff),
			colorNode: texture(aag_.SmkMap),
			transparent:true,
			opacity: 1.0,
			depthTest:false,
			depthWrite:false,
		});
		aag_.SmkPtr[n] = new Sprite(aag_.SmkMat[n]);
		aag_.SmkPtr[n].scale.set(100,100,100);	
		scene.add(aag_.SmkPtr[n]);
		aag_.SmkPtr[n].visible = false;
	} // end of n
}

//= MOVE AA GUNS ===============//===============================================

function moveAAGuns(aag_,air_,AltDif,DLTime,GrvDLT,SndFlg) {
	let MapPos = new Vector3();
	let AAASV3 = new Vector3();
	let	AAASpT = aag_.AAASpd * DLTime;
	for (let n = 0; n < aag_.ObjNum; n ++) {
		// Update Gun Object Rotation (for show only)
		aag_.GunPtr[n].rotation.x = aag_.GunRot[n].x*DegRad; // Latitude
		aag_.GunPtr[n].rotation.y = aag_.GunRot[n].y*DegRad; // Longitude
		// Combined Map Position of Parent plus Gun
		MapPos.copy(aag_.GunRef[n]).add(aag_.GunPos[n]);
		// Compute Gun Relative Position (for show only)
		aag_.GunPtr[n].position.x = MapPos.x-air_.MapPos.x;
		aag_.GunPtr[n].position.y = MapPos.y-AltDif;
		aag_.GunPtr[n].position.z = air_.MapPos.z-MapPos.z;
		// For Each Bullet String	
		aag_.AAASp2[n] = aag_.AAASp2[n] - DLTime; // When reach 0, fire next bullet
		if (aag_.AAASp2[n] < 0) aag_.AAASp2[n] = 0; // Ready to fire next bullet
		for (let i = 0; i < aag_.AAANum; i ++) {
			// Start New Bullets
			if (!aag_.AAATim[n][i] && !aag_.AAASp2[n] && aag_.AAAFlg[n]) {
			// AAATim = time in flight (reset to zero at end); AAASp2 = delay (reset to zero when time passed)
				// Set Initial Rotation
				aag_.AAAPtr[n][i].rotation.x = aag_.GunRot[n].x*DegRad; // Latitude
				aag_.AAAPtr[n][i].rotation.y = aag_.GunRot[n].y*DegRad; // Longitude
				// Initial Map Position
				aag_.AAAMpP[n][i].copy(MapPos);
				// Set Initial Speed
				AAASV3 = new Spherical(AAASpT,(90-aag_.GunRot[n].x)*DegRad,Mod360(-aag_.GunRot[n].y)*DegRad);
				AAASV3 = new Vector3().setFromSpherical(AAASV3);
				aag_.AAAMpS[n][i] = AAASV3;
				//
				aag_.AAATim[n][i] = DLTime; // First jump
				aag_.AAASp2[n] = aag_.AAASpc; // restart delay
				aag_.AAAPtr[n][i].visible = true;
				// End Smoke When Bullet0 Begins
				if (!i) aag_.SmkPtr[n].visible = false;
			}
			// Continue Bullets
			aag_.AAATim[n][i] = aag_.AAATim[n][i] + DLTime;
			// Stop
			if (aag_.AAATim[n][i] > aag_.AAADLT) {
				aag_.AAATim[n][i] = 0;
				aag_.AAAPtr[n][i].visible = false;
				// Start Smoke When Bullet0 Ends
				if (n == 0 && i == 0) {
					aag_.SmkMpP[n].copy(aag_.AAAMpP[n][i]); // Bullet0 MapPos
					aag_.SmkPtr[n].visible = true;
					aag_.SmkMat[n].opacity = 1.0;
					aag_.SmkRot[n] = Mod360(aag_.SmkRot[n] + 163); // Change appearance
					if (SndFlg && aag_.SndFlg[n]) aag_.SndPtr[n].play();
				}
				if (n == 1 && i == 2) {
					aag_.SmkMpP[n].copy(aag_.AAAMpP[n][i]); // Bullet0 MapPos
					aag_.SmkPtr[n].visible = true;
					aag_.SmkMat[n].opacity = 1.0;
					aag_.SmkRot[n] = Mod360(aag_.SmkRot[n] - 197); // Change appearance
					if (SndFlg && aag_.SndFlg[n]) aag_.SndPtr[n].play();
				}
			}
			// Continue
			else {
				// Speed lost due to Drag (approx)
				aag_.AAAMpS[n][i].multiplyScalar(.995);
				// New Map Position
				aag_.AAAMpP[n][i].x = aag_.AAAMpP[n][i].x + aag_.AAAMpS[n][i].x;
				aag_.AAAMpP[n][i].y = aag_.AAAMpP[n][i].y + aag_.AAAMpS[n][i].y - GrvDLT;
				aag_.AAAMpP[n][i].z = aag_.AAAMpP[n][i].z + aag_.AAAMpS[n][i].z;
				// Relative Position
				aag_.AAAPtr[n][i].position.x = aag_.AAAMpP[n][i].x - air_.MapPos.x;
				aag_.AAAPtr[n][i].position.y = aag_.AAAMpP[n][i].y - AltDif;
				aag_.AAAPtr[n][i].position.z = air_.MapPos.z - aag_.AAAMpP[n][i].z;
			}
		} // end of i
		// Smoke Relative Position
		if (aag_.SmkPtr[n].visible = true) {
			aag_.SmkPtr[n].position.x = aag_.SmkMpP[n].x - air_.MapPos.x;
			aag_.SmkPtr[n].position.y = aag_.SmkMpP[n].y - AltDif;
			aag_.SmkPtr[n].position.z = air_.MapPos.z - aag_.SmkMpP[n].z;
			aag_.SmkMat[n].rotation = Mod360((air_.AirRot.z + aag_.SmkRot[n])) * DegRad;
			aag_.SmkMat[n].opacity = aag_.SmkMat[n].opacity - 0.005;
			if (aag_.SmkMat[n].opacity < 0) {
				aag_.SmkMat[n].opacity = 0;
				aag_.SndPtr[n].stop();	// Reset for next explosion
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

//= LOAD AAA GUNS ==============//===============================================

function loadGunObj(gun_,scene) {
	// Make Bullets
	let scale = 2.5;			// Smoke Scale
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

//**************************************|****************************************
//																				*
//								  SUBROUTINES									*
//																				*
//*******************************************************************************

/* Converts degrees to 360 */
function Mod360(deg) {
	while (deg < 0) deg = deg + 360; // Make deg a positive number
	deg = deg % 360;				 // Compute remainder of any number divided by 360
return deg;}

//- Make Mesh -------------------------------------------------------------------
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

export {loadBullet,moveBullet,loadXACBul,moveXACBul,loadAAGuns,moveAAGuns};

//**************************************|****************************************
//																				*
//								    REVISIONS									*
//																				*
//*******************************************************************************

// * 250125:	Created
