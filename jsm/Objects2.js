/*
 * Objects.js (vers 25.09.30)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

/* NOTES:
This currently includes mountains/islands, and also fixed and animated objects attached to the scenery
*/

/********************************************************************************
*
*	IMPORTS
*
********************************************************************************/

import {
	// Common
	Vector2,
	Vector3,
	MeshLambertNodeMaterial,
	// Flag
	DoubleSide,
	LinearFilter,
	LinearMipMapLinearFilter,
	Mesh,
	PlaneGeometry,
	RGBAFormat,
	// People
	AnimationClip,
	AnimationMixer,
} from 'three';

import {color,texture} from "three/tsl";

/********************************************************************************
*
*	VARIABLES
*
********************************************************************************/

//= CONSTANTS ==================//===============================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians
const FlgSiz = new Vector2(30,16); // Standard Flag Dimensions
const FlgSeg = new Vector2(30,16); // Standard Flag Segments

/********************************************************************************
*
*	MOUNTAINS/ISLANDS
*
********************************************************************************/

//=	LOAD MOUNTAINS/ISLANDS ===============//=====================================
function loadMountn(scene,mnt_,air_,txtrLoader,gltfLoader) {
	for (let i = 0; i < mnt_.ObjNum; i++) {
		mnt_.ObjGrp[i].position.copy(mnt_.MapPos[i]);
		scene.add(mnt_.ObjGrp[i]);
	}
	for (let i = 0; i < mnt_.ObjNum; i++) {
	// Mountain/Island Objects (Transparent for now)
		txtrLoader.load(mnt_.ObjTxt[i], function (IslTxt) {	
			let mat = new MeshLambertNodeMaterial({colorNode: texture(IslTxt), transparent: true});
			gltfLoader.load(mnt_.ObjSrc[i], function (gltf) {
				gltf.scene.traverse(function (child) {
				// Note: Blender island must include a UV map
					if (child.isMesh) {
						child.material = mat;
						child.receiveShadow = true;
					}
				});
				mnt_.ObjAdr[i] = gltf.scene;
				mnt_.ObjAdr[i].scale.setScalar(mnt_.ObjSiz[i]);
				mnt_.ObjAdr[i].rotation.copy(mnt_.ObjRot[i]);
				mnt_.ObjGrp[i].add(mnt_.ObjAdr[i]);
			});
		});
	}
}

//=	INIT MOUNTAINS/ISLANDS ===============//=====================================
function initMountn(mnt_,air_) {
	moveMountn(mnt_,air_);
}

//=	MOVE MOUNTAINS/ISLANDS ===============//=====================================

function moveMountn(mnt_,air_) {
//	Assumes that objects are at Sea Level
	let X,Y,Z;
	for (let i = 0; i < mnt_.ObjNum; i ++) {
		// Compute New Relative Position
		// (cause Islands to elevate above water as we climb to prevent flicker)
		X = mnt_.MapPos[i].x-air_.MapPos.x;
//		Y = mnt_.MapPos[i].y-gen_.AltDif;
//		Y = mnt_.MapPos[i].y-(air_.MapPos.y*mnt_.AltMul[i]); // 250929
		Y = mnt_.MapPos[i].y-(air_.MapPos.y*mnt_.AltMul[i])+mnt_.VrtAdj[i]; // 250930
		Z = air_.MapPos.z-mnt_.MapPos[i].z;
		mnt_.ObjGrp[i].position.set(X,Y,Z);
	}
}

/********************************************************************************
*
*	FIXED OBJECTS - Only Objects Attached to Mountains/Islands (for Now)
*
********************************************************************************/

//=	LOAD OBJECTS ===============//===============================================
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

//=	INIT OBJECTS ===============//===============================================
function initFxdObj(fxd_,air_,gen_) {
	moveFxdObj(fxd_,air_,gen_);
}

//=	MOVE OBJECTS ===============//===============================================
function moveFxdObj(fxd_,air_,gen_) {
	let AltAdj = gen_.AltDif*0.01;
	// Change Altitude on Linked Objects to Prevent Flicker
	for (let i = 0; i < fxd_.ObjNum; i++) {
		fxd_.ObjAdr[i].position.y = fxd_.MapPos[i].y+AltAdj+fxd_.VrtAdj[i];
	}
}

/********************************************************************************
*
*	ANIMATED FLAGS
*
********************************************************************************/
//	Adapted from example at https://codepen.io/okada-web/pen/OJydGzy. Thanks!

