/*
 * AnimFM2.js (vers 24.10.11)
 * Copyright 2022-2024, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * A three.js class-type module for animating a FM2 aircraft model
 * See http://philcrowther.com/Aviation for more details.
 */

//= IMPORTS ====================================================================

import {AnimationClip,AnimationMixer,
		Euler,Vector3,
		Mesh,BoxGeometry,PlaneGeometry,
		DoubleSide,LinearFilter,LinearMipMapLinearFilter,RGBAFormat,
} from 'three';

import {MeshBasicNodeMaterial,MeshLambertNodeMaterial,MeshPhongNodeMaterial,
		MeshStandardNodeMaterial,SpriteNodeMaterial,LineBasicNodeMaterial,
		color,texture,attribute,timerLocal,range,positionLocal,uv,mix,
		rotateUV	//r168
} from "three/tsl";

//= VARIABLES ==================================================================

//- Sample Variable
let var_ = {
		Num: 1,					// Number of Objects
		Mdl: [0],				// Source File
		Txt: [0],				// Texture Source File
		Ptr: [0],				// Object Address
		Siz: [],				// Scale (e.g. Ft2Mtr)
		Ord: [0],				// renderOrder
		Rot: [new Euler(0,0,0)], // Object Rotation (in radians)
		MpP: [new Vector3(0,0,0)], // Map Position - Absolute or Relative
		Ref: [0],				// Parent Object
		// Moving
		Spd: [0],				// Speed - if Moving (mtr/sec)
		MpS: [new Vector3()], // Map Speed (mtr/sec)
		// Animations (Varies by Object)
		Dst: [0],				// Object distance (meters) used to activate effects
		Mx0: [0],				// Animation Mixer
		An0: [0]				// Animation
	};

//= STATIC OBJECTS =============//==============================================
//- Islands --------------------------------------------------------------------
let isl_ = {
		Num: 2,
		Mdl: ["https://PhilCrowther.github.io/Aviation/scenery/models/homebase_ctr0.glb",
			  "https://PhilCrowther.github.io/Aviation/scenery/models/giaros.glb"],
		Txt: ["https://PhilCrowther.github.io/Aviation/scenery/textures/homebase.png",
			  "https://PhilCrowther.github.io/Aviation/scenery/textures/giaros.png"],
		Ptr: [],
		Siz: [MtrMil,1.5*MtrMil], // Scale
		Ord: [0,0],				// renderOrder (not used)
		Rot: [new Euler(),new Euler()], // Rotation
		MpP: [new Vector3(610,30,5275),new Vector3(-1610,10,2440)],
		Ref: [new makMsh(),new makMsh()],
	};
//- Volcano Smoke --------------------------------------------------------------
let vlk_ = {
		Num: 1,
		Mdl: [0],
		Txt: ["https://PhilCrowther.github.io/Aviation/textures/fx/smoke1r.png"],
		Ptr: [0],
		Siz: [4000],			// Scale
		Ord: [1],				// renderOrder
		Rot: [new Euler()], // Rotation (not used)
		MpP: [new Vector3(50,75,25)], // Map Position
		Ref: [isl_.Ref[0]],
		// Moving	
		Spd: [0],				// 0 = not moving
		MpS: [new Vector3()]
	};
//- General Static Objects: Linked ---------------------------------------------
//- 0 = Hangar
let lnk_ = {
		Num: 1,
		Mdl: ["https://PhilCrowther.github.io/Aviation/scenery/models/hangar.glb"],
		Txt: [0],
		Ptr: [],				// Loaded Object
		Siz: [Ft2Mtr],			// Scale
		Ord: [0],				// renderOrder
		Rot: [new Euler()], // Rotation
		MpP: [new Vector3(-562,-22.5,-363)], // Relative Position
		Ref: [isl_.Ref[0]],
	};
//- General Static Objects: Unlinked -------------------------------------------
//- 0 = Fletcher
let fxd_ = {
		Num: 1,
		Mdl: ["https://PhilCrowther.github.io/Aviation/models/vehicles/fletcher.glb"],
		Txt: [0],
		Ptr: [],				// Loaded Object
		Siz: [Ft2Mtr],			// Scale
		Ord: [0],				// renderOrder
		Rot: [new Euler()], // Rotation
		MpP: [new Vector3(-300,0,5275)], // Absolute Position
	};

