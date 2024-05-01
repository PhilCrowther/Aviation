//= GRID MAP MODULE ============================================================

// GrdWtr variation
// Version 1.01 (dated 31 May 2023)
// Copyright 2022-2023, Phil Crowther
// icensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

//
// @fileoverview
// This moduel contains functions creating a scrolling grid map using the Ocean module
//

import {
	Mesh
} from 'three';

/* = LOCAL VARIABLES =========================================================*/
let geometry, material, mesh;

/*= PROGRAM ==================================================================*/

let GrdMap = function (grx_, scene) {

/*- Grid 0 -------------------------------------------------------------------*/
	grx_.Grd[0] = {
		Typ:	0,					// Type of Grid - Inner or Outer
		RCs:	grx_.RCs,			// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	grx_.Siz,			// Size of square
		Stp:	grx_.Stp,			// Steps
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
	}
/*- Grid 1 -------------------------------------------------------------------*/
	grx_.Grd[1] = {
		Typ:	1,					// Type of Grid - Inner or Outer
		RCs:	16,					// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	grx_.Grd[0].Siz*grx_.Grd[0].Stp,	// Size of square
		Stp:	4,					// Steps (### changed)
		RCi:	0,					// Rows and Columns Index (computed)
		MZV:	[0],				// Ground Z Value
		MXV:	[0],				// Ground X Value
		Nor:	0,					// Max North Square (updated)
		Est:	0,					// Max East Square (updated)
		Num:	0,					// Size of array (computed)
		Ptr:	[0],				// Ground Address
		Shd:	1,					// Shadow enabled
		RCF:	grx_.Grd[0].RCs/grx_.Grd[0].Stp,	// Cut-Out Area (27/3 = 9)
		NSA:	0,					// Shared North/South Adjustment (updated)
		EWA:	0,					// Shared East/West Adjustment (updated)
	}
/*- Grid 2 -------------------------------------------------------------------*/
	grx_.Grd[2] = {
		Typ:	2,					// Type of Grid - Inner or Outer
		RCs:	16,					// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	grx_.Grd[1].Siz*grx_.Grd[1].Stp,	// Size of square
		Stp:	1,					// Squares to flip
		RCi:	0,					// Rows and Columns Index (computed)
		MZV:	[0],				// Ground Z Value
		MXV:	[0],				// Ground X Value
		Nor:	0,					// Max North Square (updated)
		Est:	0,					// Max East Square (updated)
		Num:	0,					// Size of array (computed)
		Ptr:	[0],				// Ground Address
		Shd:	1,					// Shadow enabled
		RCF:	grx_.Grd[1].RCs/grx_.Grd[1].Stp,	// Cut-Out Area
		NSA:	0,					// Shared North/South Adjustment (updated)
		EWA:	0,					// Shared East/West Adjustment (updated)
	}
	init1GrMap(grx_.Grd[0], grx_, scene);
	init1GrMap(grx_.Grd[1], grx_, scene);
	init1GrMap(grx_.Grd[2], grx_, scene);
}

GrdMap.prototype.update = function (grx_) {
	move1GrMap(grx_.Grd[0], grx_);
	move1GrMap(grx_.Grd[1], grx_);
	move1GrMap(grx_.Grd[2], grx_);
}

/* Init Moving Map (Ocean) --------------------------------------*/

