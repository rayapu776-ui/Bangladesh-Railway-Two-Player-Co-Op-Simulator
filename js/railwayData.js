// ============================================================================
// TRACKS OF BENGAL: BANGLADESH RAILWAY CO-OP SIMULATOR
// Module: railwayData.js — Complete Bangladesh Railway Map, Locomotives & Routes
// ============================================================================

window.BRSim = window.BRSim || {};

window.BRSim.DATA = {
  // --------------------------------------------------------------------------
  // 1. AUTHENTIC BANGLADESH RAILWAY LOCOMOTIVE ROSTER
  // --------------------------------------------------------------------------
  locomotives: [
    {
      id: "class_3000",
      code: "BED-30 (Class 3000)",
      name: "Progress Rail EMD GT38ACe",
      bengaliName: "ক্লাস ৩০০০ (ইএমডি জিটি৩৮এসি)",
      gauge: "MG",
      gaugeLabel: "Meter Gauge (1,000 mm)",
      powerHP: 2200,
      maxSpeedKmh: 115,
      massTons: 78,
      maxTractiveEffortKN: 265,
      engineType: "EMD 8-710G3B-T2 (2-Stroke Turbo)",
      soundProfile: "emd_710",
      brakeSystem: "Graduated Release Twin-Pipe Air Brake (Knorr-Bremse)",
      liveryPrimary: "#006a4e", // National Flag Green
      liverySecondary: "#f42a41", // National Flag Red
      liveryAccent: "#ffd700",
      cabStyle: "modern_emd",
      description: "Modern AC-traction Meter Gauge flagship pulling Suborno Express, Sonar Bangla, and Cox's Bazar Express across the East Zone."
    },
    {
      id: "class_2900",
      code: "MEI-20 (Class 2900)",
      name: "Hyundai Rotem / EMD GT18LA-2",
      bengaliName: "ক্লাস ২৯০০ (হুন্ডাই রোটেম এমইআই-২০)",
      gauge: "MG",
      gaugeLabel: "Meter Gauge (1,000 mm)",
      powerHP: 1850,
      maxSpeedKmh: 105,
      massTons: 72,
      maxTractiveEffortKN: 220,
      engineType: "EMD 8-645E3B (2-Stroke Roots/Turbo)",
      soundProfile: "emd_645",
      brakeSystem: "Westinghouse 26-L Air Brake",
      liveryPrimary: "#154c79", // Classic BR Blue
      liverySecondary: "#f5b041", // Classic BR Warm Yellow
      liveryAccent: "#ffffff",
      cabStyle: "classic_emd",
      description: "The beloved workhorse of Bangladesh Railway's East Zone. Famous for its distinct 2-stroke turbo whine on Sylhet hill gradients and Haor routes."
    },
    {
      id: "class_6600",
      code: "BED-32 (Class 6600)",
      name: "Progress Rail EMD GT42ACe",
      bengaliName: "ক্লাস ৬৬০০ (ইএমডি জিটি৪২এসি ব্রডগেজ)",
      gauge: "BG",
      gaugeLabel: "Broad Gauge (1,676 mm) / Dual Gauge",
      powerHP: 3250,
      maxSpeedKmh: 120,
      massTons: 112,
      maxTractiveEffortKN: 410,
      engineType: "EMD 12-710G3B-EC (2-Stroke Turbo)",
      soundProfile: "emd_710_heavy",
      brakeSystem: "Wabtec FastBrake Microprocessor Air Brake",
      liveryPrimary: "#006a4e",
      liverySecondary: "#e63946",
      liveryAccent: "#f1faee",
      cabStyle: "modern_emd",
      description: "High-horsepower Broad Gauge AC locomotive engineered for the Padma Multipurpose Bridge corridor, Banalata Express, and Jamuna crossings."
    },
    {
      id: "class_6500",
      code: "BED-30 (Class 6500)",
      name: "DLW ALCO WDM-3A / WDG-4",
      bengaliName: "ক্লাস ৬৫০০ (অ্যালকো ডব্লিউডিএম-৩এ)",
      gauge: "BG",
      gaugeLabel: "Broad Gauge (1,676 mm) / Dual Gauge",
      powerHP: 3100,
      maxSpeedKmh: 110,
      massTons: 114,
      maxTractiveEffortKN: 385,
      engineType: "ALCO 251-C 16-Cylinder (4-Stroke Turbo)",
      soundProfile: "alco_251",
      brakeSystem: "Dual Air & Vacuum Brake System (A9 / SA9)",
      liveryPrimary: "#8b2635", // Deep Crimson/Maroon
      liverySecondary: "#f4d35e", // Gold Stripe
      liveryAccent: "#1d3557",
      cabStyle: "classic_alco",
      description: "Raw, throaty 16-cylinder ALCO beast dominating the Hardinge Bridge, Ishwardi Junction, and northern Panchagarh heavy express runs."
    }
  ],

  // --------------------------------------------------------------------------
  // 2. COMPLETE BANGLADESH RAILWAY GEOGRAPHIC NETWORK NODES (FOR FULL MAP)
  // Coordinates normalized (0..1000 x, 0..1000 y) matching Bangladesh geography
  // --------------------------------------------------------------------------
  networkNodes: [
    // Central / Dhaka Division
    { id: "kamalapur", name: "Dhaka (Kamalapur)", bn: "কমলাপুর (ঢাকা)", x: 525, y: 515, zone: "East", gauge: "DG", major: true, landmark: "Modernist Parasol Canopy Terminal" },
    { id: "bimanbandar", name: "Dhaka Airport (Bimanbandar)", bn: "বিমানবন্দর", x: 522, y: 482, zone: "East", gauge: "DG", major: true },
    { id: "tongi", name: "Tongi Junction", bn: "টঙ্গী জংশন", x: 524, y: 460, zone: "East", gauge: "DG", major: true, landmark: "Biswa Ijtema Grounds & Dual-Gauge Diverge" },
    { id: "joydebpur", name: "Joydebpur Junction", bn: "জয়দেবপুর জংশন", x: 515, y: 435, zone: "East", gauge: "DG", major: true },
    { id: "tangail", name: "Tangail", bn: "টাঙ্গাইল", x: 455, y: 410, zone: "East", gauge: "DG", major: false },
    { id: "bb_east", name: "Bangabandhu Bridge East", bn: "বঙ্গবন্ধু সেতু পূর্ব", x: 420, y: 392, zone: "East", gauge: "DG", major: true, landmark: "Jamuna Railway Bridge East Portal" },

    // North-East / Mymensingh & Haor Basin
    { id: "gafargaon", name: "Gafargaon", bn: "গফরগাঁও", x: 530, y: 375, zone: "East", gauge: "MG", major: false },
    { id: "mymensingh", name: "Mymensingh Junction", bn: "ময়মনসিংহ জংশন", x: 528, y: 325, zone: "East", gauge: "MG", major: true, landmark: "Brahmaputra Heritage Junction" },
    { id: "gouripur", name: "Gouripur Junction", bn: "গৌরীপুর জংশন", x: 565, y: 320, zone: "East", gauge: "MG", major: false },
    { id: "netrokona", name: "Netrokona", bn: "নেত্রকোণা", x: 590, y: 295, zone: "East", gauge: "MG", major: false },
    { id: "mohanganj", name: "Mohanganj (Haor Basin)", bn: "মোহনগঞ্জ (হাওর)", x: 635, y: 290, zone: "East", gauge: "MG", major: true, landmark: "Flooded Haor Wetland Causeway" },
    { id: "jamalpur", name: "Jamalpur Town", bn: "জামালপুর টাউন", x: 465, y: 310, zone: "East", gauge: "MG", major: false },
    { id: "dewanganj", name: "Dewanganj Bazar", bn: "দেওয়ানগঞ্জ বাজার", x: 440, y: 275, zone: "East", gauge: "MG", major: false },

    // East Trunk / Bhairab, Sylhet, Chattogram, Cox's Bazar
    { id: "narsingdi", name: "Narsingdi", bn: "নরসিংদী", x: 575, y: 470, zone: "East", gauge: "MG", major: false },
    { id: "bhairab", name: "Bhairab Bazar Jn", bn: "ভৈরব বাজার জংশন", x: 615, y: 445, zone: "East", gauge: "MG", major: true, landmark: "Meghna River Twin Truss Bridges" },
    { id: "kishoreganj", name: "Kishoreganj", bn: "কিশোরগঞ্জ", x: 585, y: 390, zone: "East", gauge: "MG", major: false },
    { id: "brahmanbaria", name: "Brahmanbaria", bn: "ব্রাহ্মণবাড়িয়া", x: 642, y: 455, zone: "East", gauge: "MG", major: false },
    { id: "akhaura", name: "Akhaura Junction", bn: "আখাউড়া জংশন", x: 660, y: 475, zone: "East", gauge: "MG", major: true, landmark: "Historic Sylhet-Chattogram Split Junction" },
    { id: "shaistaganj", name: "Shaistaganj", bn: "শায়েস্তাগঞ্জ", x: 695, y: 420, zone: "East", gauge: "MG", major: false },
    { id: "srimangal", name: "Srimangal (Tea Capital)", bn: "শ্রীমঙ্গল (চা বাগান)", x: 730, y: 385, zone: "East", gauge: "MG", major: true, landmark: "Lawachara Rainforest & 1:100 Hill Gradient" },
    { id: "kulaura", name: "Kulaura Junction", bn: "কুলাউড়া জংশন", x: 765, y: 345, zone: "East", gauge: "MG", major: false },
    { id: "sylhet", name: "Sylhet Terminal", bn: "সিলেট স্টেশন", x: 755, y: 285, zone: "East", gauge: "MG", major: true, landmark: "Surma Valley Iconic Canopy Station" },

    // South-East / Cumilla, Chattogram, Cox's Bazar
    { id: "cumilla", name: "Cumilla", bn: "কুমিল্লা", x: 665, y: 535, zone: "East", gauge: "MG", major: true },
    { id: "laksam", name: "Laksam Junction", bn: "লাকসাম জংশন", x: 655, y: 575, zone: "East", gauge: "MG", major: true, landmark: "Noakhali & Chandpur Branch Hub" },
    { id: "chandpur", name: "Chandpur Ghat", bn: "চাঁদপুর ঘাট", x: 575, y: 585, zone: "East", gauge: "MG", major: false, landmark: "Meghna River Steamer Terminal" },
    { id: "noakhali", name: "Noakhali (Maijdee)", bn: "নোয়াখালী", x: 655, y: 635, zone: "East", gauge: "MG", major: false },
    { id: "feni", name: "Feni Junction", bn: "ফেনী জংশন", x: 695, y: 615, zone: "East", gauge: "MG", major: false },
    { id: "pahartali", name: "Pahartali (Loco Workshop)", bn: "পাহাড়তলী", x: 745, y: 695, zone: "East", gauge: "MG", major: false, landmark: "East Zone HQ & Historic Diesel Shed" },
    { id: "chattogram", name: "Chattogram Terminal", bn: "চট্টগ্রাম স্টেশন", x: 755, y: 715, zone: "East", gauge: "MG", major: true, landmark: "Port City Main Terminal & Yard" },
    { id: "dohazari", name: "Dohazari (Kalurghat)", bn: "দোহাজারী (কালুরঘাট সেতু)", x: 785, y: 755, zone: "East", gauge: "MG", major: false, landmark: "Kalurghat Karnaphuli River Bridge" },
    { id: "chakaria", name: "Chakaria (Chunati Sanctuary)", bn: "চকরিয়া (চুনতি অভয়ারণ্য)", x: 800, y: 815, zone: "East", gauge: "MG", major: false, landmark: "Asian Elephant Overpass Corridor" },
    { id: "coxsbazar", name: "Cox's Bazar Iconic Station", bn: "কক্সবাজার আইকনিক স্টেশন", x: 805, y: 880, zone: "East", gauge: "MG", major: true, landmark: "Pearl & Oyster Shaped Mega Terminal" },

    // South-West / Padma Bridge Link & Khulna
    { id: "mawa", name: "Mawa (Padma North)", bn: "মাওয়া (পদ্মা সেতু উত্তর)", x: 505, y: 565, zone: "West", gauge: "BG", major: true, landmark: "Padma Multipurpose Bridge Lower Deck" },
    { id: "bhanga", name: "Bhanga Cloverleaf Jn", bn: "ভাঙ্গা জংশন", x: 465, y: 595, zone: "West", gauge: "BG", major: true, landmark: "Elevated Circular Railway Interchange" },
    { id: "narail", name: "Narail", bn: "নড়াইল", x: 395, y: 630, zone: "West", gauge: "BG", major: false },
    { id: "jashore", name: "Jashore Junction", bn: "যশোর জংশন", x: 335, y: 645, zone: "West", gauge: "BG", major: true },
    { id: "benapole", name: "Benapole Border", bn: "বেনাপোল বন্দরে", x: 280, y: 655, zone: "West", gauge: "BG", major: false, landmark: "International Cross-Border Gate" },
    { id: "khulna", name: "Khulna Terminal", bn: "খুলনা টার্মিনাল", x: 370, y: 710, zone: "West", gauge: "BG", major: true, landmark: "Rupsha River Modern BG Terminal" },

    // West & North-West / Rajshahi, Ishwardi, Santahar, Parbatipur, Panchagarh
    { id: "bb_west", name: "Bangabandhu Bridge West", bn: "বঙ্গবন্ধু সেতু পশ্চিম", x: 385, y: 395, zone: "West", gauge: "DG", major: true },
    { id: "ullapara", name: "Ullapara", bn: "উল্লাপাড়া", x: 355, y: 405, zone: "West", gauge: "DG", major: false },
    { id: "ishwardi", name: "Ishwardi Junction", bn: "ঈশ্বরদী জংশন", x: 285, y: 450, zone: "West", gauge: "DG", major: true, landmark: "Hardinge Bridge & West Zone Hub" },
    { id: "paksey", name: "Paksey (Hardinge Bridge)", bn: "পাকশী (হার্ডিঞ্জ ব্রিজ)", x: 282, y: 480, zone: "West", gauge: "BG", major: true, landmark: "1915 Crimson Steel Truss Padma Bridge" },
    { id: "poradaha", name: "Poradaha Junction", bn: "পোড়াদহ জংশন", x: 285, y: 525, zone: "West", gauge: "BG", major: false },
    { id: "darshana", name: "Darshana Border Jn", bn: "দর্শনা জংশন", x: 265, y: 575, zone: "West", gauge: "BG", major: false },
    { id: "abdulpur", name: "Abdulpur Junction", bn: "আব্দুলপুর জংশন", x: 265, y: 425, zone: "West", gauge: "DG", major: true },
    { id: "rajshahi", name: "Rajshahi Terminal", bn: "রাজশাহী স্টেশন", x: 205, y: 425, zone: "West", gauge: "BG", major: true, landmark: "West Zone HQ & Silk City Terminal" },
    { id: "natore", name: "Natore", bn: "নাটোর", x: 285, y: 395, zone: "West", gauge: "DG", major: false },
    { id: "santahar", name: "Santahar Junction", bn: "সান্তাহার জংশন", x: 295, y: 340, zone: "West", gauge: "DG", major: true, landmark: "BG/MG Multi-Gauge Silo Junction" },
    { id: "bogura", name: "Bogura", bn: "বগুড়া", x: 345, y: 330, zone: "West", gauge: "MG", major: false },
    { id: "bonarpara", name: "Bonarpara Junction", bn: "বোনারপাড়া জংশন", x: 375, y: 290, zone: "West", gauge: "MG", major: false },
    { id: "kaunia", name: "Kaunia Jn (Teesta Bridge)", bn: "কাউনিয়া জংশন (তিস্তা সেতু)", x: 355, y: 210, zone: "West", gauge: "MG", major: true, landmark: "Teesta River Historic Bridge" },
    { id: "lalmonirhat", name: "Lalmonirhat Division HQ", bn: "লালমনিরহাট", x: 385, y: 185, zone: "West", gauge: "MG", major: true },
    { id: "parbatipur", name: "Parbatipur Junction", bn: "পার্বতীপুর জংশন", x: 275, y: 230, zone: "West", gauge: "DG", major: true, landmark: "4-Track BG/MG Diamond Crossing & Saidpur Workshop" },
    { id: "dinajpur", name: "Dinajpur", bn: "দিনাজপুর", x: 235, y: 220, zone: "West", gauge: "DG", major: false },
    { id: "chilahati", name: "Chilahati Border", bn: "চিলাহাটি", x: 255, y: 145, zone: "West", gauge: "BG", major: false },
    { id: "panchagarh", name: "Panchagarh Terminal", bn: "পঞ্চগড় (বীর মুক্তিযোদ্ধা সিরাজুল ইসলাম)", x: 210, y: 120, zone: "West", gauge: "DG", major: true, landmark: "Northernmost Himalayan-Foothill Terminal" }
  ],

  // Network graph edges for rendering the complete Bangladesh Railway Map
  networkEdges: [
    // Dhaka Core & North
    ["kamalapur", "bimanbandar", "DG"],
    ["bimanbandar", "tongi", "DG"],
    ["tongi", "joydebpur", "DG"],
    // Joydebpur to Mymensingh & Haor
    ["joydebpur", "gafargaon", "MG"],
    ["gafargaon", "mymensingh", "MG"],
    ["mymensingh", "gouripur", "MG"],
    ["gouripur", "netrokona", "MG"],
    ["netrokona", "mohanganj", "MG"],
    ["mymensingh", "jamalpur", "MG"],
    ["jamalpur", "dewanganj", "MG"],
    ["gouripur", "kishoreganj", "MG"],
    ["kishoreganj", "bhairab", "MG"],
    // East Mainline (Tongi - Bhairab - Akhaura - Chattogram - Cox's Bazar)
    ["tongi", "narsingdi", "MG"],
    ["narsingdi", "bhairab", "MG"],
    ["bhairab", "brahmanbaria", "MG"],
    ["brahmanbaria", "akhaura", "MG"],
    ["akhaura", "cumilla", "MG"],
    ["cumilla", "laksam", "MG"],
    ["laksam", "chandpur", "MG"],
    ["laksam", "noakhali", "MG"],
    ["laksam", "feni", "MG"],
    ["feni", "pahartali", "MG"],
    ["pahartali", "chattogram", "MG"],
    ["chattogram", "dohazari", "MG"],
    ["dohazari", "chakaria", "MG"],
    ["chakaria", "coxsbazar", "MG"],
    // Sylhet Line
    ["akhaura", "shaistaganj", "MG"],
    ["shaistaganj", "srimangal", "MG"],
    ["srimangal", "kulaura", "MG"],
    ["kulaura", "sylhet", "MG"],
    // Padma Bridge Corridor
    ["kamalapur", "mawa", "BG"],
    ["mawa", "bhanga", "BG"],
    ["bhanga", "narail", "BG"],
    ["narail", "jashore", "BG"],
    ["jashore", "benapole", "BG"],
    ["jashore", "khulna", "BG"],
    ["jashore", "darshana", "BG"],
    ["darshana", "poradaha", "BG"],
    ["poradaha", "paksey", "BG"],
    ["paksey", "ishwardi", "BG"],
    // Jamuna Bridge & West Zone
    ["joydebpur", "tangail", "DG"],
    ["tangail", "bb_east", "DG"],
    ["bb_east", "bb_west", "DG"],
    ["bb_west", "ullapara", "DG"],
    ["ullapara", "ishwardi", "DG"],
    ["ishwardi", "abdulpur", "DG"],
    ["abdulpur", "rajshahi", "BG"],
    ["abdulpur", "natore", "DG"],
    ["natore", "santahar", "DG"],
    ["santahar", "bogura", "MG"],
    ["bogura", "bonarpara", "MG"],
    ["bonarpara", "kaunia", "MG"],
    ["kaunia", "lalmonirhat", "MG"],
    ["santahar", "parbatipur", "DG"],
    ["parbatipur", "kaunia", "MG"],
    ["parbatipur", "dinajpur", "DG"],
    ["parbatipur", "chilahati", "BG"],
    ["dinajpur", "panchagarh", "DG"]
  ],

  // --------------------------------------------------------------------------
  // 3. SIX PLAYABLE CO-OP ROUTES ACROSS BANGLADESH
  // Distances are scaled for engaging gameplay while preserving real KM posts!
  // --------------------------------------------------------------------------
  routes: [
    {
      id: "suborno_coxsbazar",
      trainNo: "701 / 814",
      name: "Suborno & Cox's Bazar Express",
      bengaliName: "সুবর্ণ ও কক্সবাজার এক্সপ্রেস (ঢাকা–চট্টগ্রাম–কক্সবাজার)",
      zone: "East Zone (Dhaka & Chattogram Divisions)",
      gauge: "MG",
      recommendedLoco: "class_3000",
      coachCount: 16,
      coachType: "PT INKA Red-Green Air-Braked Intercity",
      signalingSystem: "Computer-Based Interlocking (CBI) Color Light + Single-Line Token (South)",
      weatherDefault: "clear_sunset",
      cautionOrder: {
        formNo: "T/409 - East/CTG-88",
        restrictions: [
          "KM 4.2 – Bhairab Meghna Truss Bridge approach: Max Speed 55 km/h",
          "KM 9.8 – Kalurghat Bridge & Chunati Wildlife Sanctuary Elephant Corridor: Max Speed 45 km/h & Continuous Horn"
        ]
      },
      totalDistanceKm: 14.0,
      nodeSequence: ["kamalapur", "bimanbandar", "tongi", "bhairab", "akhaura", "cumilla", "laksam", "chattogram", "dohazari", "chakaria", "coxsbazar"],
      stations: [
        { km: 0.0, id: "kamalapur", name: "Dhaka Kamalapur", bn: "কমলাপুর, ঢাকা", stopRequired: true, platformSide: "left", biome: "urban_dhaka", landmark: "kamalapur_canopy" },
        { km: 2.2, id: "bimanbandar", name: "Dhaka Airport (Bimanbandar)", bn: "বিমানবন্দর স্টেশন", stopRequired: true, platformSide: "left", biome: "urban_dhaka", landmark: "airport_overpass" },
        { km: 4.5, id: "bhairab", name: "Bhairab Bazar Jn (Meghna Bridge)", bn: "ভৈরব বাজার জংশন", stopRequired: false, tokenExchange: true, platformSide: "right", biome: "river_bridge", landmark: "bhairab_bridge" },
        { km: 7.2, id: "akhaura", name: "Akhaura Junction", bn: "আখাউড়া জংশন", stopRequired: true, platformSide: "left", biome: "paddy_brickkiln", landmark: "colonial_junction" },
        { km: 10.5, id: "chattogram", name: "Chattogram Port Terminal", bn: "চট্টগ্রাম স্টেশন", stopRequired: true, platformSide: "left", biome: "urban_ctg", landmark: "ctg_terminal" },
        { km: 14.0, id: "coxsbazar", name: "Cox's Bazar Iconic Oyster Terminal", bn: "কক্সবাজার আইকনিক স্টেশন", stopRequired: true, platformSide: "right", biome: "coastal_palms", landmark: "coxsbazar_oyster" }
      ],
      events: [
        { km: 1.1, type: "level_crossing", name: "Tejgaon & Malibagh Rail Gate (Dhaka)", density: "extreme", speedLimit: 65 },
        { km: 3.3, type: "whistle_board", name: "Tongi Turag Bridge Whistle Board (W/L)", speedLimit: 85 },
        { km: 4.1, type: "bridge", name: "King George VI & 2nd Bhairab Bridge (Meghna River)", lengthKm: 0.7, speedLimit: 55, bridgeStyle: "steel_truss" },
        { km: 6.0, type: "acp_zone", name: "Brahmanbaria Unscheduled Chain Pull Risk Zone", probability: 0.75 },
        { km: 8.8, type: "level_crossing", name: "Cumilla Kandirpar Rail Gate", density: "high", speedLimit: 80 },
        { km: 11.4, type: "bridge", name: "Kalurghat Shared Road-Rail Bridge (Karnaphuli River)", lengthKm: 0.6, speedLimit: 40, bridgeStyle: "kalurghat_truss" },
        { km: 12.6, type: "wildlife_corridor", name: "Chunati Sanctuary Asian Elephant Overpass", speedLimit: 50 }
      ]
    },
    {
      id: "padma_sundarban",
      trainNo: "726 / 795",
      name: "Padma Bridge & Sundarban Express",
      bengaliName: "পদ্মা সেতু ও সুন্দরবন এক্সপ্রেস (ঢাকা–মাওয়া–ভাঙ্গা–খুলনা)",
      zone: "West & Central Zone (Padma Rail Link BG)",
      gauge: "BG",
      recommendedLoco: "class_6600",
      coachCount: 14,
      coachType: "CRRC Tangshan & LHB Stainless Steel BG",
      signalingSystem: "Modern CASCO Color-Light Interlocking & Viaduct Cab Signaling",
      weatherDefault: "clear_day",
      cautionOrder: {
        formNo: "T/409 - PBRL/Mawa-12",
        restrictions: [
          "KM 3.8 to 5.4 – Padma Multipurpose Bridge Lower Truss Deck: Crosswind Monitoring Active (Max 85 km/h)",
          "KM 7.0 – Bhanga Cloverleaf Viaduct Curve: Max 65 km/h"
        ]
      },
      totalDistanceKm: 12.5,
      nodeSequence: ["kamalapur", "mawa", "bhanga", "narail", "jashore", "khulna"],
      stations: [
        { km: 0.0, id: "kamalapur", name: "Dhaka Kamalapur (BG Platform)", bn: "কমলাপুর, ঢাকা", stopRequired: true, platformSide: "left", biome: "urban_dhaka", landmark: "kamalapur_canopy" },
        { km: 3.4, id: "mawa", name: "Mawa Elevated Viaduct Station", bn: "মাওয়া স্টেশন", stopRequired: true, platformSide: "right", biome: "river_bridge", landmark: "mawa_viaduct" },
        { km: 7.1, id: "bhanga", name: "Bhanga Cloverleaf Junction", bn: "ভাঙ্গা জংশন", stopRequired: true, platformSide: "left", biome: "paddy_mustard", landmark: "bhanga_cloverleaf" },
        { km: 9.8, id: "jashore", name: "Jashore Junction", bn: "যশোর জংশন", stopRequired: true, platformSide: "left", biome: "paddy_brickkiln", landmark: "colonial_junction" },
        { km: 12.5, id: "khulna", name: "Khulna Modern Terminal", bn: "খুলনা টার্মিনাল", stopRequired: true, platformSide: "right", biome: "urban_ctg", landmark: "khulna_terminal" }
      ],
      events: [
        { km: 1.5, type: "level_crossing", name: "Gandaria & Jurain Urban Rail Gate", density: "extreme", speedLimit: 60 },
        { km: 3.8, type: "bridge", name: "Padma Multipurpose Bridge (6.15 km Lower Steel Truss Deck)", lengthKm: 1.5, speedLimit: 85, bridgeStyle: "padma_double_deck" },
        { km: 6.2, type: "whistle_board", name: "Arial Khan River Viaduct Whistle Board", speedLimit: 100 },
        { km: 8.5, type: "level_crossing", name: "Narail Madhumati Approach Gate", density: "medium", speedLimit: 90 }
      ]
    },
    {
      id: "sylhet_parabat_hills",
      trainNo: "709 / 717",
      name: "Parabat & Jayantika Tea Garden Express",
      bengaliName: "পারাবত ও জয়ন্তিকা এক্সপ্রেস (আখাউড়া–শ্রীমঙ্গল–সিলেট)",
      zone: "East Zone (Sylhet Hill & Rainforest Section)",
      gauge: "MG",
      recommendedLoco: "class_2900",
      coachCount: 14,
      coachType: "PT INKA MG Air-Braked Rake",
      signalingSystem: "Mechanical Lower-Quadrant Semaphore & Neale's Ball Token",
      weatherDefault: "monsoon_rain",
      cautionOrder: {
        formNo: "T/409 - SYL/Hill-04",
        restrictions: [
          "KM 4.0 to 6.5 – Rashidpur–Srimangal–Lawachara 1:100 Steep Gradient: Wet tea leaves on rail! Use Sander [X] to prevent stalling!",
          "Single-Line Section: Mandatory Neale's Ball Token Hoop Exchange [O] at Shaistaganj & Kulaura (15–30 km/h)."
        ]
      },
      totalDistanceKm: 11.5,
      nodeSequence: ["akhaura", "shaistaganj", "srimangal", "kulaura", "sylhet"],
      stations: [
        { km: 0.0, id: "akhaura", name: "Akhaura Junction", bn: "আখাউড়া জংশন", stopRequired: true, platformSide: "left", biome: "paddy_brickkiln", landmark: "colonial_junction" },
        { km: 2.8, id: "shaistaganj", name: "Shaistaganj Token Station", bn: "শায়েস্তাগঞ্জ", stopRequired: false, tokenExchange: true, platformSide: "left", biome: "tea_hills", landmark: "semaphore_cabin" },
        { km: 5.8, id: "srimangal", name: "Srimangal (Tea Capital of Bangladesh)", bn: "শ্রীমঙ্গল স্টেশন", stopRequired: true, platformSide: "right", biome: "tea_hills", landmark: "srimangal_tea" },
        { km: 8.6, id: "kulaura", name: "Kulaura Junction (Token Exchange)", bn: "কুলাউড়া জংশন", stopRequired: false, tokenExchange: true, platformSide: "left", biome: "tea_hills", landmark: "semaphore_cabin" },
        { km: 11.5, id: "sylhet", name: "Sylhet Surma Valley Terminal", bn: "সিলেট স্টেশন", stopRequired: true, platformSide: "left", biome: "urban_ctg", landmark: "sylhet_canopy" }
      ],
      events: [
        { km: 1.6, type: "level_crossing", name: "Shahbazpur Rural Haat Crossing", density: "high", speedLimit: 65 },
        { km: 4.2, type: "steep_gradient", name: "Rashidpur–Srimangal 1:100 Hill Climb (Slippery Wet Rails)", gradientPct: 1.15, lengthKm: 1.4, speedLimit: 50 },
        { km: 6.4, type: "wildlife_corridor", name: "Lawachara National Park Rainforest Cutting (Hoolock Gibbons)", speedLimit: 45 },
        { km: 9.8, type: "bridge", name: "Fenchuganj Kushiyara River Truss Bridge", lengthKm: 0.5, speedLimit: 55, bridgeStyle: "steel_truss" }
      ]
    },
    {
      id: "banalata_jamuna_west",
      trainNo: "791 / 753",
      name: "Banalata & Silk City Jamuna Express",
      bengaliName: "বনলতা ও সিল্কসিটি এক্সপ্রেস (ঢাকা–যমুনা সেতু–রাজশাহী)",
      zone: "East-to-West Dual Gauge Trunk Corridor",
      gauge: "DG",
      recommendedLoco: "class_6600",
      coachCount: 12,
      coachType: "PT INKA Broad Gauge Non-Stop Rake",
      signalingSystem: "Dual-Gauge Three-Rail Interlocking & Jamuna Bridge Anemometer Control",
      weatherDefault: "winter_fog",
      cautionOrder: {
        formNo: "T/409 - PAK/Jamuna-19",
        restrictions: [
          "KM 4.5 to 6.1 – Bangabandhu Jamuna Railway Bridge (4.8 km): Strict Speed Limit 40 km/h",
          "Dense Winter Fog (Kuasha) over Jamuna Char Basin: Watch for Fog Signal Posts & Detonators!"
        ]
      },
      totalDistanceKm: 12.0,
      nodeSequence: ["kamalapur", "joydebpur", "tangail", "bb_east", "bb_west", "ullapara", "ishwardi", "abdulpur", "rajshahi"],
      stations: [
        { km: 0.0, id: "kamalapur", name: "Dhaka Kamalapur", bn: "কমলাপুর, ঢাকা", stopRequired: true, platformSide: "left", biome: "urban_dhaka", landmark: "kamalapur_canopy" },
        { km: 2.5, id: "joydebpur", name: "Joydebpur Dual-Gauge Jn", bn: "জয়দেবপুর জংশন", stopRequired: false, tokenExchange: true, platformSide: "left", biome: "paddy_mustard", landmark: "colonial_junction" },
        { km: 4.3, id: "bb_east", name: "Bangabandhu Bridge East (Ibrahimabad)", bn: "বঙ্গবন্ধু সেতু পূর্ব", stopRequired: true, platformSide: "right", biome: "river_bridge", landmark: "jamuna_portal" },
        { km: 8.5, id: "ishwardi", name: "Ishwardi Bypass / Abdulpur Jn", bn: "ঈশ্বরদী / আব্দুলপুর", stopRequired: false, tokenExchange: true, platformSide: "left", biome: "paddy_mustard", landmark: "semaphore_cabin" },
        { km: 12.0, id: "rajshahi", name: "Rajshahi Silk City Terminal", bn: "রাজশাহী স্টেশন", stopRequired: true, platformSide: "left", biome: "urban_ctg", landmark: "rajshahi_heritage" }
      ],
      events: [
        { km: 1.4, type: "level_crossing", name: "Banani & Uttara Dual-Gauge Rail Gate", density: "extreme", speedLimit: 65 },
        { km: 3.4, type: "whistle_board", name: "Tangail Mustard Field Fog Post", speedLimit: 80 },
        { km: 4.5, type: "bridge", name: "Bangabandhu Jamuna Railway Bridge (4.8 km Dual-Gauge Crossing)", lengthKm: 1.5, speedLimit: 45, bridgeStyle: "jamuna_arch_truss" },
        { km: 7.2, type: "acp_zone", name: "Ullapara Dairy Hub Chain Pull Zone", probability: 0.7 },
        { km: 10.2, type: "level_crossing", name: "Arani Mango Orchard Crossing", density: "medium", speedLimit: 85 }
      ]
    },
    {
      id: "haor_mohanganj",
      trainNo: "777",
      name: "Haor Wetland Express (Mymensingh–Mohanganj)",
      bengaliName: "হাওর এক্সপ্রেস (ময়মনসিংহ–নেত্রকোণা–মোহনগঞ্জ)",
      zone: "East Zone (Submerged Haor Basin Single-Line MG)",
      gauge: "MG",
      recommendedLoco: "class_2900",
      coachCount: 11,
      coachType: "Classic Vacuum/Air Mixed Mail & Intercity Rake",
      signalingSystem: "Mechanical Semaphore + Physical Neale's Ball Token Hoop",
      weatherDefault: "monsoon_rain",
      cautionOrder: {
        formNo: "T/409 - MYN/Haor-07",
        restrictions: [
          "KM 5.0 to 9.5 – Submerged Haor Causeway Embankment: Monsoon waves lapping ballast! Max Speed 55 km/h",
          "Token Hoop Snatching Mandatory at Gouripur Jn & Shyamganj"
        ]
      },
      totalDistanceKm: 10.0,
      nodeSequence: ["mymensingh", "gouripur", "netrokona", "mohanganj"],
      stations: [
        { km: 0.0, id: "mymensingh", name: "Mymensingh Heritage Junction", bn: "ময়মনসিংহ জংশন", stopRequired: true, platformSide: "left", biome: "urban_ctg", landmark: "colonial_junction" },
        { km: 2.8, id: "gouripur", name: "Gouripur Junction (Token Exchange)", bn: "গৌরীপুর জংশন", stopRequired: false, tokenExchange: true, platformSide: "right", biome: "haor_wetland", landmark: "semaphore_cabin" },
        { km: 6.2, id: "netrokona", name: "Netrokona Satpai Station", bn: "নেত্রকোণা স্টেশন", stopRequired: true, platformSide: "left", biome: "haor_wetland", landmark: "colonial_junction" },
        { km: 10.0, id: "mohanganj", name: "Mohanganj Haor Terminal", bn: "মোহনগঞ্জ টার্মিনাল", stopRequired: true, platformSide: "left", biome: "haor_wetland", landmark: "haor_ghat" }
      ],
      events: [
        { km: 1.5, type: "bridge", name: "Shambhuganj Old Brahmaputra Steel Bridge", lengthKm: 0.6, speedLimit: 50, bridgeStyle: "steel_truss" },
        { km: 4.4, type: "level_crossing", name: "Shyamganj Bazar Unfettered Crossing (Cattle & Rickshaws)", density: "extreme", speedLimit: 50 },
        { km: 7.5, type: "acp_zone", name: "Barhatta Haor Boat Ghat Chain Pull Zone", probability: 0.85 }
      ]
    },
    {
      id: "hardinge_panchagarh",
      trainNo: "705 / 757",
      name: "Ekota & Drutojan Hardinge–Panchagarh Express",
      bengaliName: "একতা ও দ্রুতযান এক্সপ্রেস (পাকশী হার্ডিঞ্জ ব্রিজ–পার্বতীপুর–পঞ্চগড়)",
      zone: "West Zone (Paksey & Lalmonirhat Northern Spine)",
      gauge: "BG",
      recommendedLoco: "class_6500",
      coachCount: 15,
      coachType: "LHB Stainless Steel Broad Gauge Rake",
      signalingSystem: "Mixed Color-Light & Historic Paksey/Parbatipur Interlocking",
      weatherDefault: "clear_sunset",
      cautionOrder: {
        formNo: "T/409 - PAK/Hardinge-1915",
        restrictions: [
          "KM 0.8 to 2.2 – Historic 1915 Hardinge Bridge over Padma River: Max Speed 60 km/h",
          "KM 7.8 – Parbatipur 4-Track BG/MG Diamond Crossing: Approach under Caution at 40 km/h"
        ]
      },
      totalDistanceKm: 12.0,
      nodeSequence: ["paksey", "ishwardi", "natore", "santahar", "parbatipur", "dinajpur", "panchagarh"],
      stations: [
        { km: 0.0, id: "paksey", name: "Paksey Station (Hardinge Bridge South)", bn: "পাকশী স্টেশন", stopRequired: true, platformSide: "left", biome: "river_bridge", landmark: "paksey_colonial" },
        { km: 2.6, id: "ishwardi", name: "Ishwardi Junction", bn: "ঈশ্বরদী জংশন", stopRequired: true, platformSide: "right", biome: "paddy_brickkiln", landmark: "colonial_junction" },
        { km: 5.5, id: "santahar", name: "Santahar Multi-Gauge Junction", bn: "সান্তাহার জংশন", stopRequired: false, tokenExchange: true, platformSide: "left", biome: "paddy_mustard", landmark: "santahar_silo" },
        { km: 8.5, id: "parbatipur", name: "Parbatipur 4-Track Diamond Jn", bn: "পার্বতীপুর জংশন", stopRequired: true, platformSide: "left", biome: "paddy_brickkiln", landmark: "parbatipur_diamond" },
        { km: 12.0, id: "panchagarh", name: "Panchagarh (Veer Muktijoddha Sirajul Islam)", bn: "পঞ্চগড় স্টেশন", stopRequired: true, platformSide: "right", biome: "tea_hills", landmark: "panchagarh_terminal" }
      ],
      events: [
        { km: 0.9, type: "bridge", name: "Hardinge Bridge (1915 Crimson Steel Truss over Padma River)", lengthKm: 1.3, speedLimit: 60, bridgeStyle: "hardinge_crimson" },
        { km: 4.0, type: "level_crossing", name: "Natore Kachagolla Market Crossing", density: "high", speedLimit: 75 },
        { km: 7.0, type: "whistle_board", name: "Hili Zero-Line Border Track Whistle Board", speedLimit: 80 },
        { km: 10.2, type: "level_crossing", name: "Dinajpur Ramsagar Approach Gate", density: "medium", speedLimit: 85 }
      ]
    }
  ],

  // --------------------------------------------------------------------------
  // 4. CULTURAL AMBIENCE, PA ANNOUNCEMENTS, & HAWKER CALLOUTS
  // --------------------------------------------------------------------------
  hawkerCries: [
    { bn: "এই চা... গরম চা! দুধ চা, রঙ চা!", en: "Hot Tea! Milk tea, spiced red tea!" },
    { bn: "ঝালমুড়ি! স্পেশাল সরিষার তেলের ঝালমুড়ি!", en: "Jhalmuri! Fresh puffed rice with mustard oil & chili!" },
    { bn: "গরম সিঙ্গারা, সমুচা, ডিম চপ!", en: "Hot Singara, Samosa, Egg Chops!" },
    { bn: "ঠান্ডা পানির বোতল, কলা, পাউরুটি!", en: "Cold water bottles, ripe bananas, fresh bread!" },
    { bn: "নাটোরের কাঁচাগোল্লা, কুমিল্লার রসমালাই!", en: "Famous Natore Kachagolla & Cumilla Rasmalai sweets!" }
  ],

  guardMessages: [
    { bn: "গার্ড সাহেব: ব্রেক পাইপ প্রেসার ৫.০ কেজি/সেমি২। সবুজ পতাকা প্রদর্শিত—লাইন ক্লিয়ার!", en: "Guard via VHF: Brake Pipe 5.0 kg/cm² verified. Green Flag shown — Line Clear to depart!" },
    { bn: "গার্ড সাহেব: লেভেল ক্রসিংয়ে রিকশা ও সিএনজি! হর্ন বাজান!", en: "Guard via VHF: Heavy CNG & Rickshaw traffic at upcoming Rail Gate! Sound the Horn [SPACE]!" },
    { bn: "গার্ড সাহেব: যাত্রীরা চেইন টেনেছে (ACP)! ট্রেন থামিয়ে আলপ (ALP) দিয়ে ভালভ রিসেট করুন!", en: "Guard via VHF: Passenger Alarm Chain Pulled (ACP) in Coach 6! Stop & have ALP press [P] to reset clapper valve!" }
  ]
};