//=	LOAD AND INITIALIZE FLAGS ==//===============================================
function loadAnmFlg(txtrLoader,flg_) {
	let FlgGeo = new PlaneGeometry(FlgSiz.x,FlgSiz.y,FlgSeg.x,FlgSeg.y); // Standard Dimensions and Segments
	let FlgMat;
	// For Each Flag
	for (let n = 0; n < flg_.ObjNum; n++) {
		txtrLoader.load(flg_.ObjTxt[n], function(FlgTxt) {
			FlgTxt.format = RGBAFormat;
			FlgTxt.magFilter = LinearFilter;
			FlgTxt.minFilter = LinearMipMapLinearFilter;
			FlgTxt.generateMipmaps = true;
			FlgTxt.needsUpdate = true;
			flgMat = new MeshLambertNodeMaterial({colorNode: texture(FlgTxt), side: DoubleSide});
			flg_.ObjSrc[n] = FlgGeo;
			flg_.ObjSrc[n].rotateY(180*DegRad);
			flg_.ObjAdr[n] = new Mesh(flg_.ObjSrc[n],flgMat);
			flg_.ObjAdr[n].rotation.copy(flg_.ObjRot[n]);
			flg_.ObjAdr[n].position.copy(flg_.MapPos[n]);
			flg_.ObjAdr[n].scale.setScalar(flg_.ObjSiz[n]); // Height = 2 meters
			flg_.ObjRef[n].add(flg_.ObjAdr[n]); // Attach to Object
			flg_.ObjAdr[n].visible = true;
		});
	}
}

//=	MOVE FLAG MESHES ===========//===============================================
function moveAnmFlg(flg_,tim_) {
	let flgSeg = new Vector2(FlgSeg.x+1,FlgSeg.y+1); // Standard Flag Segments + 1
	for (let n = 0; n < flg_.ObjNum; n++) {
		// Get Distance to Parent Object
		let flgPos = new Vector3(Math.abs(flg_.ObjAdr[n].position.x),
								 Math.abs(flg_.ObjAdr[n].position.y),
								 Math.abs(flg_.ObjAdr[n].position.z))
		let MinDst = flg_.ObjDst[n];
		// Only Animate if Within Min Distance to Parent Object
		if (flgPos.x < MinDst && flgPos.y < MinDst && flgPos.z < MinDst) {
			let h = 0.5; 		// Horizontal
			let v = 0.3; 		// Vertical
			let w = 0.075; 		// Swing
			let s = 400; 		// Speed
			let idx,val;
			let tim = tim_.NowTim*s/50;	
			for (let y = 0; y < flgSeg.y; y++) {
				for (let x = 0; x < flgSeg.x; x++) {
	            	idx = x + y*(flgSeg.x);
					val = Math.sin(h*x+v*y-tim)*w*x/4;
					flg_.ObjSrc[n].attributes.position.setZ(idx,val);
	            }
	        }
			flg_.ObjSrc[n].attributes.position.needsUpdate = true;
			flg_.ObjSrc[n].computeVertexNormals();
		}
		// Rotate Flag on Flagpole
		flg_.ObjAdj[n] = Mod360(flg_.ObjAdj[n]+3); // Degrees
		let FlgAdj = 2.5*DegRad*Math.sin(flg_.ObjAdj[n]*DegRad); // Max Offset = 5 deg
		flg_.ObjAdr[n].rotation.y = flg_.ObjRot[n].y+FlgAdj;
	}
}

/********************************************************************************
*
*	AIRPLANES
*
********************************************************************************/

//=	LOAD AIRPLANES =============//===============================================

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

//=	INIT AIRPLANES =============//===============================================

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

//=	MOVE AIRPLANES ===============//=============================================

// No pathing yet

/********************************************************************************
*
*	SHIPS
*
********************************************************************************/

//=	LOAD SHIPS =================//===============================================

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

//=	INIT SHIPS =================//===============================================

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

//=	MOVE SHIPS =================//===============================================

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

/********************************************************************************
*
*	RIGGED ANIMATED PEOPLE
*
********************************************************************************/

