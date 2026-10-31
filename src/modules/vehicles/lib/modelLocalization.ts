/**
 * @file modelLocalization.ts
 * @description Centralized Arabic-first display-name localization layer
 * for vehicle models across Miqwad.
 *
 * Covers all 296 verified live models across 40 brands.
 * Preserves canonical backend model names and original model IDs.
 * Primary lookup by stable numeric modelId; secondary fallback by brandId/brandName + modelName.
 */
import i18n from "@app/i18n";
import type { Vehicle } from "../types";
import {
  normalizeArabic,
  getBrandEnglishName,
  ARABIC_NAME_TO_BRAND_ID,
  BRAND_LOCALIZATION_CATALOG,
} from "./brandLocalization";

export { normalizeArabic };

/** Primary mapping: modelId -> Arabic display name (296 verified catalog models). */
export const MODEL_ARABIC_NAMES: Readonly<Record<number, string>> = {
  // ── Brand 9: تويوتا ──
  5: "كامري", // Camry
  6: "كورولا", // Corolla
  7: "لاندكروزر", // Land Cruiser
  8: "لاندكروزر برادو", // Land Cruiser Prado
  9: "فورتشنر", // Fortuner
  10: "هايلكس", // Hilux
  11: "يارس", // Yaris
  12: "راف فور", // RAV4
  13: "هايلاندر", // Highlander
  14: "بريوس", // Prius
  15: "أفانزا", // Avanza
  16: "راش", // Rush
  17: "إنوفا", // Innova
  18: "فيلوز", // Veloz
  19: "كورولا كروس", // Corolla Cross
  20: "أوربان كروزر", // Urban Cruiser
  21: "رايز", // Raize
  22: "كراون", // Crown
  23: "سيكويا", // Sequoia
  24: "تندرا", // Tundra
  25: "لاندكروزر 70", // Land Cruiser 70
  26: "لاندكروزر بيك أب", // Land Cruiser Pickup
  27: "هايس", // HiAce
  28: "كوستر", // Coaster
  // ── Brand 10: لكزس ──
  45: "إي إس", // ES
  46: "آي إس", // IS
  47: "إل إس", // LS
  48: "آر سي", // RC
  49: "إل سي", // LC
  50: "إن إكس", // NX
  51: "آر إكس", // RX
  52: "يو إكس", // UX
  53: "جي إكس", // GX
  54: "إل إكس", // LX
  // ── Brand 11: نيسان ──
  29: "باترول", // Patrol
  30: "ألتيما", // Altima
  31: "صني", // Sunny
  32: "إكس تريل", // X-Trail
  33: "باثفندر", // Pathfinder
  34: "نافارا", // Navara
  35: "كيكس", // Kicks
  36: "سنترا", // Sentra
  37: "مكسيما", // Maxima
  38: "أرمادا", // Armada
  39: "إكستيرا", // Xterra
  40: "مورانو", // Murano
  41: "فرونتير", // Frontier
  42: "تيتان", // Titan
  43: "370 زد", // 370Z
  44: "جي تي آر", // GT-R
  // ── Brand 12: إنفينيتي ──
  63: "كيو إكس 50", // QX50
  64: "كيو إكس 55", // QX55
  65: "كيو إكس 60", // QX60
  66: "كيو إكس 80", // QX80
  67: "كيو 50", // Q50
  68: "كيو 60", // Q60
  // ── Brand 13: هوندا ──
  55: "سيفيك", // Civic
  56: "أكورد", // Accord
  57: "سيتي", // City
  58: "سي آر في", // CR-V
  59: "إتش آر في", // HR-V
  60: "بايلوت", // Pilot
  61: "أوديسي", // Odyssey
  62: "زد آر في", // ZR-V
  // ── Brand 15: مازدا ──
  243: "مازدا 2", // Mazda 2
  244: "مازدا 3", // Mazda 3
  245: "مازدا 6", // Mazda 6
  246: "سي إكس 3", // CX-3
  247: "سي إكس 30", // CX-30
  248: "سي إكس 5", // CX-5
  249: "سي إكس 60", // CX-60
  250: "سي إكس 90", // CX-90
  251: "بي تي 50", // BT-50
  // ── Brand 16: ميتسوبيشي ──
  252: "باجيرو", // Pajero
  253: "مونتيرو سبورت", // Montero Sport
  254: "أوتلاندر", // Outlander
  255: "إيه إس إكس", // ASX
  256: "إكليبس كروس", // Eclipse Cross
  257: "إكسباندر", // Xpander
  258: "إل 200", // L200
  // ── Brand 17: سوزوكي ──
  259: "سويفت", // Swift
  260: "جيمني", // Jimny
  261: "جراند فيتارا", // Grand Vitara
  262: "فيتارا", // Vitara
  263: "أرتيجا", // Ertiga
  264: "إكس إل 7", // XL7
  265: "بالينو", // Baleno
  // ── Brand 18: سوبارو ──
  266: "فورستر", // Forester
  267: "أوتباك", // Outback
  268: "كروستريك", // Crosstrek
  269: "دبليو آر إكس", // WRX
  270: "إمبريزا", // Impreza
  // ── Brand 19: هيونداي ──
  69: "أكسنت", // Accent
  70: "إلنترا", // Elantra
  71: "سوناتا", // Sonata
  72: "أزيرا", // Azera
  73: "فينيو", // Venue
  74: "كونا", // Kona
  75: "كريتا", // Creta
  76: "توسان", // Tucson
  77: "سنتافي", // Santa Fe
  78: "باليسيد", // Palisade
  79: "ستاريا", // Staria
  80: "إتش 1", // H-1
  81: "أيونك 5", // Ioniq 5
  82: "أيونك 6", // Ioniq 6
  // ── Brand 20: كيا ──
  83: "سيراتو", // Cerato
  84: "كي 5", // K5
  85: "كي 8", // K8
  86: "ريو", // Rio
  87: "سونيت", // Sonet
  88: "سيلتوس", // Seltos
  89: "سبورتاج", // Sportage
  90: "سورينتو", // Sorento
  91: "تيلورايد", // Telluride
  92: "كارينز", // Carens
  93: "إي في 6", // EV6
  94: "إي في 9", // EV9
  // ── Brand 21: جينيسيس ──
  95: "جي 70", // G70
  96: "جي 80", // G80
  97: "جي 90", // G90
  98: "جي في 70", // GV70
  99: "جي في 80", // GV80
  // ── Brand 22: فورد ──
  100: "إف 150", // F-150
  101: "رينجر", // Ranger
  102: "إكسبلورر", // Explorer
  103: "إكسبدشن", // Expedition
  104: "إيدج", // Edge
  105: "تيريتوري", // Territory
  106: "إيفرست", // Everest
  107: "موستنج", // Mustang
  108: "برونكو", // Bronco
  109: "توروس", // Taurus
  // ── Brand 23: شيفروليه ──
  110: "تاهو", // Tahoe
  111: "سوبربان", // Suburban
  112: "سيلفرادو", // Silverado
  113: "ترافيرس", // Traverse
  114: "بليزر", // Blazer
  115: "كابتيفا", // Captiva
  116: "جرووف", // Groove
  117: "كمارو", // Camaro
  118: "كورفيت", // Corvette
  // ── Brand 24: جي إم سي ──
  119: "يوكن", // Yukon
  120: "يوكن إكس إل", // Yukon XL
  121: "سييرا", // Sierra
  122: "أكاديا", // Acadia
  123: "تيرين", // Terrain
  124: "كانيون", // Canyon
  // ── Brand 25: كاديلاك ──
  125: "إسكاليد", // Escalade
  126: "إسكاليد إي إس في", // Escalade ESV
  127: "سي تي 4", // CT4
  128: "سي تي 5", // CT5
  129: "إكس تي 4", // XT4
  130: "إكس تي 5", // XT5
  131: "إكس تي 6", // XT6
  // ── Brand 26: دودج ──
  132: "تشارجر", // Charger
  133: "تشالنجر", // Challenger
  134: "دورانجو", // Durango
  135: "رام 1500", // Ram 1500
  // ── Brand 27: جيب ──
  136: "رانجلر", // Wrangler
  137: "جراند شيروكي", // Grand Cherokee
  138: "جلاديتور", // Gladiator
  139: "كومباس", // Compass
  // ── Brand 28: كرايسلر ──
  140: "300", // 300
  141: "باسيفيكا", // Pacifica
  // ── Brand 29: بي إم دبليو ──
  142: "الفئة الأولى", // 1 Series
  143: "الفئة الثانية", // 2 Series
  144: "الفئة الثالثة", // 3 Series
  145: "الفئة الرابعة", // 4 Series
  146: "الفئة الخامسة", // 5 Series
  147: "الفئة السابعة", // 7 Series
  148: "إكس 1", // X1
  149: "إكس 3", // X3
  150: "إكس 4", // X4
  151: "إكس 5", // X5
  152: "إكس 6", // X6
  153: "إكس 7", // X7
  154: "إم 2", // M2
  155: "إم 3", // M3
  156: "إم 4", // M4
  157: "إم 5", // M5
  158: "آي إكس", // iX
  159: "زد 4", // Z4
  // ── Brand 30: مرسيدس بنز ──
  160: "الفئة A", // A-Class
  161: "الفئة C", // C-Class
  162: "الفئة E", // E-Class
  163: "الفئة S", // S-Class
  164: "جي إل إيه", // GLA
  165: "جي إل بي", // GLB
  166: "جي إل سي", // GLC
  167: "جي إل إي", // GLE
  168: "جي إل إس", // GLS
  169: "الفئة G", // G-Class
  170: "سي إل إيه", // CLA
  171: "سي إل إي", // CLE
  172: "إيه إم جي جي تي", // AMG GT
  // ── Brand 31: أودي ──
  173: "إيه 3", // A3
  174: "إيه 4", // A4
  175: "إيه 5", // A5
  176: "إيه 6", // A6
  177: "إيه 7", // A7
  178: "إيه 8", // A8
  179: "كيو 2", // Q2
  180: "كيو 3", // Q3
  181: "كيو 5", // Q5
  182: "كيو 7", // Q7
  183: "كيو 8", // Q8
  184: "تي تي", // TT
  185: "آر 8", // R8
  // ── Brand 32: فولكس فاجن ──
  186: "جولف", // Golf
  187: "باسات", // Passat
  188: "تيجوان", // Tiguan
  189: "تيرامونت", // Teramont
  190: "طوارق", // Touareg
  191: "تي روك", // T-Roc
  192: "بولو", // Polo
  // ── Brand 33: بورش ──
  193: "911", // 911
  194: "كايين", // Cayenne
  195: "ماكان", // Macan
  196: "باناميرا", // Panamera
  197: "تايكان", // Taycan
  198: "718", // 718
  // ── Brand 34: فولفو ──
  199: "إكس سي 40", // XC40
  200: "إكس سي 60", // XC60
  201: "إكس سي 90", // XC90
  202: "إس 60", // S60
  203: "إس 90", // S90
  204: "سي 40", // C40
  // ── Brand 35: لاند روفر ──
  205: "رينج روفر", // Range Rover
  206: "رينج روفر سبورت", // Range Rover Sport
  207: "رينج روفر إيفوك", // Range Rover Evoque
  208: "رينج روفر فيلار", // Range Rover Velar
  209: "ديفندر", // Defender
  210: "ديسكفري", // Discovery
  211: "ديسكفري سبورت", // Discovery Sport
  // ── Brand 36: جاكوار ──
  212: "إف بيس", // F-PACE
  213: "إي بيس", // E-PACE
  214: "إف تايب", // F-TYPE
  215: "إكس إي", // XE
  216: "إكس إف", // XF
  // ── Brand 37: ميني ──
  217: "كوبر", // Cooper
  218: "كانتري مان", // Countryman
  219: "كلوب مان", // Clubman
  // ── Brand 38: بنتلي ──
  220: "كونتيننتال جي تي", // Continental GT
  221: "فلاينج سبور", // Flying Spur
  222: "بنتايجا", // Bentayga
  // ── Brand 39: رولز رويس ──
  223: "فانتوم", // Phantom
  224: "جوست", // Ghost
  225: "ريث", // Wraith
  226: "داون", // Dawn
  227: "كولينان", // Cullinan
  228: "سبكتر", // Spectre
  // ── Brand 40: فيراري ──
  229: "روما", // Roma
  230: "296 جي تي بي", // 296 GTB
  231: "إس إف 90 سترادالي", // SF90 Stradale
  232: "إف 8 تريبوتو", // F8 Tributo
  233: "بورتوفينو", // Portofino
  234: "بوروسانجوي", // Purosangue
  // ── Brand 41: لامبورغيني ──
  235: "أوروس", // Urus
  236: "هوراكان", // Huracan
  237: "ريفويلتو", // Revuelto
  // ── Brand 42: مازيراتي ──
  238: "جيبلي", // Ghibli
  239: "كواتروبورتي", // Quattroporte
  240: "ليفانتي", // Levante
  241: "جريكالي", // Grecale
  242: "جران توريزمو", // GranTurismo
  // ── Brand 43: بي واي دي ──
  295: "أتو 3", // Atto 3
  296: "سيل", // Seal
  297: "هان", // Han
  298: "سونج بلس", // Song Plus
  299: "سي ليون 7", // Sealion 7
  300: "دولفين", // Dolphin
  // ── Brand 44: جيلي ──
  291: "كولراي", // Coolray
  292: "مونجارو", // Monjaro
  293: "أوكافانجو", // Okavango
  294: "بريفيس", // Preface
  // ── Brand 45: شيري ──
  287: "تيجو 4 برو", // Tiggo 4 Pro
  288: "تيجو 7 برو", // Tiggo 7 Pro
  289: "تيجو 8 برو", // Tiggo 8 Pro
  290: "أريزو 6", // Arrizo 6
  // ── Brand 46: شانجان ──
  280: "ألسفن", // Alsvin
  281: "سي إس 35 بلس", // CS35 Plus
  282: "سي إس 75 بلس", // CS75 Plus
  283: "يوني تي", // UNI-T
  284: "يوني كي", // UNI-K
  285: "يوني في", // UNI-V
  286: "أوشان إكس 7", // Oshan X7
  // ── Brand 47: هافال ──
  277: "جوليان", // Jolion
  278: "إتش 6", // H6
  279: "إتش 9", // H9
  // ── Brand 48: إم جي ──
  271: "إم جي 5", // MG 5
  272: "إم جي 6", // MG 6
  273: "إم جي 7", // MG 7
  274: "إم جي إتش إس", // MG HS
  275: "إم جي زد إس", // MG ZS
  276: "إم جي ون", // MG One
};

