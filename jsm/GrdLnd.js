//= GRIDMAP3b MODULE ===========================================================

// GrdMap Module (8 Jun 2025)
// Copyright 2022-2025, Phil Crowther
// icensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

//
// @fileoverview
// This moduel contains functions creating a scrolling grid map for Land
//

/*******************************************************************************
*
*	IMPORTS
*
*******************************************************************************/

import {
	BoxGeometry,
	CircleGeometry,
	Color,
	DataTexture,
	LatheGeometry,
	LinearFilter,
	LinearMipMapLinearFilter,
	Mesh,
	MeshBasicNodeMaterial,
	MeshLambertNodeMaterial,
	MeshStandardNodeMaterial,
	PlaneGeometry,
	RepeatWrapping,
	RGBAFormat,
	Vector2,
} from 'three';
import {color} from 'three/tsl';

/*******************************************************************************
*
*	CONSTANTS
*
*******************************************************************************/

//=	CONVERSIONS ================================================================
var DegRad = Math.PI/180;			// Convert Degrees to Radians

//= GRIDS =======================//=============================================
//= Textures Data ==============//==============================================
//- All textures are 512X512
let dqSize = 1024;
let dqArea = dqSize*dqSize;
let dtSize = 512;
let dtArea = dtSize*dtSize;
let dtData = 0;
let txtTot = 6;					// Total Textures
//- Canvas
let ImgSiz = 1024;				// !!! Change this for each image
//= Grid 4 Data ================//==============================================
//- 1/4 section squares (1/2 mile X 1/2 mile)
//- Variables
let GrdMul = 10;
let red = [0,0];
let grn = [0,0];
let blu = [0,0];
//- Colors
let GrdDrt = "#1c160e";			// Color of underlying dirt (affects brightness)
let drtclr = [0x8e6d3d,0x47361e]; // Dirt
let pstclr = [0x00b000,0x005000]; // Pasture
let cvrclr = [0x75b24c,0x466b2d]; // Green
let whtclr = [0xfbf4e5,0xeabb63]; // Wheat
let bnsclr = [0xacd193,0x5d8e3d]; // Beans
//	Tones of Dirt Brown Color | #836539 Monochromatic Color
//	0xefe7db, 0xe0cfb7, 0xd0b894, 0xc1a070, 0xb1884d, 0x8e6d3d, 0x6a522e, 0x47361e
//	Neutral Scheme (Brown to Green)
//	0x836539, 0x837738, 0x7b8338, 0x698338, 0x568338, 0x448338
//	Hot Pepper Green ( similar ) Color | 568338 Monochromatic Color
//	0xe3efdb, 0xc7e0b7, 0xacd193, 0x90c170, 0x75b24c, 0x5d8e3d, 0x466b2d, 0x2e471e
//	[https://icolorpalette.com/color/dirt-brown
let count0;

//= MATERIALS ==================//==============================================
//= Grid 0 Data ================//==============================================
let gt0_ = {
		//- Image Data
		G0DPtr: [],
		//- Materials
		G0MPtr: [],
		// Patterns for Grid 5 3X3 Textures
		// Also used to draw Grid 4 textures
		// 0 = Dirt
		// 1 = Pasture
		// 2 = Plowed Dirt
		// 3 = Green Vertical
		// 4 = Wheat
		// 5 = Green Horizontal
		// Per Pattern: 1X 0-2 2X 3-5
		G0Id00: [4,3,5,4,3,0,5,2,1],
		G0Id01: [3,0,4,1,2,4,5,3,5],
		G0Id02: [5,1,3,4,5,0,2,4,3],
		G0Id03: [2,4,1,3,5,3,5,0,4],
		G0Id04: [5,1,5,0,3,4,2,4,3],
		G0Id05: [3,0,5,3,4,5,1,2,4],
		G0Id06: [2,0,3,5,3,1,4,4,5],
		G0Id07: [1,5,4,3,5,0,2,4,3],
		G0Id08: [2,3,0,5,3,1,4,5,4],
		G0Id09: [0,2,5,3,4,3,5,1,4],
		G0Id10: [4,3,5,4,5,2,1,3,0],
		G0Id11: [4,5,3,0,1,4,3,5,2],
		G0Id12: [3,1,2,4,5,3,5,0,4],
		G0Id13: [0,5,3,1,4,2,4,3,5],
		G0Id14: [1,4,2,5,3,0,4,5,3],
		G0Id15: [4,1,5,0,3,4,3,5,2],
		G0Indx: [
			gt0_.G0Id00,gt0_.G0Id01,gt0_.G0Id02,gt0_.G0Id03,
			gt0_.G0Id04,gt0_.G0Id05,gt0_.G0Id06,gt0_.G0Id07,
			gt0_.G0Id08,gt0_.G0Id09,gt0_.G0Id10,gt0_.G0Id11,
			gt0_.G0Id12,gt0_.G0Id13,gt0_.G0Id14,gt0_.G0Id15,
		],
	}
//= Grid 1 Data ================//==============================================
let Gr1Mul = 3;
let Gr1Siz = Math.floor(dtSize/Gr1Mul);
// Image Data (Source Data - Resized)
let gt1_ = {
		// Image Data (Source Data - Resized)
		G1SPtr: [],
		// Image Data
		G1DPtr: [],
		// Materials
		G1MPtr: [],
		// Index to Display of G1 Textures by Type
		// Used by G0 to position squares
		// And by G1 to create textures
		G1Indx: [
			 0, 1, 2, 3, 4, 5, 6, 7, 8,	//value of 9-15 in first row causes white space 
			10, 2, 4,15,10,12,10, 9, 5,
			 3,12,11, 8,13, 3, 1, 0,14,
			 0, 7,10,14,12,10,11, 2, 4,
			 9,14, 5, 4,11,13, 8,12, 7,	// 11 = Over Airport
			 4, 7,15,12, 3,11, 9,13, 4,
			11,12, 8, 5,13, 2,10,15,13,
			 6,10, 7, 9,15,14,12, 5,11,
			 0,13, 6,10, 3, 2,14, 4, 8
		],
	}