//= LOAD MY PEOPLE =============//===============================================
function loadMyPeep(gltfLoader,myp_) {
	for (let n = 0; n < myp_.ObjNum; n++) {
		gltfLoader.load(myp_.ObjSrc[n], function (gltf) {
			// Cast Shadow (but not in shadow zone)
			gltf.scene.traverse(function (child) {
				if (child.isMesh) child.castShadow = true;
			});
			myp_.ObjAdr[n] = gltf.scene;
			// Load Animation
			myp_.AnmMxr[n] = new AnimationMixer(myp_.ObjAdr[n]);
			myp_.AnmMxr[n].clipAction(gltf.animations[0]).play();
			//- Set Initial Values
			myp_.AnmTim[n] = 0;
			myp_.RepRem[n] = myp_.RepNum[n][myp_.SegRef[n]]; // Reps Remaining
			myp_.DlyRem[n] = myp_.DlyBeg[n][myp_.SegRef[n]]; // Load Beg Delay (if any)
			myp_.DlyFlg[n] = myp_.DlyPos[n][myp_.SegRef[n]]/anmfps; // Set Mid Delay Flag = Time
			//- Position
			myp_.ObjAdr[n].scale.setScalar(myp_.ObjSiz[n]);
			myp_.ObjAdr[n].rotation.x = myp_.ObjRot[n].x * DegRad;
			myp_.ObjAdr[n].rotation.y = myp_.ObjRot[n].y * DegRad;
			myp_.ObjAdr[n].rotation.z = myp_.ObjRot[n].z * DegRad;
			myp_.ObjAdr[n].position.copy(myp_.MapPos[n]); // Relative to moving object
			if (myp_.ObjRef[n]) myp_.ObjRef[n].add(myp_.ObjAdr[n]); // Link to moving object
			else {scene.add(myp_.ObjAdr[n]);}
		});
	}
}

//= MOVE MY PEOPLE =============//===============================================
function moveMyPeep(myp_,tim_) {
	// To compute position, use AnmTim * anmfps
	let ObjRef = 0;
	let ObjDst = new Vector3();
	// For Each Character (n)
	for (let n = 0; n < myp_.ObjNum; n++) {
		if (myp_.SegRef[n] != myp_.SegNum[n]) { // If Have Not Reached Max Segments
			//= Play Animations //-----------------------------------------------
			if (myp_.ObjViz[n]) {	// If in Visual Range
				// Set Position - AnmTim = time on timeline - setTime converts to position
				myp_.AnmMxr[n].setTime(myp_.AnmTim[n]);
				//. Update or Delay Counter .....................................
				// If No Delay, Update Position Time
				if (!myp_.DlyRem[n]) myp_.AnmTim[n] = myp_.AnmTim[n] + tim_.DifTim;
				// If Delay, Don't Change Position Time
				else {
					myp_.DlyRem[n] = myp_.DlyRem[n] - tim_.DifTim;
					if (myp_.DlyRem[n] < 0) myp_.DlyRem[n] = 0;
				}
				//. If Exceed End, Repeat or Move to Next Animation
				if (myp_.AnmTim[n] * anmfps > (myp_.SegEnd[n][myp_.SegRef[n]])) {
					// Repeat Animation?
					if (myp_.RepRem[n]) myp_.RepRem[n] = myp_.RepRem[n] - 1;
					// Or Move On to Next Animation?
					else {
						myp_.SegRef[n] = myp_.SegRef[n] + 1;
						if (myp_.SegRef[n] != myp_.SegNum[n]) {		
							myp_.RepRem[n] = myp_.RepNum[n][myp_.SegRef[n]];
							myp_.DlyRem[n] = myp_.DlyBeg[n][myp_.SegRef[n]]; // Start Delay
						}
					}
					if (myp_.SegRef[n] != myp_.SegNum[n]) {
						myp_.AnmTim[n] = myp_.SegBeg[n][myp_.SegRef[n]]/anmfps; // old or new start time
						myp_.DlyFlg[n] = myp_.DlyPos[n][myp_.SegRef[n]]/anmfps; // load delay flag = delay time
					}
				}
				if (myp_.SegRef[n] != myp_.SegNum[n]) {
					//	When Reach Mid Delay Time, Set Delay Counter
					if (myp_.DlyFlg[n] && myp_.AnmTim[n] > myp_.DlyFlg[n]) {
						myp_.DlyRem[n] = myp_.DlyMid[n][myp_.SegRef[n]];
						myp_.DlyFlg[n] = 0; // so don't keep repeating delay
					}
				}
			}
		}
		//- Turn On or Off Based on Distance ------------------------------------
		// Get Distances
		if (myp_.ObjRef[n]) { // If Linked
			ObjRef = myp_.ObjRef[n];
			ObjDst = ObjRef.position;
		}
		else {ObjDst.copy(myp_.MapPos[n]);}
		// Turn On
		if (!myp_.ObjViz[n] && ObjDst.x < myp_.MaxDst && ObjDst.y < myp_.MaxDst && ObjDst.z < myp_.MaxDst) {
			myp_.ObjViz[n] = 1;
			myp_.ObjAdr[n].visible = true;
//			myp_.AnmAct[n].play(); // Start Playing
		}
		// Continue
		if (myp_.ObjViz[n] && ObjDst.x > myp_.MaxDst || ObjDst.y > myp_.MaxDst || ObjDst.z > myp_.MaxDst) {
			myp_.ObjViz[n] = 0;
			myp_.ObjAdr[n].visible = false;
//			myp_.AnmAct[n].stop(); // causes err (not a function)
		}
	}
}

