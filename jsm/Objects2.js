/*
 * Objects.js (vers 25.04.13)
 * Copyright 2022-2025, Phil Crowther
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
*/

/*
 * @fileoverview
 * Subroutines to create an air combat simulation
 * See http://philcrowther.com/Aviation for more details.
 */

/* NOTES:
This currently includes islands, and also fixed and animated objects attached to the scenery
*/

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	// Common
	MeshLambertNodeMaterial,
	// Flag
	DoubleSide,
	LinearFilter,
	LinearMipMapLinearFilter,
	Mesh,
	PlaneGeometry,
	RGBAFormat,
	// Peeps
	AnimationMixer,
	Vector3,
	// makMsh
	BoxGeometry,
	MeshBasicNodeMaterial,
} from 'three';

import {color,texture} from "three/tsl";

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= CONSTANTS ==================//==============================================

const DegRad = Math.PI/180;		// Convert Degrees to Radians

/*******************************************************************************
*
*	ISLANDS
*
*******************************************************************************/

//=	LOAD ISLANDS ===============//==============================================
function loadIsland(scene,isl_,air_,gen_,txtrLoader,gltfLoader) {
	for (let i = 0; i < isl_.ObjNum; i++) {
		isl_.ObjGrp[i].position.copy(isl_.MapPos[i]);
		scene.add(isl_.ObjGrp[i]);
	}
	for (let i = 0; i < isl_.ObjNum; i++) {
	// Transparent Island Objects
		txtrLoader.load(isl_.ObjTxt[i], function (IslTxt) {	
			let mat = new MeshLambertNodeMaterial({colorNode: texture(IslTxt), transparent: true});
			gltfLoader.load(isl_.ObjSrc[i], function (gltf) {
				gltf.scene.traverse(function (child) {
				// Note: Blender island must include a UV map
					if (child.isMesh) {
						child.material = mat;
						child.receiveShadow = true;
					}
				});
				isl_.ObjAdr[i] = gltf.scene;
				isl_.ObjAdr[i].scale.setScalar(isl_.ObjSiz[i]);
				isl_.ObjAdr[i].rotation.copy(isl_.ObjRot[i]);
				isl_.ObjGrp[i].add(isl_.ObjAdr[i]);
			});
		});
	}
}

//=	INIT ISLANDS ===============//==============================================
function initIsland(isl_,air_,gen_) {
	moveIsland(isl_,air_,gen_);
}

//=	MOVE ISLANDS ===============//==============================================

function moveIsland(isl_,air_,gen_) {
	let X,Y,Z;
	for (let i = 0; i < isl_.ObjNum; i ++) {
		// Compute New Relative Position
		// (cause Islands to elevate above water as we climb to prevent flicker)
		X = isl_.MapPos[i].x-air_.MapPos.x;
		Y = isl_.MapPos[i].y-gen_.AltDif;
		Z = air_.MapPos.z-isl_.MapPos[i].z;
		isl_.ObjGrp[i].position.set(X,Y,Z);
	}
}

/*******************************************************************************
*
*	FIXED OBJECTS - Only Objects Attached to Islands (for Now)
*
*******************************************************************************/

//=	LOAD OBJECTS ===============//==============================================
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

//=	INIT OBJECTS ===============//==============================================
function initFxdObj(fxd_,air_,gen_) {
	moveFxdObj(fxd_,air_,gen_);
}

//=	MOVE OBJECTS ===============//==============================================
function moveFxdObj(fxd_,air_,gen_) {
	// Change Altitude on Linked Objects to Prevent Flicker
	for (let i = 0; i < fxd_.ObjNum; i++) {
		fxd_.ObjAdr[i].position.y = fxd_.MapPos[i].y + gen_.AltDif*0.01;
	}
}

/*******************************************************************************
*
*	ANIMATED FLAGS
*
*******************************************************************************/
//	Adapted from example at https://codepen.io/okada-web/pen/OJydGzy. Thanks!

