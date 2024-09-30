//= PRE-LOAD DATA ==============================================================
//	No three.js routines allowed since three.js has not been loaded yet.

//= IMPORTS ====================================================================
// Basic Modules
import * as THREE from "three";
import {MeshBasicNodeMaterial,MeshLambertNodeMaterial,MeshPhongNodeMaterial,
		MeshStandardNodeMaterial,SpriteNodeMaterial,LineBasicNodeMaterial,
		color,texture,attribute,timerLocal,range,positionLocal,uv,mix,
		rotateUV	//r168
} from "three/tsl";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {LensflareMesh,LensflareElement } from "three/addons/objects/LensflareMesh.js";
import Stats from "stats-gl";
// Special Modules
import {Flight,Mod360,PoM360,MaxVal,makMsh} from "https://PhilCrowther.github.io/Aviation/jsm/Flight4.js";
import {loadACanimX,loadACanimV,moveACanimX,moveACanimV} from "https://PhilCrowther.github.io/Aviation/jsm/AnimFM2.js";
import {GrdMap} from "https://PhilCrowther.github.io/Aviation/jsm/GrdWtr4a.js";
import {Ocean} from "https://PhilCrowther.github.io/Aviation/jsm/Ocean4t.js";
import {grd_,wav_} from "https://PhilCrowther.github.io/Aviation/data/mod_fsim_FM2_ocean_gpu.js";

//= CONSTANTS ==================================================================
//	Time
let	DLTime = 1/60;			// Delta Time (1/60 seconds)
let DLTim2 = DLTime*DLTime;
//	Conversions
let DegRad = Math.PI / 180;	// Convert Degrees to Radians
let RadDeg = 180/Math.PI;	// Convert Radians to Degrees
let Ft2Mtr = 0.3048;		// Convert Feet to Meters
let Mtr2Ft = 1/0.3048;
let Km2Mil = 0.621371;
let Mil2Km = 1.60934;
let MtrMil = 1609.34;		// Meters per Mile
//	Default Constants
let	GrvMPS = 9.80665; 		// Gravity (mps)
//	Starting Constants per frame
let GrvDLT = GrvMPS*DLTim2;

//= INPUT VALUES ===============================================================
//	Program Flags
let LodFlg = 0;
//	Altitude Adjustment
let AltAdj = 0.99;			// Raises objects above map as altitude increases
//	Animations
let anmfps = 24;			// Blender FPS
let aoarng = 20;			// AoA range (model)

//= SKY VALUES =================================================================
//- SkyBox
let SBxSrc = "https://threejs.org/examples/textures/cube/skyboxsun25deg/";
//- Fog
let FogCol = 0xbab4a6;			// Sky (for Fog only)
//- Sun
let SunLat = 23;			// Direction - Vert (+/- 90)
let SunLon = 312;			// Direction - Horz (0->360)
let SunCol = "white";		// Sun
let SunInt = 3;				// Default intensity of light/sun
let SunDst = 10000;			// Distance (for shadows and lensflare)
//-	LensFlare
let LF0Src = "https://threejs.org/examples/textures/lensflare/lensflare1.png";
let LF1Src = "https://threejs.org/examples/textures/lensflare/hexangle.png";
let LF0Txt, LF1Txt = 0;
//-	Shadows
let ShdBox = 25;			// Size of shadow box
let ShdDst = 5000;			// [feet] for shadow

//= GRDWTR TEXTURES ============================================================
//- Textures
let DifSrc = "https://PhilCrowther.github.io/Aviation/textures/ocean/transition1F.png";
let RufSrc = "https://PhilCrowther.github.io/Aviation/textures/ocean/transition5.png";
let	NrmSrc = "https://threejs.org/examples/textures/waternormals.jpg";	// Size = 1024x1024
//- Canvas (for splitting up textures)
let ImgSiz = 512;			// !!! Change this for each image
let canvas = document.createElement("canvas");
	canvas.width = ImgSiz;
	canvas.height = ImgSiz;
