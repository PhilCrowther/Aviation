/*******************************************************************************
*
*	EFFECTS MODULE
*
********************************************************************************

Copyright 2017-26, Phil Crowther <phil@philcrowther.com>
Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
Version dated 21 Aug 2026

@fileoverview
Subroutines to create an air combat simulation
See http://philcrowther.com/Aviation for more details.

NOTES:
Bul refers to aircraft bullets with double lines
AAA refers to anti-aircraft bullets with singles lines
Use lines and 2 colors so bullets appear against both light sky and dark ground

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
	AnimationClip,
	AnimationMixer,
	BackSide,
	BufferGeometry,
	Euler,
	Group,
	Line,
	LineBasicNodeMaterial,
	Line2NodeMaterial,
	MeshBasicNodeMaterial,
	Mesh,
	Object3D,
	PlaneGeometry,
	PositionalAudio,
	SphereGeometry,
	Spherical,
	Sprite,
	SpriteNodeMaterial,
	Vector3,	
} from 'three';

import {Line2} from "three/addons/lines/webgpu/Line2.js";
import {LineGeometry} from "three/addons/lines/LineGeometry.js";
import {color,mix,positionLocal,range,rotateUV,texture,time,uniform,uv,} from 'three/tsl';

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= CONSTANTS ==================//==============================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians
const GrvMPS = 9.8;				// Gravity Acceleration m/s2
const Ft2Mtr = 0.3048;			// Convert Feet to Meters (exact)
const animfps = 24;

//= VARIABLES ==================//==============================================

//. Shared Textures ............//..............................................
let txt_ = {
		ObjNum: 3,
		ObjSrc: ["https://PhilCrowther.github.io/Aviation/textures/fx/smoke1.png",	// White Smoke
				 "https://PhilCrowther.github.io/Aviation/textures/fx/smoke2.png",	// Gray Smoke
				 "https://PhilCrowther.github.io/Aviation/textures/fx/aaa.png"],	// Black Smoke
		ObjTxt: [],
	};

let SmkWyte = 0;
let SmkGray = 1;
let SmkBlak = 2;

//. Shared Sounds ..............//..............................................
let snd_ = {
		ObjNum: 3,
		ObjSrc: ["https://PhilCrowther.github.io/Aviation/sounds/fx/gun.mp3",	// Gunfire
				 "https://PhilCrowther.github.io/Aviation/sounds/fx/aaa.mp3",	// AAA explosion
				 "https://PhilCrowther.github.io/Aviation/sounds/fx/exp.mp3"],	// Bomb explosion
		ObjSnd: [],
	};

//- Airplane Smoke Trail .......//..............................................
let xas_ = {
		// Shared Values
		ObjNum: 1,				// Number of Smoke Trails
		ObjTxt: 0,				// Shared Texture Reference Number
		ObjSiz: 800,			// Scale
		// Smoke
		SmkMat: [0],			// Material
		SmkMsh: [0],			// Emitter Address
	};

//- Airplane Flame Trail .......//..............................................
let xaf_ = {
		ObjNum: 1,				// Number of Smoke Trails
		// Shared Values
		ObjTxt: 0,				// Texture
		ObjSiz: 10,				// Scale
		// Smoke
		SmkMat: [0],			// Material
		SmkMsh: [0],			// Mesh
		// Fire
		FyrMat: [0],			// Material
		FyrMsh: [0],			// Mesh
	};

/*******************************************************************************
*
*	LOAD EFFECTS FILES
*
*******************************************************************************/

function loadFXfile(gen_) {
	//	Textures
	if (txt_.ObjNum) {
		for (let n = 0; n < txt_.ObjNum; n++) {
			txt_.ObjTxt[n] = gen_.txtrLd.load(txt_.ObjSrc[n]);	
		}
	}
	//	Sounds
	if (snd_.ObjNum) {
		for (let n = 0; n < snd_.ObjNum; n++) {	
			gen_.audoLd.load(snd_.ObjSrc[n], function(buffer) {
				snd_.ObjSnd[n] = buffer;
			});
		}
	}
};

/*******************************************************************************
*
*	FADE 2 BLACK
*
*******************************************************************************/
//	Use this to fade to/from black or other color
//	In flight, this can emulate black-out, gray-out or red-out	

//=	INIT FADE2BLK ==============//==============================================
function initFad2Blk(f2b_,gen_) {
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
	gen_.camera.add(f2b_.Msh);
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

function initBullet(myg_,gen_) {
	// Line	
	let line = 0
	let BltGeo = new LineGeometry();
	BltGeo.setPositions([0,0,-myg_.BulLen/2, 0,0,myg_.BulLen/2]);
	let BulMtL = new Line2NodeMaterial({color: myg_.BulClr.x,linewidth: myg_.BulWid});
	let BulMtD = new Line2NodeMaterial({color: myg_.BulClr.y,linewidth: myg_.BulWid});
	let ClrFlg = 0;
	for (let i = 0; i < myg_.BulNum; i ++) {
		//	Create Bullet Meshes 
		myg_.BulPtr[i] = new Object3D();
		for (let j = 0; j < myg_.ObjNum; j ++) { // For Each Barrel
			if (!ClrFlg) line = new Line2(BltGeo,BulMtL);
			if ( ClrFlg) line = new Line2(BltGeo,BulMtD);
			line.position.copy(myg_.ObjPos[j]);
			myg_.BulPtr[i].add(line);
		}
		ClrFlg = 1 - ClrFlg;		
		gen_.scene.add(myg_.BulPtr[i]);
		myg_.BulPtr[i].visible = false;
		myg_.BulMpS[i] = new Vector3(); // Initialize Speed and Position
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
			myg_.BulPtr[i].rotation.x = myg_.BulPtr[i].rotation.x + air_.ACPAdj*DegRad
			//	Set Initial Speed
			BulSV3 = new Spherical(BulSpT,(90-air_.AirRot.x-air_.ACPAdj)*DegRad,Mod360(-air_.AirRot.y)*DegRad);
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
			myg_.BulPtr[i].position.set(0,0,0); // Reset Position
			myg_.BulMpS[i].set(0,0,0); // Reset Speed
		}
		// Continue Bullet
		else {
			//	Speed lost due to Drag (approx)
			myg_.BulMpS[i].multiplyScalar(.995);
			// New Relative Position
			myg_.BulPtr[i].position.x = myg_.BulPtr[i].position.x - myg_.BulMpS[i].x;
			myg_.BulPtr[i].position.y = myg_.BulPtr[i].position.y + myg_.BulMpS[i].y - tim_.GrvDLT; // Bullet drop
			myg_.BulPtr[i].position.z = myg_.BulPtr[i].position.z - myg_.BulMpS[i].z;
			if (myg_.HitTgt && (myg_.BulMpS[i].x || myg_.BulMpS[i].z)) testHitBox(i,myg_,xac_); // If Enemy Target and Bullet Moving, Are We Hitting It?
		}
	}
}

//= HITBOX =====================//==============================================

