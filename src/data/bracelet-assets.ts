import type { CustomStoneKey } from "@/data/products";
import { collections } from "@/data/products";
import {
  ASSET_VERSION,
  seedFor,
  type BraceletBead,
} from "@/lib/bracelet-design";

export const stonePalette: Record<
  CustomStoneKey,
  {
    base: string;
    light: string;
    dark: string;
    roughness: number;
    metalness: number;
  }
> = {
  "tiger-eye": {
    base: "#684321",
    light: "#b7813c",
    dark: "#27190f",
    roughness: 0.3,
    metalness: 0,
  },
  hematite: {
    base: "#444444",
    light: "#b0b2b3",
    dark: "#111315",
    roughness: 0.16,
    metalness: 0.82,
  },
  amethyst: {
    base: "#613254",
    light: "#a76d9c",
    dark: "#28192f",
    roughness: 0.27,
    metalness: 0,
  },
  pyrite: {
    base: "#8b7954",
    light: "#baac78",
    dark: "#52472f",
    roughness: 0.42,
    metalness: 0.65,
  },
  "green-quartz": {
    base: "#58775a",
    light: "#a2b69a",
    dark: "#2a4430",
    roughness: 0.34,
    metalness: 0,
  },
  lava: {
    base: "#292724",
    light: "#57524b",
    dark: "#111111",
    roughness: 0.95,
    metalness: 0,
  },
  "heart-quartz": {
    base: "#d9acb7",
    light: "#f2d5d9",
    dark: "#aa7a8c",
    roughness: 0.32,
    metalness: 0,
  },
  citrine: {
    base: "#c49842",
    light: "#edcd87",
    dark: "#815626",
    roughness: 0.26,
    metalness: 0,
  },
};
export const braceletAssets = Object.fromEntries(
  Object.entries(stonePalette).map(([key, material]) => [
    key,
    {
      catalogueKey: key,
      sourcePhoto:
        key === "heart-quartz" || key === "citrine"
          ? null
          : `src/assets/products/${key}/01.webp`,
      fallbackPhoto: collections.find((p) => p.slug === key)?.images[0] ?? null,
      geometryKey: "pierced-round-v1",
      mapPaths: [],
      materialVersion: ASSET_VERSION,
      approvalStatus:
        key === "heart-quartz" || key === "citrine"
          ? "catalogue-colour-only"
          : "photo-referenced-illustration",
      verifiedDimensions: null,
      material,
    },
  ]),
);
// Photo-reviewed homogeneous recipe: 24 round Tiger Eye beads, counted clockwise from top centre in tiger-eye/01.webp.
// This validates the illustrative photo recipe, not a manufacturing size or exact natural pattern.
export const productPreviewConfigs: Record<
  string,
  { beads: BraceletBead[]; source: string; status: string }