/** Primary mapping: modelId -> Canonical English display name (296 verified catalog models). */
export const MODEL_ENGLISH_NAMES: Readonly<Record<number, string>> = {
  5: "Camry",
  6: "Corolla",
  7: "Land Cruiser",
  8: "Land Cruiser Prado",
  9: "Fortuner",
  10: "Hilux",
  11: "Yaris",
  12: "RAV4",
  13: "Highlander",
  14: "Prius",
  15: "Avanza",
  16: "Rush",
  17: "Innova",
  18: "Veloz",
  19: "Corolla Cross",
  20: "Urban Cruiser",
  21: "Raize",
  22: "Crown",
  23: "Sequoia",
  24: "Tundra",
  25: "Land Cruiser 70",
  26: "Land Cruiser Pickup",
  27: "HiAce",
  28: "Coaster",
  29: "Patrol",
  30: "Altima",
  31: "Sunny",
  32: "X-Trail",
  33: "Pathfinder",
  34: "Navara",
  35: "Kicks",
  36: "Sentra",
  37: "Maxima",
  38: "Armada",
  39: "Xterra",
  40: "Murano",
  41: "Frontier",
  42: "Titan",
  43: "370Z",
  44: "GT-R",
  45: "ES",
  46: "IS",
  47: "LS",
  48: "RC",
  49: "LC",
  50: "NX",
  51: "RX",
  52: "UX",
  53: "GX",
  54: "LX",
  55: "Civic",
  56: "Accord",
  57: "City",
  58: "CR-V",
  59: "HR-V",
  60: "Pilot",
  61: "Odyssey",
  62: "ZR-V",
  63: "QX50",
  64: "QX55",
  65: "QX60",
  66: "QX80",
  67: "Q50",
  68: "Q60",
  69: "Accent",
  70: "Elantra",
  71: "Sonata",
  72: "Azera",
  73: "Venue",
  74: "Kona",
  75: "Creta",
  76: "Tucson",
  77: "Santa Fe",
  78: "Palisade",
  79: "Staria",
  80: "H-1",
  81: "Ioniq 5",
  82: "Ioniq 6",
  83: "Cerato",
  84: "K5",
  85: "K8",
  86: "Rio",
  87: "Sonet",
  88: "Seltos",
  89: "Sportage",
  90: "Sorento",
  91: "Telluride",
  92: "Carens",
  93: "EV6",
  94: "EV9",
  95: "G70",
  96: "G80",
  97: "G90",
  98: "GV70",
  99: "GV80",
  100: "F-150",
  101: "Ranger",
  102: "Explorer",
  103: "Expedition",
  104: "Edge",
  105: "Territory",
  106: "Everest",
  107: "Mustang",
  108: "Bronco",
  109: "Taurus",
  110: "Tahoe",
  111: "Suburban",
  112: "Silverado",
  113: "Traverse",
  114: "Blazer",
  115: "Captiva",
  116: "Groove",
  117: "Camaro",
  118: "Corvette",
  119: "Yukon",
  120: "Yukon XL",
  121: "Sierra",
  122: "Acadia",
  123: "Terrain",
  124: "Canyon",
  125: "Escalade",
  126: "Escalade ESV",
  127: "CT4",
  128: "CT5",
  129: "XT4",
  130: "XT5",
  131: "XT6",
  132: "Charger",
  133: "Challenger",
  134: "Durango",
  135: "Ram 1500",
  136: "Wrangler",
  137: "Grand Cherokee",
  138: "Gladiator",
  139: "Compass",
  140: "300",
  141: "Pacifica",
  142: "1 Series",
  143: "2 Series",
  144: "3 Series",
  145: "4 Series",
  146: "5 Series",
  147: "7 Series",
  148: "X1",
  149: "X3",
  150: "X4",
  151: "X5",
  152: "X6",
  153: "X7",
  154: "M2",
  155: "M3",
  156: "M4",
  157: "M5",
  158: "iX",
  159: "Z4",
  160: "A-Class",
  161: "C-Class",
  162: "E-Class",
  163: "S-Class",
  164: "GLA",
  165: "GLB",
  166: "GLC",
  167: "GLE",
  168: "GLS",
  169: "G-Class",
  170: "CLA",
  171: "CLE",
  172: "AMG GT",
  173: "A3",
  174: "A4",
  175: "A5",
  176: "A6",
  177: "A7",
  178: "A8",
  179: "Q2",
  180: "Q3",
  181: "Q5",
  182: "Q7",
  183: "Q8",
  184: "TT",
  185: "R8",
  186: "Golf",
  187: "Passat",
  188: "Tiguan",
  189: "Teramont",
  190: "Touareg",
  191: "T-Roc",
  192: "Polo",
  193: "911",
  194: "Cayenne",
  195: "Macan",
  196: "Panamera",
  197: "Taycan",
  198: "718",
  199: "XC40",
  200: "XC60",
  201: "XC90",
  202: "S60",
  203: "S90",
  204: "C40",
  205: "Range Rover",
  206: "Range Rover Sport",
  207: "Range Rover Evoque",
  208: "Range Rover Velar",
  209: "Defender",
  210: "Discovery",
  211: "Discovery Sport",
  212: "F-PACE",
  213: "E-PACE",
  214: "F-TYPE",
  215: "XE",
  216: "XF",
  217: "Cooper",
  218: "Countryman",
  219: "Clubman",
  220: "Continental GT",
  221: "Flying Spur",
  222: "Bentayga",
  223: "Phantom",
  224: "Ghost",
  225: "Wraith",
  226: "Dawn",
  227: "Cullinan",
  228: "Spectre",
  229: "Roma",
  230: "296 GTB",
  231: "SF90 Stradale",
  232: "F8 Tributo",
  233: "Portofino",
  234: "Purosangue",
  235: "Urus",
  236: "Huracan",
  237: "Revuelto",
  238: "Ghibli",
  239: "Quattroporte",
  240: "Levante",
  241: "Grecale",
  242: "GranTurismo",
  243: "Mazda 2",
  244: "Mazda 3",
  245: "Mazda 6",
  246: "CX-3",
  247: "CX-30",
  248: "CX-5",
  249: "CX-60",
  250: "CX-90",
  251: "BT-50",
  252: "Pajero",
  253: "Montero Sport",
  254: "Outlander",
  255: "ASX",
  256: "Eclipse Cross",
  257: "Xpander",
  258: "L200",
  259: "Swift",
  260: "Jimny",
  261: "Grand Vitara",
  262: "Vitara",
  263: "Ertiga",
  264: "XL7",
  265: "Baleno",
  266: "Forester",
  267: "Outback",
  268: "Crosstrek",
  269: "WRX",
  270: "Impreza",
  271: "MG 5",
  272: "MG 6",
  273: "MG 7",
  274: "MG HS",
  275: "MG ZS",
  276: "MG One",
  277: "Jolion",
  278: "H6",
  279: "H9",
  280: "Alsvin",
  281: "CS35 Plus",
  282: "CS75 Plus",
  283: "UNI-T",
  284: "UNI-K",
  285: "UNI-V",
  286: "Oshan X7",
  287: "Tiggo 4 Pro",
  288: "Tiggo 7 Pro",
  289: "Tiggo 8 Pro",
  290: "Arrizo 6",
  291: "Coolray",
  292: "Monjaro",
  293: "Okavango",
  294: "Preface",
  295: "Atto 3",
  296: "Seal",
  297: "Han",
  298: "Song Plus",
  299: "Sealion 7",
  300: "Dolphin",
};

