/*
 * Effects.js (vers 25.06.3)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

/* NOTES:
	Bul refers to aircraft bullets with double lines
	AAA refers to anti-aircraft bullets with singles lines
	Use lines and 2 colors so bullets appear against both light sky and dark ground
*/

/*******************************************************************************
*
*	NOTES
*
*******************************************************************************/
/*
The AA module does not cycle through all bullets, but only enough to fill the sky.
This is because, once the time of flight has passed and the wait time has passed,
each bullet is ready to be fired again and the program uses the first available
bullet (similar to a LIFO method). This stops subsequent bullets from being fired.

AA Smoke was originally tied to a bullet, which limited the delay between bullets.
AA Smoke now has an independent delay which eliminates this problem.

Regarding implementing a delay in sounds due to distance:
When AA Smoke was tied to a bullet, the smoke was appearing so fast that that the 
delay counter was reset before it had a chance to hit zero. As a result, the sound 
was never triggered. Now that AA Smoke has an independent delay, this should be
less of a problem. 

However, since AA sound is not heard much until we get close, implementation of a
sound delay may be superfluous.
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	AdditiveBlending,
	BackSide,
	BoxGeometry,
	BufferGeometry,
	Line,
	LineBasicNodeMaterial,
	MeshBasicNodeMaterial,
	Mesh,
	PlaneGeometry,
	SphereGeometry,
	Spherical,
	Sprite,
	SpriteNodeMaterial,
	Vector3,	
} from 'three';

import {color,mix,positionLocal,range,rotateUV,texture,time,uniform,uv} from "three/tsl";

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= CONSTANTS ==================//==============================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians

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
*	MY BULLETS
*
*******************************************************************************/

// One object
// Bullet = 4 Lines: 2 X Single Type of Line X 2 Colors (Parallel)
// No Smoke
// Gun Object = Airplane

//= INIT MY BULLETS ============//==============================================
//	xp = distance left and right (FM2 = 2). If zero, single bullet

function initBullet(myg_,scene) {
	// Line	
	let line = 0
	let points = [];
		points.push(new Vector3(0,0,-10));
		points.push(new Vector3(0,0,10));
	let BltGeo = new BufferGeometry().setFromPoints(points);
	let BulMtL = new LineBasicNodeMaterial({colorNode: color(myg_.BulClr.x)});
	let BulMtD = new LineBasicNodeMaterial({colorNode: color(myg_.BulClr.y)});
	for (let i = 0; i < myg_.BulNum; i ++) {
		//	Create Bullet Meshes 
		myg_.BulPtr[i] = new makMsh();
		for (let j = 0; j < myg_.ObjNum; i ++) { // For Each Barrel
			line = new Line(BltGeo,BulMtL); // Lite Color
			line.position.copy(myg_.ObjPos[j]);
			myg_.BulPtr[i].add(line);
			line = new Line(BltGeo,BulMtD); // Dark Color
			line.position.copy(myg_.ObjPos[j]);
			myg_.BulPtr[i].add(line);
		}
		//
		scene.add(myg_.BulPtr[i]);
		myg_.BulPtr[i].visible = false;
		//	Initialize Speed and Position
		myg_.BulMpS[i] = new Vector3();
	}
}

//= MOVE MY BULLETS ============//==============================================
//	If no enemy target, xac_ = 0

function moveBullet(myg_,air_,gen_,tim_,xac_) {
	let BulSV3 = new Vector3();
	let	BulSpT = myg_.BulSpd * tim_.DLTime;
	myg_.BulSp2 = myg_.BulSp2 - tim_.DLTime;
	if (myg_.BulSp2 < 0) myg_.BulSp2 = 0;
	for (let i = 0; i < myg_.BulNum; i ++) {
		// Start New Bullets
		if (!myg_.BulTim[i] && !myg_.BulSp2 && gen_.MYGFlg) {
			//	Set Initial Position
			myg_.BulPtr[i].position.set(0,0,0);
			//	Set Initial Rotation
			myg_.BulPtr[i].rotation.copy(air_.AirObj.rotation);
			//	Set Initial Speed
			BulSV3 = new Spherical(BulSpT,(90-air_.AirRot.x)*DegRad,Mod360(-air_.AirRot.y)*DegRad);
			BulSV3 = new Vector3().setFromSpherical(BulSV3);
			myg_.BulMpS[i].copy(BulSV3);
			//
			myg_.BulTim[i] = tim_.DLTime;
			myg_.BulSp2 = myg_.BulSpc;
			myg_.BulPtr[i].visible = true;
		}
		//	Continue Bullets
		myg_.BulTim[i] = myg_.BulTim[i] + tim_.DLTime;
		//	End Bullet
		if (myg_.BulTim[i] > myg_.BulDLT) {
			myg_.BulTim[i] = 0;
			myg_.BulPtr[i].visible = false;
		}
		// Continue Bullet
		else {
			//	Speed lost due to Drag (approx)
			myg_.BulMpS[i].multiplyScalar(.995);
			// New Relative Position
			myg_.BulPtr[i].position.x = myg_.BulPtr[i].position.x - myg_.BulMpS[i].x;
			myg_.BulPtr[i].position.y = myg_.BulPtr[i].position.y + myg_.BulMpS[i].y - tim_.GrvDLT; // Bullet drop
			myg_.BulPtr[i].position.z = myg_.BulPtr[i].position.z - myg_.BulMpS[i].z;
		}
	} // end i
	// If Enemy Target, Are We Hitting It?
	if (xac_) testHitBox(myg_,xac_)
}