//= Grid 2 Data ================//==============================================
let Gr2Mul = 3;
let Gr2Siz = Math.floor(dtSize/Gr2Mul);
// Image Data (Source Data - Resized)
let gt2_ = {
		// Image Data (Source Data - Resized)
		G2SPtr: [],
		// Image Data
		G2DPtr: [],
		// Materials
		G2MPtr: [],
	}

/*******************************************************************************
*
*	INIT GRID MATERIALS
*
*******************************************************************************/

//= Make Grid Map Textures =====//==============================================

function initGrdMat(grd_,context) {
	// Create Links
	grd_.Idx = [gt0_.G0Indx,gt1_.G1Indx]; // Index to Patterns
	grd_.Mat = [gt0_.G0MPtr,gt1_.G1MPtr,gt2_.G2MPtr], // Materials
	// Initialze Textures
	initGr0Mat(grd_,context);
	initGr1Mat(grd_,context);
	initGr2Mat(grd_,context);
	// Roads and Trees
	initRoads();
	makeTrees();
}

function initGrdTxt(grd_,context) {
	initGr0Txt(grd_,context);
	initGr1Txt(grd_,context);
	initGr2Txt(grd_,context);
}

function initGr0Txt(grd_,context) {
	for (let n = 0; n < txtTot; n++) {
		// Make Large Image and Get ImageData
		context.fillStyle = GrdDrt;
		context.fillRect(0,0,dqSize,dqSize);
		gt0_.G0DPtr[n] = context.getImageData(0,0,dqSize,dqSize);
		let dtData = gt0_.G0DPtr[n].data;
		makeClr1(drtclr,dtData,1.6);	// Dirt
		if (n == 1) makeClr2(pstclr,dtData,4);	// Pasture
		if (n == 2) makeVrtL(drtclr,dtData,1.9,1.5);	// Plowed Line
		if (n == 3) makeVrtL(cvrclr,dtData,1.9,1.5);	// Bean Line
		if (n == 4) makeVrtL(whtclr,dtData,1.9,1.5);	// Wheat Line
		if (n == 5) makeVrtD(bnsclr,dtData,8);	// Bean Dots
		// Make Materials
		let DatTxt = new THREE.DataTexture(dtData, dqSize, dqSize);
		DatTxt.format = THREE.RGBAFormat;
		DatTxt.magFilter = THREE.LinearFilter;
		DatTxt.minFilter = THREE.LinearMipMapLinearFilter;
		DatTxt.generateMipmaps = true;
		DatTxt.wrapS = DatTxt.wrapT = THREE.RepeatWrapping;
		DatTxt.offset.set(0,0);
		DatTxt.repeat.set(GrdMul,GrdMul);
		DatTxt.anisotropy = maxAnisotropy;
		DatTxt.needsUpdate = true;		
		gt0_.G0MPtr[n] = new THREE.MeshLambertNodeMaterial({colorNode: texture(DatTxt)});
		// Gr5Source = Resized Gr4Data
		// Note: Dividing a Repeated Data Can Lead to Odd Results
		// e.g. If Repeat X10 and then divide by 10, result = Data
		context.putImageData(gt0_.G0DPtr[n],0,0);
		context.drawImage(canvas,0,0,dqSize,dqSize,0,0,Gr1Siz,Gr1Siz);		// Draw 1024 image into 1/3 of 512 canvas
		gt1_.G1SPtr[n] = context.getImageData(0,0,Gr1Siz,Gr1Siz);				//
	}
}

function initGr1Txt(grd_,context) {
// This creates up to 81 unique 3X3 Textures (similar to FSX textures)
// Created using ImageData from Gr4IPtr and patterns from Gr4TPtr
// Stored by ID number
// Repeated 9X on the full map.	
	let dd, sd, idx;
	let fx = dtSize/Gr1Mul;
	// For Destination (9 locations arranged linearly)
	for (let n = 0; n < gt0_.G0Indx.length; n++) {	// Destination
		// For 3X3 Source
		let stIndx = gt0_.G0Indx[n];			// Index to this pattern
		idx = 0;
		for (let ys1 = 0; ys1 < 3; ys1++) {	// Find source within 9x9 Square
			for (let xs1 = 0; xs1 < 3; xs1++) {
				let ImgDat = gt1_.G1SPtr[stIndx[idx]];	// Correct, but causes dirt lines
				context.putImageData(ImgDat,Math.floor(xs1*fx),Math.floor(ys1*fx));
				idx++;
			}
		}
		gt1_.G1DPtr[n] = context.getImageData(0,0,dtSize,dtSize);	// This should be the 3X3 image saved
		let DatTxt = new THREE.DataTexture(gt1_.G1DPtr[n].data,dtSize,dtSize);
		DatTxt.format = THREE.RGBAFormat;
		DatTxt.magFilter = THREE.LinearFilter;
		DatTxt.minFilter = THREE.LinearMipMapLinearFilter;
		DatTxt.generateMipmaps = true;
		DatTxt.anisotropy = maxAnisotropy;
		DatTxt.needsUpdate = true;
		gt1_.G1MPtr[n] = new THREE.MeshLambertNodeMaterial({colorNode: texture(DatTxt)});	
		// Gr6Source = Resized Gr5Data		
		context.putImageData(gt1_.G1DPtr[n],0,0);
		context.drawImage(canvas,0,0,dtSize,dtSize,0,0,Gr2Siz,Gr2Siz);
		gt2_.G2SPtr[n] = context.getImageData(0,0,Gr2Siz,Gr2Siz);
	}
}

