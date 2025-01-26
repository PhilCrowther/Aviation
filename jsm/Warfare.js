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

//= IMPORTS ====================================================================

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

//= CONSTANTS ==================//==============================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians

//= LOAD MY BULLETS ============================================================

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

//= MOVE MY BULLETS ============================================================

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

//= LOAD AAA GUNS ===================//=========================================

function loadGunObj(gun_,scene) {
	// Make Bullets
	let scale = 2.5;
	let line = 0
	let point0 = [];
		point0.push(new Vector3(0,0,-2));
		point0.push(new Vector3(0,0,2));
	let AAAGeL = new BufferGeometry().setFromPoints(point0);
	let point1 = [];
		point1.push(new Vector3(0,0,-10));
		point1.push(new Vector3(0,0,10));
	let AAAGeD = new BufferGeometry().setFromPoints(point1);	
	let AAAMtL = new LineBasicNodeMaterial({colorNode: color(0x80ffff)});
	let AAAMtD = new LineBasicNodeMaterial({colorNode: color(0x408080)});
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
		gun_.SmkPtr[n].scale.set(100,50,100);
		gun_.SmkPtr[n].rotation.order = "YXZ";	
		scene.add(gun_.SmkPtr[n]);
		gun_.SmkPtr[n].visible = false;
	} // end of n
}

//= MOVE AAA GUNS ===================//=========================================

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
					if (SndFlg && gun_.SndFlg[n]) gun_.SndPtr[n].play();
				}
				if (n == 1 && i == 2) {
					gun_.SmkMpP[n].copy(gun_.AAAMpP[n][i]); // Bullet0 MapPos
					gun_.SmkPtr[n].visible = true;
					gun_.SmkMat[n].opacity = 1.0;
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
			gun_.SmkMat[n].rotation = air_.AirRot.z * DegRad;
			gun_.SmkMat[n].opacity = gun_.SmkMat[n].opacity - 0.005;
			if (gun_.SmkMat[n].opacity < 0) {
				gun_.SmkMat[n].opacity = 0;
				gun_.SndPtr[n].stop();  // Reset for next explosion
			}
		}
	} // end of n
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

export {loadBullet,moveBullet,loadGunObj,moveGunObj};

/*= REVISIONS ==================================================================
 * 250125:	Created
*/
