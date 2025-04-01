//= GRIDMAP3b MODULE ===========================================================

// GrdMap3b Module (updated 20 Dec 2025)
// Copyright 2022-2024, Phil Crowther
// icensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

//
// @fileoverview
// This moduel contains functions creating a scrolling grid map for Land
//

//******************************************************************************
//*
//*	IMPORTS
//*
//******************************************************************************

import {
	PlaneGeometry,
	Mesh,
	MeshStandardNodeMaterial
} from 'three';
import {color} from 'three/tsl';

//******************************************************************************
//*
//*	CONSTANTS
//*
//******************************************************************************

//-	Conversions
var DegRad = Math.PI/180;			// Convert Degrees to Radians

//******************************************************************************
//*
//*	CONSTRUCTOR									*
//*
//******************************************************************************

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

//******************************************************************************
//*
//*	INITIALIZE
//*
//******************************************************************************

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

//******************************************************************************
//*
//*	MOVE
//*
//******************************************************************************

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

//******************************************************************************
//*
//*	EXPORTS
//*
//******************************************************************************

export {GrdMap};

//******************************************************************************
//*
//*	REVISIONS
//*
//******************************************************************************
/*
241220: Version3b	: NodeMaterials moved from tsl to main (r171)
250331:	Use **2 to square numbers
*/