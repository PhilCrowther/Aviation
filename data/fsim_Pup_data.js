// Sopwith Pup
let data_ = {
		// Lift
		WingSp: 8.08,		// Wing Span (m)
		WingAr: 21.46,		// Wing Area (m2)
		WingEf: 0.7,		// Wing Efficiency
		AngInc: 5,			// Angle of Incidence
		GrvMax: 5,			// Maximum G-Force
		TrmAdj: 2.5,		// Elevator Trim Adjustment (### - not used)
		// Gravity
		ACMass: 544,		// Aircraft Mass (kg)
		// Thrust: Prop
		PwrMax: 60,			// Prop Maximum Power (kW)
		PropEf: 0.75,		// Prop Efficiency
		WEPMax: 0,			// War Emergency Power (kW)
		// Thrust: Jet
		JetMax: 0,			// Jet Maximum Thrust (kW)
		AftMax: 0,			// Jet Afterburner Maximum Thrust (kW)
		// Drag
		DrgCd0: 0.03,		// Coefficient of Drag
		// Taildragger Geometry and Speed
		Ax2CGD: 1.3716,		// Axle to CG distance (m)
		Ax2CGA: 335.29,		// Axle to CG angle (deg)
		WheelR: 0.37155,	// Wheel radius (m)
		TDrAng: 17.5,		// Taildragger Max Angle (deg)
		TDrSpd: 11.176,		// Speed at which tail lifts (25 mph = 11.18 m/s)
		// Optional: Flaps
		FlpCfL: 0,			// Max Flap Cfl (0.2*CfLMax) (shared with main program)
		DrgCdf: 0,			// Coefficient of Drag - Flaps
		FlpAIn: 10,			// Max Flap Angle of Incidence (2*AngInc)
		// Optional: Landing Gear Retractable
		DrgCdg: 0,			// Coefficient of Drag - Gear
		// Optional: Spoiler
		SplCfL: 0,			// Max Spoiler CfL (### - not used)
		DrgCds: 0,			// Coefficient of Drag - Spoiler
		// Optional: Airbrake	
		DrgCdb: 0,			// Coefficient of Drag - Airbrake
		// Controls (shared with air_. and main program)
		CfLMax: 1.4,		// Maximum Coefficient of Lift
		BnkMax: 1,			// Maximum bank rate	
	}