function testHitBox(i,myg_,xac_) {
	let n = myg_.HitTgt-1;		// Convert to Object Number
	if (!xac_.EndSeq[n]) {		// Only Object if Not Already in End Sequence
		// Check All Bullets for Hit
//		for (let i = 0; i < myg_.BulNum; i ++) {
			// Hitting Target?
			if (Math.abs(xac_.AirObj[n].position.x - myg_.BulPtr[i].position.x) < myg_.HitDst) {
				if (Math.abs(xac_.AirObj[n].position.y - myg_.BulPtr[i].position.y) < myg_.HitDst) {
					if (Math.abs(xac_.AirObj[n].position.z - myg_.BulPtr[i].position.z) < myg_.HitDst) {
						xac_.HitCnt[n]++;
					}
				}
			}
//		}
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

function initXACBul(xag_,gen_) {
	let line = 0
	//- Front Line
	let lnF = 6;	
	let BulGeL = new LineGeometry();
	BulGeL.setPositions([0,0,-lnF, 0,0,lnF]);	
	//- Back Line
	let lnB = 6;
	let BulGeD = new LineGeometry();
	BulGeD.setPositions([0,0,-lnB, 0,0,lnB]);	
	let BulMtL = new Line2NodeMaterial({color: xag_.BulClr.x,linewidth: 2});
	let BulMtD = new Line2NodeMaterial({color: xag_.BulClr.y,linewidth: 2});
	let xp = 0.1;
	// For Each Gun
	for (let n = 0; n < xag_.ObjNum; n ++) {
		// Load Bullets
		for (let i = 0; i < xag_.BulNum; i ++) {	
			//	Create Bull Meshes - Double Line 2 Colors
			xag_.BulPtr[n][i] = new Object3D();
			//	Left
			line = new Line2(BulGeL,BulMtL); // Lite Color
			line.position.z = -lnF;
			line.position.x = -xp;
			xag_.BulPtr[n][i].add(line);
			line = new Line2(BulGeD,BulMtD); // Dark Color
			line.position.z = lnB;
			line.position.x = -xp;
			xag_.BulPtr[n][i].add(line);
			//	Rite
			line = new Line2(BulGeL,BulMtL); // Lite Color
			line.position.z = -lnF;
			line.position.x = xp;
			xag_.BulPtr[n][i].add(line);
			line = new Line2(BulGeD,BulMtD); // Dark Color
			line.position.z = lnB;
			line.position.x = xp;
			xag_.BulPtr[n][i].add(line);
			xag_.BulPtr[n][i].rotation.order = "YXZ";
		//
			gen_.scene.add(xag_.BulPtr[n][i]);
			xag_.BulPtr[n][i].visible = false;
			//	Initialize Speed and Position
			xag_.BulMpS[n][i] = new Vector3();
			xag_.BulMpP[n][i] = new Vector3();
		} // end i
		// Load Sounds
		let RefDst = 25;		// Reference distance for Positional Audio
		xag_.SndPtr[n] = new PositionalAudio(gen_.listnr);
		gen_.audoLd.load(xag_.SndSrc[n],function(buffer) {
			xag_.SndPtr[n].setBuffer(buffer);
			init1Sound(xag_.SndPtr[n],RefDst,xag_.SndVol[n],1.3,1,xag_.SndMsh[n]);
			xac_.AirObj[n].add(xag_.SndMsh[n]);
		});
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
				xag_.BulPtr[n][i].rotation.y = -xag_.XACRot[n].y*DegRad; // Longitude
				// Initial Map Position
				xag_.BulMpP[n][i].copy(xag_.XACPos[n]); // Use XACPos instead of link
				// Set Initial Speed
				BulSV3 = new Spherical(BulSpT,(90-xag_.XACRot[n].x)*DegRad,Mod360(xag_.XACRot[n].y)*DegRad); //### fixed 260603
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
				xag_.BulPtr[n][i].position.y = xag_.BulMpP[n][i].y - air_.MapPos.y; // No altitude adjustment
				xag_.BulPtr[n][i].position.z = air_.MapPos.z - xag_.BulMpP[n][i].z;
			}
		} // end i
	} // end n
}

/*******************************************************************************
*
*	XAC END SEQUENCE
*
*******************************************************************************/

//= INIT ENDING SEQUENCE =======//==============================================

function initEndSeq() {
	initXACFyr();
}

//- Init Smoke and Fire --------//----------------------------------------------
function initXACFyr() {
	xaf_.ObjTxt = txt_.ObjTxt[SmkBlak]; // Assign Texture
	initAirFyr(xaf_);			// Create Emitter
	xaf_.SmkMsh[0].visible = false; // Turn Off Smoke
	xaf_.FyrMsh[0].visible = false; // Turn Off Fire
}

//= MOVE ENDING SEQUENCE =======//==============================================

let xat_ = {
		SeqIdx: 0,				// Sequence Index
		TimRem:	0,				// If Greater Than 0, Continue Sequence
	}

function moveEndSeq(n,xac_,myg_,tim_) {
	//- START SEQUENCE ---------------------------------------------------------
	if (!xat_.TimRem) {			// Start New Actions (if TimRem = 0)
		xat_.SeqIdx = 1;		// Advance to Next Sequence
		// Sequewnce #1 (Only Sequence)
		if (xat_.SeqIdx) {
			begnXACFyr(n,xac_); // Start Smoke and Fire
			xat_.TimRem = 1;	// New Countdown
		}
	}
	//- CONTINUE SEQUENCE ------------------------------------------------------
	else {						// Continuing Actions (if Still Counting Down)
		// Sequence #1 (Only Sequence)
		if (xat_.SeqIdx) {		// Only 1 Sequence
			makeXACSpn(n,xac_);
			// Until Hit Ground
			if (xac_.MapPos[n].y < 0) {
				// Set xac_ Final Values
				xac_.MapPos[n].y = 0;	// On Ground
				xac_.HitGrd[n] = 1;		// Set Flag to Stop Further Movement
				xac_.EndSeq[n] = 0;		// Flag Reset
				// Stop Fire
				stopXACFyr();			// End Fire (later make it vertical and slowly shrink)
				// Reset xat_ Values
				xat_.SeqIdx = 0;		// Reset Sequence Index for Next Airplane
				xat_.TimRem = 0;		// New Countdown
			}
		}
	}
}

//-	Begin Smoke and Fire -------//----------------------------------------------
function begnXACFyr(n,xac_) {
	// Smoke
	xac_.AirObj[n].add(xaf_.SmkMsh[0]); // Attach to Airplane
	xaf_.SmkMsh[0].visible = true;		// Make Visible
	// Fire
	xac_.AirObj[n].add(xaf_.FyrMsh[0]);	// Attach to Airplane
	xaf_.FyrMsh[0].visible = true;		// Make Visible
}

//-	End Smoke and Fire ---------//----------------------------------------------
function stopXACFyr() {
	xaf_.SmkMsh[0].visible = false; // Make Invisible
	xaf_.FyrMsh[0].visible = false;
}

//-	Make Airplane Spin ---------//----------------------------------------------
function makeXACSpn(n,xac_) {
	xac_.AirRot[n].z = Mod360(xac_.AirRot[n].z - 1); // Roll Right
	if (xac_.AirRot[n].x > -90) {
		xac_.AirRot[n].x = xac_.AirRot[n].x - 0.1; // Pitch Down
		if (xac_.AirRot[n].x < -90) xac_.AirRot[n].x = -90;
	}
}

/*******************************************************************************
*
*	AA GUNS
*
*******************************************************************************/

//= LOAD AA GUNS ===============//==============================================

function loadAAAGun(aaf_,gen_) {
	for (let n = 0; n < aaf_.ObjNum; n ++) {
		gen_.gltfLd.load(aaf_.GunSrc, function (gltf) { // The OnLoad function
			aaf_.GunPtr[n] = gltf.scene;
			aaf_.GunPtr[n].rotation.order = "YXZ";
			//-	Loasd Animations -----------------------------------------------
			// Rotator
			let clip = AnimationClip.findByName(gltf.animations,"rotatorAction");
			aaf_.ActLon[n] = new AnimationMixer(gltf.scene);
			let actun = aaf_.ActLon[n].clipAction(clip);
			actun.play();
			if (aaf_.ActLon[n]) aaf_.ActLon[n].setTime(aaf_.AnmLon[n]/anmfps);
			//	Barrel
			clip = AnimationClip.findByName(gltf.animations,"barrelAction");
			aaf_.ActLat[n] = new AnimationMixer(gltf.scene);
			actun = aaf_.ActLat[n].clipAction(clip);
			actun.play();
			if (aaf_.ActLat[n]) aaf_.ActLat[n].setTime(aaf_.AnmLat[n]/anmfps);
			//- Initialize -----------------------------------------------------
			aaf_.GunPtr[n].position.y = -1000; // Temporary Position (aaf value not initialized yet)
			gen_.scene.add(aaf_.GunPtr[n]);
		});	
	}
}

//= INIT AAA GUN ===============//==============================================