//= MOVING OBJECTS =============//==============================================
//- Airplane -------------------------------------------------------------------
let XPPath = "https://PhilCrowther.github.io/Aviation/models/vehicles/";
let XPFile = "fm2_flyt_xp1.glb"; // Name of airplane model file (rotated blender file)
let xac_ = {
		Num: 1,					// Number of airplanes
		Mdl: [XPPath+XPFile],	// Model Source file
		Txt: [0],				// Texture Source File (not used)
		Ptr: [0],				// Object Address
		Siz: [Ft2Mtr],			// Scale
		Ord: [0],				// renderOrder (not used)
		Rot: [new Vector3(0,0,30)], // Rotation
		MpP: [new Vector3(180,100,5300)], // meters
		Ref: [0],				// 0 = not linked
		// Moving
		Spd: [91.5],			// Speed (mtr/sec) (91.5 ms = 329 kph = 205 mph)
		MpS: [new Vector3()], // not used
		// Animations
		Dst: [0],				// Object distance (meters) used to activate effects
		MxS: [0],				// Animation Mixer - Prop
		MxP: [0],				// Animation Mixer - Pitch
		MxB: [0],				// Animation Mixed - Bank
		AnP: [0],				// Animation - Pitch
		AnB: [0],				// Animation - Bank
		// Sound
		Snd: ["fm2_prop.wav"],	// Prop
		Vol: [1]
	};
//- Aircraft Carrier -----------------------------------------------------------
let XSPath = "https://PhilCrowther.github.io/Aviation/models/vehicles/";	// Other Planes
let XSFile = "CVE_noflag.glb";
let xsh_ = {
		Num: 1,					// Number of ships
		Mdl: [XSPath+XSFile],	// Source File
		Txt: [0],				// Texture Source File (not used)
		Ptr: [0],				// Object Address
		Siz: [Ft2Mtr],			// Scale
		Ord: [0],				// renderOrder (not used)
		Rot: [new Euler()], // Object Rotation
		MpP: [new Vector3(-4133,0.1,146)], // Object Map Position (meters) [used by Mesh]
		Ref: [new makMsh()],
		// Moving
		Spd: [9],				// Speed (mtr/sec) (9 ms = 34 kph = 20 mph) [top speed = 21 mph]
		MpS: [new Vector3()], // Object Map Speed (mtr/sec) used by airplane if landed
		// Animations
		Dst: [0],				// Object distance (meters) used to activate effects
		Mx0: [0],				// Animation Mixer - Radar
		An0: [0],				// Animation - Radar
		Pit: [0],				// Pitch
		Lok: [new makMsh()]		// Deck Lock
	};
//. Wake .......................................................................
let wak_ = {
		Num: 1,
		Mdl: [0],
		Txt: ["https://PhilCrowther.github.io/Aviation/textures/fx/smoke1.png"],
		Ptr: [0],
		Siz: [4000],			// Scale
		Ord: [1],				// renderOrder
		Rot: [new Euler()], // Rotation (not used)
		MpP: [new Vector3(50,75,25)], // Map Position
		Ref: [xsh_.Ref[0]],
	};
//. Flag .......................................................................
let	flg_ = {
		Num:1,
		// Material and Geometry
		Mdl: [0],				// Geometry Address (can use this for all flags)
		Txt: ["https://PhilCrowther.github.io/Aviation/models/vehicles/textures/USA_48.png"],
		Ptr: [0],
		Siz: [0.125],			// Scale (flag height = 2 meters)
		Ord: [0],				// renderOrder (not used)
		Rot: [new Euler(0,97.5*DegRad,0)], // Adjust to make the flag visible at start
		MpP: [new Vector3(44.2,92.47,-58.93).multiplyScalar(Ft2Mtr)], // Relative Map Position
		Ref: [xsh_.Ref[0]],	
		// Animation
		Dst: [152.4],			// Visibility Distance (meters)
		Tim: [0],
		Adj: [0],
	};

