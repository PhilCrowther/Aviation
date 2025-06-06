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

//= 2. SKY VARIABLES ===========//==============================================
let sky_ = {
		// Sun
		SunCol: "white",		// Sun
		SunInt: 3,
		// Fog
		FogCol: 0xbab4a6,		// Sky (for Fog only)
		// SkyBox
		SBxSrc: "https://PhilCrowther.github.io/Aviation/textures/cube/skyboxsun25deg/",
		envMap: 0,				// For this SkyBox
		// Sun (position in SkyBox)
		SunLat: 23,				// Direction - Vert (+/- 90) deg
		SunLon: 312,			// Direction - Horz (0->360) deg
		//	LensFlare		
		LF0Src: "https://threejs.org/examples/textures/lensflare/lensflare1.png",
		LF1Src: "https://threejs.org/examples/textures/lensflare/lensflare3.png",
		LF0Txt: 0,
		LF1Txt: 0,
		// Shadow Beg Info
		SunDst: 50,				// Distance
		ShdBox: 6,				// Size of shadow box
		ShdBLR: 6.5,
		ShdBTB: 4,
		ShdDst: 1500,			// Shadow Distance (meters)
	}

//= MY AIRPLANE ================//==============================================
//- Load Models and Animations -------------------------------------------------
//-	File Path
let AirSrc = "https://PhilCrowther.github.io/Aviation/models/pup/";	// Used to load models and sounds
//-	Animation Mixers - External Model
let ACFile = "pup_flyt_npa.glb"; // Name of aircraft model file (rotated blender file)

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

//=	MY SOUNDS ==================//==============================================
let mys_ = {
		AirMsh:	0,				// For Engine and Prop
		// Engine Sound - Idle
		IdlSrc: AirSrc + "sounds/xrpm1.wav",
		IdlSnd: 0,				// Address
		IdlVol: 0.5,			// Volume
		// Engine Sound	
		EngSrc: AirSrc + "sounds/pup.mp3",
		EngSnd: 0,				// Address
		EngVol: 0.2,			// Volume
	}

//= 8. OUTPUT VARIABLES ========//==============================================

//- HTML OVERLAY TEXT ----------//----------------------------------------------
let Air_PwrElement = document.getElementById("Air_Pwr");
let Air_PwrNode = document.createTextNode("");
	Air_PwrElement.appendChild(Air_PwrNode);
let Air_SpdElement = document.getElementById("Air_Spd");
let Air_SpdNode = document.createTextNode("");
	Air_SpdElement.appendChild(Air_SpdNode);
let Air_HdgElement = document.getElementById("Air_Hdg");
let Air_HdgNode = document.createTextNode("");
	Air_HdgElement.appendChild(Air_HdgNode);
let Air_AltElement = document.getElementById("Air_Alt");
let Air_AltNode = document.createTextNode("");
	Air_AltElement.appendChild(Air_AltNode);
let Air_CfLElement = document.getElementById("Air_CfL");
let Air_CfLNode = document.createTextNode("");
	Air_CfLElement.appendChild(Air_CfLNode);
let On_PawsElement = document.getElementById("On_Paws");
let On_PawsNode = document.createTextNode("");
	On_PawsElement.appendChild(On_PawsNode);
let Air_AtPElement = document.getElementById("Air_AtP");	// Autopilot
let Air_AtPNode = document.createTextNode("");
	Air_AtPElement.appendChild(Air_AtPNode);
let On_Inf0Element = document.getElementById("On_Inf0");
let On_Inf0Node = document.createTextNode("");
	On_Inf0Element.appendChild(On_Inf0Node);
let On_Inf1Element = document.getElementById("On_Inf1");
let On_Inf1Node = document.createTextNode("");
	On_Inf1Element.appendChild(On_Inf1Node);
let On_Inf2Element = document.getElementById("On_Inf2");
let On_Inf2Node = document.createTextNode("");
	On_Inf2Element.appendChild(On_Inf2Node);
let On_Inf3Element = document.getElementById("On_Inf3");
let On_Inf3Node = document.createTextNode("");
	On_Inf3Element.appendChild(On_Inf3Node);
let On_Inf4Element = document.getElementById("On_Inf4");
let On_Inf4Node = document.createTextNode("");
	On_Inf4Element.appendChild(On_Inf4Node);
let On_Inf5Element = document.getElementById("On_Inf5");
let On_Inf5Node = document.createTextNode("");
	On_Inf5Element.appendChild(On_Inf5Node);
let On_Inf6Element = document.getElementById("On_Inf6");
let On_Inf6Node = document.createTextNode("");
	On_Inf6Element.appendChild(On_Inf6Node);
let On_Inf7Element = document.getElementById("On_Inf7");
let On_Inf7Node = document.createTextNode("");
	On_Inf7Element.appendChild(On_Inf7Node);
let On_Inf8Element = document.getElementById("On_Inf8");
let On_Inf8Node = document.createTextNode("");
	On_Inf8Element.appendChild(On_Inf8Node);
//
let Air_Pwr, Air_Spd, Air_Hdg, Air_Alt, Air_CfL;
let On_Paws, On_Inf0, On_Inf1, On_Inf2, On_Inf3, On_Inf4, On_Inf5, On_Inf6, On_Inf7, On_Inf8;

//= 9. INPUT VARIABLES =========//==============================================

//- DEFAULT KEY BINDINGS -------//----------------------------------------------
let key_ = {
		PwLU:  87,				// Power Up (w) - keyboard left
		PwLD:  81,				// Power Down (q) - keyboard left
		PwRU: 187,				// Power Up (=) - keyboard right
		PwRD: 189,				// Power Down (-) - keyboard right
		BnkL:  37,				// Bank Left (left arrow) - autopilot only
		BnkR:  39,				// Bank Right (right arrow) - autopilot only
		PitU:  40,				// Pitch up (down arrow) - autopilot only
		PitD:  38,				// Pitch down (up arrow) - autopilot only
		YwLL:  90,				// Yaw Left (z) - keyboard left
		YwLR:  88,				// Yaw Left (x) - keyboard left
		YwRL: 188,				// Yaw Left (,) - keyboard right
		YwRR: 190,				// Yaw Left (.) - keyboard right
		Brak:  66,				// Brakes (b)
		Guns:  32,				// Guns (spacebar)
		//	Views
		Look:  16,				// Pan (shift)
		VU45: 104,				// View Up (alone or modifier)
		VD45: 101,				// View Down (alone or modifier)
		VL45: 103,				// Left 45 degrees
		VR45: 105,				// Right 45 degrees
		VL90: 100,				// Left 90 degrees
		VR90: 102,				// Right 90 degrees
		//	Toggle
		Soun:  83,				// Toggle sound (s)
		Paws:  80,				// Pause (p)
		Auto:  65,				// Autopilot (a)
		Info:  73,				// Info (i)
		// Flags
		U45flg: 0,				// Up 45 degrees
		D45flg: 0,				// Down 45 degrees
		L45flg: 0,				// Left 45 degrees
		R45flg: 0,				// Right 45 degrees
		L90flg: 0,				// Left 90 degrees
		R90flg: 0,				// Right 90 degrees
};

//- POINTER LOCK CONTROL -------//----------------------------------------------
//	Variables
let InpMos = 0;					// Mouse Inputs
let _changeEvent = {type: "change"};
let _lockEvent = {type: "lock"};
let _unlockEvent = {type: "unlock"};