function initAAAGun(aaf_,air_,gen_) {
	//- COMMON VARIABLES -------------------------------------------------------
	let MapRot = new Vector3();
	let MapPos = new Vector3();
	// Initial Flash Geo and Mat
	let FrLGeo = new LineGeometry();
	FrLGeo.setPositions([0,0,5, 0,0,15]);
	let FrLMat = new Line2NodeMaterial({color:"crimson",linewidth:2});
	//. Lines ..................................................................
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
	//	AAAMtL
	let AAAMtL = new LineBasicNodeMaterial();
		AAAMtL.colorNode = color(aaf_.AAACol.x);
		AAAMtL.transparent = true;
		AAAMtL.opacityNode = aaf_.AAAOpa.x;
		AAAMtL.depthWrite = false;
	//	AAAMtD
	let AAAMtD = new LineBasicNodeMaterial();
		AAAMtD.colorNode = color(aaf_.AAACol.y);
		AAAMtD.transparent = true;
		AAAMtD.opacityNode = aaf_.AAAOpa.y;
		AAAMtD.depthWrite = false;
	//- EACH GUN ---------------------------------------------------------------
	for (let n = 0; n < aaf_.ObjNum; n ++) {
		//.	Standard Values ....................................................
		aaf_.AAAFlg[n] = 1;		// Gun Firing
		aaf_.AAASp2[n] = 1;		// Bullet Spacing - time remaining
		aaf_.SmkFlg[n] = 0;
		aaf_.SmkMpP[n] = new Vector3();
		//	Sound - GunFire
		aaf_.FirFlg[n] = 0;		// 1 = Sound Ready
		aaf_.FirDTm[n] = 0;
		//	Sound - Explosion
		aaf_.SndFlg[n] = 1;		// 1 = Sound Active
		aaf_.SndDTm[n] = 0;
		//.	Map Position and Rotation of Gun plus Parent .......................
		MapPos.copy(aaf_.GunPos[n]);
		MapRot.copy(aaf_.GunRot[n]);
		if (aaf_.ParPos) {		// Add Parent since bullets not linked
			MapPos.add(aaf_.ParPos);
			MapRot.add(aaf_.ParRot);
		}
		//. Gun Object .........................................................
		aaf_.GunPtr[n].position.x = MapPos.x-air_.MapPos.x;
		aaf_.GunPtr[n].position.y = (MapPos.y+aaf_.GunAdj)-gen_.AltDif;
		aaf_.GunPtr[n].position.z = air_.MapPos.z-MapPos.z;
		//.	Animations .........................................................
		aaf_.AnmLon[n] = aaf_.GunRot[n].y;
		aaf_.AnmLat[n] = aaf_.GunRot[n].x;
		if (aaf_.ActLon[n]) aaf_.ActLon[n].setTime(aaf_.AnmLon[n]/anmfps);
		if (aaf_.ActLat[n]) aaf_.ActLat[n].setTime(aaf_.AnmLat[n]/anmfps);
		//.	Load Bullets .......................................................
		for (let i = 0; i < aaf_.AAANum; i ++) {
			// Create AAA Meshes - 1 Double Line
			aaf_.AAAPtr[n][i] = new Object3D();
			line = new Line(AAAGeL,AAAMtL); // Lite Color
			line.position.z = -lnF;
			aaf_.AAAPtr[n][i].add(line);
			line = new Line(AAAGeD,AAAMtD); // Dark Color
			line.position.z = lnB;
			aaf_.AAAPtr[n][i].add(line);
			aaf_.AAAPtr[n][i].scale.set(scale,scale,scale);
			aaf_.AAAPtr[n][i].rotation.order = "YXZ";
			// 
			gen_.scene.add(aaf_.AAAPtr[n][i]);
			aaf_.AAAPtr[n][i].visible = false;
			// Initialize Values
			aaf_.AAAMpS[n][i] = new Vector3();
			aaf_.AAAMpP[n][i] = new Vector3();
		}
		//. Create Gunfire Graphics ............................................
		//	Gunfire Flash
		aaf_.FrLPtr[n] = new Line2(FrLGeo,FrLMat);
		aaf_.FrLPtr[n].rotation.order = "YXZ";
		aaf_.FrLPtr[n].position.set(0,2.75,0);
		aaf_.GunPtr[n].add(aaf_.FrLPtr[n]);
		aaf_.FrLPtr[n].visible = false;
		//	Gunfire Smoke Material
		//	(need separate material becuase vary opacity)
		aaf_.GfSMap = txt_.ObjTxt[SmkBlak];
		aaf_.GfSMat[n] = new SpriteNodeMaterial();
		aaf_.GfSMat[n].colorNode = color(0xffffff);
		aaf_.GfSMat[n].colorNode = texture(aaf_.GfSMap);
		aaf_.GfSOpa[n] = 0;
		aaf_.GfSMat[n].transparent = true;
		aaf_.GfSMat[n].opacity = 0; // prevent black square from appearing in front of aircraft [260504]
		aaf_.GfSMat[n].depthWrite = false;
		//	Gunfire Smoke Sprite
		aaf_.GfSPtr[n] = new Sprite(aaf_.GfSMat[n]);
		aaf_.GfSPtr[n].position.set(0,2.75,0);
		aaf_.GfSPtr[n].scale.set(15,15,15);
		aaf_.GunPtr[n].add(aaf_.GfSPtr[n]);
		aaf_.GfSPtr[n].visible = false;
		//. Create Explosion Graphics ..........................................
		//	Explosion Flash
		aaf_.ExpPtr[n] = makeSphere("crimson");
		aaf_.ExpGrp[n].add(aaf_.ExpPtr[n]);
		//	Explosion Smoke Material
		//	(need separate material becuase vary opacity)
		aaf_.SmkMap = txt_.ObjTxt[SmkBlak];
		aaf_.SmkMat[n] = new SpriteNodeMaterial();
		aaf_.SmkMat[n].colorNode = color(0xffffff);
		aaf_.SmkMat[n].colorNode = texture(aaf_.SmkMap);
		aaf_.SmkMat[n].transparent = true;
		aaf_.SmkMat[n].opacity = 0;	// prevent black square from appearing in front of aircraft [260504]
		aaf_.SmkMat[n].depthWrite = false;
		//	Explosion Smoke Sprite
		aaf_.SmkPtr[n] = new Sprite(aaf_.SmkMat[n]);
		aaf_.SmkPtr[n].scale.set(100,100,100);	
		aaf_.ExpGrp[n].add(aaf_.SmkPtr[n]);
		aaf_.SmkPtr[n].visible = false;		// hide it
		//.	Create Sounds ......................................................
		//	Gunfire Sound
		aaf_.FirPtr[n] = new PositionalAudio(gen_.listnr);
		aaf_.FirPtr[n].setBuffer(snd_.ObjSnd[0]);	// Gunfire Sound
		init1Sound(aaf_.FirPtr[n],aaf_.FirDst,aaf_.FirVol,1,0,aaf_.GunPtr[n]);
		//	Explosion Sound
		aaf_.SndPtr[n] = new PositionalAudio(gen_.listnr);
		aaf_.SndPtr[n].setBuffer(snd_.ObjSnd[1]);	// AAA Explosion Sound
		init1Sound(aaf_.SndPtr[n],aaf_.SndDst,aaf_.SndVol,1,0,aaf_.ExpGrp[n]);
	} // end of n
}

//= MOVE AAA GUN ===============//==============================================