function init1GrMap(grd_, grx_, scene) {
	// Load Variables
	grd_.RCi = grd_.RCs-1;				// Max Index Value
	grd_.MZV[grd_.RCi] = 0;				// Z-Values
	grd_.MXV[grd_.RCi] = 0;				// X-Values
	grd_.Nor = grd_.RCi;					// Max North Square (updated)
	grd_.Est = grd_.RCi;					// Max East Square (updated)
	grd_.Num = grd_.RCs * grd_.RCs;		// Size of array
	grd_.Ptr[grd_.Num-1] = 0;				// Mesh Pointers
	if (grd_.Typ > 0) {
		grd_.NSA = (grd_.RCs-grd_.RCF)/2;	// (27-3=6)
		grd_.EWA = grd_.NSA;
	}
	// Compute Starting Z and X Values
	let zx = -0.5*(grd_.RCs)*grd_.Siz+0.5*grd_.Siz;
	for (let i = 0; i < grd_.RCs; i++) {
		grd_.MZV[i] = zx;
		grd_.MXV[i] = zx;
		zx = zx + grd_.Siz;
	}
	// Load Geometry and Material
	geometry = grx_.Geo[grd_.Typ];
	material = grx_.Mat[grd_.Typ];
	// Set Starting Position of Squares
	let n = 0;
	for (let z = 0; z < grd_.RCs; z++) {		// Row
		for (let x = 0; x < grd_.RCs; x++) {	// Column
			grd_.Ptr[n] = new Mesh(geometry,material);
			if (grd_.Shd == 1) grd_.Ptr[n].receiveShadow = true;
			scene.add(grd_.Ptr[n]);
			grd_.Ptr[n].position.set(grd_.MXV[x],-grx_.MSP.y,-grd_.MZV[z]);
			if (grd_.Typ > 0) grd_.Ptr[n].position.y = grd_.Ptr[n].position.y-grx_.WMx;
			n++;
		}
	}
}

/* Move Moving Map ----------------------------------------------*/