let context = canvas.getContext('2d',{willReadFrequently: true});
	context.translate(0, ImgSiz); // Flips vertical for three.js
	context.scale(1,-1);

//= OCEAN ======================================================================
let grids = 0;						// GrdWtr Module
let waves = 0;						// Ocean Module

//= ISLANDS ====================//==============================================


//= MINIMUM ALTITUDE (Base) ====//==============================================
//	Base (Centered at 0,0)
let BasAlt = 8.8392;			// 29 ft
	BasAlt = 8.25; 
let BasXlf = -635;				
let BasXrt = -585;
let BasZfr =  410;
let BasZbk = -335;

//= TRAFFIC ====================================================================
//- Airplane -------------------------------------------------------------------
let XPPath = "https://PhilCrowther.github.io/Aviation/models/vehicles/";
let XPFile = "fm2_flyt_xp1.glb";	// Name of airplane model file (rotated blender file)
//	Sounds
let xpsnd1 = "fm2_prop.wav";	// File (xp prop)
let xpvol1 = 1.0;				// Volume
//- Aircraft Carrier -----------------------------------------------------------
let XSPath = "https://PhilCrowther.github.io/Aviation/models/vehicles/";	// Other Planes
let XSFile = "CVE_noflag.glb";
//. Flag .......................................................................
let FlgSrc = "https://PhilCrowther.github.io/Aviation/models/vehicles/textures/USA.png"
//. Wake .......................................................................
let WakSrc = "https://PhilCrowther.github.io/Aviation/textures/fx/smoke1.png";
let WakMap = 0;

//= MINIMUM ALTITUDE (CVE) =====//==============================================
//	(Centered at CVEMsh)
let CVEAlt = 13.2;				// 43.267 ft
let CVEXlf = -13.2;				// 43.267 ft
let CVEXrt = 13.2;				// 43.267 ft
let CVEZfr = 70.5;				// ?? ft
let CVEZbk = -70.5;				// ?? ft

//= FM2 WILDCAT DATA ===========================================================
let data_ = {
		// Lift
		WingSp: 11.58,		// Wing Span (m)
		WingAr: 24.15,		// Wing Area (m2)
		WingEf: 0.75,		// Wing Efficiency
		AngInc: 5,			// Angle of Incidence
		GrvMax: 8,			// Maximum G-Force
		TrmAdj: 2.5,		// Elevator Trim Adjustment (### - not used)
		// Gravity
		ACMass: 3400,		// Aircraft Mass (kg)
		// Thrust: Prop
		PwrMax: 1007,		// Prop Maximum Power (kW)
		PropEf: 0.8,		// Prop Efficiency
		WEPMax: 0,			// War Emergency Power (kW)
		// Thrust: Jet
		JetMax: 0,			// Jet Maximum Thrust (kW)
		AftMax: 0,			// Jet Afterburner Maximum Thrust (kW)
		// Drag
		DrgCd0: 0.0211,		// Coefficient of Drag
		// Taildragger Geometry and Speed
		Ax2CGD: 1.6667,		// Axle to CG distance (m)
		Ax2CGA: 330,		// Axle to CG angle (deg)
		WheelR: 0.3048,		// Wheel radius (m)
		TDrAng: 11,			// Taildragger Max Angle (deg)
		TDrSpd: 11.176,		// Speed at which tail lifts (25 mph = 11.18 m/s)
		// Optional: Flaps
		FlpCfL: 0.28,		// Max Flap Cfl (0.2*CfLMax) (shared with main program)
		DrgCdf: 0.01,		// Coefficient of Drag - Flaps
		FlpAIn: 10,			// Max Flap Angle of Incidence (2*AngInc)
		// Optional: Landing Gear Retractable
		DrgCdg: 0.005,		// Coefficient of Drag - Gear
		// Optional: Spoiler
		SplCfL: 0,			// Max Spoiler CfL (### - not used)
		DrgCds: 0,			// Coefficient of Drag - Spoiler
		// Optional: Airbrake	
		DrgCdb: 0,			// Coefficient of Drag - Airbrake
		// Controls (shared with air_. and main program)
		CfLMax: 1.4,		// Maximum Coefficient of Lift
		BnkMax: 1,			// Maximum bank rate	
	}