function initGr2Txt(grd_,context) {
	// Need 27 3X3 textures which will be repeated 27 times
	// Create Grid 6 Texture Data and Materials (9 squares repeated)
	let yd0, xd0;
	let fx = dtSize/Gr2Mul;
	let n = 0;
	// For Destination (9 locations arranged linearly)
	for (let ys0 = 0; ys0 < 3; ys0++) {	// Source of Each 9x9 Square
		for (let xs0 = 0; xs0 < 3; xs0++) {
			// Loads 3x3 Grid of Textures
			for (let ys1 = 0; ys1 < 3; ys1++) {	// Find source within 9x9 Square
				for (let xs1 = 0; xs1 < 3; xs1++) {
					let ImgDat = gt2_.G2SPtr[gt1_.G1Indx[ys0*27+xs0*3+ys1*9+xs1]];
					context.putImageData(ImgDat,Math.floor(xs1*fx),Math.floor(ys1*fx));
				}
			}
			//	
			gt2_.G2DPtr[n] = context.getImageData(0,0,dtSize,dtSize);	// Saved, not used yet
			let DatTxt = new THREE.DataTexture(gt2_.G2DPtr[n].data, dtSize, dtSize);
			DatTxt.format = THREE.RGBAFormat;
			DatTxt.magFilter = THREE.LinearFilter;
			DatTxt.minFilter = THREE.LinearMipMapLinearFilter;
			DatTxt.generateMipmaps = true;
			DatTxt.anisotropy = maxAnisotropy;
			DatTxt.needsUpdate = true;
			gt2_.G2MPtr[n] = new THREE.MeshLambertNodeMaterial({colorNode: texture(DatTxt)});	
			n++;
		}
	}	
}

//= Make Textures ==============================================================

function makeClr1(dtColr,dtData,Weight) {
	// Load 2 colors
	for (let i = 0; i < 2; i++) {
		let clr = new Color(dtColr[i]);
		red[i] = Math.floor(clr.r * 255);
		grn[i] = Math.floor(clr.g * 255);
		blu[i] = Math.floor(clr.b * 255);
	}
	// Assign colors
	let idx, i;
	for (let y = 0; y < dqSize; y++) {
		for (let x = 0; x < dqSize; x++) {
			i = Math.floor(Weight*Math.random());
			idx = (y*dqSize + x) * 4;
			dtData[idx  ] = red[i];
			dtData[idx+1] = grn[i];
			dtData[idx+2] = blu[i];
			dtData[idx+3] = 255;
		}
	}
}

function makeClr2(dtColr,dtData,Weight) {
	// Load 2 colors
	for (let i = 0; i < 2; i++) {
		let clr = new Color(dtColr[i]);
		red[i] = Math.floor(clr.r * 255);
		grn[i] = Math.floor(clr.g * 255);
		blu[i] = Math.floor(clr.b * 255);
	}
	// Assign colors
	let idx, i;
	for (let y = 0; y < dqSize; y++) {
		for (let x = 0; x < dqSize; x++) {
			i = Math.floor(Weight*Math.random());
			idx = (y*dqSize + x) * 4;
			if (i == 0 || i == 1) {
				dtData[idx  ] = red[i];
				dtData[idx+1] = grn[i];
				dtData[idx+2] = blu[i];
				dtData[idx+3] = 255;
			}
		}	
	}
}

// Make Vertical Line
function makeVrtL(dtColr,dtData,Weight1,Weight2) {
	// Load 2 colors
	for (let i = 0; i < 2; i++) {
		let clr = new Color(dtColr[i]);
		red[i] = Math.floor(clr.r * 255);
		grn[i] = Math.floor(clr.g * 255);
		blu[i] = Math.floor(clr.b * 255);
	}
	let idx, i;
	for (let x = 4; x < dqSize; x+=8) {	// Rows
		for (let y = 0; y < dqSize; y++) {
			idx = (y*dqSize + x) * 4;
			i = Math.floor(Weight1*Math.random());
			if (i == 1) {
				dtData[idx  ] = red[i];
				dtData[idx+1] = grn[i];
				dtData[idx+2] = blu[i];
				dtData[idx+3] = 255;
			}
			idx = idx+4;
			i = Math.floor(Weight2*Math.random());
			if (i == 0) {
				dtData[idx  ] = red[i];
				dtData[idx+1] = grn[i];
				dtData[idx+2] = blu[i];
				dtData[idx+3] = 255;
			}
			idx = idx+4;
			i = Math.floor(Weight2*Math.random());
			if (i == 0) {
				dtData[idx  ] = red[i];
				dtData[idx+1] = grn[i];
				dtData[idx+2] = blu[i];
				dtData[idx+3] = 255;
			}
			idx = idx+4;
			i = Math.floor(Weight1*Math.random());
			if (i == 1) {
				dtData[idx  ] = red[i];
				dtData[idx+1] = grn[i];
				dtData[idx+2] = blu[i];
				dtData[idx+3] = 255;
			}
		}
	}
}