//= HITBOX =====================//==============================================

function testHitBox(myg_,xac_) {
	let n = myg_.HitTgt;		// Only 1 enemy airplane for now
	if (!xac_.EndSeq[n]) {		// Only if Not Already in Sequence
		// Check All Bullets for Hit
		for (let i = 0; i < myg_.BulNum; i ++) {
			// Hitting Target?
			if (Math.abs(xac_.ObjAdr[n].position.x - myg_.BulPtr[i].position.x) < myg_.HitDst) {
				if (Math.abs(xac_.ObjAdr[n].position.y - myg_.BulPtr[i].position.y) < myg_.HitDst) {
					if (Math.abs(xac_.ObjAdr[n].position.z - myg_.BulPtr[i].position.z) < myg_.HitDst) {
						xac_.HitCnt[n]++;
					}
				}
			}
		}
	}
}


/*******************************************************************************
*
*	OTHER AIRPLANES
*
*******************************************************************************/

// Many objects
// Bullet = 2 Lines: Each Line = 2 Types of Different Colored Lines
// No Smoke
// Gun Object = Airplane

//= INIT XAC BULLETS ===========//==============================================

function initXACBul(xag_,scene) {
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
	let BulMtL = new LineBasicNodeMaterial();
		BulMtL.colorNode = color(xag_.BulClr.x);
		BulMtL.transparent = true;
		BulMtL.opacityNode = xag_.AAAOpa;
		BulMtL.depthWrite = false;
	let BulMtD = new LineBasicNodeMaterial();
		BulMtD.colorNode = color(xag_.BulClr.y);
		BulMtD.transparent = true;
		BulMtD.opacityNode = xag_.AAAOpa;
		BulMtD.depthWrite = false;
	let xp = 2;
	// For Each Gun
	for (let n = 0; n < xag_.ObjNum; n ++) {
		// Load Bullets
		for (let i = 0; i < xag_.BulNum; i ++) {	
			//	Create Bull Meshes - Double Line 2 Colors
			xag_.BulPtr[n][i] = new makMsh();
			//	Left
			line = new Line(BulGeL,BulMtL); // Lite Color
			line.position.z = -lnF;
			line.position.x = -xp;
			xag_.BulPtr[n][i].add(line);
			line = new Line(BulGeD,BulMtD); // Dark Color
			line.position.z = lnB;
			line.position.x = -xp;
			xag_.BulPtr[n][i].add(line);
			//	Rite
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
			//	Initialize Speed and Position
			xag_.BulMpS[n][i] = new Vector3();
			xag_.BulMpP[n][i] = new Vector3();
		} // end i
	} // end n
}

//= MOVE XAC BULLETS ===========//==============================================