//- Load Models and Animations -------------------------------------------------
//	File Path
let AirSrc = "https://PhilCrowther.github.io/Aviation/models/fm2/";	// Used to load models and sounds
//	Animation Mixers - External Model
let AirFNm = "fm2_flyt_caf_npa.glb"; // Name of airplane model file (rotated blender file)
//	Animation Mixers - Internal Model
let VCFile = "fm2_flyt_vcp_npa.glb"; // Name of airplane model file (rotated blender file)

//- Play Animations ------------------------------------------------------------
//	Animation Positions (all range from 0 to 360 with center at 180)
let anm8ac = anm8vr = 0;
let anm_ = {
		anmfps: anmfps,			// Blender FPS
		spnprp: 180,			// SpinProp 	degrees = 0 to 360
		rudder: 180,			// Rudder 		degrees = +/- 360
		elvatr: 180,			// Elevator 	degrees = +/- 360
		aillft: 180,			// AileronL 	degrees = +/- 360
		ailrgt: 180,			// AileronR 	degrees = +/- 360
		flppos: 180,			// Flaps 		degrees = 0 to 180
		lngpos: 0,				// Landing Gear degrees = 0 to 180
		canpos: 180,			// Canopy 		degrees = 0 to 180
		thkpos: 180,			// Tailhook 	degrees = 0 to 180
		cmphdg: 0,				// Compass Heading
		atiarr: 180,			// Attitude - Arrow
		atibnk: 0,				// Attitude - Bank
		atipit: 180,			// Attitude - Pitch
		altft0: 0,				// Altitude - feet
		altft1: 0,				// Altitude - feet X 1000
		spdmph: 0,				// Speed - MPH
		vsifpm: 0,				// Vertical Speed - fpm
		manprs: 0,				// Manifold Pressure
		rpmprp: 0,				// Propeller RPM
		hdgdif: 180,			// Change in heading
		yawval: 180,			// Slip indicator
		stkpit: 180,			// Joystick pitch
		stkpcm: 0,				// cumulative
		stkbnk: 180,			// Joystick bank
		stkbcm: 0,				// cumulative
		vchead: 0,				// Pilot head
		// Gear and Flap				
		lngspd: 0,				// Change in Gear
		flpspd: 0,				// Change in Flaps
		canspd: 0,				// Change in Canopy
		thkspd: 0,				// Change in Canopy
		// Flags
		lngflg: 0,				// Gear (up.down)
		flpflg: 0,				// Flap (up/down)
		canflg: 0,				// Canopy (up/down)
		thkflg: 0,				// Tailhook (up/down)
	}
//- Bullets --------------------------------------------------------------------
//	M2 Browning .50 caliber
let GunFlg = 0;
let BulNum = 16;				// Number of bullets
let BulSpd = 887;				// Muzzle velocity [mps = 2910 fps]
let BulDLT = 0.5;				// Life of bullet
let BulSpc = 4*BulDLT/BulNum;	// Bullet spacing
let BulSp2 = BulSpc;			// Bullet spacing time remaining
let BulPtr = [0];				// Addresses of bullet objects
	BulPtr[BulNum-1] = 0;
let BullSX = [0];				// Speed
	BullSX[BulNum-1] = 0;
let BullSY = [0];
	BullSY[BulNum-1] = 0;
let BullSZ = [0];
	BullSZ[BulNum-1] = 0;
let BullPX = [0];				// Position
	BullPX[BulNum-1] = 0;
let BullPY = [0];
	BullPY[BulNum-1] = 0;
let BullPZ = [0];
	BullPZ[BulNum-1] = 0;
let BulTim = [0];				// Time in flight
	BulTim[BulNum-1] = 0;
//-	Sounds ---------------------------------------------------------------------
let EngSrc = "fm2.wav";				// File (my engine)
let EngVol = 0.1;					// Volume
let PrpSrc = "fm2_prop.wav";		// File (my prop)
let PrpVol = 0.5;					// Volume
let GunSrc = "fm2_gun.mp3";			// File (my guns)
let GunVol = 0.5;					// Volume