// Make Vertical Dots
function makeVrtD(dtColr,dtData,Weight) {
	// Load 2 colors
	for (let i = 0; i < 2; i++) {
		let clr = new Color(dtColr[i]);
		red[i] = Math.floor(clr.r * 255);
		grn[i] = Math.floor(clr.g * 255);
		blu[i] = Math.floor(clr.b * 255);
	}
	let idx, i;
	for (let x = 4; x < dqSize; x+=8) {	// Rows
		for (let y = 0; y < dqSize; y++) {
			idx = (y*dqSize + x) * 4;
			i = Math.floor(Weight*Math.random());
			if (i == 1) {
				dtData[idx  ] = red[i];
				dtData[idx+1] = grn[i];
				dtData[idx+2] = blu[i];
				dtData[idx+3] = 255;
			}
			idx = idx+4;
			i = Math.floor(Weight*Math.random());
			if (i == 0 || i == 1) {
				dtData[idx  ] = red[i];
				dtData[idx+1] = grn[i];
				dtData[idx+2] = blu[i];
				dtData[idx+3] = 255;
			}
			idx = idx+4;
			i = Math.floor(Weight*Math.random());
			if (i == 0 || i == 1) {
				dtData[idx  ] = red[i];
				dtData[idx+1] = grn[i];
				dtData[idx+2] = blu[i];
				dtData[idx+3] = 255;
			}
			idx = idx+4;
			i = Math.floor(Weight*Math.random());
			if (i == 1) {
				dtData[idx  ] = red[i];
				dtData[idx+1] = grn[i];
				dtData[idx+2] = blu[i];
				dtData[idx+3] = 255;
			}
		}
	}
}

/* Roads ==================================================================*/

function initRoads() {
	let txtrod,matrod,georod;
	makeRClr(rodclr,r0Data,1);
	txtrod = new DataTexture(r0Data, r0Size, r0Size);
	txtrod.format = RGBAFormat;
	txtrod.magFilter = LinearFilter;
	txtrod.minFilter = LinearMipMapLinearFilter;
	txtrod.generateMipmaps = true;
	txtrod.wrapS = txtrod.wrapT = RepeatWrapping;
	txtrod.offset.set(0,0);
	Rod1.Txt = txtrod;
	Rod2.Txt = txtrod;
	initRoad2(Rod1);
	initRoad2(Rod2);
}

function moveRoads() {
// Convert Distances into Meters to match landscape program
	moveRoad2(Rod1);
	moveRoad2(Rod2);
}

function makeRClr(dtColr,dtData,Weight) {
	// Load 2 colors
	for (let i = 0; i < 2; i++) {
		let clr = new Color(dtColr[i]);
		red[i] = Math.floor(clr.r * 255);
		grn[i] = Math.floor(clr.g * 255);
		blu[i] = Math.floor(clr.b * 255);
	}
	// Assign colors
	let idx, i;
	for (let n = 0; n < t0Area*4; n+=4) {
		i = Math.floor(Weight*Math.random());
		dtData[n  ] = red[i];
		dtData[n+1] = grn[i];
		dtData[n+2] = blu[i];
		dtData[n+3] = 255;
	}
}

function initRoad2(Rod) {
	// Load Variables
	Rod.RCi = Rod.RCs-1;				// Max Index Value
	Rod.MZV[Rod.RCi] = 0;				// Z-Values
	Rod.MXV[Rod.RCi] = 0;				// X-Values
	Rod.Nor = Rod.RCi;					// Max North Square (updated)
	Rod.Est = Rod.RCi;					// Max East Square (updated)
	Rod.Num = Rod.RCs * Rod.RCs;		// Size of array
	Rod.Ptr[Rod.Num-1] = 0;				// Mesh Pointers

	if (Rod.Typ == 1) {
		// Compute Starting Z and X Values
		let zx = -0.5*(Rod.RCs)*Rod.Siz-0.5*GrdSiz;
		for (let i = 0; i < Rod.RCs; i++) {
			Rod.MZV[i] = zx;
			Rod.MXV[i] = zx;
			zx = zx + Rod.Siz;
		}
		let geometry = new PlaneGeometry(25*Ft2Mtr,Rod.Siz);	// N/S Road;
		let DatTxt = Rod.Txt;
		DatTxt.repeat.set(10,10);
		DatTxt.anisotropy = maxAnisotropy;		// ###
		DatTxt.needsUpdate = true;
		let material = new MeshLambertNodeMaterial({colorNode: texture(DatTxt)});
		for (let n = 0; n < Rod.Num; n++) {	// Source
			Rod.Ptr[n] = new Mesh(geometry,material);
			if (Rod.Shd == 1) Rod.Ptr[n].receiveShadow = true;
		}
	}
	
	if (Rod.Typ == 2) {
		// Compute Starting Z and X Values
		let zx = -0.5*(Rod.RCs)*Rod.Siz+0.5*GrdSiz;
		for (let i = 0; i < Rod.RCs; i++) {
			Rod.MZV[i] = zx;
			Rod.MXV[i] = zx;
			zx = zx + Rod.Siz;
		}
		let geometry = new PlaneGeometry(Rod.Siz,25*Ft2Mtr);	// E/W Road;
		let DatTxt = Rod.Txt;
		DatTxt.repeat.set(10,10);
		DatTxt.anisotropy = maxAnisotropy;		// ###
		DatTxt.needsUpdate = true;
		let material = new MeshLambertNodeMaterial({colorNode: texture(DatTxt)});
		for (let n = 0; n < Rod.Num; n++) {	// Source
			Rod.Ptr[n] = new Mesh(geometry,material);
			if (Rod.Shd == 1) Rod.Ptr[n].receiveShadow = true;
		}
	}
			
	let n = 0;
	// Set Starting Position of Squares
	for (let z = 0; z < Rod.RCs; z++) {		// Row
		for (let x = 0; x < Rod.RCs; x++) {	// Column
			Rod.Ptr[n].rotation.x = -90*DegRad;
			scene.add(Rod.Ptr[n]);
			Rod.Ptr[n].renderOrder = 1;
			Rod.Ptr[n].position.set(Rod.MXV[x],-grd_.SPS.y*gen_.AltAdj+0.01,-Rod.MZV[z]);
			n++;
		}
	}
}