function moveXACBul(xag_,air_,gen_,tim_) {
	let BulSV3 = new Vector3();
	let	BulSpT = xag_.BulSpd * tim_.DLTime;
	for (let n = 0; n < xag_.ObjNum; n ++) {
		xag_.BulSp2[n] = xag_.BulSp2[n] - tim_.DLTime;
		if (xag_.BulSp2[n] < 0) xag_.BulSp2[n] = 0;
		for (let i = 0; i < xag_.BulNum; i ++) {
			//	Start New Bullets
			if (!xag_.BulTim[n][i] && !xag_.BulSp2[n] && xag_.BulFlg[n]) {		
				// Set Initial Rotation
				xag_.BulPtr[n][i].rotation.x = xag_.XACRot[n].x*DegRad; // Latitude
				xag_.BulPtr[n][i].rotation.y = xag_.XACRot[n].y*DegRad; // Longitude
				// Initial Map Position
				xag_.BulMpP[n][i].copy(xag_.XACPos[n]); // Use XACPos instead of link
				// Set Initial Speed
				BulSV3 = new Spherical(BulSpT,(90-xag_.XACRot[n].x)*DegRad,Mod360(-xag_.XACRot[n].y)*DegRad);
				BulSV3 = new Vector3().setFromSpherical(BulSV3);
				xag_.BulMpS[n][i].copy(BulSV3);
				//
				xag_.BulTim[n][i] = tim_.DLTime;
				xag_.BulSp2[n] = xag_.BulSpc;
				xag_.BulPtr[n][i].visible = true;
			}
			//	Continue Bullets
			xag_.BulTim[n][i] = xag_.BulTim[n][i] + tim_.DLTime;
			// Stop
			if (xag_.BulTim[n][i] > xag_.BulDLT) {
				xag_.BulTim[n][i] = 0;
				xag_.BulPtr[n][i].visible = false;
			}
			//	Continue Bullet
			else {
				// Speed lost due to Drag (approx)
				xag_.BulMpS[n][i].multiplyScalar(.995);
				// New Map Position
				xag_.BulMpP[n][i].x = xag_.BulMpP[n][i].x + xag_.BulMpS[n][i].x;
				xag_.BulMpP[n][i].y = xag_.BulMpP[n][i].y + xag_.BulMpS[n][i].y - tim_.GrvDLT;
				xag_.BulMpP[n][i].z = xag_.BulMpP[n][i].z + xag_.BulMpS[n][i].z;
				// Relative Position
				xag_.BulPtr[n][i].position.x = xag_.BulMpP[n][i].x - air_.MapPos.x;
				xag_.BulPtr[n][i].position.y = xag_.BulMpP[n][i].y - gen_.AltDif;
				xag_.BulPtr[n][i].position.z = air_.MapPos.z - xag_.BulMpP[n][i].z;
			}
		} // end i
	} // end n
}


/*******************************************************************************
*
*	AA GUNS - FIXED AND SHIP
*
*******************************************************************************/

//= INIT AAA GUN ===============//==============================================

function initAAAGun(aag_,txt_,air_,gen_,scene) {
	if (aag_.ObjNum) {
		aag_.SmkMap = txt_.ObjTxt[aag_.SmkMap];
		initAAGuns(aag_,air_,gen_,scene);
		// Create Exploding Center
		for (let n = 0; n < aag_.ObjNum; n ++) {
			aag_.ExpPtr[n] = makeSphere();
			aag_.SmkPtr[n].add(aag_.ExpPtr[n]);
		}
	}
}

//= MOVE AAA GUN ===============//==============================================

function moveAAAGun(aag_,air_,gen_,tim_) {
	moveAAGuns(aag_,air_,gen_,tim_);
	// Explosion
	for (let n = 0; n < aag_.ObjNum; n ++) {
		if (aag_.SmkFlg[n]) {
			aag_.ExpSiz[n] = 1/200; // Start Size
			aag_.ExpLif[n] = 0.15; // Start Life (seconds)
			aag_.ExpPtr[n].visible = true;
		}
		if (aag_.ExpLif[n] > 0) {
			aag_.ExpPtr[n].scale.setScalar(aag_.ExpSiz[n]);
			aag_.ExpSiz[n] = aag_.ExpSiz[n] + 1/200;
			aag_.ExpLif[n] = aag_.ExpLif[n] - tim_.DLTime;
			if (aag_.ExpLif[n] < 0) {
				aag_.ExpLif[n] = 0;
				aag_.ExpPtr[n].visible = false;
			}
		}
	}	
	// Play Sound (No Delay)
//	for (let n = 0; n < aag_.ObjNum; n ++) {
//		if (gen_.SndFlg && aag_.SmkFlg[n]) aag_.SndPtr[n].play();
//	}
	// Play Sound With Delay
	for (let n = 0; n < aag_.ObjNum; n ++) {
		// Start Delay
		if (aag_.SmkFlg[n]) { // Start Countdown
			let X = aag_.SmkPtr[n].position.x; // SndMsh attached to SmkPtr
			let Z = aag_.SmkPtr[n].position.z;
			let delay = (Math.sqrt(X*X+Z*Z)/343);
			if (delay > (aag_.SmkDMx[n]-1)) delay = (aag_.SmkDMx[n]-1); // Avoid overlap issues
			aag_.SndDTm[n] = delay;	
		}
		// If End of Delay Start Sound
		if (aag_.SndDTm[n]) aag_.SndDTm[n] = aag_.SndDTm[n] - tim_.DLTime;
		if (aag_.SndDTm[n] < 0) {
			aag_.SndDTm[n] = 0;
			if (gen_.SndFlg) aag_.SndPtr[n].play();
		}
	}
}

/*******************************************************************************
*
*	AA GUNS WITH SMOKE
*
*******************************************************************************/
// Many objects
// Tracers = Single Lines - 2 Color (Series)
// Smoke
// Gun Object = Gun at Relative Position to Ship

//= INIT AA GUNS ===============//==============================================

