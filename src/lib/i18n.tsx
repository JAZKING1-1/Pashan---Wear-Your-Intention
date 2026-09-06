import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const locales = [
  ["en", "English"], ["hi", "हिन्दी"], ["pa", "ਪੰਜਾਬੀ"], ["mr", "मराठी"],
  ["gu", "ગુજરાતી"], ["bn", "বাংলা"], ["ta", "தமிழ்"], ["te", "తెలుగు"],
  ["fr", "Français"], ["ar", "العربية"],
] as const;
export type Locale = (typeof locales)[number][0];

const copy = {
  en: { shop:"Shop", make:"Make your own", story:"Our story", journal:"Journal", language:"Language", bag:"Bag", headline:"Wear the quality you wish to become.", intro:"Natural stone bracelets, thoughtfully made in India. Choose a ready-made piece or create your own.", shopCta:"Shop bracelets", makeCta:"Make your own", featured:"Bracelets to begin with", makeTitle:"Make it yours.", makeBody:"Choose your stones. Find a comfortable fit. Make something personal.", note:"A moment for you", weekly:"The Weekly Pashan Note" },
  hi: { shop:"खरीदें", make:"अपना ब्रेसलेट बनाएँ", story:"हमारी कहानी", journal:"जर्नल", language:"भाषा", bag:"बैग", headline:"जिस गुण को पाना चाहते हैं, उसे पहनें।", intro:"भारत में सोच-समझकर बनाए गए प्राकृतिक पत्थर के ब्रेसलेट। तैयार डिज़ाइन चुनें या अपना बनाएँ।", shopCta:"ब्रेसलेट देखें", makeCta:"अपना बनाएँ", featured:"शुरुआत के लिए ब्रेसलेट", makeTitle:"इसे अपना बनाएँ।", makeBody:"अपने पत्थर चुनें। आरामदायक फिट पाएँ। कुछ व्यक्तिगत बनाएँ।", note:"आपके लिए एक पल", weekly:"साप्ताहिक पाशान नोट" },
  pa: { shop:"ਖਰੀਦੋ", make:"ਆਪਣਾ ਬ੍ਰੈਸਲੇਟ ਬਣਾਓ", story:"ਸਾਡੀ ਕਹਾਣੀ", journal:"ਜਰਨਲ", language:"ਭਾਸ਼ਾ", bag:"ਬੈਗ", headline:"ਉਹ ਗੁਣ ਪਹਿਨੋ ਜੋ ਤੁਸੀਂ ਬਣਨਾ ਚਾਹੁੰਦੇ ਹੋ।", intro:"ਭਾਰਤ ਵਿੱਚ ਸੋਚ-ਸਮਝ ਕੇ ਬਣਾਏ ਕੁਦਰਤੀ ਪੱਥਰਾਂ ਦੇ ਬ੍ਰੈਸਲੇਟ। ਤਿਆਰ ਚੁਣੋ ਜਾਂ ਆਪਣਾ ਬਣਾਓ।", shopCta:"ਬ੍ਰੈਸਲੇਟ ਵੇਖੋ", makeCta:"ਆਪਣਾ ਬਣਾਓ", featured:"ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਬ੍ਰੈਸਲੇਟ", makeTitle:"ਇਸਨੂੰ ਆਪਣਾ ਬਣਾਓ।", makeBody:"ਆਪਣੇ ਪੱਥਰ ਚੁਣੋ। ਆਰਾਮਦਾਇਕ ਫਿੱਟ ਲੱਭੋ। ਕੁਝ ਨਿੱਜੀ ਬਣਾਓ।", note:"ਤੁਹਾਡੇ ਲਈ ਇੱਕ ਪਲ", weekly:"ਹਫ਼ਤਾਵਾਰੀ ਪਾਸ਼ਾਨ ਨੋਟ" },
  mr: { shop:"खरेदी", make:"तुमचे ब्रेसलेट बनवा", story:"आमची गोष्ट", journal:"जर्नल", language:"भाषा", bag:"बॅग", headline:"जो गुण व्हायचा आहे तो परिधान करा.", intro:"भारतात विचारपूर्वक बनवलेली नैसर्गिक दगडांची ब्रेसलेट्स.", shopCta:"ब्रेसलेट्स पाहा", makeCta:"स्वतःचे बनवा", featured:"सुरुवातीची ब्रेसलेट्स", makeTitle:"तुमचे बनवा.", makeBody:"दगड निवडा. आरामदायी फिट शोधा. वैयक्तिक काहीतरी बनवा.", note:"तुमच्यासाठी एक क्षण", weekly:"साप्ताहिक पाशान नोट" },
  gu: { shop:"ખરીદો", make:"તમારું બ્રેસલેટ બનાવો", story:"અમારી વાર્તા", journal:"જર્નલ", language:"ભાષા", bag:"બેગ", headline:"તમે જે ગુણ બનવા માંગો છો તેને પહેરો.", intro:"ભારતમાં વિચારપૂર્વક બનાવેલા કુદરતી પથ્થરના બ્રેસલેટ.", shopCta:"બ્રેસલેટ જુઓ", makeCta:"તમારું બનાવો", featured:"શરૂઆત માટે બ્રેસલેટ", makeTitle:"તેને તમારું બનાવો.", makeBody:"પથ્થરો પસંદ કરો. આરામદાયક ફિટ મેળવો. કંઈક અંગત બનાવો.", note:"તમારા માટે એક ક્ષણ", weekly:"સાપ્તાહિક પાશાન નોંધ" },
  bn: { shop:"কিনুন", make:"নিজের ব্রেসলেট বানান", story:"আমাদের গল্প", journal:"জার্নাল", language:"ভাষা", bag:"ব্যাগ", headline:"আপনি যে গুণ হতে চান, সেটিই পরুন।", intro:"ভারতে যত্নসহকারে তৈরি প্রাকৃতিক পাথরের ব্রেসলেট।", shopCta:"ব্রেসলেট দেখুন", makeCta:"নিজেরটি বানান", featured:"শুরু করার ব্রেসলেট", makeTitle:"নিজের মতো করে নিন।", makeBody:"পাথর বাছুন। আরামদায়ক মাপ খুঁজুন। ব্যক্তিগত কিছু বানান।", note:"আপনার জন্য এক মুহূর্ত", weekly:"সাপ্তাহিক পাশান নোট" },
  ta: { shop:"வாங்குங்கள்", make:"உங்கள் வளையலை உருவாக்குங்கள்", story:"எங்கள் கதை", journal:"குறிப்பேடு", language:"மொழி", bag:"பை", headline:"நீங்கள் அடைய விரும்பும் பண்பை அணியுங்கள்.", intro:"இந்தியாவில் கவனமாக உருவாக்கப்பட்ட இயற்கைக் கல் வளையல்கள்.", shopCta:"வளையல்களைப் பாருங்கள்", makeCta:"உங்களுடையதை உருவாக்குங்கள்", featured:"தொடங்குவதற்கான வளையல்கள்", makeTitle:"உங்களுக்கென உருவாக்குங்கள்.", makeBody:"கற்களைத் தேர்ந்தெடுங்கள். வசதியான அளவை அறியுங்கள். தனிப்பட்டதாக உருவாக்குங்கள்.", note:"உங்களுக்கான ஒரு தருணம்", weekly:"வாராந்திர பாஷான் குறிப்பு" },
  te: { shop:"కొనండి", make:"మీ బ్రేస్‌లెట్ తయారు చేయండి", story:"మా కథ", journal:"జర్నల్", language:"భాష", bag:"బ్యాగ్", headline:"మీరు కావాలనుకునే గుణాన్ని ధరించండి.", intro:"భారతదేశంలో శ్రద్ధగా తయారైన సహజ రాయి బ్రేస్‌లెట్లు.", shopCta:"బ్రేస్‌లెట్లు చూడండి", makeCta:"మీది తయారు చేయండి", featured:"మొదలుపెట్టడానికి బ్రేస్‌లెట్లు", makeTitle:"దాన్ని మీ సొంతం చేసుకోండి.", makeBody:"రాళ్లను ఎంచుకోండి. సౌకర్యమైన కొలతను కనుగొనండి. వ్యక్తిగతంగా తయారు చేయండి.", note:"మీ కోసం ఒక క్షణం", weekly:"వారపు పాషాన్ నోట్" },
  fr: { shop:"Boutique", make:"Créer le vôtre", story:"Notre histoire", journal:"Journal", language:"Langue", bag:"Panier", headline:"Portez la qualité que vous souhaitez incarner.", intro:"Des bracelets en pierres naturelles, confectionnés avec soin en Inde. Choisissez une création ou composez la vôtre.", shopCta:"Voir les bracelets", makeCta:"Créer le vôtre", featured:"Bracelets pour commencer", makeTitle:"Créez le vôtre.", makeBody:"Choisissez vos pierres. Trouvez une taille confortable. Créez un objet personnel.", note:"Un moment pour vous", weekly:"La note Pashan hebdomadaire" },
  ar: { shop:"تسوّق", make:"صمّم سوارك", story:"قصتنا", journal:"المجلة", language:"اللغة", bag:"الحقيبة", headline:"ارتدِ الصفة التي ترغب أن تصبح عليها.", intro:"أساور من الأحجار الطبيعية، صُنعت بعناية في الهند. اختر قطعة جاهزة أو صمّم سوارك.", shopCta:"تسوّق الأساور", makeCta:"صمّم سوارك", featured:"أساور للبدء", makeTitle:"اجعله خاصاً بك.", makeBody:"اختر أحجارك. اعثر على مقاس مريح. اصنع شيئاً شخصياً.", note:"لحظة لك", weekly:"رسالة باشان الأسبوعية" },
} as const;

type CopyKey = keyof typeof copy.en;
const I18nContext = createContext({ locale:"en" as Locale, setLocale: (_:Locale)=>{}, t:(key:CopyKey)=>copy.en[key] as string });
const allowed = new Set(locales.map(([id]) => id));

export function I18nProvider({children}:{children:ReactNode}) {
  const [locale,setLocaleState] = useState<Locale>("en");
  useEffect(()=>{
    const query = new URLSearchParams(location.search).get("lang");
    const cookie = document.cookie.match(/(?:^|; )pashan-locale=([^;]+)/)?.[1];
    const next = query && allowed.has(query as Locale) ? query : cookie;
    if (next && allowed.has(next as Locale)) setLocaleState(next as Locale);
  },[]);
  const setLocale=(next:Locale)=>{ setLocaleState(next); document.cookie=`pashan-locale=${next};path=/;max-age=31536000;samesite=lax`; };
  useEffect(()=>{ document.documentElement.lang=locale; document.documentElement.dir=locale==="ar"?"rtl":"ltr"; },[locale]);
  const value=useMemo(()=>({locale,setLocale,t:(key:CopyKey)=>(copy[locale] ?? copy.en)[key] ?? copy.en[key]}),[locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export const useI18n=()=>useContext(I18nContext);
