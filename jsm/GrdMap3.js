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

/*= PROGRAM ==================================================================*/

let GrdMap = function (grd_, scene) {

/*- Grid 0 -------------------------------------------------------------------*/
	grd_.Grx[0] = {
		Typ:	0,					// Type of Grid - Inner or Outer
		RCs:	grd_.RCs,			// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	grd_.Siz,			// Size of square
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
	}
/*- Grid 1 -------------------------------------------------------------------*/
	grd_.Grx[1] = {
		Typ:	1,					// Type of Grid - Inner or Outer
		RCs:	16,					// Rows and Columns - use odd number (for now = divisible by 3)
		Siz:	grd_.Grx[0].Siz*grd_.Grx[0].Stp,	// Size of square
		Stp:	4,					// Steps (### changed)
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
	}
/*- Grid 2 -------------------------------------------------------------------*/
	grd_.Grx[2] = {
		Typ:	2,					// Type of Grid - Inner or Outer
		RCs:	16,					// Rows and Columns - use odd number (for now = divisible by 3)
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

/* Init Moving Map (Ocean) --------------------------------------*/

function init1GrMap(grx_, grd_, scene) {
	// Load Variables
	grx_.RCi = grx_.RCs-1;				// Max Index Value
	grx_.MZV[grx_.RCi] = 0;				// Z-Values
	grx_.MXV[grx_.RCi] = 0;				// X-Values
	grx_.Nor = grx_.RCi;				// Max North Square (updated)
	grx_.Est = grx_.RCi;				// Max East Square (updated)
	grx_.Num = grx_.RCs * grx_.RCs;		// Size of array
	grx_.Ptr[grx_.Num-1] = 0;			// Mesh Pointers
	if (grx_.Typ > 0) {
		grx_.NSA = (grx_.RCs-grx_.RCF)/2;	// (27-3=6)
		grx_.EWA = grx_.NSA;
	}
	// Compute Starting Z and X Values
	let zx = -0.5*(grx_.RCs)*grx_.Siz+0.5*grx_.Siz;
	for (let i = 0; i < grx_.RCs; i++) {
		grx_.MZV[i] = zx;
		grx_.MXV[i] = zx;
		zx = zx + grx_.Siz;
	}
	// Load Geometry and Material
	let geometry = grd_.Geo[grx_.Typ];
	let material = grd_.Mat[grx_.Typ];
	// Set Starting Position of Squares
	let n = 0;
	for (let z = 0; z < grx_.RCs; z++) {		// Row
		for (let x = 0; x < grx_.RCs; x++) {	// Column
			grx_.Ptr[n] = new Mesh(geometry,material);
			if (grx_.Shd == 1) grx_.Ptr[n].receiveShadow = true;
			scene.add(grx_.Ptr[n]);
			grx_.Ptr[n].position.set(grx_.MXV[x],-grd_.SPS.y,-grx_.MZV[z]);
			if (grx_.Typ > 0) grx_.Ptr[n].position.y = grx_.Ptr[n].position.y-grd_.WMx;
			n++;
		}
	}
}

/* Move Moving Map ----------------------------------------------*/

function move1GrMap(grx_, grd_) {
	let grd1_ = grx_.Grx[1];
	let grd2_ = grx_.Grx[2];
	let j, v = 0;
	let max = 0.5*grx_.RCs*grx_.Siz;
	let min = -max;
	// Update ZX
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
			if (grx_.Typ > 0) grx_.Ptr[n].position.y = -grd_.SPS.y-grd_.WMx;
			grx_.Ptr[n].visible = true;	// Default for Outer Grid
			n++;
		}
	}
	// Outer Grids Only - Make Cut-Out Area Invisible
	if (grx_.Typ > 0) {
		let r = grx_.Nor + 1 + grx_.NSA;		// Get Lower index
		if (r > grx_.RCi) r = r - grx_.RCs;
		let c = grx_.Est + 1 + grx_.EWA;		// Get Left Index
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

export {GrdMap};

/*= REVISIONS ================================================================*/
//- 230530	Moved Grid Definitions into Module
//- 230531	Created this generalized version of GrdWtr.
//			Routines in Main Program now handle creation of Geometry and Materials
//			(You can now use this for animated and non-animated Ocean)
		