function initAAGuns(aag_,air_,gen_,scene) {
	//- Combined Rotation and Map Position of Parent plus Gun
	let MapRot = new Vector3();
	let MapPos = new Vector3();
	//- Lines
	let scale = 2.5;			// Smoke Scale
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
	let AAAMtL = new LineBasicNodeMaterial();
		AAAMtL.colorNode = color(aag_.AAACol.x);
		AAAMtL.transparent = true;
		AAAMtL.opacityNode = aag_.AAAOpa;
		AAAMtL.depthWrite = false;
	let AAAMtD = new LineBasicNodeMaterial();
		AAAMtD.colorNode = color(aag_.AAACol.y);
		AAAMtD.transparent = true;
		AAAMtD.opacityNode = aag_.AAAOpa;
		AAAMtD.depthWrite = false;
	//- For Each Gun
	for (let n = 0; n < aag_.ObjNum; n ++) {
		// Combined Rotation and Map Position of Parent plus Gun
		MapRot.copy(aag_.XSHRot[n]).add(aag_.GunRot[n]); // Use XSHRot since bullets not linked
		MapPos.copy(aag_.XSHPos[n]).add(aag_.GunPos[n]); // Use XSHPos since bullets not linked
		//	Gun Object Rotation (for show only)
		aag_.GunPtr[n].rotation.x = MapRot.x*DegRad; // Latitude
		aag_.GunPtr[n].rotation.y = MapRot.y*DegRad; // Longitude
		//	Combined Map Position of Parent plus Gun
		MapPos.copy(aag_.XSHPos[n]).add(aag_.GunPos[n]);
		// Compute Gun Relative Position (for show only)
		aag_.GunPtr[n].position.x = MapPos.x-air_.MapPos.x;
		aag_.GunPtr[n].position.y = MapPos.y-gen_.AltDif;
		aag_.GunPtr[n].position.z = air_.MapPos.z-MapPos.z;
		scene.add(aag_.GunPtr[n]);
		//	Load Bullets
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
		//	Smoke Material
		aag_.SmkMat[n] = new SpriteNodeMaterial();
		aag_.SmkMat[n].colorNode = color(0xffffff);
		aag_.SmkMat[n].colorNode = texture(aag_.SmkMap);
		aag_.SmkMat[n].transparent = true;
		aag_.SmkMat[n].opacity = 1.0;
//		aag_.SmkMat[n].depthTest = false;	// Same as volcano
		aag_.SmkMat[n].depthWrite = false;
		//	Smoke Sprite
		aag_.SmkPtr[n] = new Sprite(aag_.SmkMat[n]);
		aag_.SmkPtr[n].scale.set(100,100,100);	
		scene.add(aag_.SmkPtr[n]);
		aag_.SmkPtr[n].visible = false;
	} // end of n
}

//= MOVE AA GUNS ===============//==============================================