//= MINIMUM ALTITUDE ===========//==============================================
let alt_ = {
		Num: 2,
		Ref: [isl_.Ref[0],xsh_.Ref[0]],
		Var: [0,xsh_],
		Typ: [0,1], 			// 0 = stationary, 1 = movine
		Alt: [7.59,13.1],
		Lft: [-635,-13.2],
		Rgt: [-585,13.2],
		Fnt: [410,70.5],
		Bak: [-335,-70.5]
	};
//- Carrier Deck Lock Down
	xsh_.Lok[0].position.y = 1.4+(alt_.Alt[1]-xsh_.MpP[0].y);
	xsh_.Ref[0].add(xsh_.Lok[0]);

//= LOAD =======================================================================

//= OBJECTS ====================//==============================================

function loadObject() {
	AltDif = air_.MapPos.y*AltAdj;
	loadStatic();
	loadMoving();
}

function initObject() {
	AltDif = air_.MapPos.y*AltAdj;
	initStatic();
	initMoving();
}

function moveObject() {
	AltDif = air_.MapPos.y*AltAdj;
	moveStatic();
	moveMoving();
}

//- Static Objects -------------------------------------------------------------

function loadStatic() {
	loadIsland();
	if (lnk_.Num) loadLnkObj();
	if (fxd_.Num) loadFxdObj();
}

function initStatic() {
	initIsland();
}

function moveStatic() {
	moveIsland();
	if (lnk_.Num) moveLnkObj();
	if (fxd_.Num) moveFxdObj();
}

//- Moving Objects -------------------------------------------------------------

function loadMoving() {
	loadMovPln();
	loadMovShp();
}

function initMoving() {
	initMovPln();
	initMovShp();

}

function moveMoving() {
	moveMovPln();
	moveMovShp();
}

//= ISLANDS ====================//==============================================

//-	Load Islands ---------------------------------------------------------------
function loadIsland() {
	for (let i = 0; i < isl_.Num; i++) {
		isl_.Ref[i].position.copy(isl_.MpP[i]);
		scene.add(isl_.Ref[i]);
	}
	for (let i = 0; i < isl_.Num; i++) {
	// Transparent Island Objects
		txtrLoader.load(isl_.Txt[i], function (IslTxt) {	
			let mat = new MeshLambertNodeMaterial({colorNode: texture(IslTxt), transparent: true});
			gltfLoader.load(isl_.Mdl[i], function (gltf) {
				gltf.scene.traverse(function (child) {
				// Note: Blender island must include a UV map
					if (child.isMesh) {
						child.material = mat;				
						child.receiveShadow = true;
					}
				});
				isl_.Ptr[i] = gltf.scene;
				isl_.Ptr[i].scale.setScalar(isl_.Siz[i]);
				isl_.Ptr[i].rotation.copy(isl_.Rot[i]);
				isl_.Ref[i].add(isl_.Ptr[i]);
			});
		});
	}
	// Specific Atached Objects
	loadVulkan();				// Load Volcano Smoke
}

//-	Init Islands ---------------------------------------------------------------
function initIsland() {
	let X,Y,Z;
	for (let i = 0; i < isl_.Num; i++) {
		// Set Relative Position
		// (cause Objects to elevate above water as we climb to prevent flicker)
		X = isl_.MpP[i].x-air_.MapPos.x;
		Y = isl_.MpP[i].y-AltDif;
		Z = air_.MapPos.z-isl_.MpP[i].z;
		isl_.Ref[i].position.set(X,Y,Z);
	}
}

//-	Move Islands ---------------------------------------------------------------
function moveIsland() {
	let X,Y,Z;
	for (let i = 0; i < isl_.Num; i ++) {
		// Compute New Relative Position
		// (cause Islands to elevate above water as we climb to prevent flicker)
		X = isl_.MpP[i].x-air_.MapPos.x;
		Y = isl_.MpP[i].y-AltDif;
		Z = air_.MapPos.z-isl_.MpP[i].z;
		isl_.Ref[i].position.set(X,Y,Z);
	}
}

//= VOLCANO SMOKE ==============//==============================================