/** Secondary mapping: `${brandId}:${modelName.toLowerCase()}` -> Arabic display name. */
export const BRAND_ID_MODEL_ARABIC_NAMES: Readonly<Record<string, string>> = {
  "9:camry": "كامري",
  "9:corolla": "كورولا",
  "9:land cruiser": "لاندكروزر",
  "9:land cruiser prado": "لاندكروزر برادو",
  "9:fortuner": "فورتشنر",
  "9:hilux": "هايلكس",
  "9:yaris": "يارس",
  "9:rav4": "راف فور",
  "9:highlander": "هايلاندر",
  "9:prius": "بريوس",
  "9:avanza": "أفانزا",
  "9:rush": "راش",
  "9:innova": "إنوفا",
  "9:veloz": "فيلوز",
  "9:corolla cross": "كورولا كروس",
  "9:urban cruiser": "أوربان كروزر",
  "9:raize": "رايز",
  "9:crown": "كراون",
  "9:sequoia": "سيكويا",
  "9:tundra": "تندرا",
  "9:land cruiser 70": "لاندكروزر 70",
  "9:land cruiser pickup": "لاندكروزر بيك أب",
  "9:hiace": "هايس",
  "9:coaster": "كوستر",
  "10:es": "إي إس",
  "10:is": "آي إس",
  "10:ls": "إل إس",
  "10:rc": "آر سي",
  "10:lc": "إل سي",
  "10:nx": "إن إكس",
  "10:rx": "آر إكس",
  "10:ux": "يو إكس",
  "10:gx": "جي إكس",
  "10:lx": "إل إكس",
  "11:patrol": "باترول",
  "11:altima": "ألتيما",
  "11:sunny": "صني",
  "11:x-trail": "إكس تريل",
  "11:pathfinder": "باثفندر",
  "11:navara": "نافارا",
  "11:kicks": "كيكس",
  "11:sentra": "سنترا",
  "11:maxima": "مكسيما",
  "11:armada": "أرمادا",
  "11:xterra": "إكستيرا",
  "11:murano": "مورانو",
  "11:frontier": "فرونتير",
  "11:titan": "تيتان",
  "11:370z": "370 زد",
  "11:gt-r": "جي تي آر",
  "12:qx50": "كيو إكس 50",
  "12:qx55": "كيو إكس 55",
  "12:qx60": "كيو إكس 60",
  "12:qx80": "كيو إكس 80",
  "12:q50": "كيو 50",
  "12:q60": "كيو 60",
  "13:civic": "سيفيك",
  "13:accord": "أكورد",
  "13:city": "سيتي",
  "13:cr-v": "سي آر في",
  "13:hr-v": "إتش آر في",
  "13:pilot": "بايلوت",
  "13:odyssey": "أوديسي",
  "13:zr-v": "زد آر في",
  "15:mazda 2": "مازدا 2",
  "15:mazda 3": "مازدا 3",
  "15:mazda 6": "مازدا 6",
  "15:cx-3": "سي إكس 3",
  "15:cx-30": "سي إكس 30",
  "15:cx-5": "سي إكس 5",
  "15:cx-60": "سي إكس 60",
  "15:cx-90": "سي إكس 90",
  "15:bt-50": "بي تي 50",
  "16:pajero": "باجيرو",
  "16:montero sport": "مونتيرو سبورت",
  "16:outlander": "أوتلاندر",
  "16:asx": "إيه إس إكس",
  "16:eclipse cross": "إكليبس كروس",
  "16:xpander": "إكسباندر",
  "16:l200": "إل 200",
  "17:swift": "سويفت",
  "17:jimny": "جيمني",
  "17:grand vitara": "جراند فيتارا",
  "17:vitara": "فيتارا",
  "17:ertiga": "أرتيجا",
  "17:xl7": "إكس إل 7",
  "17:baleno": "بالينو",
  "18:forester": "فورستر",
  "18:outback": "أوتباك",
  "18:crosstrek": "كروستريك",
  "18:wrx": "دبليو آر إكس",
  "18:impreza": "إمبريزا",
  "19:accent": "أكسنت",
  "19:elantra": "إلنترا",
  "19:sonata": "سوناتا",
  "19:azera": "أزيرا",
  "19:venue": "فينيو",
  "19:kona": "كونا",
  "19:creta": "كريتا",
  "19:tucson": "توسان",
  "19:santa fe": "سنتافي",
  "19:palisade": "باليسيد",
  "19:staria": "ستاريا",
  "19:h-1": "إتش 1",
  "19:ioniq 5": "أيونك 5",
  "19:ioniq 6": "أيونك 6",
  "20:cerato": "سيراتو",
  "20:k5": "كي 5",
  "20:k8": "كي 8",
  "20:rio": "ريو",
  "20:sonet": "سونيت",
  "20:seltos": "سيلتوس",
  "20:sportage": "سبورتاج",
  "20:sorento": "سورينتو",
  "20:telluride": "تيلورايد",
  "20:carens": "كارينز",
  "20:ev6": "إي في 6",
  "20:ev9": "إي في 9",
  "21:g70": "جي 70",
  "21:g80": "جي 80",
  "21:g90": "جي 90",
  "21:gv70": "جي في 70",
  "21:gv80": "جي في 80",
  "22:f-150": "إف 150",
  "22:ranger": "رينجر",
  "22:explorer": "إكسبلورر",
  "22:expedition": "إكسبدشن",
  "22:edge": "إيدج",
  "22:territory": "تيريتوري",
  "22:everest": "إيفرست",
  "22:mustang": "موستنج",
  "22:bronco": "برونكو",
  "22:taurus": "توروس",
  "23:tahoe": "تاهو",
  "23:suburban": "سوبربان",
  "23:silverado": "سيلفرادو",
  "23:traverse": "ترافيرس",
  "23:blazer": "بليزر",
  "23:captiva": "كابتيفا",
  "23:groove": "جرووف",
  "23:camaro": "كمارو",
  "23:corvette": "كورفيت",
  "24:yukon": "يوكن",
  "24:yukon xl": "يوكن إكس إل",
  "24:sierra": "سييرا",
  "24:acadia": "أكاديا",
  "24:terrain": "تيرين",
  "24:canyon": "كانيون",
  "25:escalade": "إسكاليد",
  "25:escalade esv": "إسكاليد إي إس في",
  "25:ct4": "سي تي 4",
  "25:ct5": "سي تي 5",
  "25:xt4": "إكس تي 4",
  "25:xt5": "إكس تي 5",
  "25:xt6": "إكس تي 6",
  "26:charger": "تشارجر",
  "26:challenger": "تشالنجر",
  "26:durango": "دورانجو",
  "26:ram 1500": "رام 1500",
  "27:wrangler": "رانجلر",
  "27:grand cherokee": "جراند شيروكي",
  "27:gladiator": "جلاديتور",
  "27:compass": "كومباس",
  "28:300": "300",
  "28:pacifica": "باسيفيكا",
  "29:1 series": "الفئة الأولى",
  "29:2 series": "الفئة الثانية",
  "29:3 series": "الفئة الثالثة",
  "29:4 series": "الفئة الرابعة",
  "29:5 series": "الفئة الخامسة",
  "29:7 series": "الفئة السابعة",
  "29:x1": "إكس 1",
  "29:x3": "إكس 3",
  "29:x4": "إكس 4",
  "29:x5": "إكس 5",
  "29:x6": "إكس 6",
  "29:x7": "إكس 7",
  "29:m2": "إم 2",
  "29:m3": "إم 3",
  "29:m4": "إم 4",
  "29:m5": "إم 5",
  "29:ix": "آي إكس",
  "29:z4": "زد 4",
  "30:a-class": "الفئة A",
  "30:c-class": "الفئة C",
  "30:e-class": "الفئة E",
  "30:s-class": "الفئة S",
  "30:gla": "جي إل إيه",
  "30:glb": "جي إل بي",
  "30:glc": "جي إل سي",
  "30:gle": "جي إل إي",
  "30:gls": "جي إل إس",
  "30:g-class": "الفئة G",
  "30:cla": "سي إل إيه",
  "30:cle": "سي إل إي",
  "30:amg gt": "إيه إم جي جي تي",
  "31:a3": "إيه 3",
  "31:a4": "إيه 4",
  "31:a5": "إيه 5",
  "31:a6": "إيه 6",
  "31:a7": "إيه 7",
  "31:a8": "إيه 8",
  "31:q2": "كيو 2",
  "31:q3": "كيو 3",
  "31:q5": "كيو 5",
  "31:q7": "كيو 7",
  "31:q8": "كيو 8",
  "31:tt": "تي تي",
  "31:r8": "آر 8",
  "32:golf": "جولف",
  "32:passat": "باسات",
  "32:tiguan": "تيجوان",
  "32:teramont": "تيرامونت",
  "32:touareg": "طوارق",
  "32:t-roc": "تي روك",
  "32:polo": "بولو",
  "33:911": "911",
  "33:cayenne": "كايين",
  "33:macan": "ماكان",
  "33:panamera": "باناميرا",
  "33:taycan": "تايكان",
  "33:718": "718",
  "34:xc40": "إكس سي 40",
  "34:xc60": "إكس سي 60",
  "34:xc90": "إكس سي 90",
  "34:s60": "إس 60",
  "34:s90": "إس 90",
  "34:c40": "سي 40",
  "35:range rover": "رينج روفر",
  "35:range rover sport": "رينج روفر سبورت",
  "35:range rover evoque": "رينج روفر إيفوك",
  "35:range rover velar": "رينج روفر فيلار",
  "35:defender": "ديفندر",
  "35:discovery": "ديسكفري",
  "35:discovery sport": "ديسكفري سبورت",
  "36:f-pace": "إف بيس",
  "36:e-pace": "إي بيس",
  "36:f-type": "إف تايب",
  "36:xe": "إكس إي",
  "36:xf": "إكس إف",
  "37:cooper": "كوبر",
  "37:countryman": "كانتري مان",
  "37:clubman": "كلوب مان",
  "38:continental gt": "كونتيننتال جي تي",
  "38:flying spur": "فلاينج سبور",
  "38:bentayga": "بنتايجا",
  "39:phantom": "فانتوم",
  "39:ghost": "جوست",
  "39:wraith": "ريث",
  "39:dawn": "داون",
  "39:cullinan": "كولينان",
  "39:spectre": "سبكتر",
  "40:roma": "روما",
  "40:296 gtb": "296 جي تي بي",
  "40:sf90 stradale": "إس إف 90 سترادالي",
  "40:f8 tributo": "إف 8 تريبوتو",
  "40:portofino": "بورتوفينو",
  "40:purosangue": "بوروسانجوي",
  "41:urus": "أوروس",
  "41:huracan": "هوراكان",
  "41:revuelto": "ريفويلتو",
  "42:ghibli": "جيبلي",
  "42:quattroporte": "كواتروبورتي",
  "42:levante": "ليفانتي",
  "42:grecale": "جريكالي",
  "42:granturismo": "جران توريزمو",
  "43:atto 3": "أتو 3",
  "43:seal": "سيل",
  "43:han": "هان",
  "43:song plus": "سونج بلس",
  "43:sealion 7": "سي ليون 7",
  "43:dolphin": "دولفين",
  "44:coolray": "كولراي",
  "44:monjaro": "مونجارو",
  "44:okavango": "أوكافانجو",
  "44:preface": "بريفيس",
  "45:tiggo 4 pro": "تيجو 4 برو",
  "45:tiggo 7 pro": "تيجو 7 برو",
  "45:tiggo 8 pro": "تيجو 8 برو",
  "45:arrizo 6": "أريزو 6",
  "46:alsvin": "ألسفن",
  "46:cs35 plus": "سي إس 35 بلس",
  "46:cs75 plus": "سي إس 75 بلس",
  "46:uni-t": "يوني تي",
  "46:uni-k": "يوني كي",
  "46:uni-v": "يوني في",
  "46:oshan x7": "أوشان إكس 7",
  "47:jolion": "جوليان",
  "47:h6": "إتش 6",
  "47:h9": "إتش 9",
  "48:mg 5": "إم جي 5",
  "48:mg 6": "إم جي 6",
  "48:mg 7": "إم جي 7",
  "48:mg hs": "إم جي إتش إس",
  "48:mg zs": "إم جي زد إس",
  "48:mg one": "إم جي ون",
};