function moveAAGuns(aag_,air_,gen_,tim_) {
	//- Combined Rotation and Map Position of Parent plus Gun
	let MapRot = new Vector3();
	let MapPos = new Vector3();
	//
	let AAASV3 = new Vector3();
	let	AAASpT = aag_.AAASpd * tim_.DLTime;
	for (let n = 0; n < aag_.ObjNum; n ++) {
		// Combined Rotation and Map Position of Parent plus Gun
		MapRot.copy(aag_.XSHRot[n]).add(aag_.GunRot[n]); // Use XSHRot since bullets not linked
		MapPos.copy(aag_.XSHPos[n]).add(aag_.GunPos[n]); // Use XSHPos since bullets not linked
		// Update Gun Object Rotation (for show only)
		aag_.GunPtr[n].rotation.x = MapRot.x*DegRad; // Latitude
		aag_.GunPtr[n].rotation.y = MapRot.y*DegRad; // Longitude
		// Compute Gun Relative Position (for show only)
		aag_.GunPtr[n].position.x = MapPos.x-air_.MapPos.x;
		aag_.GunPtr[n].position.y = MapPos.y-gen_.AltDif;
		aag_.GunPtr[n].position.z = air_.MapPos.z-MapPos.z;
		// Smoke Flag Default
		aag_.SmkFlg[n] = 0;
		// For Each Bullet String	
		aag_.AAASp2[n] = aag_.AAASp2[n] - tim_.DLTime; // When reach 0, fire next bullet
		if (aag_.AAASp2[n] < 0) aag_.AAASp2[n] = 0; // Ready to fire next bullet
		for (let i = 0; i < aag_.AAANum; i ++) {
			// Start New Bullets
			if (!aag_.AAATim[n][i] && !aag_.AAASp2[n] && aag_.AAAFlg[n]) {
			// AAATim = time in flight (reset to zero at end); AAASp2 = delay (reset to zero when time passed)
				// Set Initial Rotation
				aag_.AAAPtr[n][i].rotation.x = MapRot.x*DegRad; // Latitude
				aag_.AAAPtr[n][i].rotation.y = MapRot.y*DegRad; // Longitude
				// Initial Map Position
				aag_.AAAMpP[n][i].copy(MapPos);
				// Set Initial Speed
				AAASV3 = new Spherical(AAASpT,(90-MapRot.x)*DegRad,Mod360(-MapRot.y)*DegRad);
				AAASV3 = new Vector3().setFromSpherical(AAASV3);
				aag_.AAAMpS[n][i] = AAASV3;
				//
				aag_.AAATim[n][i] = tim_.DLTime; // First jump
				aag_.AAASp2[n] = aag_.AAASpc; // restart delay
				aag_.AAAPtr[n][i].visible = true;
				// End Smoke When Bullet0 Begins
				if (!i) aag_.SmkPtr[n].visible = false;
			}
			// Continue Bullets
			aag_.AAATim[n][i] = aag_.AAATim[n][i] + tim_.DLTime;
			// Stop
			if (aag_.AAATim[n][i] > aag_.AAADLT) {
				aag_.AAATim[n][i] = 0;
				aag_.AAAPtr[n][i].visible = false;	
				// Start Smoke When Designated Bullet Stops
				if (!aag_.SmkDTm[n]) { // Smoke Delay = 0
					aag_.SmkMpP[n].copy(aag_.AAAMpP[n][i]); // Bullet0 MapPos
					aag_.SmkPtr[n].visible = true;
					aag_.SmkMat[n].opacity = 1.0;
					aag_.SmkRot[n] = Mod360(aag_.SmkRot[n] + 163); // Change appearance
					aag_.SmkDTm[n] = aag_.SmkDMx[n]; // Reset Delay Timer
					aag_.SmkFlg[n] = 1 // Smoke Flag On (Used to Start Sound)
				}
			}
			// Continue
			else {
				// Speed lost due to Drag (approx)
				aag_.AAAMpS[n][i].multiplyScalar(.995);
				// New Map Position
				aag_.AAAMpP[n][i].x = aag_.AAAMpP[n][i].x + aag_.AAAMpS[n][i].x;
				aag_.AAAMpP[n][i].y = aag_.AAAMpP[n][i].y + aag_.AAAMpS[n][i].y - tim_.GrvDLT;
				aag_.AAAMpP[n][i].z = aag_.AAAMpP[n][i].z + aag_.AAAMpS[n][i].z;
				// Relative Position
				aag_.AAAPtr[n][i].position.x = aag_.AAAMpP[n][i].x - air_.MapPos.x;
				aag_.AAAPtr[n][i].position.y = aag_.AAAMpP[n][i].y - gen_.AltDif;
				aag_.AAAPtr[n][i].position.z = air_.MapPos.z - aag_.AAAMpP[n][i].z;
			}
		} // end of i
		// Smoke Relative Position
		if (aag_.SmkPtr[n].visible = true) {
			aag_.SmkPtr[n].position.x = aag_.SmkMpP[n].x - air_.MapPos.x;
			aag_.SmkPtr[n].position.y = aag_.SmkMpP[n].y - gen_.AltDif;
			aag_.SmkPtr[n].position.z = air_.MapPos.z - aag_.SmkMpP[n].z;
			aag_.SmkMat[n].rotation = Mod360((air_.AirRot.z + aag_.SmkRot[n])) * DegRad;
			// Reduce Opacity
			aag_.SmkMat[n].opacity = aag_.SmkMat[n].opacity - aag_.SmkOpR;
			if (aag_.SmkMat[n].opacity < 0) {
				aag_.SmkMat[n].opacity = 0;
			}
		}
		// Smoke Timer
		if (aag_.SmkDTm[n] > 0) aag_.SmkDTm[n] = aag_.SmkDTm[n] - tim_.DLTime;
		if (aag_.SmkDTm[n] < 0) aag_.SmkDTm[n] = 0;
	} // end of n
}

/*******************************************************************************
*
*	GROUND BASED
*
*******************************************************************************/

//= INITIALIZE GROUND SMOKE ====//==============================================

