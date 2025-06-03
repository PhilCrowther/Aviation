//= PRE-LOAD DATA ==============================================================
//	No three.js routines allowed since three.js has not been loaded yet.

/*******************************************************************************
*
*	INDEX TO VARIABLES
*
*******************************************************************************

	1. MAIN VARIABLES
	   Constants
	   Input Values					(gen_)
	   Fad2Black					(f2b_)
	2. SKY VARIABLES				(sky_)
	3. OCEAN GRID VARIABLES
		GRDWTR MODULE				(grd_)
		OCEAN MODULE				(wav_)
	4. OBJECT VARIABLES
		SHARED TEXTURES				(txt_)
		STATIC OBJECTS
			Islands					(isl_)
			Fixed Objects			(fxd_)
		MOVING VEHICLES
			Moving Airplanes		(xac_)
			Moving Ships			(xsh_)
		ANIMATED FLAG				(flg_)
		AIRPLANE EXPLOSION			(xae_)
	    SMOKE MODULE
	    	Volcano Smoke			(grs_)
	    	Ground Fire				(grf_)
	    	Airplane Smoke Trail	(xas_)
	    	Airplane Fire Trail		(xaf_)
	    	Ship Wakes				(wak_)
		MYPEOPLE					(myp_)
		MYCREW						(myc_)
		MINIMUM ALTITUDE			(alt_)
	5. MY AIRPLANE VARIABLES		(air_)
		FLIGHT MODULE
		ANIMFM2 MODULE				(anm_,mxr_,vxr_)
	x. GUNASG MODULE
			My Guns					(myg_)
			Moving Airplanes		(xag_)
			Moving Ships			(xsg_)
			Fixed Guns				(aaf_)
	6. SOUND VARIABLES
		My Sounds					(mys_)
		Radio Variables				(rad_)
	7. CAMERA VARIABLES				(cam_)
	8. OUTPUT VARIABLES
	9. INPUT VARIABLES
	   Pointer Lock Control
*/

/*******************************************************************************
*
*	VARIABLES
*
*******************************************************************************/

//= 1. MAIN VARIABLES ==========//==============================================

//- CONSTANTS ------------------//----------------------------------------------
//	Conversions
const DegRad = Math.PI/180;		// Convert Degrees to Radians
const RadDeg = 180/Math.PI;		// Convert Radians to Degrees
const Ft2Mtr = 0.3048;			// Convert Feet to Meters
const Mtr2Ft = 1/Ft2Mtr;		// Meters to Feet
const Km2Mil = 0.621371;		// Kilometers to Miles
const Mil2Km = 1.60934;			// Miles to Kilometers
const MtrMil = 1609.34;			// Meters per Mile
//	Environmental
const GrvMPS = 9.80665; 		// Gravity (mps)
const BegTmp = 288.15;			// K = 59F (loaded into _air)
// These values could also be used by modules, but that would require that all 
// module users also create a data file - which complicates the use of modules.

//- GENERAL VARIABLES ----------//----------------------------------------------

let gen_ = {
		//- Flght Controls
		PwrMul:	0.0005,			// Power % Input - Mouse Multiplier
		PwrDif:	0,				// Power % Input - Value
		InpBrk:	0,				// Brakes
		//- Display
		PawsOn:	0,				// Pause
		InfoOn:	0,				// Info
		SndFlg:	0,				// Sound (0 = off; 1 = on)
		StatOn:	1,				// Stats (0 = off, 1 = on)
		LnFFlg:	1,				// Lensflare
		//	Program Flags
		LodFlg:	0,				// Set at end of initialization
		LodSnd:	0,				// Set when sound initialized
		MYGFlg:	0,				// My Guns (1 = firing)
		//	Altitude Adjustment
		AltAdj:	0.99,			// Raises objects above map as altitude increases
		AltDif:	0,
	}

let tim_ = {
		DLTime: 1/60,
		DLTim2: 0,
		GrvDLT: 0,
		NowTim: 0,
		DifTim: 0,
	}

//- Fade2Black Values -----------//----------------------------------------------
//	If FadBeg > 0, Prop Invisible.
//	Therefore, limit use to where Prop would be invisible.
let f2b_ = {
		Flr: 0.25,
		Beg: 0.99,
		End: 0.25,
		Spd: 0.005,
		Mat: 0,
		Col: "black",
		Msh: 0,
	}

//= GUNASG MODULE ==============//==============================================
//	Lewis .303 caliber
//	BulSpd = 744;				// Muzzle velocity [mps]
//	BulDLT = 0.5;				// Bullet Maximum Time in Flight

//- My Guns --------------------//----------------------------------------------
let myg_ = {
		// Data
		BulSpd: 744,			// Muzzle Velocity (mps)
		BulDLT: 0.5,			// Max Bullet Time in Flight
		BulNum: 16,				// Number of Tracers
		BulSpc: 0.125,			// Bullet Spacing (4*BulDLT/BulNum)
		BulSp2: 0.125,			// Bullet Spacing - time remaining
		// Object
		BulClr: 0,				// Red (Vector2)
		BulPtr: [0],			// Bullet Objects
		BulMpS: [0],			// Bullet Speed
		BulTim: [0],			// Bullet Time in Flight
		// Sound
		ObjNum: 1,				// Number of Barrels
		ObjPos: [0],			// Position of Each Barrel
		SndSrc: 0,				// File (my guns)
		SndPtr: [0],			// For Each Gun
		SndVol: 0.5,			// Volume
		SndMsh: [0],			// For Each Gun
		// HitBox
		HitTgt: 1,				// Hit Target (1 = enemy airplane)
		HitDst: 10,				// Hit Radius
	}