// Move Roads
function moveRoad2(Rod) {
	let j = 0;
	let v = 0; 
	let max = 0.5*Rod.RCs*Rod.Siz;
	let min = -max;
	// Update Z and X-Values
	for (let i = 0; i < Rod.RCs; i++) {
		Rod.MZV[i] = Rod.MZV[i] - grd_.SPS.z;	// Rows
		Rod.MXV[i] = Rod.MXV[i] - grd_.SPS.x;	// Columns
	}
	// Test North/South
	if (grd_.SPS.z < 0) {					// If Moving South
		j = Rod.Nor;
		if (Rod.MZV[j] >= max) {
			v = min+(Rod.MZV[j]-max);
			for (let i = 0; i < Rod.Stp; i++) {
				Rod.MZV[j] = v;
				j = j - 1;
				if (j < 0) j = Rod.RCi;
				v = v - Rod.Siz;
			}
			Rod.Nor = Rod.Nor - Rod.Stp;
			if (Rod.Nor < 0) Rod.Nor = Rod.Nor + Rod.RCs;
		}
	}
	if (grd_.SPS.z > 0) {					// If Moving North
		j = Rod.Nor + 1;
		if (j > Rod.RCi) j = 0;
		if (Rod.MZV[j] <= min) {
			v = max-(min-Rod.MZV[j]);
			for (let i = 0; i < Rod.Stp; i++) {
				Rod.MZV[j] = v;
				j++;
				if (j > Rod.RCi) j = 0;
				v = v + Rod.Siz;
			}
			Rod.Nor = Rod.Nor + Rod.Stp;
			if (Rod.Nor > Rod.RCi) Rod.Nor = Rod.Nor - Rod.RCs;
		}
	}
	// Test East/West
	if (grd_.SPS.x < 0) {					// If Moving West
		j = Rod.Est;
		if (Rod.MXV[j] >= max) {
			v = min+(Rod.MXV[j]-max);
			for (let i = 0; i < Rod.Stp; i++) {
				Rod.MXV[j] = v;
				j = j - 1;
				if (j < 0) j = Rod.RCi;
				v = v - Rod.Siz;
			}
			Rod.Est = Rod.Est - Rod.Stp;
			if (Rod.Est < 0) Rod.Est = Rod.Est + Rod.RCs;
		}
	}
	if (grd_.SPS.x > 0) {						// If Moving East
		j = Rod.Est + 1;
		if (j > Rod.RCi) j = 0;	
		if (Rod.MXV[j] <= min) {
			v = max-(min-Rod.MXV[j]);
			for (let i = 0; i < Rod.Stp; i++) {			
				Rod.MXV[j] = v;
				j++;
				if (j > Rod.RCi) j = 0;
				v = v + Rod.Siz;
			}
			Rod.Est = Rod.Est + Rod.Stp;
			if (Rod.Est > Rod.RCi) Rod.Est = Rod.Est - Rod.RCs;
		}
	}
	// Set Position
	let n = 0;
	for (let z = 0; z < Rod.RCs; z++) {	// Row
		for (let x = 0; x < Rod.RCs; x++) {	// Col
			Rod.Ptr[n].position.set(Rod.MXV[x],-grd_.SPS.y*gen_.AltAdj+0.01,-Rod.MZV[z]);
			n++;
		}
	}
}

//= TREES ======================================================================

//- Make Trees ------------------------------------------------------------------

function makeTrees() {
	let points = [
		new Vector2(4.0,-6.7),	// Bot
		new Vector2(4.9,-3.0),
		new Vector2(4.2, 3.0),
		new Vector2(3,5, 2.0),
		new Vector2(1.8, 5.8),
		new Vector2(0.1, 6.0)		// Top
	];
	let gomtre = new LatheGeometry(points,6);
	let gomtrn = new BoxGeometry(0.9,3.0,0.9);
	let gomshd = new CircleGeometry(6.0,16);
	// Make Texture	
	makeTClr(treclr,t0Data,1.9);
	let txttre = new DataTexture(t0Data, t0Size, t0Size);
	txttre.format = RGBAFormat;
	txttre.magFilter = LinearFilter;
	txttre.minFilter = LinearMipMapLinearFilter;
	txttre.generateMipmaps = true;
	txttre.anisotropy = maxAnisotropy;	// ###
	txttre.needsUpdate = true;
	let mtltre = new MeshLambertNodeMaterial({colorNode: texture(txttre)});
	let mtltrn = new MeshLambertNodeMaterial({colorNode: color(0x161005)});
	let mtlshd = new MeshBasicNodeMaterial({colorNode: color(0x000000),transparent:true,opacity:0.5,depthWrite: false});
	// Make Prototype Tree
	let tree0 = new Mesh(gomtre,mtltre);
	let trnk = new Mesh(gomtrn,mtltrn);
	trnk.position.y = -7.9;
	tree0.add(trnk);
	let shad = new Mesh(gomshd,mtlshd);
	shad.position.y = -9.4;
	shad.rotation.x = -90*DegRad;
	tree0.add(shad);
	Trees[0] = tree0.clone();
	// Make Row of Trees
	let sx = 15.0;
	let ry = 13.7;
	let dy = 13.7;
	let px = sx;
	for (let x = 0; x < 10; x++) {
		let tree = tree0.clone();
		tree.position.x = px;
		ry = Mod360(360*Math.random());
		tree.rotation.y = ry*DegRad;
		tree.rotation.z = Mod360(2*Math.random()*DegRad);
		tree.rotation.x = Mod360(2*Math.random()*DegRad);
		ry = ry+dy;
		px = px+sx;
		Trees[0].add(tree);
	}
	Trees[0].position.x = 0;
	Trees[0].position.y = 9.8;
	let pz = 90;
	for (let n = 1; n < TreTot; n++) {
		Trees[n] = Trees[0].clone();
		scene.add(Trees[n]);
		Trees[n].rotation.y = (Math.floor(Math.random()+0.5))*90*DegRad;
		Trees[n].position.y = 9.8;
		TreePX[n] = GrdSiz*Math.floor(27*(Math.random()-0.5))+50*Ft2Mtr;
		TreePZ[n] = GrdSiz*Math.floor(27*(Math.random()-0.5))+50*Ft2Mtr;
	}
	moveTrees();
}