function initGrdSmk(grs_) {
	for (let n = 0; n < grs_.ObjNum; n ++) {
		//- Timer
		let speed = uniform(.001); // r170
		let scaledTime = time.add(125).mul(speed); // r170
		//- Life
		let lifeRange = range(0.1,1);
		let lifeTime = scaledTime.mul(lifeRange).mod(.05); // r170
		let life = lifeTime.div(lifeRange);
		//- Rotation Range
		let rotateRange = range(.1,4);
		let textureNode = texture(grs_.ObjTxt, rotateUV(uv(),scaledTime.mul(rotateRange))); // r170
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);	
		//- Lateral Offset	
		let offsetRange = range(new Vector3(-.5,3,-.5), new Vector3(1,5,1)); // cone shaped
		//- Size Range
		let scaleRange = range(.1,.2);
		//
		let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
		//-	Wake
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		//-	Material
		grs_.SmkMat[n] = new SpriteNodeMaterial();
		grs_.SmkMat[n].colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		grs_.SmkMat[n].opacityNode = opacityNode;
		grs_.SmkMat[n].positionNode = offsetRange.mul(lifeTime);
		grs_.SmkMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		grs_.SmkMat[n].depthWrite = false;
		grs_.SmkMat[n].transparent = true;
		//-	Mesh
		grs_.SmkMsh[n] = new Mesh(new PlaneGeometry(1, 1),grs_.SmkMat[n]);
		grs_.SmkMsh[n].scale.setScalar(grs_.ObjSiz);
		grs_.SmkMsh[n].isInstancedMesh = true;
		grs_.SmkMsh[n].count = 600; // Increases continuity (was 100)
		grs_.SmkMsh[n].renderOrder = 1; // This allows the transparent smoke to work with transparent island
	}
}

//= INITIALIZE GROUND FIRE =====//===============================================

function initGrdFyr(grf_) {
	for (let n = 0; n < grf_.ObjNum; n ++) {
		// create nodes
		let lifeRange = range(.1,1);
		let speed = uniform(.01);
		let scaledTime = time.add(5).mul(speed);
		let lifeTime = scaledTime.mul(lifeRange).mod(1);
		let scaleRange = range(.3,2);
		let rotateRange = range(.1,4);
		let life = lifeTime.div(lifeRange);
		let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
		let textureNode = texture(grf_.ObjTxt, rotateUV(uv(),scaledTime.mul(rotateRange)));
		let opacityNode = textureNode.a.mul(life.oneMinus());
		let smokeColor = mix(color(0x2c1501),color(0x222222),positionLocal.y.mul(3).clamp());
		//-	Smoke
		grf_.SmkMat[n] = new SpriteNodeMaterial();
		grf_.SmkMat[n].colorNode = mix(color(0xf27d0c),smokeColor,life.mul(2.5).min(1)).mul(fakeLightEffect);
		grf_.SmkMat[n].opacityNode = opacityNode;
		grf_.SmkMat[n].positionNode = range(new Vector3(-2,3,-2), new Vector3(2,5,2)).mul(lifeTime);
		grf_.SmkMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		grf_.SmkMat[n].depthWrite = false;
		//
		grf_.SmkMsh[n] = new Mesh(new PlaneGeometry(1,1),grf_.SmkMat[n]);
		grf_.SmkMsh[n].scale.setScalar(grf_.ObjSiz);
		grf_.SmkMsh[n].count = 2000;
		grf_.SmkMsh[n].renderOrder = 1;
		//- Fire
		grf_.FyrMat[n] = new SpriteNodeMaterial();
		grf_.FyrMat[n].colorNode = mix(color(0xb72f17),color(0xb72f17),life);
		grf_.FyrMat[n].positionNode = range(new Vector3(-1,1,-1),new Vector3(1,2,1)).mul(lifeTime);
		grf_.FyrMat[n].scaleNode = grf_.SmkMat[n].scaleNode;
		grf_.FyrMat[n].opacityNode = opacityNode.mul(.5);
		grf_.FyrMat[n].blending = AdditiveBlending;
		grf_.FyrMat[n].transparent = true;
		grf_.FyrMat[n].depthWrite = false;
		//
		grf_.FyrMsh[n] = new Mesh(new PlaneGeometry(1,1),grf_.FyrMat[n]);
		grf_.FyrMsh[n].scale.setScalar(grf_.ObjSiz);
		grf_.FyrMsh[n].count = 1000;
		grf_.FyrMsh[n].renderOrder = 1;
	}
}

/*******************************************************************************
*
*	AIRPLANE BASED
*
*******************************************************************************/

//= INITIALIZE AIRPLANE SMOKE ==================================================

function initAirSmk(xas_) {
	for (let n = 0; n < xas_.ObjNum; n ++) {
		let lifeRange = range(0.1,1);
		let offsetRange = range(new Vector3(0,3,0), new Vector3(0,5,0));
		let speed = uniform(.2);		// r170
		let scaledTime = time.add(5).mul(speed); // r170
		let lifeTime = scaledTime.mul(lifeRange).mod(.05); // r170
		let scaleRange = range(.01,.02);
		let rotateRange = range(.1,4);
		let life = lifeTime.div(lifeRange);
		let fakeLightEffect = positionLocal.x.oneMinus().max(0.2);
		let textureNode = texture(xas_.ObjTxt, rotateUV(uv(),scaledTime.mul(rotateRange))); // r170
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);
		//	Color
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		//	Material
		xas_.SmkMat[n] = new SpriteNodeMaterial();
		xas_.SmkMat[n].colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		xas_.SmkMat[n].opacityNode = opacityNode;
		xas_.SmkMat[n].positionNode = offsetRange.mul(lifeTime);
		xas_.SmkMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		xas_.SmkMat[n].depthWrite = false;
		xas_.SmkMat[n].transparent = true;
		//	Mesh
		xas_.SmkMsh[n] = new Mesh(new PlaneGeometry(1, 1),xas_.SmkMat[n]);
		xas_.SmkMsh[n].scale.setScalar(xas_.ObjSiz);
		xas_.SmkMsh[n].isInstancedMesh = true;
		xas_.SmkMsh[n].count = 100;
		xas_.SmkMsh[n].rotation.x = Math.PI/2;
		xas_.SmkMsh[n].position.z = 10;
	}
}

