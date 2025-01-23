/*
 * Warfare.js (vers 25.01.23)
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
	Sprite,
	SpriteNodeMaterial,
	Vector3,
} from 'three';

//= CONSTANTS ==================//==============================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians

//= LOAD =======================//==============================================

//- Load Guns ------------------------------------------------------------------
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
		for (let i = 0; i < AAANum; i ++) {
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
			// Initialize Values (Necessary?)
			gun_.AAAMSX[n][i] = gun_.AAAMSY[n][i] = gun_.AAAMSZ[n][i] = 0;
			gun_.AAAMPX[n][i] = gun_.AAAMPY[n][i] = gun_.AAAMPZ[n][i] = 0;
		}
		// Starting Y-Rotation
		gun_.ObjRot[n].y = gun_.RotYBg[n];
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
		scene.add(gun_.SmkPtr[n]);
		gun_.SmkPtr[n].visible = false;
	} // end of n
}

//- Fire AAA -------------------//----------------------------------------------
function moveGunObj(gun_) {
	let AAASV3 = new Vector3();
	let	AAASpT = AAASpd * DLTime;
	let X,Y,Z;
	for (let n = 0; n < gun_.ObjNum; n ++) {
		// Update Gun Object Rotation (for show only)
		gun_.ObjAdr[n].rotation.x = gun_.ObjRot[n].x*DegRad; // Latitude
		gun_.ObjAdr[n].rotation.y = gun_.ObjRot[n].y*DegRad; // Longitude
		// Compute Gun Relative Position (for show only)
		X = gun_.MapPos[n].x-air_.MapPos.x;
		Y = gun_.MapPos[n].y-AltDif;
		Z = air_.MapPos.z-gun_.MapPos[n].z;
		gun_.ObjAdr[n].position.set(X,Y,Z);
		// For Each Bullet String	
		gun_.AAASp2[n] = gun_.AAASp2[n] - DLTime; // When reach 0, fire next bullet
		if (gun_.AAASp2[n] < 0) gun_.AAASp2[n] = 0; // Ready to fire next bullet
		for (let i = 0; i < AAANum; i ++) {
			// Start New Bullets
			if (!gun_.AAATim[n][i] && !gun_.AAASp2[n] && gun_.AAAFlg[n]) {
				// Set Initial Rotation
				gun_.AAAPtr[n][i].rotation.x = gun_.ObjRot[n].x*DegRad; // Latitude
				gun_.AAAPtr[n][i].rotation.y = gun_.ObjRot[n].y*DegRad; // Longitude
				// Initial Map Position
				gun_.AAAMPX[n][i] = gun_.MapPos[n].x;
				gun_.AAAMPY[n][i] = gun_.MapPos[n].y;
				gun_.AAAMPZ[n][i] = gun_.MapPos[n].z;				
				// Set Initial Speed
				AAASV3 = new Spherical(AAASpT,(90-gun_.ObjRot[n].x)*DegRad,Mod360(-gun_.ObjRot[n].y)*DegRad);
				AAASV3 = new Vector3().setFromSpherical(AAASV3);
				gun_.AAAMSX[n][i] = AAASV3.x;
				gun_.AAAMSY[n][i] = AAASV3.y;
				gun_.AAAMSZ[n][i] = AAASV3.z;
				//
				gun_.AAATim[n][i] = DLTime; // First jump
				gun_.AAASp2[n] = AAASpc;
				gun_.AAAPtr[n][i].visible = true;
				// End Smoke When Bullet0 Begins
				if (!i) gun_.SmkPtr[n].visible = false;
			}
			// Continue Bullets
			gun_.AAATim[n][i] = gun_.AAATim[n][i] + DLTime;
			// Stop
			if (gun_.AAATim[n][i] > AAADLT) {
				gun_.AAATim[n][i] = 0;
				gun_.AAAPtr[n][i].visible = false;
				// Start Smoke When Bullet0 Ends
				if (n == 0 && i == 0) {
					gun_.SmkMPX[n] = gun_.AAAMPX[n][i]; // Bullet0 MapPos
					gun_.SmkMPY[n] = gun_.AAAMPY[n][i];
					gun_.SmkMPZ[n] = gun_.AAAMPZ[n][i];
					gun_.SmkPtr[n].visible = true;
					gun_.SmkMat[n].opacity = 1.0;
					if (SndFlg && gun_.SndFlg[n]) gun_.SndPtr[n].play();
				}
				if (n == 1 && i == 2) {
					gun_.SmkMPX[n] = gun_.AAAMPX[n][i]; // Bullet0 MapPos
					gun_.SmkMPY[n] = gun_.AAAMPY[n][i];
					gun_.SmkMPZ[n] = gun_.AAAMPZ[n][i];
					gun_.SmkPtr[n].visible = true;
					gun_.SmkMat[n].opacity = 1.0;
					if (SndFlg && gun_.SndFlg[n]) gun_.SndPtr[n].play();
				}
			}
			// Continue
			else {
				// Speed lost due to Drag (approx)
				gun_.AAAMSX[n][i] = gun_.AAAMSX[n][i] * .995;
				gun_.AAAMSY[n][i] = gun_.AAAMSY[n][i] * .995;
				gun_.AAAMSZ[n][i] = gun_.AAAMSZ[n][i] * .995;
				// New Map Position
				gun_.AAAMPX[n][i] = gun_.AAAMPX[n][i] + gun_.AAAMSX[n][i];
				gun_.AAAMPY[n][i] = gun_.AAAMPY[n][i] + gun_.AAAMSY[n][i] - GrvDLT; // Bullet drop
				gun_.AAAMPZ[n][i] = gun_.AAAMPZ[n][i] + gun_.AAAMSZ[n][i];
				// Relative Position
				X = gun_.AAAMPX[n][i] - air_.MapPos.x;
				Y = gun_.AAAMPY[n][i] - AltDif;
				Z = air_.MapPos.z - gun_.AAAMPZ[n][i];
				gun_.AAAPtr[n][i].position.set(X,Y,Z);
			}
		} // end of i
		// Smoke Relative Position
		if (gun_.SmkPtr[n].visible = true) {
			X = gun_.SmkMPX[n] - air_.MapPos.x;
			Y = gun_.SmkMPY[n] - AltDif;
			Z = air_.MapPos.z - gun_.SmkMPZ[n];			
			gun_.SmkPtr[n].position.set(X,Y,Z);
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

export {loadGunObj,moveGunObj};

/*= REVISIONS ==================================================================
 * 250123:	Created
*/