//- Move Trees -----------------------------------------------------------------

function moveTrees() {
	// Convert Distances into Meters to match landscape program
	let a = 13.5*GrdSiz;
	for (let n = 0; n < TreTot; n ++) {
		// Set Position 
		let x = TreePX[n]-air_.MapPos.x-GrdSiz/2;
		if (x > a) x = x - 2*a;
		if (x < -a) x = x + 2*a;
		let z = air_.MapPos.z-TreePZ[n]-GrdSiz/2;
		if (z > a) z = z - 2*a;
		if (z < -a) z = z + 2*a;
		let y = -grd_.SPS.y*gen_.AltAdj+9.8;	// Objects elevate above ground as we climb to prevent flicker
		Trees[n].position.set(x,y,z);
	}
}

function makeTClr(dtColr,dtData,Weight) {
	// Load 2 colors
	for (let i = 0; i < 2; i++) {
		let clr = new Color(dtColr[i]);
		red[i] = Math.floor(clr.r * 255);
		grn[i] = Math.floor(clr.g * 255);
		blu[i] = Math.floor(clr.b * 255);
	}
	// Assign colors
	let idx, i;
	for (let n = 0; n < t0Area*4; n+=4) {
		i = Math.floor(Weight*Math.random());
		dtData[n  ] = red[i];
		dtData[n+1] = grn[i];
		dtData[n+2] = blu[i];
		dtData[n+3] = 255;
	}
}

/*******************************************************************************
*
*	CONSTRUCTOR									*
*
*******************************************************************************/

let GrdMap = function (grd_, scene) {

//- Grid 0 ---------------------------------------------------------------------
	grd_.Grx[0] = {
		Typ:	0,					// Type of Grid - Inner or Outer
		RCs:	grd_.RCs,			// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	grd_.Siz,				// Size of square
		Stp:	grd_.Stp,			// Steps
		RCi:	0,					// Rows and Columns Index (computed)
		MZV:	[0],				// Ground Z Value
		MXV:	[0],				// Ground X Value
		Nor:	0,					// Max North Square (updated)
		Est:	0,					// Max East Square (updated)
		Num:	0,					// Size of array (computed)
		Ptr:	[0],				// Ground Address
		Shd:	1,					// Shadow enabled
		RCF:	0,					// N/A
		NSA:	0,					// N/A
		EWA:	0,					// N/A
		Mat:	0					// N/A
	}
//- Grid 1 ---------------------------------------------------------------------
	grd_.Grx[1] = {
		Typ:	1,					// Type of Grid - Inner or Outer
		RCs:	grd_.RCs,			// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	grd_.Grx[0].Siz*grd_.Grx[0].Stp,	// Size of square
		Stp:	grd_.Stp,			// Steps (### changed)
		RCi:	0,					// Rows and Columns Index (computed)
		MZV:	[0],				// Ground Z Value
		MXV:	[0],				// Ground X Value
		Nor:	0,					// Max North Square (updated)
		Est:	0,					// Max East Square (updated)
		Num:	0,					// Size of array (computed)
		Ptr:	[0],				// Ground Address
		Shd:	1,					// Shadow enabled
		RCF:	grd_.Grx[0].RCs/grd_.Grx[0].Stp,	// Cut-Out Area (27/3 = 9)
		NSA:	0,					// Shared North/South Adjustment (updated)
		EWA:	0,					// Shared East/West Adjustment (updated)
		Mat:	0					// Match Texture of Outer and Inner Blocks
	}
//- Grid 2 ---------------------------------------------------------------------
	grd_.Grx[2] = {
		Typ:	2,					// Type of Grid - Inner or Outer
		RCs:	grd_.RCs,			// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	grd_.Grx[1].Siz*grd_.Grx[1].Stp,	// Size of square
		Stp:	1,					// Squares to flip
		RCi:	0,					// Rows and Columns Index (computed)
		MZV:	[0],				// Ground Z Value
		MXV:	[0],				// Ground X Value
		Nor:	0,					// Max North Square (updated)
		Est:	0,					// Max East Square (updated)
		Num:	0,					// Size of array (computed)
		Ptr:	[0],				// Ground Address
		Shd:	1,					// Shadow enabled
		RCF:	grd_.Grx[1].RCs/grd_.Grx[1].Stp,	// Cut-Out Area
		NSA:	0,					// Shared North/South Adjustment (updated)
		EWA:	0,					// Shared East/West Adjustment (updated)
		Mat:	0					// Match Texture of Outer and Inner Blocks
	}
	init1GrMap(grd_.Grx[0], grd_, scene);
	init1GrMap(grd_.Grx[1], grd_, scene);
	init1GrMap(grd_.Grx[2], grd_, scene);
}

GrdMap.prototype.update = function (grd_) {
	move1GrMap(grd_.Grx[0], grd_);
	move1GrMap(grd_.Grx[1], grd_);
	move1GrMap(grd_.Grx[2], grd_);
}

/*******************************************************************************
*
*	INITIALIZE
*
*******************************************************************************/