//= INITIALIZE AIRPLANE FIRE ===================================================

function initAirFyr(xaf_) {
	for (let n = 0; n < xaf_.ObjNum; n ++) {
		let lifeRange = range(0.5,5); // faster
		let speed = uniform(0.2);
		let scaledTime = time.add(10).mul(speed);
		let lifeTime = scaledTime.mul(lifeRange).mod(0.5); // length
		let scaleRange = range(0.3,1); // volume - denser
		let rotateRange = range(0.1,4);
		let life = lifeTime.div(lifeRange);
		//- Materials
		let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
		let textureNode = texture(xaf_.ObjTxt, rotateUV(uv(),scaledTime.mul(rotateRange)));
		let opacityNode = textureNode.a.mul(life.oneMinus());
		let smokeColor = mix(color(0x2c1501),color(0x222222),positionLocal.y.mul(3).clamp());
		//-	Smoke Material
		xaf_.SmkMat[n] = new SpriteNodeMaterial();
		xaf_.SmkMat[n].colorNode = mix(color(0xf27d0c),smokeColor,life.mul(2.5).min(1)).mul(fakeLightEffect);
		xaf_.SmkMat[n].opacityNode = opacityNode;
		xaf_.SmkMat[n].positionNode = range(new Vector3(-.1,3,-.1), new Vector3(0.5,5,0.5)).mul(lifeTime); // narrower
		xaf_.SmkMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		xaf_.SmkMat[n].depthWrite = false;
		//-	Smoke Mesh
		xaf_.SmkMsh[n] = new Mesh(new PlaneGeometry(1,1),xaf_.SmkMat[n]);
		xaf_.SmkMsh[n].scale.setScalar(xaf_.ObjSiz);
		xaf_.SmkMsh[n].count = 250;
		xaf_.SmkMsh[n].rotation.x = Math.PI/2;
		xaf_.SmkMsh[n].position.z = 10;
		//- Fire Material
		xaf_.FyrMat[n] = new SpriteNodeMaterial();
		xaf_.FyrMat[n].colorNode = mix(color(0xb72f17),color(0xb72f17),life);
		xaf_.FyrMat[n].opacityNode = opacityNode.mul(.5);
		xaf_.FyrMat[n].positionNode = range(new Vector3(-0.01,0.25,-0.01),new Vector3(0.01,0.5,0.01)).mul(lifeTime);
		xaf_.FyrMat[n].scaleNode = xaf_.SmkMat[n].scaleNode;
		xaf_.FyrMat[n].depthWrite = false;
		xaf_.FyrMat[n].transparent = true;
		xaf_.FyrMat[n].blending = AdditiveBlending;
		//-	Fire Mesh
		xaf_.FyrMsh[n] = new Mesh(new PlaneGeometry(1,1),xaf_.FyrMat[n]);
		xaf_.FyrMsh[n].scale.setScalar(xaf_.ObjSiz);
		xaf_.FyrMsh[n].count = 50;
		xaf_.FyrMsh[n].renderOrder = 1;
		xaf_.FyrMsh[n].rotation.x = Math.PI/2;
		xaf_.FyrMsh[n].position.z = 10;
	}
}

/*******************************************************************************
*
*	SHIP BASED
*
*******************************************************************************/