function moveAAAGun(aaf_,air_,gen_,tim_) {
	//- COMMON VARIABLES -------------------------------------------------------
	let MapPos = new Vector3();
	let MapRot = new Vector3();
	let AAASV3 = new Vector3();	// Initial Speed
	let	AAASpT = aaf_.AAASpd * tim_.DLTime;
	//- EACH GUN ---------------------------------------------------------------
	for (let n = 0; n < aaf_.ObjNum; n ++) {
		//. Map Position and Rotation of Gun plus Parent .......................
		MapPos.copy(aaf_.GunPos[n]);
		MapRot.copy(aaf_.GunRot[n]);
		if (aaf_.ParPos) {		// Add Parent since bullets not linked
			MapPos.add(aaf_.ParPos);
			MapRot.add(aaf_.ParRot);
		}
		MapRot.y = Mod360(-MapRot.y);
		//- Gun Object ---------------------------------------------------------
		aaf_.GunPtr[n].position.x = MapPos.x-air_.MapPos.x;
		aaf_.GunPtr[n].position.y = (MapPos.y+aaf_.GunAdj)-gen_.AltDif;
		aaf_.GunPtr[n].position.z = air_.MapPos.z-MapPos.z;
		//.	Animations .........................................................
		aaf_.AnmLon[n] = aaf_.GunRot[n].y;
		aaf_.AnmLat[n] = aaf_.GunRot[n].x;
		if (aaf_.ActLon[n]) aaf_.ActLon[n].setTime(aaf_.AnmLon[n]/anmfps);
		if (aaf_.ActLat[n]) aaf_.ActLat[n].setTime(aaf_.AnmLat[n]/anmfps);
		//. Targeting ..........................................................
		if (aaf_.GunTar) {
			let DifX,DifY,DifZ,DifH,LonL;
			let Trgt = new Vector3().copy(aaf_.GunTar);
			// Targeting - Adjust Gun Longitude		
			DifX = Trgt.x - aaf_.GunPos[n].x;
			DifY = Trgt.y - aaf_.GunPos[n].y;
			DifZ = Trgt.z - aaf_.GunPos[n].z;
			DifH = Math.sqrt(DifX**2+DifZ**2);
			// Longitude (add lead based on past rotation)
			aaf_.GunRot[n].y = Mod360(Math.atan2(DifX,DifZ)*RadDeg);
			LonL = (5/tim_.DLTime)*(aaf_.GunRot[n].y - aaf_.GunOld[n]); // Lead X factor for flight time
			aaf_.GunOld[n] = aaf_.GunRot[n].y; // Save Old
			aaf_.GunRot[n].y = Mod360(aaf_.GunRot[n].y + LonL);
			// Latitude
			aaf_.GunRot[n].x = Mod360(Math.atan2(DifY,DifH)*RadDeg);
			if 	(aaf_.GunRot[n].x < 10 || aaf_.GunRot[n].x > 90) aaf_.GunRot[n].x = 10;
		}
		//- Bullets ------------------------------------------------------------		
		aaf_.SmkFlg[n] = 0;		// Smoke Flag Default
		aaf_.AAASp2[n] = aaf_.AAASp2[n] - tim_.DLTime; // When reach 0, fire next bullet
		if (aaf_.AAASp2[n] < 0) aaf_.AAASp2[n] = 0; // Ready to fire next bullet
		for (let i = 0; i < aaf_.AAANum; i ++) {
			// Start New Bullets
			if (!aaf_.AAATim[n][i] && !aaf_.AAASp2[n] && aaf_.AAAFlg[n]) {
			// AAATim = time in flight (reset to zero at end); AAASp2 = delay (reset to zero when time passed)
				// Set Initial Rotation
				aaf_.AAAPtr[n][i].rotation.x = MapRot.x*DegRad; // Latitude
				aaf_.AAAPtr[n][i].rotation.y = MapRot.y*DegRad; // Longitude
				// Initial Map Position
				aaf_.AAAMpP[n][i].copy(MapPos);
				// Set Initial Speed
				AAASV3 = new Spherical(AAASpT,(90-MapRot.x)*DegRad,Mod360(-MapRot.y)*DegRad);
				AAASV3 = new Vector3().setFromSpherical(AAASV3);
				aaf_.AAAMpS[n][i] = AAASV3;
				//
				aaf_.AAATim[n][i] = tim_.DLTime; // First jump
				aaf_.AAASp2[n] = aaf_.AAASpc; // restart delay
				aaf_.AAAPtr[n][i].visible = true;
				// End Smoke When Bullet0 Begins
				if (!i) {
					aaf_.SmkPtr[n].visible = false;
					aaf_.FirFlg[n] = 1; 	// 1 = Sound Ready
				// Start Gun Flash
				aaf_.FrLPtr[n].rotation.x = -aaf_.AnmLat[n]*DegRad;
				aaf_.FrLPtr[n].rotation.y = -(aaf_.AnmLon[n]+180)*DegRad;
				aaf_.FrLPtr[n].visible = true;
				aaf_.FrLTim[n] = 0.1;
				// Start Gunsmoke
				aaf_.GfSPtr[n].visible = true;
				aaf_.GfSOpa[n] = 1.0;
				}
			}
			// Continue Bullets
			aaf_.AAATim[n][i] = aaf_.AAATim[n][i] + tim_.DLTime;
			// Stop
			if (
				(aaf_.AAADLT < 10 && aaf_.AAATim[n][i] > aaf_.AAADLT) ||	// Time Limit (1 to 9 secs)
				(aaf_.AAADLT > 10 && aaf_.AAAMpP[n][i].y > aaf_.AAADLT)		// Altitude Limit (> 10  meters)
			){
				aaf_.AAATim[n][i] = 0;
				aaf_.AAAPtr[n][i].visible = false;	
				// Start Smoke When Designated Bullet Stops
				if (!aaf_.SmkDTm[n] && aaf_.AAAFlg[n]) { // Smoke Delay = 0 and still firing
					aaf_.SmkMpP[n].copy(aaf_.AAAMpP[n][i]); // Bullet0 MapPos
					aaf_.SmkPtr[n].visible = true;
					aaf_.SmkMat[n].opacity = 1.0;
					aaf_.SmkRot[n] = Mod360(aaf_.SmkRot[n] + 163); // Change appearance
					aaf_.SmkDTm[n] = aaf_.SmkDMx[n]; // Reset Delay Timer
					aaf_.SmkFlg[n] = 1 // Smoke Flag On (Used to Start Sound) - reset to zero on next rep
				}
			}
			// Continue
			else {
				// Speed lost due to Drag (approx)
				aaf_.AAAMpS[n][i].multiplyScalar(.995);
				// New Map Position
				aaf_.AAAMpP[n][i].x = aaf_.AAAMpP[n][i].x + aaf_.AAAMpS[n][i].x;
				aaf_.AAAMpP[n][i].y = aaf_.AAAMpP[n][i].y + aaf_.AAAMpS[n][i].y - tim_.GrvDLT;
				aaf_.AAAMpP[n][i].z = aaf_.AAAMpP[n][i].z + aaf_.AAAMpS[n][i].z;
				// Relative Position
				aaf_.AAAPtr[n][i].position.x = aaf_.AAAMpP[n][i].x - air_.MapPos.x;
				aaf_.AAAPtr[n][i].position.y = aaf_.AAAMpP[n][i].y - air_.MapPos.y;
				aaf_.AAAPtr[n][i].position.z = air_.MapPos.z - aaf_.AAAMpP[n][i].z;
			}
			//	Gun Flash Delay
			if (aaf_.FrLPtr[n].visible = true) {
				aaf_.FrLTim[n] = aaf_.FrLTim[n] - tim_.DLTime;
				if (aaf_.FrLTim[n] < 0) aaf_.FrLPtr[n].visible = false;
			}
			// Smoke Delay
			if (aaf_.GfSOpa[n]) {
				aaf_.GfSMat[n].opacity = aaf_.GfSOpa[n];
				aaf_.GfSOpa[n] = aaf_.GfSOpa[n] - aaf_.GfSOpR;
				if (aaf_.GfSOpa[n] < 0) {
					aaf_.GfSOpa[n] = 0;
					aaf_.GfSMat[n].opacity = 0;
					aaf_.GfSPtr[n].visible = false;				
				}
			}
		} // end of i (Bulllets)
		//-	Smoke --------------------------------------------------------------
		// Smoke Relative Position
		if (aaf_.SmkPtr[n].visible = true) {
			aaf_.ExpGrp[n].position.x = aaf_.SmkMpP[n].x - air_.MapPos.x;
			aaf_.ExpGrp[n].position.y = aaf_.SmkMpP[n].y - air_.MapPos.y;
			aaf_.ExpGrp[n].position.z = air_.MapPos.z - aaf_.SmkMpP[n].z;
			aaf_.SmkMat[n].rotation = Mod360((air_.AirRot.z + aaf_.SmkRot[n])) * DegRad;
			// Reduce Opacity
			aaf_.SmkMat[n].opacity = aaf_.SmkMat[n].opacity - aaf_.SmkOpR;
			if (aaf_.SmkMat[n].opacity < 0) {
				aaf_.SmkMat[n].opacity = 0;
			}
		}
		// Smoke Timer (This Timer Allows Explosions - Generally Only After Several Bullets Have Passed)
		if (aaf_.SmkDTm[n] > 0) aaf_.SmkDTm[n] = aaf_.SmkDTm[n] - tim_.DLTime;
		if (aaf_.SmkDTm[n] < 0) aaf_.SmkDTm[n] = 0; // Ready for Next Explosion
		// Explosion (Red Flash)
		if (aaf_.SmkFlg[n]) {
			aaf_.ExpSiz[n] = 1/200; // Start Size
			aaf_.ExpLif[n] = 0.15; // Start Life (seconds)
			aaf_.ExpPtr[n].visible = true;
		}
		if (aaf_.ExpLif[n] > 0) {
			aaf_.ExpPtr[n].scale.setScalar(aaf_.ExpSiz[n]);
			aaf_.ExpSiz[n] = aaf_.ExpSiz[n] + 1/200;
			aaf_.ExpLif[n] = aaf_.ExpLif[n] - tim_.DLTime;
			if (aaf_.ExpLif[n] < 0) {
				aaf_.ExpLif[n] = 0;
				aaf_.ExpPtr[n].visible = false;
			}
		}
		//-	Sounds -------------------------------------------------------------
		//.	Play Sounds (No Delay) .............................................
//		if (gen_.SndFlg && aaf_.SmkFlg[n]) aaf_.SndPtr[n].play();
		// Play Sound With Delay
		//. Gunfire ............................................................
		//	Start Delay
		if (aaf_.FirFlg[n]) { // Compute Delay and Start Countdown 		
			aaf_.FirDTm[n] = aaf_.GunPtr[n].position.length()/343;
			aaf_.FirFlg[n] = 0;
		}
		//	If End of Delay Start Sound
		if (aaf_.FirDTm[n]) aaf_.FirDTm[n] = aaf_.FirDTm[n] - tim_.DLTime;
		if (aaf_.FirDTm[n] < 0) {
			aaf_.FirDTm[n] = 0;
			if (gen_.SndFlg) {
				if (aaf_.FirPtr[n].isPlaying) aaf_.FirPtr[n].stop();
				aaf_.FirPtr[n].setVolume(aaf_.FirVol);
				aaf_.FirPtr[n].play();
			}
		}
		//.	Exlosion ...........................................................
		// Start Delay
		if (aaf_.SmkFlg[n]) { // Compute Delay and Start Countdown
			let delay = aaf_.ExpGrp[n].position.length()/343;
			if (delay > (aaf_.SmkDMx[n]-1)) delay = (aaf_.SmkDMx[n]-1); // Avoid overlap issues
			aaf_.SndDTm[n] = delay;
//			aaf_.SmkFlg[n] = 0;		// Automatically reeset with each frame
		}
		// If End of Delay Start Sound
		if (aaf_.SndDTm[n]) aaf_.SndDTm[n] = aaf_.SndDTm[n] - tim_.DLTime;
		if (aaf_.SndDTm[n] < 0) {
			aaf_.SndDTm[n] = 0;
			if (gen_.SndFlg) {
				if (aaf_.SndPtr[n].isPlaying) aaf_.SndPtr[n].stop();
				aaf_.SndPtr[n].play();
			}
		}
	} // end of n
}