//=	LOAD AND INITIALIZE FLAGS ==//==============================================
function loadAnmFlg(txtrLoader,flg_) {
	let flgSzX = 30;			// Size X
	let flgSzY = 16;			// Size Y
	let flgSgX = 30;			// Segments X
	let flgSgY = 16;			// Segments Y
	let FlgGeo = new PlaneGeometry(flgSzX,flgSzY,flgSgX,flgSgY);
	// For Each Flag
	for (let n = 0; n < flg_.ObjNum; n++) {
		txtrLoader.load(flg_.ObjTxt[n], function(FlgTxt) {
			FlgTxt.format = RGBAFormat;
			FlgTxt.magFilter = LinearFilter;
			FlgTxt.minFilter = LinearMipMapLinearFilter;
			FlgTxt.generateMipmaps = true;
			FlgTxt.needsUpdate = true;
			let flgMat = new MeshLambertNodeMaterial({colorNode: texture(FlgTxt), side: DoubleSide});
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

//=	MOVE FLAG MESHES ===========//==============================================
function moveAnmFlg(flg_,tim_) {
//	let n = 0;
	for (let n = 0; n < flg_.ObjNum; n++) {
		let flgSgX = 30;		// Segments X
		let flgSgY = 16;		// Segments Y
		// Get Distance to Parent Object
		let flgPsX = Math.abs(flg_.ObjAdr[n].position.x);
		let flgPsY = Math.abs(flg_.ObjAdr[n].position.y);
		let flgPsZ = Math.abs(flg_.ObjAdr[n].position.z);
		let MinDst = flg_.ObjDst[n];
		// Only Animate if Within Min Distance to Parent Object
		if (flgPsX < MinDst && flgPsY < MinDst && flgPsZ < MinDst) {
			flgSgX = flgSgX+1;
			flgSgY = flgSgY+1;		
			let h = 0.5; 		// Horizontal
			let v = 0.3; 		// Vertical
			let w = 0.075; 		// Swing
			let s = 400; 		// Speed
			let idx,val;
			let tim = tim_.NowTim*s/50;	
			for (let y = 0; y < flgSgY; y++) {
				for (let x = 0; x < flgSgX; x++) {
	            	idx = x + y*(flgSgX);
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

/*******************************************************************************
*
*	RIGGED ANIMATED PEOPLE
*
*******************************************************************************/

//= LOAD MY PEOPLE =============//==============================================
function loadMyPeep(gltfLoader,myp_) {
	for (let n = 0; n < myp_.ObjNum; n++) {
		gltfLoader.load(myp_.ObjSrc[n], function (gltf) {
			// Cast Shadow (but not in shadow zone)
			gltf.scene.traverse(function (child) {
				if (child.isMesh) child.castShadow = true;
			});
			myp_.ObjAdr[n] = gltf.scene;
			// Play Animation
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

//= MOVE MY PEOPLE =============//==============================================
function moveMyPeep(myp_,tim_) {
	// To compute position, use AnmTim * anmfps
	let ObjRef = 0;
	let ObjDst = new Vector3();
	for (let n = 0; n < myp_.ObjNum; n++) {
		//= Play Animations ----//----------------------------------------------
		if (myp_.ObjViz[n]) {	// If in Visual Range
			// Set Position - AnmTim = time on timeline - setTime converts to position
			myp_.AnmMxr[n].setTime(myp_.AnmTim[n]);
			//. Update or Delay Counter .........................................
			// If No Delay, Update Positon Time
			if (!myp_.DlyRem[n]) myp_.AnmTim[n] = myp_.AnmTim[n] + tim_.DifTim;
			// If Delay, Don't Change Position Time
			else {
				myp_.DlyRem[n] = myp_.DlyRem[n] - tim_.DifTim;
				if (myp_.DlyRem[n] < 0) myp_.DlyRem[n] = 0;
			}
			//. If Exceed Max, Repeat or Move to Next Animation
			if (myp_.AnmTim[n] * anmfps > (myp_.SegEnd[n][myp_.SegRef[n]])) {
				// Repeat Animation?
				if (myp_.RepRem[n]) myp_.RepRem[n] = myp_.RepRem[n] - 1;
				// Or Move On to Next Animation?
				else {
					myp_.SegRef[n] = myp_.SegRef[n] + 1;
					if (myp_.SegRef[n] == myp_.SegNum[n]) myp_.SegRef[n] = 0;		
					myp_.RepRem[n] = myp_.RepNum[n][myp_.SegRef[n]];
					myp_.DlyRem[n] = myp_.DlyBeg[n][myp_.SegRef[n]]; // Start Delay
				}
				myp_.AnmTim[n] = myp_.SegBeg[n][myp_.SegRef[n]]/anmfps; // old or new start time
				myp_.DlyFlg[n] = myp_.DlyPos[n][myp_.SegRef[n]]/anmfps; // load delay flag = delay time	
			}
			//	When Reach Mid Delay Time, Set Delay Counter
			if (myp_.DlyFlg[n] && myp_.AnmTim[n] > myp_.DlyFlg[n]) {
				myp_.DlyRem[n] = myp_.DlyMid[n][myp_.SegRef[n]];
				myp_.DlyFlg[n] = 0; // so don't keep repeating delay
			}
		}
		//- Distance -----------//----------------------------------------------
		// Turn On or Off Based on Distance
		// (Not Computed for OrbitControls)
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

/*******************************************************************************
*
*	ANIMATED PEOPLE (Not Rigged)
*
*******************************************************************************/

//= LOAD MY CREW ===============//==============================================
function loadMyCrew(gltfLoader,myc_) {
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
		});
	}
}

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

//- Make Mesh ------------------------------------------------------------------
function makMsh() {
	let geometry = new BoxGeometry(0.01,0.01,0.01); 
	let material = new MeshBasicNodeMaterial({colorNode:color("black"),transparent:true,opacity:0});
	let mesh = new Mesh(geometry,material);
return mesh;}


/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {loadIsland,initIsland,moveIsland,
		loadFxdObj,initFxdObj,moveFxdObj,
		loadAnmFlg,moveAnmFlg,
		loadMyPeep,moveMyPeep,
		loadMyCrew
	};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/
/*
250405:	In development
*/