//= INIT SHIP WAKE =============//==============================================
function initXSHWak(wak_,txt_) {
	for (let n = 0; n < wak_.ObjNum; n ++) {
		wak_.ObjTxt[n] = txt_.ObjTxt[wak_.ObjTxt[n]];
		//- Timer
		let speed = uniform(.001); // r170 Lower = slower
		let scaledTime = time.add(125).mul(speed); // r170
		//- Life
		let lifeRange = range(0.1,1);
		let lifeTime = scaledTime.mul(lifeRange).mod(.05); // r170
		let life = lifeTime.div(lifeRange);
		//- Rotation Range
		let rotateRange = range(.1,.2);
		let textureNode = texture(wak_.ObjTxt[n], rotateUV(uv(),scaledTime.mul(rotateRange))); // r170
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);	
		//- Lateral Offset	
		let offsetRange = range(new Vector3(0,3,0), new Vector3(0,5,0));
		//- Size Range
		let scaleRange = range(.01,.02);
		//
		let fakeLightEffect = positionLocal.x.oneMinus().max(0.2);
		//	Color
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		//	Material
		wak_.ObjMat[n] = new SpriteNodeMaterial();
		wak_.ObjMat[n].colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		wak_.ObjMat[n].opacityNode = opacityNode;
		wak_.ObjMat[n].positionNode = offsetRange.mul(lifeTime);
		wak_.ObjMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		wak_.ObjMat[n].depthWrite = false;
		wak_.ObjMat[n].transparent = true;
		//	Mesh
		wak_.ObjAdr[n] = new Mesh(new PlaneGeometry(1, 1),wak_.ObjMat[n]);
		wak_.ObjAdr[n].scale.setScalar(wak_.ObjSiz[n]);
		wak_.ObjAdr[n].isInstancedMesh = true;
		wak_.ObjAdr[n].count = 600; // Increases continuity (was 100)
		wak_.ObjAdr[n].rotation.x = Math.PI/2; // Set Flat
		wak_.ObjAdr[n].position.y = -5; // Added
		//	Link
		wak_.ObjRef[n].add(wak_.ObjAdr[n]);
	}
}

//= MOVE SHIP WAKE =============//==============================================
function moveXSHWak() {
	for (let n = 0; n < wak_.ObjNum; n ++) {
		wak_.ObjAdr[n].rotation.x = Math.PI/2-wak_.ObjRef[n].rotation.x; // Remain flat
	}
}

//= INIT SHIP SMOKE ============//==============================================
function initXSHSmk(xss_,txt_) {
	for (let n = 0; n < xss_.ObjNum; n ++) {
		xss_.ObjTxt[n] = txt_.ObjTxt[xss_.ObjTxt[n]];
		//- Timer
		let speed = uniform(.001); // r170 Lower = slower
		let scaledTime = time.add(5).mul(speed); // r170
		//- Life
		let lifeRange = range(0.1,10); // ###
		let lifeTime = scaledTime.mul(lifeRange).mod(.05); // r170
		let life = lifeTime.div(lifeRange);
		//- Rotation Range
		let rotateRange = range(1,2); // ###
		let textureNode = texture(xss_.ObjTxt[n], rotateUV(uv(),scaledTime.mul(rotateRange))); // r170
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);	
		//- Lateral Offset	
		let offsetRange = range(new Vector3(-.5,1,2), new Vector3(1,3,6)); // ###
		//- Size Range
		let scaleRange = range(.1,.2);
		//
		let fakeLightEffect = positionLocal.x.oneMinus().max(0.2);
		//	Color
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		//	Material
		xss_.ObjMat[n] = new SpriteNodeMaterial();
		xss_.ObjMat[n].colorNode = mix(color("black"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
		xss_.ObjMat[n].opacityNode = opacityNode;
		xss_.ObjMat[n].positionNode = offsetRange.mul(lifeTime);
		xss_.ObjMat[n].scaleNode = scaleRange.mul(lifeTime.max(0.3));
		xss_.ObjMat[n].depthWrite = false;
		xss_.ObjMat[n].transparent = true;
		//	Mesh
		xss_.ObjAdr[n] = new Mesh(new PlaneGeometry(1, 1),xss_.ObjMat[n]);
		xss_.ObjAdr[n].scale.setScalar(xss_.ObjSiz[n]);
		xss_.ObjAdr[n].isInstancedMesh = true;
		xss_.ObjAdr[n].count = 300; // Increases continuity (was 100)
		xss_.ObjAdr[n].position.copy(xss_.ObjPos[n]);
		//	Link
		xss_.ObjRef[n].add(xss_.ObjAdr[n]);
	}
}

/*******************************************************************************
*
*	SUBROUTINES
*
*******************************************************************************/

//- Converts degrees to 360 ----//----------------------------------------------
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

//- Sphere ---------------------//---------------------------------------------
//	Used to create flash explosions
function makeSphere() {
	let geometry = new SphereGeometry(1,32,16);
	let	material = new MeshBasicNodeMaterial({colorNode:color("crimson"),transparent:true,opacity:1});
	let mesh = new Mesh(geometry,material);
	mesh.visible = false;
return mesh;}

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {initFad2Blk,moveFad2Blk,
		initBullet,moveBullet,
		initXACBul,moveXACBul,
		initAAAGun,moveAAAGun,
		initGrdSmk,initGrdFyr,
		initAirSmk,initAirFyr,
		initXSHWak,moveXSHWak,
		initXSHSmk,	
		};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/
/*
250125:	In Development
*/