function init1GrMap(grx_, grd_, scene) {
	// Load Variables
	grx_.RCi = grx_.RCs-1;				// Max Index Value
	grx_.MZV[grx_.RCi] = 0;				// Z-Values
	grx_.MXV[grx_.RCi] = 0;				// X-Values
	grx_.Nor = grx_.RCi;				// Max North Square (updated)
	grx_.Est = grx_.RCi;				// Max East Square (updated)
	grx_.Num = grx_.RCs**2;				// Size of array
	grx_.Ptr[grx_.Num-1] = 0;			// Mesh Pointers
	if (grx_.Typ) {
		grx_.NSA = (grx_.RCs-grx_.RCF)/2; // (27-3=6)
		grx_.EWA = grx_.NSA;
	}
	// Compute Starting Z and X Values
	let zx = -0.5*(grx_.RCs)*grx_.Siz+0.5*grx_.Siz;
	for (let i = 0; i < grx_.RCs; i++) {
		grx_.MZV[i] = zx;
		grx_.MXV[i] = zx;
		zx = zx + grx_.Siz;
	}	
	// Common Variables
	let n, si, d2, yd0, xd0;
	let geometry = new PlaneGeometry(grx_.Siz, grx_.Siz);
	// Default to Prevent Err (Lower Left to Upper Right)
	let material = new MeshStandardNodeMaterial({colorNode: color(0xc00000)});
	// Assign Textures and Save Square Pointers
	for (let i = 0; i < grx_.Num; i++) {
		let mesh = new Mesh(geometry,material);
		if (grx_.Shd) mesh.receiveShadow = true;
		grx_.Ptr[i] = mesh;
	}
	let Lv1Idx = grd_.Idx[0];	// G0Indx
	let Lv2Idx = grd_.Idx[1];	// G1Indx
	let MatPtr;
	//
	if (grx_.Typ == 0) {
		n = 0;
		MatPtr = grd_.Mat[0];	// G0MPtr
		// Use Combination of Grid 0 3x3 Index and Grid 1 Index to Determine Material for Each Square 
		for (let yd = 0; yd < 9; yd++) {	// For each 3X3 section
			for (let xd = 0; xd < 9; xd++) {
				yd0 = yd * 81;
				xd0 = xd * 3;
				let MatIdx = Lv1Idx[Lv2Idx[n]];	//G1Indx points to 3X3 type, G0Indx points to sequence
				si = 0;
				// Within single 3x3 Grid
				for (let yd2 = 0; yd2 < 3; yd2++) {
					for (let xd2 = 0; xd2 < 3; xd2++) {
						si = yd2*3+xd2;
						d2 = yd0 + xd0 + yd2*27 + xd2;
						material = MatPtr[MatIdx[si]];
						grx_.Ptr[d2] = new Mesh(geometry,material);
						if (grx_.Shd) grx_.Ptr[d2].receiveShadow = true;
						si++;
					}
				}
				n++;		
			}
		}	
	}
	if (grx_.Typ == 1) {
		// 81 textures are repeated 9X on the full map
		// Assign Textures
		n = 0;
		MatPtr = grd_.Mat[1];	// G1MPtr
		for (let yd = 0; yd < 9; yd++) {
			for (let xd = 0; xd < 9; xd++) {
				// From Upper Left
				material = MatPtr[Lv2Idx[n]];
				yd0 = yd*grx_.RCs;
				// Assign Textures and Save Square Pointers
				for (let ad = 0; ad < 3; ad++) {
					d2 = yd0 + xd + ad*9*grx_.RCs;
					for (let bd = 0; bd < 3; bd++) {
						grx_.Ptr[d2] = new Mesh(geometry,material);
						if (grx_.Shd) grx_.Ptr[d2].receiveShadow = true;
						d2 = d2 + 9;
					}
				}
				n++;
			}
		}
	}
	if (grx_.Typ == 2) {
		// 27 textures are repeated 27X on the full map
		n = 0;
		MatPtr = grd_.Mat[2];	// G2MPtr
		for (let yd = 0; yd < 3; yd++) {	// Source
			for (let xd = 0; xd < 3; xd++) {
				material = MatPtr[n];
				yd0 = yd*grx_.RCs;			// Within the lower left square
				// Assign Textures and Save Square Pointers
				for (let ad = 0; ad < 9; ad++) {
					d2 = yd0 + xd + ad*3*grx_.RCs;
					for (let bd = 0; bd < 9; bd++) { 
						grx_.Ptr[d2] = new Mesh(geometry,material);
						if (grx_.Shd) grx_.Ptr[d2].receiveShadow = true;
						d2 = d2 + 3;
					}
				}
				n++;
			}
		}
	}
	n = 0;
	// Set Starting Position of Squares
	for (let y = 0; y < grx_.RCs; y++) {		// Row
		for (let x = 0; x < grx_.RCs; x++) {	// Column
			grx_.Ptr[n].rotation.x = -90*DegRad;
			scene.add(grx_.Ptr[n]);
			grx_.Ptr[n].position.set(grx_.MXV[x],-grd_.SPS.y,-grx_.MZV[y]);
			n++;
		}
	}
}

/*******************************************************************************
*
*	MOVE
*
*******************************************************************************/