//- Load Volcano ---------------------------------------------------------------
function loadVulkan() {
	txtrLoader.load(vlk_.Txt[0], function (VlkTxt) {
		//- Timer
		let timer = timerLocal(.001,1);
		//- Life
		let lifeRange = range(0.1,1);
		let lifeTime = timer.mul(lifeRange).mod(.05);
		let life = lifeTime.div(lifeRange);
		//- Rotation Range
		let rotateRange = range(.1,4);
		let textureNode = texture(VlkTxt, rotateUV(uv(),timer.mul(rotateRange)));	//r168
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);	
		//- Lateral Offset	
		let offsetRange = range(new Vector3(-.5,3,-.5), new Vector3(1,5,1));	// cone shaped
		//- Size Range
		let scaleRange = range(.1,.2);
		//
		let fakeLightEffect = positionLocal.y.oneMinus().max(0.2);
		// Wake
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		let VlkMat = new SpriteNodeMaterial();
			VlkMat.colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
			VlkMat.opacityNode = opacityNode;
			VlkMat.positionNode = offsetRange.mul(lifeTime);
			VlkMat.scaleNode = scaleRange.mul(lifeTime.max(0.3));
			VlkMat.depthWrite = false;
			VlkMat.transparent = true;
		vlk_.Ptr[0] = new Mesh(new PlaneGeometry(1, 1),VlkMat);
			vlk_.Ptr[0].scale.setScalar(vlk_.Siz[0]);
			vlk_.Ptr[0].isInstancedMesh = true;
			vlk_.Ptr[0].count = 600; // Increases continuity (was 100)
			vlk_.Ptr[0].position.copy(vlk_.MpP[0]);
			vlk_.Ptr[0].renderOrder = vlk_.Ord[0]; // This allows the transparent smoke to work with transparent island
			vlk_.Ref[0].add(vlk_.Ptr[0]);
	})
}

//= GENERAL STATIC OBJECTS: LINKED =============================================

//- Load Objects ---------------------------------------------------------------
function loadLnkObj() {
	let parent = 0;
	for (let i = 0; i < lnk_.Num; i++) {
		gltfLoader.load(lnk_.Mdl[i], function (gltf) {
			lnk_.Ptr[i] = gltf.scene;
			lnk_.Ptr[i].scale.setScalar(lnk_.Siz[i]);
			lnk_.Ptr[i].rotation.copy(lnk_.Rot[i]);
			lnk_.Ptr[i].position.copy(lnk_.MpP[i]);
			lnk_.Ref[i].add(lnk_.Ptr[i]);
		});
	}
}

//- Move Objects ---------------------------------------------------------------
function moveLnkObj() {
	for (let i = 0; i < lnk_.Num; i++) {
		lnk_.Ptr[i].position.y = lnk_.MpP[i].y + AltDif*0.01;
	}
}

//= GENERAL STATIC OBJECTS: UNLINKED ===========================================

//- Load Objects ---------------------------------------------------------------
function loadFxdObj() {
	for (let i = 0; i < fxd_.Num; i++) {
		gltfLoader.load(fxd_.Mdl[i], function (gltf) {
			fxd_.Ptr[i] = gltf.scene;
			fxd_.Ptr[i].scale.setScalar(fxd_.Siz[i]);
			fxd_.Ptr[i].rotation.copy(lnk_.Rot[i]);
			fxd_.Ptr[i].position.copy(fxd_.MpP[i]);
			scene.add(fxd_.Ptr[i]);
		});
	}
}

//-	Move Objects ---------------------------------------------------------------
function moveFxdObj() {
	let position = new Vector3();
	let X,Y,Z;
	for (let i = 0; i < fxd_.Num; i++) {
		X = fxd_.MpP[i].x-air_.MapPos.x;
		Y = fxd_.MpP[i].y-AltDif;
		Z = air_.MapPos.z-fxd_.MpP[i].z;
		fxd_.Ptr[i].position.set(X,Y,Z);
	}
}

//= MOVING AIRPLANES ===========//==============================================