function move1GrMap(grd_, grx_) {
	let grd1_ = grx_.Grd[1];
	let grd2_ = grx_.Grd[2];
	let j, v = 0;
	let max = 0.5*grd_.RCs*grd_.Siz;
	let min = -max;
	// Update ZX
	for (let i = 0; i < grd_.RCs; i++) {
		grd_.MZV[i] = grd_.MZV[i] - grx_.MSP.z;	// Rows
		grd_.MXV[i] = grd_.MXV[i] - grx_.MSP.x;	// Columns
	}
	// Test North/South
	if (grx_.MSP.z < 0) {					// If Moving South
		j = grd_.Nor;
		if (grd_.MZV[j] >= max) {
			v = min+(grd_.MZV[j]-max);
			for (let i = 0; i < grd_.Stp; i++) {
				grd_.MZV[j] = v;
				j = j - 1;
				if (j < 0) j = grd_.RCi;
				v = v - grd_.Siz;
			}
			grd_.Nor = grd_.Nor - grd_.Stp;
			if (grd_.Nor < 0) grd_.Nor = grd_.Nor + grd_.RCs;
			if (grd_.Typ == 0) grd1_.NSA = grd1_.NSA - 1;
			if (grd_.Typ == 1) {
				grd_.NSA = grd_.NSA + grd_.Stp;
				grd2_.NSA = grd2_.NSA - 1;
			}
			if (grd_.Typ == 2) grd2_.NSA = grd2_.NSA + grd_.Stp;
		}
	}
	if (grx_.MSP.z > 0) {					// If Moving North
		j = grd_.Nor + 1;
		if (j > grd_.RCi) j = 0;
		if (grd_.MZV[j] <= min) {
			v = max-(min-grd_.MZV[j]);
			for (let i = 0; i < grd_.Stp; i++) {
				grd_.MZV[j] = v;
				j++;
				if (j > grd_.RCi) j = 0;
				v = v + grd_.Siz;
			}
			grd_.Nor = grd_.Nor + grd_.Stp;
			if (grd_.Nor > grd_.RCi) grd_.Nor = grd_.Nor - grd_.RCs;
			if (grd_.Typ == 0) grd1_.NSA = grd1_.NSA + 1;
			if (grd_.Typ == 1) {
				grd_.NSA = grd_.NSA - grd_.Stp;
				grd2_.NSA = grd2_.NSA + 1;
			}
			if (grd_.Typ == 2) grd2_.NSA = grd2_.NSA - grd_.Stp;
		}
	}
	// Test East/West
	if (grx_.MSP.x < 0) {					// If Moving West
		j = grd_.Est;
		if (grd_.MXV[j] >= max) {
			v = min+(grd_.MXV[j]-max);
			for (let i = 0; i < grd_.Stp; i++) {
				grd_.MXV[j] = v;
				j = j - 1;
				if (j < 0) j = grd_.RCi;
				v = v - grd_.Siz;
			}
			grd_.Est = grd_.Est - grd_.Stp;
			if (grd_.Est < 0) grd_.Est = grd_.Est + grd_.RCs;
			if (grd_.Typ == 0) grd1_.EWA = grd1_.EWA - 1;
			if (grd_.Typ == 1) {
				grd_.EWA = grd_.EWA + grd_.Stp;
				grd2_.EWA = grd2_.EWA - 1;
			}
			if (grd_.Typ == 2) grd2_.EWA = grd2_.EWA + grd_.Stp;
		}
	}
	if (grx_.MSP.x > 0) {						// If Moving East
		j = grd_.Est + 1;
		if (j > grd_.RCi) j = 0;	
		if (grd_.MXV[j] <= min) {
			v = max-(min-grd_.MXV[j]);
			for (let i = 0; i < grd_.Stp; i++) {			
				grd_.MXV[j] = v;
				j++;
				if (j > grd_.RCi) j = 0;
				v = v + grd_.Siz;
			}
			grd_.Est = grd_.Est + grd_.Stp;
			if (grd_.Est > grd_.RCi) grd_.Est = grd_.Est - grd_.RCs;
			if (grd_.Typ == 0) grd1_.EWA = grd1_.EWA + 1;
			if (grd_.Typ == 1) {
				grd_.EWA = grd_.EWA - grd_.Stp;
				grd2_.EWA = grd2_.EWA + 1;
			}
			if (grd_.Typ == 2) grd2_.EWA = grd2_.EWA - grd_.Stp;
		}
	}
	// Set Position
	let n = 0;
	for (let r = 0; r < grd_.RCs; r++) {	// Row
		for (let c = 0; c < grd_.RCs; c++) {	// Col
			grd_.Ptr[n].position.set(grd_.MXV[c],-grx_.MSP.y,-grd_.MZV[r]);
			if (grd_.Typ > 0) grd_.Ptr[n].position.y = -grx_.MSP.y-grx_.WMx;
			grd_.Ptr[n].visible = true;	// Default for Outer Grid
			n++;
		}
	}
	// Outer Grids Only - Make Cut-Out Area Invisible
	if (grd_.Typ > 0) {
		let r = grd_.Nor + 1 + grd_.NSA;		// Get Lower index
		if (r > grd_.RCi) r = r - grd_.RCs;
		let c = grd_.Est + 1 + grd_.EWA;		// Get Left Index
		if (c > grd_.RCi) c = c - grd_.RCs;
		for (let i = 0; i < grd_.RCF; i++) {
			n = r * grd_.RCs + c;
			if (n < 0) n = n + grd_.Num;
			if (n > grd_.Num) n = n - grd_.Num;
			let n2 = (r+1) * grd_.RCs - 1;
			if (n2 > grd_.Num) n2 = n2 - grd_.Num;
			if (n2 < 0) n2 = n2 + grd_.Num;
			for (let j = 0; j < grd_.RCF; j++) {
				grd_.Ptr[n].visible = false;
				n++;
				if (n > n2) n = n - grd_.RCs; 
				if (n < 0) n = n + grd_.Num;
				if (n > grd_.Num) n = n - grd_.Num;
			}
			r++;
			if (r > grd_.RCi) r = r - grd_.RCs;
		}
	}
}

export {GrdMap};

/*= REVISIONS ================================================================*/
//- 230530	Moved Grid Definitions into Module
//- 230531	Created this generalized version of GrdWtr.
//			Routines in Main Program now handle creation of Geometry and Materials
//			(You can now use this for animated and non-animated Ocean)
		