//= DEFAULT KEY BINDINGS =======================================================
//	Basic
let K_PwLU =  87;	// Power Up (w) - keyboard left
let K_PwLD =  81;	// Power Down (q) - keyboard left
let K_PwRU = 187;	// Power Up (=) - keyboard right
let K_PwRD = 189;	// Power Down (-) - keyboard right
let K_BnkL =  37;	// Bank Left (left arrow) - autopilot only
let K_BnkR =  39;	// Bank Right (right arrow) - autopilot only
let K_PitU =  40;	// Pitch Up (down arrow) - autopilot only
let K_PitD =  38;	// Pitch Down (up arrow) - autopilot only
let K_YwLL =  90;	// Yaw Left (z) - keyboard left
let K_YwLR =  88;	// Yaw Left (x) - keyboard left
let K_YwRL = 188;	// Yaw Left (,) - keyboard right
let K_YwRR = 190;	// Yaw Left (.) - keyboard right
let K_Brak =  66;	// Brakes (b)
let K_Guns =  32;	// Guns (spacebar)
//	Additional
let K_Flap =  70;	// Flaps (f)
let K_Gear =  71;	// Landing Gear (g)
let K_Hook =  72;	// Tailhook (h)
let K_Canp =  67;	// Canopy (c)
//	Views
let K_Look =  16;	// Pan (shift)
let K_VU45 =  36;	// View Up (alone or modifier)
let K_VD45 =  35;	// View Down (alone or modifier)
let K_VL45 =  33;	// Left 45 degrees
let K_VR45 =  45;	// Right 45 degrees
let K_VL90 =  34;	// Left 90 degrees
let K_VR90 =  46;	// Right 90 degrees
//	Toggle
let K_Vizz =  86;	// Toggle Visibility (v)
let K_Soun =  83;	// Toggle sound (s)
let K_Paws =  80;	// Pause (p)
let K_Auto =  65;	// Autopilot (a)
let K_Info =  73;	// Info (i)

//=	VIEW KEYS ==================================================================
let U45flg = 0;		// Up 45 degrees
let D45flg = 0;		// Down 45 degrees
let	L45flg = 0;		// Left 45 degrees
let R45flg = 0;		// Right 45 degrees
let L90flg = 0;		// Left 90 degrees
let R90flg = 0;		// Right 90 degrees

//= HTML OVERLAY TEXT ==========================================================
let Air_PwrElement = document.getElementById("Air_Pwr");	// Power
let Air_PwrNode = document.createTextNode("");
	Air_PwrElement.appendChild(Air_PwrNode);
let Air_SpdElement = document.getElementById("Air_Spd");	// Speed
let Air_SpdNode = document.createTextNode("");
	Air_SpdElement.appendChild(Air_SpdNode);
let Air_AltElement = document.getElementById("Air_Alt");	// Altitude
let Air_AltNode = document.createTextNode("");
	Air_AltElement.appendChild(Air_AltNode);
let Air_HdgElement = document.getElementById("Air_Hdg");	// Heading
let Air_HdgNode = document.createTextNode("");
	Air_HdgElement.appendChild(Air_HdgNode);
let Air_CfLElement = document.getElementById("Air_CfL");	// CfLift
let Air_CfLNode = document.createTextNode("");
	Air_CfLElement.appendChild(Air_CfLNode);
let On_PawsElement = document.getElementById("On_Paws");	// Pause
let On_PawsNode = document.createTextNode("");
	On_PawsElement.appendChild(On_PawsNode);
let Air_AtPElement = document.getElementById("Air_AtP");	// Autopilot
let Air_AtPNode = document.createTextNode("");
	Air_AtPElement.appendChild(Air_AtPNode);
let On_Info01Element = document.getElementById("On_Info01"); // Info
let On_Info01Node = document.createTextNode("");
	On_Info01Element.appendChild(On_Info01Node);
