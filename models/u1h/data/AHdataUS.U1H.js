/*=	AIRCRAFT DATA FILE (UH-1H Huey) ==========================================*/
// You can use a text editor to change these values
// Do not use leading zeros (e.g. "060"), except for fractions (e.g. 0.12)

/*=	AIRCRAFT SPECIFICATIONS ==================================================*/
/*-	Controls (if using direct inputs) ----------------------------------------*/
	MxBnkR = 1;							// Maximum bank rate
	BnkMul = MxBnkR/100;				// Standard bank multiplier
	MxPitR = 1;							// Maximum pitch rate
	PitMul = MxPitR/100;				// Standard pitch multiplier
/*-	Advanced Movement Vectors ------------------------------------------------*/
	USorSI = "US";						// Units of Measurement (US or SI)
	DLTime = 1/60;						// Delta Time (1/60 seconds)
//	Thrust - Prop Only
	PwrMax = 0;							// Prop Maximum Power (BHP) [NA]
	WEPMax = 0;							// War Emergency Power (BHP) [NA]
	PropEf = 0;							// Prop Efficiency [NA]
//	Thrust - Jet Only
	JetMax = 0;							// Jet Maximum Thrust (lb) [NA]
	AftMax = 0;							// Jet Afterburner Maximum Thrust (lb) [NA]
//	Thrust - Helicopter
	HelMax = 17000;						// Helicopter Maximum Thrust (lb)
//	Other Unit Values
	Weight = 9000;						// Aircraft Weight (lbs)
	FrntAr = 20;						// Frontal Area (ft2)
	MinAGL = 4.23;						// Minimum Altitude AGL (ft)
//	Other Non-Unit Values
	CfLMax = 0;							// Maximum Coefficient of Lifr [NA]
	WingEf = 0;							// Wing Efficiency [NA]
	DrgCd0 = 2.5;						// Coefficient of Drag (Total)
	DrgCdf = 0;							// Coefficient of Drag - Flaps [NA]
	DrgCdg = 0;							// Coefficient of Drag - Gear
	DrgCdb = 0;							// Coefficient of Drag - Airbrake [NA]
	DrgCds = 0;							// Coefficient of Drag - Spoiler [NA]
	GrvMax = 8;							// Maximum G-Force
	AngInc = 5;							// Angle of Incidence
	TrmAdj = 2.5;						// Elevator Trim Adjustment
//	Landing Gear
	Ax2CGD = MinAGL;					// Axle to CG distance (ft)
	Ax2CGA = 0;							// Axle to CG angle (deg)
	WheelR = 0;							// Wheel radius (ft)
//	Flaps/Spoiler
	FlpCfL = 0;							// Max Flap Cfl [NA]
	SplCfL = 0;							// Max Spoiler [NA]
//	Taildragger
	TDrAng = 0;							// Taildragger Max Angle (deg)
	TDrSpd = 25;						// Speed at which tail lifts (mph) [NA]
/*-	Starting Values ---------------------------------------------------------*/
	SpdUPH = 0;							// Aircraft Speed (MPH)
	BegAGL = MinAGL;					// AGL (ft)
	GrdAlt = 29;						// Altitude at Airport
	BegPit = 0;							// Pitch
	BegHdg = 0;							// Heading
	BegBnk = 0;							// No Bank