> = {
  "tiger-eye": {
    beads: Array.from({ length: 24 }, (_, i) => ({
      id: `tiger-eye-photo-${i}`,
      stoneKey: "tiger-eye",
      seed: seedFor(`tiger-eye-photo-${i}`),
    })),
    source: "src/assets/products/tiger-eye/01.webp",
    status: "photo-reviewed; maker fidelity approval pending",
  },
};
export const cardDescriptions: Record<string, string[]> = {
  pyrite: [
    "A reminder of the future you are building.",
    "आप जिस भविष्य को बना रहे हैं, उसकी याद।",
    "ਉਸ ਭਵਿੱਖ ਦੀ ਯਾਦ ਜੋ ਤੁਸੀਂ ਬਣਾ ਰਹੇ ਹੋ।",
    "तुम्ही घडवत असलेल्या भविष्याची आठवण.",
    "તમે બનાવતા ભવિષ્યની યાદ.",
    "আপনার গড়ে তোলা ভবিষ্যতের স্মারক।",
    "நீங்கள் உருவாக்கும் எதிர்காலத்தின் நினைவூட்டல்.",
    "మీరు నిర్మించే భవిష్యత్తుకు గుర్తు.",
    "Un rappel de l’avenir que vous construisez.",
    "تذكير بالمستقبل الذي تبنيه.",
  ],
  "tiger-eye": [
    "For a steady beginning.",
    "एक स्थिर शुरुआत के लिए।",
    "ਇੱਕ ਸਥਿਰ ਸ਼ੁਰੂਆਤ ਲਈ।",
    "स्थिर सुरुवातीसाठी.",
    "સ્થિર શરૂઆત માટે.",
    "স্থির শুরুর জন্য।",
    "உறுதியான தொடக்கத்திற்கு.",
    "స్థిరమైన ప్రారంభం కోసం.",
    "Pour un début serein.",
    "لبداية ثابتة.",
  ],
  hematite: [
    "For the work that matters.",
    "उस काम के लिए जो मायने रखता है।",
    "ਉਸ ਕੰਮ ਲਈ ਜੋ ਮਾਇਨੇ ਰੱਖਦਾ ਹੈ।",
    "महत्त्वाच्या कामासाठी.",
    "મહત્વના કામ માટે.",
    "গুরুত্বপূর্ণ কাজের জন্য।",
    "முக்கியமான பணிக்காக.",
    "ముఖ్యమైన పని కోసం.",
    "Pour le travail qui compte.",
    "للعمل الذي يستحق.",
  ],
  amethyst: [
    "Make room for quieter moments.",
    "शांत पलों के लिए जगह बनाएँ।",
    "ਸ਼ਾਂਤ ਪਲਾਂ ਲਈ ਥਾਂ ਬਣਾਓ।",
    "शांत क्षणांसाठी जागा करा.",
    "શાંત પળો માટે જગ્યા બનાવો.",
    "শান্ত মুহূর্তের জায়গা করুন।",
    "அமைதியான தருணங்களுக்கு இடமளியுங்கள்.",
    "ప్రశాంత క్షణాలకు చోటివ్వండి.",
    "Faites place aux moments calmes.",
    "افسح مجالاً للحظات أهدأ.",
  ],
  "green-quartz": [
    "Carry a little meaning into your next chapter.",
    "अगले अध्याय में थोड़ा अर्थ साथ रखें।",
    "ਅਗਲੇ ਅਧਿਆਇ ਵਿੱਚ ਕੁਝ ਮਾਇਨੇ ਨਾਲ ਲੈ ਜਾਓ।",
    "पुढील अध्यायात थोडा अर्थ सोबत न्या.",
    "આગલા અધ્યાયમાં થોડો અર્થ સાથે લો.",
    "পরের অধ্যায়ে কিছু অর্থ সঙ্গে নিন।",
    "அடுத்த அத்தியாயத்தில் சிறிது அர்த்தத்தைச் சுமந்து செல்லுங்கள்.",
    "తర్వాతి అధ్యాయానికి కొంత అర్థం తీసుకెళ్లండి.",
    "Emportez du sens dans votre prochain chapitre.",
    "احمل بعض المعنى إلى فصلك القادم.",
  ],
  lava: [
    "A reminder of the strength you have practised.",
    "आपने जिस शक्ति को साधा है, उसकी याद।",
    "ਤੁਹਾਡੀ ਅਭਿਆਸ ਕੀਤੀ ਤਾਕਤ ਦੀ ਯਾਦ।",
    "तुम्ही जोपासलेल्या बळाची आठवण.",
    "તમે કેળવેલી શક્તિની યાદ.",
    "আপনার চর্চিত শক্তির স্মারক।",
    "நீங்கள் வளர்த்த வலிமையின் நினைவூட்டல்.",
    "మీరు సాధన చేసిన బలానికి గుర్తు.",
    "Un rappel de la force que vous avez cultivée.",
    "تذكير بالقوة التي نمّيتها.",
  ],
  "dhan-yog": [
    "A thoughtful composition for the path ahead.",
    "आगे के रास्ते के लिए विचारशील संयोजन।",
    "ਅੱਗੇ ਦੇ ਰਾਹ ਲਈ ਸੋਚਿਆ ਸਮਝਿਆ ਸੁਮੇਲ।",
    "पुढील वाटचालीसाठी विचारपूर्वक रचना.",
    "આગળના માર્ગ માટે વિચારપૂર્વક રચના.",
    "সামনের পথের জন্য ভাবনাপূর্ণ মিশ্রণ।",
    "முன்னுள்ள பாதைக்கான சிந்தனைமிக்க சேர்க்கை.",
    "ముందున్న మార్గానికి ఆలోచనాత్మక కలయిక.",
    "Une composition réfléchie pour le chemin à venir.",
    "تشكيلة مدروسة للطريق القادم.",
  ],
  "make-your-own": [
    "Choose your stones. Create your own pattern.",
    "पत्थर चुनें। अपना पैटर्न बनाएँ।",
    "ਪੱਥਰ ਚੁਣੋ। ਆਪਣਾ ਪੈਟਰਨ ਬਣਾਓ।",
    "दगड निवडा. तुमचा नमुना बनवा.",
    "પથ્થરો પસંદ કરો. તમારી પેટર્ન બનાવો.",
    "পাথর বাছুন। নিজের নকশা বানান।",
    "கற்களைத் தேர்ந்தெடுங்கள். உங்கள் வடிவத்தை உருவாக்குங்கள்.",
    "రాళ్లను ఎంచుకోండి. మీ నమూనా సృష్టించండి.",
    "Choisissez vos pierres. Créez votre motif.",
    "اختر أحجارك. اصنع نمطك.",
  ],
};