let On_Info02Element = document.getElementById("On_Info02");
let On_Info02Node = document.createTextNode("");
	On_Info02Element.appendChild(On_Info02Node);
let On_Info03Element = document.getElementById("On_Info03");
let On_Info03Node = document.createTextNode("");
	On_Info03Element.appendChild(On_Info03Node);
let On_Info04Element = document.getElementById("On_Info04");
let On_Info04Node = document.createTextNode("");
	On_Info04Element.appendChild(On_Info04Node);
let On_Info05Element = document.getElementById("On_Info05");
let On_Info05Node = document.createTextNode("");
	On_Info05Element.appendChild(On_Info05Node);
let On_Info06Element = document.getElementById("On_Info06");
let On_Info06Node = document.createTextNode("");
	On_Info06Element.appendChild(On_Info06Node);
let On_Info07Element = document.getElementById("On_Info07");
let On_Info07Node = document.createTextNode("");
	On_Info07Element.appendChild(On_Info07Node);
let On_Info08Element = document.getElementById("On_Info08");
let On_Info08Node = document.createTextNode("");
	On_Info08Element.appendChild(On_Info08Node);
let On_Info09Element = document.getElementById("On_Info09");
let On_Info09Node = document.createTextNode("");
	On_Info09Element.appendChild(On_Info09Node);
//
let Air_Pwr, Air_Spd, Air_Hdg, Air_Alt, Air_CfL;
let On_Paws, Air_AtP, On_Info01, On_Info02, On_Info03, On_Info04, On_Info05, On_Info06, On_Info07, On_Info08;

//= INPUT VALUES ===============//==============================================
//- Display
let PawsOn = 0;					// Pause
let InfoOn = 0;					// Info
let SndFlg = 0;

//= OUTPUT VALUES ==============================================================

//-	Pause ----------------------------------------------------------------------
function PawsText(){
	if (PawsOn) On_PawsNode.nodeValue = "Paused";
	else {On_PawsNode.nodeValue = "Pause: Press P";}
}

//- INFO -----------------------------------------------------------------------

function InfoText() {
	if (InfoOn == 0) onInfo0();
	else if (InfoOn == 1) onInfo1();
	else if (InfoOn == 2) onInfo2();
}

//	Info Off
function onInfo0(){
	On_Info01Node.nodeValue = "Info : Press I";
	On_Info02Node.nodeValue = "";
	On_Info03Node.nodeValue = "";
	On_Info04Node.nodeValue = "";
	On_Info05Node.nodeValue = "";
	On_Info06Node.nodeValue = "";
	On_Info07Node.nodeValue = "";
	On_Info08Node.nodeValue = "";
	On_Info09Node.nodeValue = "";
}

//	Info On
function onInfo1(){
	On_Info01Node.nodeValue = "";
	On_Info02Node.nodeValue = "CONTROLS";
	On_Info03Node.nodeValue = "Mouse changes Pitch/Bank and Yaw (bottons)";
	On_Info04Node.nodeValue = "AutoPilot: Arrow Key change Pitch and Bank";
	On_Info05Node.nodeValue = "Mouse Wheel or -/= Keys change Throttle";
	On_Info06Node.nodeValue = "G Key toggles landing gear";
	On_Info07Node.nodeValue = "F Key toggles flaps"
	On_Info08Node.nodeValue = "S Key toggles sound";
	On_Info09Node.nodeValue = "Spacebar fires guns";
}

//	Info On
function onInfo2(){
	On_Info01Node.nodeValue = "";
	On_Info02Node.nodeValue = "VIEW KEYS";
	On_Info03Node.nodeValue = "V Key toggles views";
	On_Info04Node.nodeValue = "Shift Key and Mouse pans around airplane";
	On_Info05Node.nodeValue = "END Key looks down";
	On_Info06Node.nodeValue = "DELETE or PAGE DOWN Keys look left/right";
	On_Info07Node.nodeValue = "HOME Key and above Keys look up";
	On_Info08Node.nodeValue = "END Key and DELETE or PAGE DOWN Keys look back";
	On_Info09Node.nodeValue = "All 3 Keys look back";
}