/** Secondary mapping: `${brandName}:${modelName.toLowerCase()}` -> Arabic display name. */
export const BRAND_NAME_MODEL_ARABIC_NAMES: Readonly<Record<string, string>> = {
  "تويوتا:camry": "كامري",
  "تويوتا:corolla": "كورولا",
  "تويوتا:land cruiser": "لاندكروزر",
  "تويوتا:land cruiser prado": "لاندكروزر برادو",
  "تويوتا:fortuner": "فورتشنر",
  "تويوتا:hilux": "هايلكس",
  "تويوتا:yaris": "يارس",
  "تويوتا:rav4": "راف فور",
  "تويوتا:highlander": "هايلاندر",
  "تويوتا:prius": "بريوس",
  "تويوتا:avanza": "أفانزا",
  "تويوتا:rush": "راش",
  "تويوتا:innova": "إنوفا",
  "تويوتا:veloz": "فيلوز",
  "تويوتا:corolla cross": "كورولا كروس",
  "تويوتا:urban cruiser": "أوربان كروزر",
  "تويوتا:raize": "رايز",
  "تويوتا:crown": "كراون",
  "تويوتا:sequoia": "سيكويا",
  "تويوتا:tundra": "تندرا",
  "تويوتا:land cruiser 70": "لاندكروزر 70",
  "تويوتا:land cruiser pickup": "لاندكروزر بيك أب",
  "تويوتا:hiace": "هايس",
  "تويوتا:coaster": "كوستر",
  "لكزس:es": "إي إس",
  "لكزس:is": "آي إس",
  "لكزس:ls": "إل إس",
  "لكزس:rc": "آر سي",
  "لكزس:lc": "إل سي",
  "لكزس:nx": "إن إكس",
  "لكزس:rx": "آر إكس",
  "لكزس:ux": "يو إكس",
  "لكزس:gx": "جي إكس",
  "لكزس:lx": "إل إكس",
  "نيسان:patrol": "باترول",
  "نيسان:altima": "ألتيما",
  "نيسان:sunny": "صني",
  "نيسان:x-trail": "إكس تريل",
  "نيسان:pathfinder": "باثفندر",
  "نيسان:navara": "نافارا",
  "نيسان:kicks": "كيكس",
  "نيسان:sentra": "سنترا",
  "نيسان:maxima": "مكسيما",
  "نيسان:armada": "أرمادا",
  "نيسان:xterra": "إكستيرا",
  "نيسان:murano": "مورانو",
  "نيسان:frontier": "فرونتير",
  "نيسان:titan": "تيتان",
  "نيسان:370z": "370 زد",
  "نيسان:gt-r": "جي تي آر",
  "إنفينيتي:qx50": "كيو إكس 50",
  "إنفينيتي:qx55": "كيو إكس 55",
  "إنفينيتي:qx60": "كيو إكس 60",
  "إنفينيتي:qx80": "كيو إكس 80",
  "إنفينيتي:q50": "كيو 50",
  "إنفينيتي:q60": "كيو 60",
  "هوندا:civic": "سيفيك",
  "هوندا:accord": "أكورد",
  "هوندا:city": "سيتي",
  "هوندا:cr-v": "سي آر في",
  "هوندا:hr-v": "إتش آر في",
  "هوندا:pilot": "بايلوت",
  "هوندا:odyssey": "أوديسي",
  "هوندا:zr-v": "زد آر في",
  "مازدا:mazda 2": "مازدا 2",
  "مازدا:mazda 3": "مازدا 3",
  "مازدا:mazda 6": "مازدا 6",
  "مازدا:cx-3": "سي إكس 3",
  "مازدا:cx-30": "سي إكس 30",
  "مازدا:cx-5": "سي إكس 5",
  "مازدا:cx-60": "سي إكس 60",
  "مازدا:cx-90": "سي إكس 90",
  "مازدا:bt-50": "بي تي 50",
  "ميتسوبيشي:pajero": "باجيرو",
  "ميتسوبيشي:montero sport": "مونتيرو سبورت",
  "ميتسوبيشي:outlander": "أوتلاندر",
  "ميتسوبيشي:asx": "إيه إس إكس",
  "ميتسوبيشي:eclipse cross": "إكليبس كروس",
  "ميتسوبيشي:xpander": "إكسباندر",
  "ميتسوبيشي:l200": "إل 200",
  "سوزوكي:swift": "سويفت",
  "سوزوكي:jimny": "جيمني",
  "سوزوكي:grand vitara": "جراند فيتارا",
  "سوزوكي:vitara": "فيتارا",
  "سوزوكي:ertiga": "أرتيجا",
  "سوزوكي:xl7": "إكس إل 7",
  "سوزوكي:baleno": "بالينو",
  "سوبارو:forester": "فورستر",
  "سوبارو:outback": "أوتباك",
  "سوبارو:crosstrek": "كروستريك",
  "سوبارو:wrx": "دبليو آر إكس",
  "سوبارو:impreza": "إمبريزا",
  "هيونداي:accent": "أكسنت",
  "هيونداي:elantra": "إلنترا",
  "هيونداي:sonata": "سوناتا",
  "هيونداي:azera": "أزيرا",
  "هيونداي:venue": "فينيو",
  "هيونداي:kona": "كونا",
  "هيونداي:creta": "كريتا",
  "هيونداي:tucson": "توسان",
  "هيونداي:santa fe": "سنتافي",
  "هيونداي:palisade": "باليسيد",
  "هيونداي:staria": "ستاريا",
  "هيونداي:h-1": "إتش 1",
  "هيونداي:ioniq 5": "أيونك 5",
  "هيونداي:ioniq 6": "أيونك 6",
  "كيا:cerato": "سيراتو",
  "كيا:k5": "كي 5",
  "كيا:k8": "كي 8",
  "كيا:rio": "ريو",
  "كيا:sonet": "سونيت",
  "كيا:seltos": "سيلتوس",
  "كيا:sportage": "سبورتاج",
  "كيا:sorento": "سورينتو",
  "كيا:telluride": "تيلورايد",
  "كيا:carens": "كارينز",
  "كيا:ev6": "إي في 6",
  "كيا:ev9": "إي في 9",
  "جينيسيس:g70": "جي 70",
  "جينيسيس:g80": "جي 80",
  "جينيسيس:g90": "جي 90",
  "جينيسيس:gv70": "جي في 70",
  "جينيسيس:gv80": "جي في 80",
  "فورد:f-150": "إف 150",
  "فورد:ranger": "رينجر",
  "فورد:explorer": "إكسبلورر",
  "فورد:expedition": "إكسبدشن",
  "فورد:edge": "إيدج",
  "فورد:territory": "تيريتوري",
  "فورد:everest": "إيفرست",
  "فورد:mustang": "موستنج",
  "فورد:bronco": "برونكو",
  "فورد:taurus": "توروس",
  "شيفروليه:tahoe": "تاهو",
  "شيفروليه:suburban": "سوبربان",
  "شيفروليه:silverado": "سيلفرادو",
  "شيفروليه:traverse": "ترافيرس",
  "شيفروليه:blazer": "بليزر",
  "شيفروليه:captiva": "كابتيفا",
  "شيفروليه:groove": "جرووف",
  "شيفروليه:camaro": "كمارو",
  "شيفروليه:corvette": "كورفيت",
  "جي إم سي:yukon": "يوكن",
  "جي إم سي:yukon xl": "يوكن إكس إل",
  "جي إم سي:sierra": "سييرا",
  "جي إم سي:acadia": "أكاديا",
  "جي إم سي:terrain": "تيرين",
  "جي إم سي:canyon": "كانيون",
  "كاديلاك:escalade": "إسكاليد",
  "كاديلاك:escalade esv": "إسكاليد إي إس في",
  "كاديلاك:ct4": "سي تي 4",
  "كاديلاك:ct5": "سي تي 5",
  "كاديلاك:xt4": "إكس تي 4",
  "كاديلاك:xt5": "إكس تي 5",
  "كاديلاك:xt6": "إكس تي 6",
  "دودج:charger": "تشارجر",
  "دودج:challenger": "تشالنجر",
  "دودج:durango": "دورانجو",
  "دودج:ram 1500": "رام 1500",
  "جيب:wrangler": "رانجلر",
  "جيب:grand cherokee": "جراند شيروكي",
  "جيب:gladiator": "جلاديتور",
  "جيب:compass": "كومباس",
  "كرايسلر:300": "300",
  "كرايسلر:pacifica": "باسيفيكا",
  "بي إم دبليو:1 series": "الفئة الأولى",
  "بي إم دبليو:2 series": "الفئة الثانية",
  "بي إم دبليو:3 series": "الفئة الثالثة",
  "بي إم دبليو:4 series": "الفئة الرابعة",
  "بي إم دبليو:5 series": "الفئة الخامسة",
  "بي إم دبليو:7 series": "الفئة السابعة",
  "بي إم دبليو:x1": "إكس 1",
  "بي إم دبليو:x3": "إكس 3",
  "بي إم دبليو:x4": "إكس 4",
  "بي إم دبليو:x5": "إكس 5",
  "بي إم دبليو:x6": "إكس 6",
  "بي إم دبليو:x7": "إكس 7",
  "بي إم دبليو:m2": "إم 2",
  "بي إم دبليو:m3": "إم 3",
  "بي إم دبليو:m4": "إم 4",
  "بي إم دبليو:m5": "إم 5",
  "بي إم دبليو:ix": "آي إكس",
  "بي إم دبليو:z4": "زد 4",
  "مرسيدس بنز:a-class": "الفئة A",
  "مرسيدس بنز:c-class": "الفئة C",
  "مرسيدس بنز:e-class": "الفئة E",
  "مرسيدس بنز:s-class": "الفئة S",
  "مرسيدس بنز:gla": "جي إل إيه",
  "مرسيدس بنز:glb": "جي إل بي",
  "مرسيدس بنز:glc": "جي إل سي",
  "مرسيدس بنز:gle": "جي إل إي",
  "مرسيدس بنز:gls": "جي إل إس",
  "مرسيدس بنز:g-class": "الفئة G",
  "مرسيدس بنز:cla": "سي إل إيه",
  "مرسيدس بنز:cle": "سي إل إي",
  "مرسيدس بنز:amg gt": "إيه إم جي جي تي",
  "أودي:a3": "إيه 3",
  "أودي:a4": "إيه 4",
  "أودي:a5": "إيه 5",
  "أودي:a6": "إيه 6",
  "أودي:a7": "إيه 7",
  "أودي:a8": "إيه 8",
  "أودي:q2": "كيو 2",
  "أودي:q3": "كيو 3",
  "أودي:q5": "كيو 5",
  "أودي:q7": "كيو 7",
  "أودي:q8": "كيو 8",
  "أودي:tt": "تي تي",
  "أودي:r8": "آر 8",
  "فولكس فاجن:golf": "جولف",
  "فولكس فاجن:passat": "باسات",
  "فولكس فاجن:tiguan": "تيجوان",
  "فولكس فاجن:teramont": "تيرامونت",
  "فولكس فاجن:touareg": "طوارق",
  "فولكس فاجن:t-roc": "تي روك",
  "فولكس فاجن:polo": "بولو",
  "بورش:911": "911",
  "بورش:cayenne": "كايين",
  "بورش:macan": "ماكان",
  "بورش:panamera": "باناميرا",
  "بورش:taycan": "تايكان",
  "بورش:718": "718",
  "فولفو:xc40": "إكس سي 40",
  "فولفو:xc60": "إكس سي 60",
  "فولفو:xc90": "إكس سي 90",
  "فولفو:s60": "إس 60",
  "فولفو:s90": "إس 90",
  "فولفو:c40": "سي 40",
  "لاند روفر:range rover": "رينج روفر",
  "لاند روفر:range rover sport": "رينج روفر سبورت",
  "لاند روفر:range rover evoque": "رينج روفر إيفوك",
  "لاند روفر:range rover velar": "رينج روفر فيلار",
  "لاند روفر:defender": "ديفندر",
  "لاند روفر:discovery": "ديسكفري",
  "لاند روفر:discovery sport": "ديسكفري سبورت",
  "جاكوار:f-pace": "إف بيس",
  "جاكوار:e-pace": "إي بيس",
  "جاكوار:f-type": "إف تايب",
  "جاكوار:xe": "إكس إي",
  "جاكوار:xf": "إكس إف",
  "ميني:cooper": "كوبر",
  "ميني:countryman": "كانتري مان",
  "ميني:clubman": "كلوب مان",
  "بنتلي:continental gt": "كونتيننتال جي تي",
  "بنتلي:flying spur": "فلاينج سبور",
  "بنتلي:bentayga": "بنتايجا",
  "رولز رويس:phantom": "فانتوم",
  "رولز رويس:ghost": "جوست",
  "رولز رويس:wraith": "ريث",
  "رولز رويس:dawn": "داون",
  "رولز رويس:cullinan": "كولينان",
  "رولز رويس:spectre": "سبكتر",
  "فيراري:roma": "روما",
  "فيراري:296 gtb": "296 جي تي بي",
  "فيراري:sf90 stradale": "إس إف 90 سترادالي",
  "فيراري:f8 tributo": "إف 8 تريبوتو",
  "فيراري:portofino": "بورتوفينو",
  "فيراري:purosangue": "بوروسانجوي",
  "لامبورغيني:urus": "أوروس",
  "لامبورغيني:huracan": "هوراكان",
  "لامبورغيني:revuelto": "ريفويلتو",
  "مازيراتي:ghibli": "جيبلي",
  "مازيراتي:quattroporte": "كواتروبورتي",
  "مازيراتي:levante": "ليفانتي",
  "مازيراتي:grecale": "جريكالي",
  "مازيراتي:granturismo": "جران توريزمو",
  "بي واي دي:atto 3": "أتو 3",
  "بي واي دي:seal": "سيل",
  "بي واي دي:han": "هان",
  "بي واي دي:song plus": "سونج بلس",
  "بي واي دي:sealion 7": "سي ليون 7",
  "بي واي دي:dolphin": "دولفين",
  "جيلي:coolray": "كولراي",
  "جيلي:monjaro": "مونجارو",
  "جيلي:okavango": "أوكافانجو",
  "جيلي:preface": "بريفيس",
  "شيري:tiggo 4 pro": "تيجو 4 برو",
  "شيري:tiggo 7 pro": "تيجو 7 برو",
  "شيري:tiggo 8 pro": "تيجو 8 برو",
  "شيري:arrizo 6": "أريزو 6",
  "شانجان:alsvin": "ألسفن",
  "شانجان:cs35 plus": "سي إس 35 بلس",
  "شانجان:cs75 plus": "سي إس 75 بلس",
  "شانجان:uni-t": "يوني تي",
  "شانجان:uni-k": "يوني كي",
  "شانجان:uni-v": "يوني في",
  "شانجان:oshan x7": "أوشان إكس 7",
  "هافال:jolion": "جوليان",
  "هافال:h6": "إتش 6",
  "هافال:h9": "إتش 9",
  "إم جي:mg 5": "إم جي 5",
  "إم جي:mg 6": "إم جي 6",
  "إم جي:mg 7": "إم جي 7",
  "إم جي:mg hs": "إم جي إتش إس",
  "إم جي:mg zs": "إم جي زد إس",
  "إم جي:mg one": "إم جي ون",
};