function move1GrMap(grx_, grd_) {
	let grd1_ = grd_.Grx[1];
	let grd2_ = grd_.Grx[2];
	let j, v = 0;
	let max = 0.5*grx_.RCs*grx_.Siz;
	let min = -max;
	// Update Z, X and Y-Values
	for (let i = 0; i < grx_.RCs; i++) {
		grx_.MZV[i] = grx_.MZV[i] - grd_.SPS.z;	// Rows
		grx_.MXV[i] = grx_.MXV[i] - grd_.SPS.x;	// Columns
	}
	// Test North/South
	if (grd_.SPS.z < 0) {					// If Moving South
		j = grx_.Nor;
		if (grx_.MZV[j] >= max) {
			v = min+(grx_.MZV[j]-max);
			for (let i = 0; i < grx_.Stp; i++) {
				grx_.MZV[j] = v;
				j = j - 1;
				if (j < 0) j = grx_.RCi;
				v = v - grx_.Siz;
			}
			grx_.Nor = grx_.Nor - grx_.Stp;
			if (grx_.Nor < 0) grx_.Nor = grx_.Nor + grx_.RCs;
			if (grx_.Typ == 0) grd1_.NSA = grd1_.NSA - 1;
			if (grx_.Typ == 1) {
				grx_.NSA = grx_.NSA + grx_.Stp;
				grd2_.NSA = grd2_.NSA - 1;
			}
			if (grx_.Typ == 2) grd2_.NSA = grd2_.NSA + grx_.Stp;
		}
	}
	if (grd_.SPS.z > 0) {					// If Moving North
		j = grx_.Nor + 1;
		if (j > grx_.RCi) j = 0;
		if (grx_.MZV[j] <= min) {
			v = max-(min-grx_.MZV[j]);
			for (let i = 0; i < grx_.Stp; i++) {
				grx_.MZV[j] = v;
				j++;
				if (j > grx_.RCi) j = 0;
				v = v + grx_.Siz;
			}
			grx_.Nor = grx_.Nor + grx_.Stp;
			if (grx_.Nor > grx_.RCi) grx_.Nor = grx_.Nor - grx_.RCs;
			if (grx_.Typ == 0) grd1_.NSA = grd1_.NSA + 1;
			if (grx_.Typ == 1) {
				grx_.NSA = grx_.NSA - grx_.Stp;
				grd2_.NSA = grd2_.NSA + 1;
			}
			if (grx_.Typ == 2) grd2_.NSA = grd2_.NSA - grx_.Stp;
		}
	}
	// Test East/West
	if (grd_.SPS.x < 0) {					// If Moving West
		j = grx_.Est;
		if (grx_.MXV[j] >= max) {
			v = min+(grx_.MXV[j]-max);
			for (let i = 0; i < grx_.Stp; i++) {
				grx_.MXV[j] = v;
				j = j - 1;
				if (j < 0) j = grx_.RCi;
				v = v - grx_.Siz;
			}
			grx_.Est = grx_.Est - grx_.Stp;
			if (grx_.Est < 0) grx_.Est = grx_.Est + grx_.RCs;
			if (grx_.Typ == 0) grd1_.EWA = grd1_.EWA - 1;
			if (grx_.Typ == 1) {
				grx_.EWA = grx_.EWA + grx_.Stp;
				grd2_.EWA = grd2_.EWA - 1;
			}
			if (grx_.Typ == 2) grd2_.EWA = grd2_.EWA + grx_.Stp;
		}
	}
	if (grd_.SPS.x > 0) {						// If Moving East
		j = grx_.Est + 1;
		if (j > grx_.RCi) j = 0;	
		if (grx_.MXV[j] <= min) {
			v = max-(min-grx_.MXV[j]);
			for (let i = 0; i < grx_.Stp; i++) {			
				grx_.MXV[j] = v;
				j++;
				if (j > grx_.RCi) j = 0;
				v = v + grx_.Siz;
			}
			grx_.Est = grx_.Est + grx_.Stp;
			if (grx_.Est > grx_.RCi) grx_.Est = grx_.Est - grx_.RCs;
			if (grx_.Typ == 0) grd1_.EWA = grd1_.EWA + 1;
			if (grx_.Typ == 1) {
				grx_.EWA = grx_.EWA - grx_.Stp;
				grd2_.EWA = grd2_.EWA + 1;
			}
			if (grx_.Typ == 2) grd2_.EWA = grd2_.EWA - grx_.Stp;
		}
	}
	// Set Position
	let n = 0;
	for (let r = 0; r < grx_.RCs; r++) {	// Row
		for (let c = 0; c < grx_.RCs; c++) {	// Col
			grx_.Ptr[n].position.set(grx_.MXV[c],-grd_.SPS.y,-grx_.MZV[r]);
			grx_.Ptr[n].visible = true;	// Default for Outer Grid
			n++;
		}
	}
	// Outer Grids Only - Make Cut-Out Area Invisible
	if (grx_.Typ) {
		let r = grx_.Nor + 1 + grx_.NSA;			// Get Lower index
		if (r > grx_.RCi) r = r - grx_.RCs;
		let c = grx_.Est + 1 + grx_.EWA;			// Get Left Index
		if (c > grx_.RCi) c = c - grx_.RCs;
		for (let i = 0; i < grx_.RCF; i++) {
			n = r * grx_.RCs + c;
			if (n < 0) n = n + grx_.Num;
			if (n > grx_.Num) n = n - grx_.Num;
			let n2 = (r+1) * grx_.RCs - 1;
			if (n2 > grx_.Num) n2 = n2 - grx_.Num;
			if (n2 < 0) n2 = n2 + grx_.Num;
			for (let j = 0; j < grx_.RCF; j++) {
				grx_.Ptr[n].visible = false;
				n++;
				if (n > n2) n = n - grx_.RCs; 
				if (n < 0) n = n + grx_.Num;
				if (n > grx_.Num) n = n - grx_.Num;
			}
			r++;
			if (r > grx_.RCi) r = r - grx_.RCs;
		}
	}
}

/*******************************************************************************
*
*	EXPORTS
*
*******************************************************************************/

export {initGrdMat, GrdMap};

/*******************************************************************************
*
*	REVISIONS
*
*******************************************************************************/
/*
241220: Version3b	: NodeMaterials moved from tsl to main (r171)
250331:	Use **2 to square numbers
250531:	Rename GrdMap3b as GrdMap
*/