//	Load Plane
function loadMovPln() {
	gltfLoader.load(xac_.Mdl[0], function (gltf) {
		xac_.Ptr[0] = gltf.scene;
		// Convert from feet to meters
		xac_.Ptr[0].scale.setScalar(xac_.Siz[0]);
		// Propeller
		let clip = AnimationClip.findByName(gltf.animations, "propellerAction");
		xac_.MxS[0] = new AnimationMixer(xac_.Ptr[0]);
		let actun = xac_.MxS[0].clipAction(clip);
		actun.play();
		if (xac_.MxS[0]) xac_.MxS[0].setTime(anm_.spnprp/anmfps);
		// Bank
		clip = AnimationClip.findByName(gltf.animations, "AC_BankAction");
		xac_.MxB[0] = new AnimationMixer(xac_.Ptr[0]);
		actun = xac_.MxB[0].clipAction(clip);
		actun.play();
		if (xac_.MxB[0]) xac_.MxB[0].setTime(xac_.AnB[0]/anmfps);
		// Pitch
		clip = AnimationClip.findByName(gltf.animations, "AC_PtchAction");
		xac_.MxP[0] = new AnimationMixer(xac_.Ptr[0]);
		actun = xac_.MxP[0].clipAction(clip);
		actun.play();
		if (xac_.MxP[0]) xac_.MxP[0].setTime(xac_.AnP[0]/anmfps);
		// Rotation
		xac_.Ptr[0].rotation.order = "YXZ"; // Heading, Pitch, Bank
		xac_.Ptr[0].rotation.y = xac_.Rot[0].y*DegRad;
		//
		xac_.Ptr[0].add(XPESnd);	// Engine sound
	});
}

// Init Plane
function initMovPln() {
	// Compute Relative Position
	// (cause Objects to elevate above water as we climb to prevent flicker)
	let X = xac_.MpP[0].x-air_.MapPos.x;
	let Y = xac_.MpP[0].y-AltDif;
	let Z = air_.MapPos.z-xac_.MpP[0].z;
	xac_.Ptr[0].position.set(X,Y,Z);
	scene.add(xac_.Ptr[0]);
}

// Move Plane
function moveMovPln() {
	// Rotation
	let XPHSpd = Math.tan(xac_.Rot[0].z*DegRad)*xac_.Spd[0]/GrvMPS;
	XPHSpd = XPHSpd * DLTime;
	xac_.Rot[0].y = xac_.Rot[0].y + XPHSpd;
	xac_.Ptr[0].rotation.set(0,xac_.Rot[0].y*DegRad,xac_.Rot[0].z*DegRad);
	// Speed (Only Horizontal for Now)
	let SpdTim = xac_.Spd[0] * DLTime; // Speed (m/t)
	let SpeedZ = -SpdTim * Math.cos(xac_.Rot[0].y * DegRad);
	let SpeedX = -SpdTim * Math.sin(xac_.Rot[0].y * DegRad);
	// Recompute Map Position
	xac_.MpP[0].x = xac_.MpP[0].x + SpeedX;
	xac_.MpP[0].z = xac_.MpP[0].z - SpeedZ;
	// Animation - Prop (same as mine)
	if (xac_.MxS[0]) xac_.MxS[0].setTime(anm_.spnprp/anmfps);
	// Compute New Relative Position
	let X = xac_.MpP[0].x-air_.MapPos.x;
	let Y = xac_.MpP[0].y-AltDif;
	let Z = air_.MapPos.z-xac_.MpP[0].z;
	xac_.Ptr[0].position.set(X,Y,Z);
}

//= MOVING SHIPS ===============//==============================================