/*******************************************************************************
*
*	AIRPLANE BASED
*
*******************************************************************************/

//= INITIALIZE AIRPLANE SMOKE ==================================================

function initAirSmk() {
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
*	SHIP WAKE AND ENGINE SMOKE
*
*******************************************************************************/

/*******************************************************************************
*	SHIP WAKE
*******************************************************************************/

//= INIT SHIP WAKE =============//==============================================
function initXSHWak(wak_) {
	for (let n = 0; n < wak_.ObjNum; n ++) {
		wak_.ObjTxt[n] = txt_.ObjTxt[SmkWyte];
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
		wak_.ObjAdr[n].rotation.y = wak_.ObjRot[n].y*DegRad; //rotation around corner
//		wak_.ObjAdr[n].position.y = -5; // Added
		wak_.ObjAdr[n].position.copy(wak_.ObjPos[n]);
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

/*******************************************************************************
*	SHIP SMOKE
*******************************************************************************/

//= INIT SHIP SMOKE ============//==============================================
function initXSHSmk(xss_) {
	for (let n = 0; n < xss_.ObjNum; n ++) {
		xss_.ObjTxt[n] = txt_.ObjTxt[SmkBlak];
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
*	SHIP GUNFIRE
*******************************************************************************/

//= INIT SHIP GUNS =============//==============================================

function initXSHGun(xsg_,gen_) {
	//- COMMON VARIABLES -------------------------------------------------------
	//. Initial Flash Geo and Mat
	let FrLGeo = new LineGeometry();
	FrLGeo.setPositions([0,0,5, 0,0,30]);
	let FrLMat = new Line2NodeMaterial({color:"crimson",linewidth:2});
	//- EACH GUN ---------------------------------------------------------------
	for (let n = 0; n < xsg_.ObjNum; n ++) {
		//.	Create Gun Flash ...................................................
		xsg_.FrLPtr[n] = new Line2(FrLGeo,FrLMat);
		xsg_.FrLPtr[n].rotation.order = "YXZ";
		xsg_.FrLPtr[n].position.set(0,0,0);
		xsg_.GunPtr[n].add(xsg_.FrLPtr[n]);
		xsg_.FrLPtr[n].visible = false;
		//.	Smoke ..............................................................
		//	Explosion Smoke Material (need separate material becuase vary opacity)
		xsg_.SmkMap = txt_.ObjTxt[SmkBlak];
		xsg_.SmkMat[n] = new SpriteNodeMaterial();
		xsg_.SmkMat[n].colorNode = color(0xffffff);
		xsg_.SmkMat[n].colorNode = texture(xsg_.SmkMap);
		xsg_.SmkMat[n].transparent = true;
		xsg_.SmkOpa[n] = 0;
		xsg_.SmkMat[n].opacity = 0;		// prevent black square from appearing in front of aircraft [260504]
		xsg_.SmkMat[n].depthWrite = false;
		//	Explosion Smoke Sprite
		xsg_.SmkPtr[n] = new Sprite(xsg_.SmkMat[n]);
		xsg_.SmkPtr[n].position.set(0,0,10);
		xsg_.SmkPtr[n].scale.set(15,15,15);
		xsg_.GunPtr[n].add(xsg_.SmkPtr[n]);
		xsg_.SmkPtr[n].visible = false;
		//.	Sounds .............................................................
		xsg_.FirPtr[n] = new PositionalAudio(gen_.listnr);
		xsg_.FirPtr[n].setBuffer(snd_.ObjSnd[0]);	// Gunfire Sound
		init1Sound(xsg_.FirPtr[n],xsg_.FirDst,xsg_.FirVol,1,0,xsg_.GunPtr[n]);		
	}
}

//= MOVE SHIP GUNS =============//==============================================
function moveXSHGun(xsg_,xsh_,gen_,tim_) {
	for (let n = 0; n < xsg_.ObjNum; n ++) {
		//	Start
		if (xsg_.FirFlg[n]) { // Compute Delay and Start Countdown 
			// Gun Flash	
			xsg_.FrLPtr[n].visible = true;
			xsg_.FrLDTm[n] = 0.1;
			//	Smoke
			xsg_.SmkPtr[n].visible = true;
			xsg_.SmkOpa[n] = 1.0;
			//	Compute Sound Delay	
			xsg_.FirDTm[n] = xsh_.ObjGrp[1].position.length()/343;
			//	Reset Flag
			xsg_.FirFlg[n] = 0;
		}		
		//	Gunfire Flash Delay
		if (xsg_.FrLDTm[n]) {
			xsg_.FrLDTm[n] = xsg_.FrLDTm[n] - tim_.DLTime;
			if (xsg_.FrLDTm[n] < 0) {
				xsg_.FrLDTm[n] = 0;
				xsg_.FrLPtr[n].visible = false;
			}
		}
		// Smoke Delay
		if (xsg_.SmkOpa[n]) {
			xsg_.SmkMat[n].opacity = xsg_.SmkOpa[n];
			xsg_.SmkOpa[n] = xsg_.SmkOpa[n] - xsg_.SmkOpR;
			if (xsg_.SmkOpa[n] < 0) {
				xsg_.SmkOpa[n] = 0;
				xsg_.SmkMat[n].opacity = 0;
				xsg_.SmkPtr[n].visible = false;				
			}
		}
		//	Sound Delay
		if (xsg_.FirDTm[n]) {
			xsg_.FirDTm[n] = xsg_.FirDTm[n] - tim_.DLTime;
			if (xsg_.FirDTm[n] < 0) {
				xsg_.FirDTm[n] = 0;
				if (gen_.SndFlg) {
					if (xsg_.FirPtr[n].isPlaying) xsg_.FirPtr[n].stop();
					xsg_.FirPtr[n].setVolume(xsg_.FirVol);
					xsg_.FirPtr[n].play();
				}
			}
		}
	}
}

/*******************************************************************************
*
*	SPRITE SMOKE TRAILS
*
*******************************************************************************/
// Fixed Collection of Sprites, with different Opacities and Sizes
// Start with Sprite #1 at Object Position
// For next Sprite, Sprite #2 = Sprite #1 Position, Sprite #1 at Object Position
// For entire line, Sprite #9 = Sprite #8, etc, Sprite #1 = Object Position

//= INIT =======================//==============================================
//	0 = Engine Smoke: SprNum = 150, BegOpa = 0.5;
//	1 = Damage Smoke Trail: SprNum = 250, BegOpa = 0.75;

function initSmkTrl(smt_,air_,xac_,gen_) {
	//- My Airplane - Oil Trail
	smt_.SprMap = txt_.ObjTxt[SmkBlak];
	smt_.ObjNum = 1;
	smt_.SprNum[0] = 150;		// Number of Sprites
	smt_.SprSpc[0] = 3;			// Sprite Spacing
	smt_.BegOpa[0] = 1.0;		// Beginning Opacity
	smt_.OpaMul[0] = 0.85;		// Opacity Decrement Multiplier
	smt_.BegSiz[0] = 1.5;		// Beginning Size
	smt_.Parent[0] = air_.MapPos; // Change this when add more
	// Other Airplanes - Damage Trail
	if (xac_.ObjNum) {
		smt_.ObjNum = 1 + xac_.ObjNum;
		for (let n = 1; n < smt_.ObjNum; n++) {
			smt_.SprNum[n] = 250;	// Number of Sprites
			smt_.SprSpc[n] = 2;		// Sprite Spacing
			smt_.BegOpa[n] = 1.0;	// Beginning Opacity
			smt_.OpaMul[n] = 0.75;	// Opacity Decrement Multiplier
			smt_.BegSiz[n] = 2.5;	// Beginning Size	
			smt_.Parent[n] = xac_.MapPos[n-1];
		}
	}
	//- Common Values
	for (let n = 0; n < smt_.ObjNum; n++) {
		// Init Values
		smt_.Spritz[n] = [];	// Address of Each Sprite
		smt_.MapPos[n] = [];	// MapPos for Each Sprite
		smt_.SprIdx[n] = smt_.SprNum[n]-1; // First Sprite
		smt_.SpcCnt[n] = 0;		// Initialize
		smt_.SprSpn[n] = 0;		// Default = No Spin
		smt_.OpaDec[n] = smt_.OpaMul[n]*smt_.BegOpa[n]/smt_.SprNum[n];
		let SprRot = 90;
		//	Init Material
		smt_.SprMat[n] = new SpriteNodeMaterial(),
		smt_.SprMat[n].colorNode = texture(smt_.SprMap);
		smt_.SprMat[n].transparent = true;
		smt_.SprMat[n].depthWrite = false;
		smt_.SprMat[n].alphaTest = 0.1; // Adjust between 0.0 and 1.0
		//	Init Sprites (initializes Size and Rotation)
		for (let x = 0; x < smt_.SprNum[n]; x++) {
			//	Make Sprites
			smt_.Spritz[n][x] = new Sprite(smt_.SprMat[n]);
			smt_.Spritz[n][x].material.rotation = SprRot*DegRad;
			smt_.Spritz[n][x].scale.setScalar(smt_.BegSiz[n]);
			gen_.scene.add(smt_.Spritz[n][x]);
			smt_.MapPos[n][x] = new Vector3();
			smt_.Spritz[n][x].position.set(0,-10000,0); // Hide Sprites Until Used
			//	Adjust Starting Rotation
			SprRot = Mod360(SprRot+36);	// Rotate Each Sprite
		}
	}
}

//= MOVE =======================//==============================================

function moveSmkTrl(smt_,air_,n) {
	let X,Y,Z;
//	Deposit New Sprite
	if (!smt_.SpcCnt[n]) {
		if (!smt_.SprIdx[n]) smt_.SprIdx[n] = smt_.SprNum[n];
		smt_.SprIdx[n]--;
		smt_.MapPos[n][smt_.SprIdx[n]].copy(smt_.Parent[n]);
	}
	smt_.SpcCnt[n]++;
	if (smt_.SpcCnt[n] == smt_.SprSpc[n]) smt_.SpcCnt[n] = 0;
//	Compute Relative Distance - from 0 to SprNum
	let Opa = smt_.BegOpa[n];
	let OpaDif = smt_.OpaDec[n];
	for (let x = smt_.SprIdx[n]; x < smt_.SprNum[n]; x++) {
		// Compute New Relative Position
		X = smt_.MapPos[n][x].x-air_.MapPos.x;
		Y = smt_.MapPos[n][x].y-air_.MapPos.y;
		Z = air_.MapPos.z-smt_.MapPos[n][x].z;
		smt_.Spritz[n][x].position.set(X,Y,Z);
		if (smt_.SprSpn[n]) smt_.Spritz[n][x].material.rotation += smt_.SprSpn[n];
		smt_.Spritz[n][x].material.opacity = Opa;
		Opa = Opa - OpaDif;
	}
// Compute Relative Distance - Remaining
	for (let x = 0; x < smt_.SprIdx[n]; x++) {
		// Compute New Relative Position
		X = smt_.MapPos[n][x].x-air_.MapPos.x;
		Y = smt_.MapPos[n][x].y-air_.MapPos.y;
		Z = air_.MapPos.z-smt_.MapPos[n][x].z;
		smt_.Spritz[n][x].position.set(X,Y,Z);
		if (smt_.SprSpn[n]) smt_.Spritz[n][x].material.rotation += smt_.SprSpn[n];
		smt_.Spritz[n][x].material.opacity = Opa;
		Opa = Opa - OpaDif;
	}
}

/*******************************************************************************
*
*	BOMB EXPLOSION
*
*******************************************************************************/

//= INIT BOMB ==================//==============================================
function initExpBom(bom_,bmx_,bmt_,bms_,air_) {
	bom_.SmkMap = txt_.ObjTxt[SmkBlak];
	let RefDst = 25;			// Reference distance for Positional Audio
	for (let n = 0; n < bom_.ObjNum; n ++) {
		bom_.ExpGrp[n] = new Group();
		//	Explosion Sound
		bom_.SndPtr[n] = new PositionalAudio(gen_.listnr);
		bom_.SndMsh[n] = new Object3D();
		bom_.SndPtr[n].setBuffer(snd_.ObjSnd[2]);	// Bomb Explosion Sound
		init1Sound(bom_.SndPtr[n],RefDst,bom_.SndVol,1,0,bom_.SndMsh[n]);	
		bom_.ExpGrp[n].add(bom_.SndMsh[n]);
		//
		bom_.ExpFlg[n] = 0;
		bom_.SndFlg[n] = 0;		// 1 = Sound Ready
		bom_.SndDTm[n] = 0;
		bom_.MapPos[n] = new Vector3();
		initBomExp(bmx_,bom_,n);
		initBomSmT(bmt_,bom_,n);
		initBomSmk(bms_,bom_,n);
		bom_.ExpGrp[n].visible = false;
		// Compute New Relative Position
		let X = bom_.MapPos[n].x-air_.MapPos.x;
		let Y = bom_.MapPos[n].y-gen_.AltDif;
		let Z = air_.MapPos.z-bom_.MapPos[n].z;
		bom_.ExpGrp[n].position.set(X,Y,Z);
	}
}

//= MOVE BOMB ==================//==============================================
function moveExpBom(bom_,bmx_,bmt_,bms_,air_,gen_,tim_,n) {
	// Start Sound
	if (gen_.SndFlg && bom_.SndFlg[n]) {
		if (bom_.SndPtr[n].isPlaying) bom_.SndPtr[n].stop();
		bom_.SndPtr[n].play();
		bom_.SndFlg[n] = 0;
	}
	// Make/Continue Explosion
	moveBomExp(bmx_,n);
	moveBomSmT(bmt_,tim_,n);
	moveBomSmk(bms_,bom_,gen_,n);
	// Compute New Relative Position
	let X = bom_.MapPos[n].x-air_.MapPos.x;
	let Y = bom_.MapPos[n].y-gen_.AltDif;
	let Z = air_.MapPos.z-bom_.MapPos[n].z;
	bom_.ExpGrp[n].position.set(X,Y,Z);
}

/*******************************************************************************
*	BOMB SPHERE GEOMETRY
*******************************************************************************/

//= INIT =======================//==============================================
function initBomExp(bmx_,bom_,n) {
	bmx_.ExpGeo[n] = new SphereGeometry(1,32,16);
	bmx_.ExpMat[n] = new MeshBasicNodeMaterial({
			colorNode: color("orange"),
			transparent: true,
			depthWrite: false,
			opacity: 1,
		}),
	bmx_.ExpMsh[n] = new Mesh(bmx_.ExpGeo[n],bmx_.ExpMat[n]);
	bmx_.ExpMsh[n].scale.setScalar(bmx_.ExpSiz[n]);
	bom_.ExpGrp[n].add(bmx_.ExpMsh[n]);
	bmx_.ExpMsh[n].position.y = 5;
	bmx_.ExpSiz[n] = bmx_.BegSiz;
}

//= MOVE =======================//==============================================
function moveBomExp(bmx_,n) {
	if (bmx_.ExpFlg[n]) {
		// Display New Size and Opacity
		bmx_.ExpMsh[n].scale.setScalar(bmx_.ExpSiz[n]);
		bmx_.ExpMat[n].OpacityNode = bmx_.ExpOpa[n];
		// Adjust Opacity and Size
		bmx_.ExpSiz[n] = bmx_.ExpSiz[n] + 0.1; // Expand
		bmx_.ExpOpa[n] = bmx_.ExpOpa[n] - 0.01; // Fade Away
		// If Size > MaxSiz, Turn Off and Reset
		if (bmx_.ExpSiz[n] > bmx_.MaxSiz) {
			bmx_.ExpFlg[n] = 0;
			// Reset
			bmx_.ExpSiz[n] = bmx_.BegSiz;
			bmx_.ExpOpa[n] = 1;
			bmx_.ExpMsh[n].scale.setScalar(bmx_.ExpSiz[n]);
			bmx_.ExpMat[n].OpacityNode = bmx_.ExpOpa[n];
		}
	}
}

/*******************************************************************************
*	BOMB SMOKE TRAILS
*******************************************************************************/

//= INIT =======================//==============================================

function initBomSmT(bmt_,bom_,n) {
	// Init Values
	bmt_.SmkRot[n] = 90;
	bmt_.MakFlg[n] = 1;
	bmt_.FadFlg[n] = 1;
	bmt_.FadTim[n] = bmt_.BegOpa*bmt_.SmkMul; // Fade Time
	bmt_.SmkIdx[n] = 0;
	bmt_.SmkSiz[n] = bmt_.SmkMax; // Size of Next Sprite
	bmt_.SmkTim[n] = 0;
	bmt_.SmkSpr[n] = [[],[],[]];
	bmt_.SmkSpd[n] = [];
	bmt_.SmkPos[n] = new Vector3(0,0,0);
	//	Init Material
	bmt_.SmkMat[n] = new SpriteNodeMaterial(),
	bmt_.SmkMat[n].colorNode = texture(bom_.SmkMap);
	bmt_.SmkMat[n].transparent = true;
	bmt_.SmkMat[n].opacity = bmt_.BegOpa;
	bmt_.SmkMat[n].depthWrite = false;
	//	Init Sprites (initializes Size and Rotation)
	for (let t = 0; t < bmt_.Trails; t++) {
		// Compute XYZ Speed (m/s) Before Gravity
		bmt_.SmkSpd[n][t] = new Vector3();
		bmt_.SmkSpd[n][t].x = Math.cos(bmt_.SmkVec[n][t].x*DegRad)*Math.cos(bmt_.SmkVec[n][t].y*DegRad)*bmt_.SmkVec[n][t].z;
		bmt_.SmkSpd[n][t].y = Math.sin(bmt_.SmkVec[n][t].x*DegRad)*bmt_.SmkVec[n][t].z;
		bmt_.SmkSpd[n][t].z = Math.cos(bmt_.SmkVec[n][t].x*DegRad)*Math.sin(bmt_.SmkVec[n][t].y*DegRad)*bmt_.SmkVec[n][t].z;
		for (let x = 0; x < bmt_.SmkNum; x++) {
			//	Make Sprites
			bmt_.SmkSpr[n][t][x] = new Sprite(bmt_.SmkMat[n]); // 10 different textures
			bmt_.SmkSpr[n][t][x].scale.setScalar(bmt_.SmkSiz[n]);
			bmt_.SmkSpr[n][t][x].material.rotation = bmt_.SmkRot[n]*DegRad;
			bmt_.SmkSpr[n][t][x].visible = false;
			bom_.ExpGrp[n].add(bmt_.SmkSpr[n][t][x]); // Add to Group
			//	Adjust Size and Rotation
			bmt_.SmkSiz[n] = bmt_.SmkSiz[n] - 0.01*bmt_.SmkMax;	// Reduce Size of Each Sprite	
			bmt_.SmkRot[n] = Mod360(bmt_.SmkRot[n]+36);		// Rotate Each Sprite
		}
		bmt_.SmkSiz[n] = bmt_.SmkMax;
	}
}

//= MOVE =======================//==============================================

function moveBomSmT(bmt_,tim_,n) {
	// Make Smoke Trail (Only Position One Sprite per Frame)
	if (bmt_.MakFlg[n]) {
		if (!bmt_.SpcCnt[n]) {		// If Space Counter = 0;
			for (let t = 0; t < bmt_.Trails; t++) {
				bmt_.SmkPos[n].x = bmt_.SmkSpd[n][t].x*bmt_.SmkTim[n]+bmt_.SmkRnd[n][t].x*Math.random()+bmt_.SmkOff[n][t].x;
				bmt_.SmkPos[n].y = bmt_.SmkSpd[n][t].y*bmt_.SmkTim[n]+bmt_.SmkRnd[n][t].y*Math.random()+bmt_.SmkOff[n][t].y-0.5*GrvMPS*(bmt_.SmkTim[n]**2);
				bmt_.SmkPos[n].z = bmt_.SmkSpd[n][t].z*bmt_.SmkTim[n]+bmt_.SmkRnd[n][t].z*Math.random()+bmt_.SmkOff[n][t].z;
				bmt_.SmkSpr[n][t][bmt_.SmkIdx[n]].position.copy(bmt_.SmkPos[n]);
				bmt_.SmkSpr[n][t][bmt_.SmkIdx[n]].material.opacity = bmt_.BegOpa;
				bmt_.SmkSpr[n][t][bmt_.SmkIdx[n]].visible = true;
			}
			bmt_.SmkIdx[n]++;		// Next Sprite
			if (bmt_.SmkIdx[n] == bmt_.SmkNum) bmt_.MakFlg[n] = 0; // End Smoke Generation
			bmt_.SpcCnt[n] = bmt_.SmkSpc;	// Reset Space Counter
		}
		if (bmt_.SmkIdx[n]) bmt_.SmkTim[n] = bmt_.SmkTim[n] + tim_.DifTim;
		bmt_.SpcCnt[n]--;			// Decrement Space Counter
	}
	// Fade Smoke Trail (Only If bmt_.FadFlg > 0)
	else if (bmt_.FadFlg[n]) {
		for (let t = 0; t < bmt_.Trails; t++) {
			for (let x = 0; x < bmt_.SmkNum; x++) { // Fade All at Same Time by Same Amount
				bmt_.SmkSpr[n][t][x].material.opacity = bmt_.FadTim[n]/bmt_.SmkMul;
			}
		}
		bmt_.FadTim[n]--;
		// If Done, Reset All
		if (bmt_.FadTim[n] <= 0) {
			bmt_.FadFlg[n] = 0;
			bmt_.SmkIdx[n] = 0;
			bmt_.SmkTim[n] = 0;
			bmt_.FadTim[n] = bmt_.BegOpa*bmt_.SmkMul;
			bmt_.SmkSiz[n] = bmt_.SmkMax;
			bmt_.SpcCnt[n] = bmt_.SmkSpc;
			for (let t = 0; t < bmt_.Trails; t++) {
				for (let x = 0; x < bmt_.SmkNum; x++) {
					bmt_.SmkSpr[n][t][x].position.set(0,0,0); // Reset Position
					bmt_.SmkSpr[n][t][x].material.opacity = bmt_.BegOpa; // Reset Opacity
					bmt_.SmkSpr[n][t][x].visible = false; // Make Invisible
				}
			}
		}
	}
}

/*******************************************************************************
*	BOMB SMOKE
*******************************************************************************/
// NOTES: Apparently, the SpriteMaterial moves, not the Sprites

//=	INIT =======================//==============================================

function initBomSmk(bms_,bom_,n) {
	//	Init Values
//	bms_.RemSiz[n] = bms_.MaxSiz;
	bms_.RemSiz[n] = 0.001;
	//- Commom Variables -------------------------------------------------------
	//	Speed
	let speed = uniform(.2); // Used by scaledTime
	let scaledTime = time.add(5).mul(speed); // Used by lifeTime and Opacity
	//	Life
	let lifeRange = range(.1,1); // Used by lifeTime and life (for each particle)
	let lifeTime = scaledTime.mul(lifeRange).mod(1); // used by life and Position
	let life = lifeTime.div(lifeRange);	// Used by Color and Opacity
	//-	Material ---------------------------------------------------------------
	let smokeNodeMaterial = new SpriteNodeMaterial();
		smokeNodeMaterial.transparent = true;
		smokeNodeMaterial.depthWrite = false;
	//	Color
	let smokeColor = mix(color(bms_.SmkCol[n].x),color(bms_.SmkCol[n].y),positionLocal.y.mul(3).clamp());
	let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
		smokeNodeMaterial.colorNode = mix(color(bms_.SmkCol[n].z),smokeColor,life.mul(2.5).min(1)).mul(fakeLightEffect);
	//	Opacity
	let rotateRange = range(.1,4);
	let textureNode = texture(bom_.SmkMap,rotateUV(uv(),scaledTime.mul(rotateRange)));
	let opacityNode = textureNode.a.mul(life.oneMinus());
		smokeNodeMaterial.opacityNode = opacityNode;
	//	Position
	let offsetRange = range(new Vector3(-2,3,-2),new Vector3(2,5,2));
		smokeNodeMaterial.positionNode = offsetRange.mul(lifeTime);
	//	Scale
	let scaleRange = range(.3,2);
		smokeNodeMaterial.scaleNode = scaleRange.mul(lifeTime.max(0.3));
	//-	Mesh -------------------------------------------------------------------
		bms_.SmkSpr[n] = new Mesh(new PlaneGeometry(1,1),smokeNodeMaterial);
		bms_.SmkSpr[n].scale.setScalar(bms_.RemSiz[n]);
		bms_.SmkSpr[n].isInstancedMesh = true;
		bms_.SmkSpr[n].frustumCulled = false;
		bms_.SmkSpr[n].count = 1000;
		bms_.SmkSpr[n].renderOrder = 1;
		bom_.ExpGrp[n].add(bms_.SmkSpr[n]);
}

//=	MOVE =======================//==============================================

function moveBomSmk(bms_,bom_,gen_,n) {
	// After First Rep, Smoke Plume is Fully Developed. So You Need to Expand the
	// Whole Plume to Create the Illusion of a Developing Smoke Plume

	// Expand Quickly
	if (bms_.GroFlg[n]) {
		bms_.RemSiz[n] = bms_.RemSiz[n] + 0.175; // (default = 0.175)
		if (bms_.RemSiz[n] > bms_.MaxSiz) {
			bms_.RemSiz[n] = bms_.MaxSiz;
			bms_.GroFlg[n] = 0;
		}
	}
	// Contract Slowly
	if (!bms_.GroFlg[n]) {
		bms_.RemSiz[n] = bms_.RemSiz[n] - bms_.SubSiz[n]; // (default SubSiz = 0.01; test = 0.05)
		if (bms_.RemSiz[n] < 0.001) {
			bms_.RemSiz[n] = 0.001;
			bms_.GroFlg[n] = 1;	// Grow Next Time
			bom_.ExpFlg[n] = 0;	// End Entire Explosion
			gen_.scene.remove(bom_.ExpGrp[n]); // ERR: not make display invisible
			bom_.ExpGrp[n].position.y = -10000;
		}
	}
	bms_.SmkSpr[n].scale.setScalar(bms_.RemSiz[n]);
}

/*******************************************************************************
*
*	GROUND BASED SMOKE AND FIRE
*
*******************************************************************************/

//= INITIALIZE GROUND SMOKE ====//==============================================

function initGrdSmk(grs_) {
	grs_.ObjTxt = txt_.ObjTxt[SmkBlak];
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
*	EFFECTS SOUNDS
*
*******************************************************************************/

//= LOAD SOUNDS ================//===============================================

//- INIT POSITIONAL AUDIO ------//----------------------------------------------
function init1Sound(dest,dist,volm,rate,loop,link) {
	dest.setRefDistance(dist);	// Position
	dest.setVolume(volm);
	dest.playbackRate = rate;
	if (loop) dest.setLoop(true); // if sound loops
	link.add(dest);				// Link SndPtr to SndMsh
}

//= STOP SOUNDS ================//==============================================
// This leaves gen_.SndFlg = 1 and gen_.MYGFlg unchanged.

function stopEffSnd(xag_,aaf_,bom_) {
	//- XAC Aircraft Guns ---------------------------------------------------------------
	for (let n = 0; n < xag_.ObjNum; n ++) {if (xag_.SndPtr[n].isPlaying) xag_.SndPtr[n].stop();}
	//- XAS Ship Guns
	if (typeof xsg_ !== 'undefined') {
		for (let n = 0; n < xsg_.ObjNum; n ++) {if (xsg_.FirPtr[n].isPlaying) xsg_.FirPtr[n].stop();}
	}	
	//-	AAF Guns ---------------------------------------------------------------
	for (let n = 0; n < aaf_.ObjNum; n ++) {
		if (aaf_.FirPtr[n].isPlaying) aaf_.FirPtr[n].stop();
		if (aaf_.SndPtr[n].isPlaying) aaf_.SndPtr[n].stop();
	}
	//- Bombs ------------------------------------------------------------------
	for (let n = 0; n < bom_.ObjNum; n ++) {if (bom_.SndPtr[n].isPlaying) bom_.SndPtr[n].stop();}
}

/*******************************************************************************
*
*	SUBROUTINES
*
*******************************************************************************/

//= CONVERTS DEGREES TO 360 ====//==============================================
function Mod360(deg) {
	while (deg < 0) deg = deg + 360; // Make deg a positive number
	deg = deg % 360;				 // Compute remainder of any number divided by 360
return deg;}

//= SPHERE =====================//==============================================
//	Used to create flash explosions
function makeSphere(col) {
	let geometry = new SphereGeometry(1,32,16);
	let	material = new MeshBasicNodeMaterial({colorNode:color(col),transparent:true,opacity:1});
	let mesh = new Mesh(geometry,material);
	mesh.visible = false;
return mesh;}

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {
	loadFXfile,							// Load Common FX Textures and Sounds
	initFad2Blk,moveFad2Blk,			// Fade2Black
	initBullet,moveBullet,				// Guns - My Airplane
	initXACBul,moveXACBul,				// Guns - Other Airplane
	loadAAAGun,initAAAGun,moveAAAGun,	// AA Guns
	initEndSeq,moveEndSeq,				// Ending Sequence
	initXSHWak,moveXSHWak,				// Ship Wake
	initXSHSmk,							// Ship Smoke
	initXSHGun,moveXSHGun,				// Ship Guns
	initSmkTrl,moveSmkTrl,				// Sprite Smoke Trail
	initExpBom,moveExpBom,				// Bombs
	initGrdSmk,initGrdFyr,				// Ground Smoke and Fire
	stopEffSnd,							// Sounds
};

/*******************************************************************************
*
*	REVISIONS
*
********************************************************************************

250125:	In Development
251010:	Replace MakMsh with Object3D
		Allow position and rotation of wak_
251126:	Add scene to gen_
260504:	Initialized aag_ opacity to "0", not "1" - prevents sprite from appearing in front of my airplane
260504: Initialize most aag_ values to allow easier expansion of number of AA guns
260506: Allow Bullet Life to be limited by Altitude instead of Time.  Time values are 1 to < 10 secs.  Altitude values are > 10 meters.
260507: Allow different opacity for head and tail of AAA bullet.
260508: Each AAA "battery" can have only one parent. Renamed from XSH to Par since parent is not necessarily a ship.
		Added AAA targeting.  Computes lead based on past change in heading.  But does not account for change in rotation of parent (if any)
260509:	Optional: Load and Move Gun Object
260513: Seeting AAAFlg[n] = 0 will stop explosions.
260520:	Eliminate altitude adjustment (AltDif) for bullets (xac and aag).
260521: Changed air_.ObjAdr to air_.AirObj
260530: Have HitTgt refer to xac aircraft number, rather than object number. So can shoot at airplane object number 0.
260603: Fix bullet direciton by changing -xag_.XACRot[n].y to xag_.XACRot[n].y.
260604: Only run one bullet at a time through HitBox.
260605: myg dark colors adjacent to light colors
260611: Bullet starting direction affected by air_.ACPAdj
260612: Add Ending Sequence
260614: Text Bullets for Hits Only if Moving
260702:	Add Bomb Subroutines
260703: Add Bomb Sounds
260706: Multiple Bombs
260718: Sprite Smoke Trail
260722: Add Colors to Bomb Explosion
260801:	Shorten Ending Sequences
260802: Move Effects Sounds from Objects Module; Elimiate moveEffSnd and play EffSnd subroutines; Replace aag_ with aaf_
260805: Eliminate xsg_
260808: Show aaf_ guns firing (FrL)
260817: Add xsg_ ship guns firing animation and sounds
260818: Move load of common textures and sounds to this module; move reference to those files internally
260819: Add Smoke to Gunfire
*/