/** Common Saudi-market spelling aliases for resilient search */
export const MODEL_SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "هايلكس": ["هايلوكس", "hilux"],
  "لاندكروزر": ["لاند كروزر", "landcruiser", "land cruiser", "لاند"],
  "لاندكروزر بيك أب": ["شاص", "بيك اب", "بيكاب"],
  "لاندكروزر 70": ["شاص", "شاصات"],
  "لاندكروزر برادو": ["برادو", "prado"],
  "باثفندر": ["باثفايندر", "باث فندر", "pathfinder"],
  "سنتافي": ["سانتافي", "سانتا في", "سنتا في", "santafe", "santa fe"],
  "توسان": ["توسون", "tucson"],
  "إلنترا": ["النترا", "elantra"],
  "أكسنت": ["اكسنت", "accent"],
  "أزيرا": ["ازيرا", "azera"],
  "إسكاليد": ["اسكاليد", "escalade"],
  "إسكاليد إي إس في": ["اسكاليد اي اس في", "escalade esv"],
  "جراند شيروكي": ["شيروكي", "grand cherokee", "cherokee"],
};

function checkModelSearchAliases(
  term: string,
  arabicModel: string,
  englishModel: string,
): boolean {
  const normTerm = normalizeArabic(term).toLowerCase();
  const normArabic = normalizeArabic(arabicModel);

  for (const [key, aliases] of Object.entries(MODEL_SEARCH_ALIASES)) {
    const normKey = normalizeArabic(key);
    if (normArabic.includes(normKey) || englishModel.toLowerCase().includes(key.toLowerCase())) {
      for (const alias of aliases) {
        const normAlias = normalizeArabic(alias).toLowerCase();
        if (normAlias.includes(normTerm) || normTerm.includes(normAlias)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Checks whether the specified language (or active i18n language) is Arabic.
 */
export function isArabicLanguage(lang?: string): boolean {
  const active = lang ?? i18n.language ?? "ar";
  return active.startsWith("ar");
}

/**
 * Returns the Arabic display name for a model by its stable ID.
 */
export function getModelArabicNameById(modelId: number | null | undefined): string | undefined {
  if (modelId == null || !Number.isFinite(modelId) || modelId <= 0) return undefined;
  return MODEL_ARABIC_NAMES[modelId];
}

/**
 * Returns the canonical English display name for a model by its stable ID.
 */
export function getModelEnglishNameById(modelId: number | null | undefined): string | undefined {
  if (modelId == null || !Number.isFinite(modelId) || modelId <= 0) return undefined;
  return MODEL_ENGLISH_NAMES[modelId];
}

/**
 * Returns the Arabic display name for a model using brand identity and model name.
 * Safe fallback for payloads that lack a model ID (e.g. legacy or salvage records).
 */
export function getModelArabicNameByBrand(
  brand: number | string | null | undefined,
  modelName: string | null | undefined,
): string | undefined {
  if (!brand || !modelName) return undefined;
  const cleanName = modelName.trim().toLowerCase();

  // If already directly in brand-name dictionary
  if (BRAND_NAME_MODEL_ARABIC_NAMES[`${brand}:${cleanName}`]) {
    return BRAND_NAME_MODEL_ARABIC_NAMES[`${brand}:${cleanName}`];
  }

  let resolvedBrandId: number | undefined;

  if (typeof brand === "number" && brand > 0) {
    resolvedBrandId = brand;
  } else if (typeof brand === "string" && brand.trim()) {
    const rawBrand = brand.trim();
    // 1. Try normalized Arabic brand name -> brandId
    const normBrand = normalizeArabic(rawBrand);
    if (ARABIC_NAME_TO_BRAND_ID[normBrand]) {
      resolvedBrandId = ARABIC_NAME_TO_BRAND_ID[normBrand];
    } else {
      // 2. Try English primary name or alias match -> brandId
      const lowerBrand = rawBrand.toLowerCase();
      for (const entry of Object.values(BRAND_LOCALIZATION_CATALOG)) {
        if (
          entry.primaryEnglish.toLowerCase() === lowerBrand ||
          entry.aliases.some((a) => a.toLowerCase() === lowerBrand)
        ) {
          resolvedBrandId = entry.id;
          break;
        }
      }
    }
  }

  if (resolvedBrandId != null && resolvedBrandId > 0) {
    const byId = BRAND_ID_MODEL_ARABIC_NAMES[`${resolvedBrandId}:${cleanName}`];
    if (byId) return byId;
  }

  const byName = BRAND_NAME_MODEL_ARABIC_NAMES[`${String(brand).trim()}:${cleanName}`];
  if (byName) return byName;

  // Safe fallback if modelName is already Arabic
  if (/[\u0600-\u06FF]/.test(modelName)) {
    return modelName.trim();
  }

  return undefined;
}

/**
 * Core model display-name resolution function.
 *
 * Rules:
 *   1. In Arabic mode: returns the verified Arabic model name if mapped.
 *   2. In English mode: returns the canonical English model name.
 *   3. If unmapped: returns the canonical model name as a safe fallback.
 *   4. Never fabricates translations.
 */
export function getModelDisplayName(
  model:
    | {
        id?: number | null;
        name?: string | null;
        brandId?: number | null;
        nameAr?: string | null;
      }
    | number
    | null
    | undefined,
  lang?: string,
  fallback?: string,
): string {
  const isAr = isArabicLanguage(lang);

  if (typeof model === "number") {
    if (isAr) {
      const ar = getModelArabicNameById(model);
      if (ar) return ar;
    } else {
      const en = getModelEnglishNameById(model);
      if (en) return en;
    }
    return fallback ?? "";
  }

  if (!model) return fallback ?? "";

  const canonicalName =
    model.name ??
    (model.id ? getModelEnglishNameById(model.id) : undefined) ??
    fallback ??
    "";

  if (!isAr) {
    return canonicalName;
  }

  // 1. Direct nameAr if already present on model
  if (model.nameAr) {
    return model.nameAr;
  }

  // 2. Lookup by modelId
  if (model.id != null && model.id > 0) {
    const arById = getModelArabicNameById(model.id);
    if (arById) return arById;
  }

  // 3. Secondary lookup by brandId and canonical name
  if (model.brandId != null && canonicalName) {
    const arByBrand = getModelArabicNameByBrand(model.brandId, canonicalName);
    if (arByBrand) return arByBrand;
  }

  // 4. Safe fallback to canonical API name
  return canonicalName;
}

/**
 * Localized model display-name resolution specifically for Vehicle records.
 */
export function getVehicleModelDisplayName(
  vehicle:
    | {
        modelId?: number | null;
        modelName?: string | null;
        brandId?: number | null;
        brandName?: string | null;
        modelNameAr?: string | null;
      }
    | null
    | undefined,
  lang?: string,
): string {
  if (!vehicle) return "";
  const isAr = isArabicLanguage(lang);
  const canonicalName =
    vehicle.modelName ??
    (vehicle.modelId ? getModelEnglishNameById(vehicle.modelId) : undefined) ??
    "";

  if (!isAr) {
    return canonicalName;
  }

  if (vehicle.modelNameAr) {
    return vehicle.modelNameAr;
  }

  // 1. Lookup by modelId
  if (vehicle.modelId != null && vehicle.modelId > 0) {
    const arById = getModelArabicNameById(vehicle.modelId);
    if (arById) return arById;
  }

  // 2. Lookup by brandId + modelName
  if (vehicle.brandId != null && vehicle.brandId > 0 && canonicalName) {
    const arByBrandId = getModelArabicNameByBrand(vehicle.brandId, canonicalName);
    if (arByBrandId) return arByBrandId;
  }

  // 3. Lookup by brandName + modelName
  if (vehicle.brandName && canonicalName) {
    const arByBrandName = getModelArabicNameByBrand(vehicle.brandName, canonicalName);
    if (arByBrandName) return arByBrandName;
  }

  return canonicalName;
}

/**
 * Searches whether a vehicle record matches a search term across plate, nickname,
 * brandName, and BOTH English and Arabic model names.
 * Supports Arabic normalization and Saudi spelling variations.
 */
export function matchesVehicleSearch(term: string, vehicle: Vehicle): boolean {
  const cleanTerm = term.trim();
  if (!cleanTerm) return true;

  const cleanLower = cleanTerm.toLowerCase();
  const arabicModel = getVehicleModelDisplayName(vehicle, "ar");
  const englishModel = vehicle.modelName ?? (vehicle.modelId ? getModelEnglishNameById(vehicle.modelId) : "") ?? "";
  const englishBrand = getBrandEnglishName(vehicle.brandId, vehicle.brandName) ?? "";

  // 1. Direct lowercase substring check across all vehicle attributes
  const rawHaystack = [
    vehicle.plateNumber,
    vehicle.nickname,
    vehicle.brandName,
    englishBrand,
    englishModel,
    arabicModel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (rawHaystack.includes(cleanLower)) {
    return true;
  }

  // 2. Normalized Arabic match (handles alef, yaa, taa marbuta, tashkeel, tatweel)
  const normTerm = normalizeArabic(cleanTerm).toLowerCase();
  if (normTerm) {
    const normHaystack = [
      vehicle.plateNumber,
      vehicle.nickname,
      normalizeArabic(vehicle.brandName ?? ""),
      normalizeArabic(arabicModel),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (normHaystack.includes(normTerm)) {
      return true;
    }

    // Space-collapsed matching (e.g. "لاند كروزر" vs "لاندكروزر")
    const collapsedTerm = normTerm.replace(/\s+/g, "");
    const collapsedHaystack = normHaystack.replace(/\s+/g, "");
    if (collapsedTerm && collapsedHaystack.includes(collapsedTerm)) {
      return true;
    }
  }

  // 3. Model aliases match
  if (checkModelSearchAliases(cleanTerm, arabicModel, englishModel)) {
    return true;
  }

  return false;
}

/**
 * Searches whether a model record matches a search term across BOTH English and Arabic names.
 * Supports Arabic normalization and Saudi spelling variations.
 */
export function matchesModelSearch(
  term: string,
  model: { id: number; name: string; brandId?: number | null; nameAr?: string | null },
): boolean {
  const cleanTerm = term.trim();
  if (!cleanTerm) return true;

  const cleanLower = cleanTerm.toLowerCase();
  const arabicModel =
    model.nameAr ??
    getModelArabicNameById(model.id) ??
    (model.brandId ? getModelArabicNameByBrand(model.brandId, model.name) : undefined) ??
    "";
  const englishModel = model.name ?? getModelEnglishNameById(model.id) ?? "";

  // 1. Direct lowercase substring check
  const rawHaystack = `${englishModel} ${arabicModel}`.toLowerCase();
  if (rawHaystack.includes(cleanLower)) {
    return true;
  }

  // 2. Normalized Arabic match
  const normTerm = normalizeArabic(cleanTerm).toLowerCase();
  if (normTerm) {
    const normArabicModel = normalizeArabic(arabicModel).toLowerCase();
    if (normArabicModel.includes(normTerm)) {
      return true;
    }

    // Space-collapsed matching
    const collapsedTerm = normTerm.replace(/\s+/g, "");
    const collapsedModel = normArabicModel.replace(/\s+/g, "");
    if (collapsedTerm && collapsedModel.includes(collapsedTerm)) {
      return true;
    }
  }

  // 3. Model aliases match
  if (checkModelSearchAliases(cleanTerm, arabicModel, englishModel)) {
    return true;
  }

  return false;
}