/********************************************************************************
*
*	ANIMATED PEOPLE (Not Rigged)
*
********************************************************************************/

//= LOAD MY CREW ===============//===============================================
function loadMyCrew(gltfLoader,myc_) {
	let clip = 0;
	for (let n = 0; n < myc_.ObjNum; n++) {
		gltfLoader.load(myc_.ObjSrc[n], function (gltf) {
			// Cast Shadow (but not in shadow zone)
			gltf.scene.traverse(function (child) {
				if (child.isMesh) child.castShadow = true;
			});
			myc_.ObjAdr[n] = gltf.scene;
			//- Position
			myc_.ObjAdr[n].scale.setScalar(myc_.ObjSiz[n]);
			myc_.ObjAdr[n].rotation.x = myc_.ObjRot[n].x * DegRad;
			myc_.ObjAdr[n].rotation.y = myc_.ObjRot[n].y * DegRad;
			myc_.ObjAdr[n].rotation.z = myc_.ObjRot[n].z * DegRad;
			myc_.ObjAdr[n].position.copy(myc_.MapPos[n]); // Relative to moving object
			if (myc_.ObjRef[n]) myc_.ObjRef[n].add(myc_.ObjAdr[n]); // Link to moving object
			else {scene.add(myc_.ObjAdr[n]);}
			// Load Animations
			for (let a = 0; a < myc_.AnmNum[n][a]; a++) {
				clip = AnimationClip.findByName(gltf.animations,myc_.AnmNam[n][a]);
				myc_.AnmMxr[n][a] = new AnimationMixer(gltf.scene);
				myc_.AnmAct[n][a] = myc_.AnmMxr[n][a].clipAction(clip);
				myc_.AnmAct[n][a].play();				
			}
		});
	}
}

//= MOVE MY CREW ===============//===============================================
function moveMyCrew(myc_) {
	// To compute position, use AnmTim * anmfps
	let ObjRef = 0;
	let ObjDst = new Vector3();
	for (let n = 0; n < myc_.ObjNum; n++) {
		// Turn On or Off Based on Distance -------------------------------------
		// Get Distances
		if (myc_.ObjRef[n]) { // If Linked
			ObjRef = myc_.ObjRef[n];
			ObjDst = ObjRef.position;
		}
		else {ObjDst.copy(myc_.MapPos[n]);}
		// Turn On
		if (!myc_.ObjViz[n] && ObjDst.x < myc_.MaxDst && ObjDst.y < myc_.MaxDst && ObjDst.z < myc_.MaxDst) {
			myc_.ObjViz[n] = 1;
			myc_.ObjAdr[n].visible = true;
		}
		// Continue
		if (myc_.ObjViz[n] && ObjDst.x > myc_.MaxDst || ObjDst.y > myc_.MaxDst || ObjDst.z > myc_.MaxDst) {
			myc_.ObjViz[n] = 0;
			myc_.ObjAdr[n].visible = false;
		}
		// Play Animations
		if (myc_.ObjViz[n]) {
			for (let a = 0; a < myc_.AnmNum[n][a]; a++) {			
				myc_.AnmMxr[n][a].setTime(myc_.AnmCnt/24);	
			}
			myc_.AnmCnt = myc_.AnmCnt + myc_.AnmInc;
			Mod360(myc_.AnmCnt);
		}
	}
}

/********************************************************************************
*
*	SUBROUTINES
*
********************************************************************************/

/* Converts degrees to 360 */
function Mod360(deg) {
	while (deg < 0) deg = deg + 360; // Make deg a positive number
	deg = deg % 360;				 // Compute remainder of any number divided by 360
return deg;}

/********************************************************************************
*
*	EXPORTS
*
********************************************************************************/

export {loadMountn,initMountn,moveMountn,
		loadFxdObj,initFxdObj,moveFxdObj,
		loadAnmFlg,moveAnmFlg,
		loadXACVeh,initXACVeh,
		loadXSHVeh,initXSHVeh,moveXSHVeh,
		loadMyPeep,moveMyPeep,
		loadMyCrew,moveMyCrew,
	};

/********************************************************************************
*
*	REVISIONS
*
********************************************************************************/
/*
250405:	In development
250523: Added loadMyCrew/moveMyCrew
250528: Added animations to loadMyCrew/moveMyCrew
250529: Marged this Objects Module with Vehicles Module
250810: No Rep of Plane Handler sequence
250929:	Make AltMul for Islands Optional
250930: Changed Islands to Mountains/Islands, load/init/move, isl_ to mnt_, added mnt_.VrtAdj
*/