//	Load Ship
function loadMovShp() {
	gltfLoader.load(xsh_.Mdl[0], function (gltf) {
		gltf.scene.traverse(function (child) {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		xsh_.Ptr[0] = gltf.scene;
		xsh_.Ptr[0].scale.setScalar(xsh_.Siz[0]); // Scale
		// Animated Radar
		let clip = AnimationClip.findByName(gltf.animations, "RadarAction");
		xsh_.Mx0[0] = new AnimationMixer(xsh_.Ptr[0]);
		let actun = xsh_.Mx0[0].clipAction(clip);
		actun.play();
		if (xsh_.Mx0[0]) xsh_.Mx0[0].setTime(xsh_.An0[0]/anmfps);
		//
		xsh_.Ptr[0].position.set(0,0,0); // position within group is always 0,0,0
	});
	// Attached Objects
	loadShpWak();				// Init Ship Wake
	loadShpFlg();				// Load and Init Ship Flag
}

//	Init Ship
function initMovShp() {
	xsh_.Ref[0].rotation.order = "YXZ";
	// Compute Relative Position
	// (cause Objects to elevate above water as we climb to prevent flicker)
	let X = xsh_.MpP[0].x-air_.MapPos.x;
	let Y = xsh_.MpP[0].y-AltDif;
	let Z = air_.MapPos.z-xsh_.MpP[0].z;
	xsh_.Ref[0].position.set(X,Y,Z);
	xsh_.Ref[0].add(xsh_.Ptr[0]);
	scene.add(xsh_.Ref[0]);		// Uses position of CVE to compute relative position
}

//	Move Ship
function moveMovShp() {
	// Change in Heading
	let XSHSpd = 0;				// for now
	let XSHPit = 0;
	XSHSpd = XSHSpd * DLTime;
	xsh_.Rot[0].y = xsh_.Rot[0].y + XSHSpd;	
	// Rock the boat
	xsh_.Pit[0] = Mod360(xsh_.Pit[0] + 0.5);
	let PitAdj = 1.5*DegRad*Math.sin(xsh_.Pit[0]*DegRad);
	xsh_.Rot[0].x = PitAdj;
	xsh_.Ref[0].rotation.copy(xsh_.Rot[0]);
	// Speed (Only Horizontal)
	let SpdTim = xsh_.Spd[0] * DLTime; // Speed (u/t)
	xsh_.MpS[0].z = -SpdTim * Math.cos(xsh_.Rot[0].y*DegRad);
	xsh_.MpS[0].x = -SpdTim * Math.sin(xsh_.Rot[0].y*DegRad);
	// Recompute Map Postion
	xsh_.MpP[0].x = xsh_.MpP[0].x + xsh_.MpS[0].x;
	xsh_.MpP[0].z = xsh_.MpP[0].z - xsh_.MpS[0].z;
	// Animation - Radar
	xsh_.An0[0] = xsh_.An0[0] - 0.1;
	if (xsh_.An0[0] < 0) xsh_.An0[0] = 359;
	if (xsh_.Mx0[0]) xsh_.Mx0[0].setTime(xsh_.An0[0]/anmfps);
	// Compute New Relative Position
	let X = xsh_.MpP[0].x-air_.MapPos.x;
	let Y = xsh_.MpP[0].y-AltDif;
	let Z = air_.MapPos.z-xsh_.MpP[0].z;
	xsh_.Ref[0].position.set(X,Y,Z);
	// Compute Distance (for Viz Tests)
	let x = xsh_.Ref[0].position.x;
	let z = xsh_.Ref[0].position.z;
	xsh_.Dst[0] = Math.sqrt(x*x+z*z);		// Compute distance
	// Attached Objects
	moveShpFlg();				// Move Ship Flag
	moveShpWak();
}

//= SHIP WAKE ==================//==============================================

//- Load Ship Wake -------------------------------------------------------------
function loadShpWak() {
	txtrLoader.load(wak_.Txt[0], function (WakTxt) {
		//- Timer
		let timer = timerLocal(.001,1); // Lower = slower
		//- Life
		let lifeRange = range(0.1,1);
		let lifeTime = timer.mul(lifeRange).mod(.05);	
		let life = lifeTime.div(lifeRange);
		//- Rotation Range
//		let rotateRange = range(.1,4);
		let rotateRange = range(.1,.2); // No apparent change
		let textureNode = texture(WakTxt, rotateUV(uv(),timer.mul(rotateRange))); //r168
		let opacityNode = textureNode.a.mul(life.oneMinus().pow(50),0.1);	
		//- Lateral Offset	
		let offsetRange = range(new Vector3(0,3,0), new Vector3(0,5,0));
		//- Size Range
		let scaleRange = range(.01,.02);
		//
		let fakeLightEffect = positionLocal.x.oneMinus().max(0.2);
		// Wake
		let smokeColor = mix(color(0xe0e0e0), color(0xd0d0d0), positionLocal.y.mul(3).clamp());
		let	WakMat = new SpriteNodeMaterial();
			WakMat.colorNode = mix(color("white"), smokeColor, life.mul(2.5).min(1)).mul(fakeLightEffect);
			WakMat.opacityNode = opacityNode;
			WakMat.positionNode = offsetRange.mul(lifeTime);
			WakMat.scaleNode = scaleRange.mul(lifeTime.max(0.3));
			WakMat.depthWrite = false;
			WakMat.transparent = true;
		wak_.Ptr[0] = new Mesh(new PlaneGeometry(1, 1),WakMat);
			wak_.Ptr[0].scale.setScalar(wak_.Siz[0]);
			wak_.Ptr[0].isInstancedMesh = true;
			wak_.Ptr[0].count = 600; // Increases continuity (was 100)
			wak_.Ptr[0].rotation.x = Math.PI/2; // Set Flat
			wak_.Ptr[0].position.y = -5; // Added
			wak_.Ref[0].add(wak_.Ptr[0]);
	})
}

function moveShpWak() {
	wak_.Ptr[0].rotation.x = Math.PI/2-wak_.Ref[0].rotation.x;
}

//= SHIP FLAG ==================//==============================================
//	Adapted from example at https://codepen.io/okada-web/pen/OJydGzy. Thanks!

//	Load and Initialize Flag
function loadShpFlg() {
	txtrLoader.load(flg_.Txt[0], function(FlgTxt) {
		let flgSzX = 30;		// Size X
		let flgSzY = 16;		// Size Y
		let flgSgX = 30;		// Segments X
		let flgSgY = 16;		// Segments Y
		FlgTxt.format = RGBAFormat;
		FlgTxt.magFilter = LinearFilter;
		FlgTxt.minFilter = LinearMipMapLinearFilter;
		FlgTxt.generateMipmaps = true;	
		FlgTxt.needsUpdate = true;		
		let flgMat = new MeshLambertNodeMaterial({colorNode: texture(FlgTxt), side: DoubleSide});
		flg_.Mdl[0] = new PlaneGeometry(flgSzX,flgSzY,flgSgX,flgSgY);
		flg_.Mdl[0].rotateY(180*DegRad);
		flg_.Ptr[0] = new Mesh(flg_.Mdl[0],flgMat);
		flg_.Ptr[0].rotation.copy(flg_.Rot[0]);
		flg_.Ptr[0].position.copy(flg_.MpP[0]);
		flg_.Ptr[0].scale.setScalar(flg_.Siz[0]); // Height = 2 meters
		flg_.Ref[0].add(flg_.Ptr[0]);
		flg_.Ptr[0].visible = true;
	});
}

//	Move Flag Mesh
function moveShpFlg() {
	let flgSgX = 30;			// Segments X
	let flgSgY = 16;			// Segments Y
	if (xsh_.Dst[0]<flg_.Dst[0]) { // Only if within range
		flgSgX = flgSgX+1;
		flgSgY = flgSgY+1;		
		let h = 0.5; 			// Horizontal
		let v = 0.3; 			// Vertical
		let w = 0.075; 			// Swing
		let s = 400; 			// Speed
		let idx,val;
		let tim = flg_.Tim[0]*s/50;
		for (let y = 0; y < flgSgY; y++) {
			for (let x = 0; x < flgSgX; x++) {
            	idx = x + y*(flgSgX);
				val = Math.sin(h*x+v*y-tim)*w*x/4;
				flg_.Mdl[0].attributes.position.setZ(idx,val);
            }
        }
		flg_.Mdl[0].attributes.position.needsUpdate = true;
		flg_.Mdl[0].computeVertexNormals();
	}
	// Rotate Flag on Flagpole
	flg_.Adj[0] = Mod360(flg_.Adj[0]+3); // Degrees
	let FlgAdj = 2.5*DegRad*Math.sin(flg_.Adj[0]*DegRad); // Max Offset = 5 deg
	flg_.Ptr[0].rotation.y = flg_.Rot[0].y+FlgAdj;
}

//= HARDENED SURFACES ==========//==============================================
//	Home Airfield and CVE Deck (moving)

// Where object not facing north, can rotate ref points and airplane to north?
// Use same approach for pitching deck?

// Compute Minimum Altitude
function moveMinAlt() {
	air_.GrdZed = 0;			// Default
	let PX,PZ;
	let Msh = 0;
	for (let i = 0; i < alt_.Num; i++) {
		Msh = alt_.Ref[i];
		PX = -Msh.position.x;
		PZ = Msh.position.z;
		if (alt_.Lft[i] < PX && alt_.Rgt[i] > PX && alt_.Fnt[i] > PZ && alt_.Bak[i] < PZ) {
			air_.GrdZed = alt_.Alt[i];
			if (alt_.Typ[i]) moveShpAlt();
		}
	}
}

function moveShpAlt(air_) {
	InpBrk = 0;					// Default = no brake
	air_.ShpPit = 0;			// Default
	// Recompute GrdZed
	let ZDst = xsh_.MpP[0].z - air_.MapPos.z; // Z-distance from ship center
	let YDif = ZDst * Math.sin(xsh_.Rot[0].x); // Y-change caused by ship pitch
	air_.GrdZed = alt_.Alt[1] - YDif;
	//
	if (air_.GrdFlg) {			// If Landed
		if (air_.PwrPct < 0.5 && anm_.thkpos < 180) InpBrk = 0.01; // Auto-braking if power < 50% and hook extended
		let ShpKPH = xsh_.Spd[0]*3.6; // Ship speed
		if (!air_.MovFlg) {
			if (air_.SpdKPH <= ShpKPH) { // If airplane speed <= Ship speed, lock to deck	
				air_.MovFlg = 1; // Flag
				InpBrk = 0;	// Brake off
				let XOff = air_.MapPos.x - xsh_.MpP[0].x;
				let ZOff = air_.MapPos.z - xsh_.MpP[0].z; // Z-distance from ship center
				xsh_.Lok[0].position.x = XOff;		
				xsh_.Lok[0].position.z = ZOff;
				xsh_.Lok[0].attach(air_.AirObj);				
				if (anm_.thkpos < 180) anm_.thkspd = 1;	// Retract tailhook
			}
		}
		if (air_.MovFlg && air_.SpdKPH > ShpKPH) air_.MovFlg = 0;	// Unlock from deck if moving faster than Ship
		if (air_.MovFlg) {		// Otherwise remain locked to deck
			// Recompute Speed and Position
			air_.MapSpd.z = -xsh_.MpS[0].z;
			air_.MapSpd.x = -xsh_.MpS[0].x;
			air_.MapPos.z = air_.MapPos.z + air_.MapSpd.z;
			air_.MapPos.x = air_.MapPos.x + air_.MapSpd.x;
			air_.MapSPS.x = air_.MapSpd.x;
			air_.MapSPS.z = air_.MapSpd.z;			
			// Recompute air_.Spd
			if (air_.PwrPct < 0.5) {
				air_.SpdKPH = air_.SpdMPS = 0;
				air_.ShpPit = -xsh_.Rot[0].x;
			}
			else {
				air_.SpdKPH = ShpKPH; // (KPH)
				air_.SpdMPS = air_.SpdKPH/3.6; // (mps)
				xsh_.Lok[0].remove(air_.AirObj); // Unlock
				scene.add(air_.AirObj); // Was detached from scene
			}
			// Point Same Direction as Carrier
			// [WIP]
		}
	}
}

//= EXTRA ======================================================================

/* Converts degrees to 360 */
function Mod360(deg) {
	while (deg < 0) deg = deg + 360;	// Make deg a positive number
	deg = deg % 360;					// Compute remainder of any number divided by 360
return deg;}

/* Converts 360 degrees to +/- 180 */
function PoM360(deg) {
	if (deg > 180) deg = deg - 360;
return deg;}

//- Make Mesh ------------------------------------------------------------------
function makMsh() {
	let geometry = new BoxGeometry(0.01,0.01,0.01); 
	let material = new MeshBasicMaterial({transparent:true,opacity:0}); 
	let mesh = new Mesh(geometry, material);
return mesh;}

//= EXPORTS ====================================================================

export {loadObject, initObject, moveObject};

/*= REVISIONS ==================================================================

*/
