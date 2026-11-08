import Link from "next/link";

export const metadata={
  title:"Privacy Policy | Zara Nikah Service",
  description:"Zara Nikah Service ki Privacy Policy: account, biodata, payment references, cookies, Google AdSense advertising aur privacy requests ki jaankari.",
  alternates:{canonical:"https://zarashadiservice.vercel.app/privacy"}
};

export default function Privacy(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">🔒</div><h1>Privacy Policy</h1><div className="pageContent">
    <p><strong>Last updated: 8 November 2026</strong></p>
    <p>Zara Nikah Service users ki privacy ko ahmiyat deta hai. Is policy mein bataya gaya hai ke website use karte waqt kaunsi information submit ya automatically process ho sakti hai, kyun use hoti hai, aur aap apne privacy choices kaise manage kar sakte hain.</p>

    <h2>Information we may collect</h2>
    <p>Google sign-in ke zariye account ki basic information; aapke dwara submit ki gayi biodata, profile, photo aur contact details; website par bheje gaye messages; aur payment request ke waqt diya gaya UTR ya transaction reference process ho sakta hai. Website use karne par technical information, jaise IP address, browser/device details, pages visited aur access time bhi service providers ke zariye process ho sakti hai. Sirf wahi information submit karein jo service ke liye zaroori ho.</p>

    <h2>How we use information</h2>
    <p>Information account aur profile manage karne, registration, profile display, payment verification, paid-access requests, customer support, security, fraud prevention aur website ko operate aur improve karne ke liye use ho sakti hai. Private biodata ya mobile number ka access website par bataye gaye login, approval aur payment rules ke mutabik hota hai. Hum users se kehte hain ke doosron ki information ko copy, publish, forward ya misuse na karein.</p>

    <h2>Service providers and sharing</h2>
    <p>Website chalane ke liye Google sign-in, Firebase/Google aur website hosting jaise technology providers information ko apni services provide karne ke liye process kar sakte hain. Google ki data practices ke baare mein <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses information from sites or apps that use its services</a> padhein. Hum personal information ko bechne ka wada ya daawa nahi karte; information service operation, user requests, security, legal obligations ya zaroori service-provider support ke liye share/process ho sakti hai.</p>

    <h2>Cookies, Google AdSense and advertising</h2>
    <p>Website par Google AdSense ya doosri advertising services ke zariye ads dikhaye ja sakte hain. Jab ads enabled hon, Google aur doosre third-party vendors users ke browser par cookies rakh sakte hain aur pehle se maujood cookies ko read kar sakte hain. Ye vendors cookies, web beacons, IP addresses, browser/device identifiers aur similar technologies ka use ads serve karne, unki delivery aur performance measure karne, frequency manage karne, fraud/abuse rokne aur applicable settings ke mutabik ads ko personalize ya non-personalize karne ke liye kar sakte hain.</p>
    <p>Google aur uske advertising partners aapki is website ya doosri websites par pehle ki visits ke basis par ads dikha sakte hain. Personalized advertising ko manage ya opt out karne ke liye <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google Ads Settings</a> dekhein. Kuch third-party vendors ki personalized advertising cookies se opt out karne ke liye <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance choices</a> bhi dekhein. Opt-out karne par bhi non-personalized ads dikh sakte hain.</p>
    <p>Agar website par Google ke alawa koi aur ad network ya advertising vendor ads serve karta hai, to us vendor ki identity, privacy information aur available opt-out choices uski apni website par dekhi ja sakti hain. Google ki advertising aur partner-site data practices ke baare mein <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google Advertising</a> aur <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google partner-site information</a> padhein.</p>
    <p>Cookies ko browser settings se block ya delete kiya ja sakta hai. Kuch website features cookies ya similar technologies ke bina sahi tarah kaam na karein. Jahan lagu kanoon ya Google ki consent requirements zaroori hon, wahan required consent/choices dikhaye jane chahiye.</p>

    <h2>Data security and retention</h2>
    <p>Hum information ko service ke kaam, account/profile management, payment verification, security aur applicable legal requirements ke liye zaroorat ke mutabik rakh sakte hain. Internet transmission ya electronic storage ka koi bhi tareeqa 100% secure guarantee nahi kiya ja sakta. Apna password, OTP, UPI PIN, bank login ya unnecessary sensitive documents share na karein.</p>

    <h2>Your choices and privacy requests</h2>
    <p>Aap apni submitted information ke baare mein sawal, correction, access ya deletion request ke liye <Link href="/contact">Contact page</Link> par diye gaye channel se request bhej sakte hain. Request par account ya profile ownership verify karne ki zaroorat ho sakti hai. Kuch records ko payment, security ya legal requirements ke liye zaroorat tak rakhna pad sakta hai.</p>

    <h2>Adults only</h2>
    <p>Yeh nikah/matrimony service sirf 18 saal ya usse zyada umar ke users ke liye hai. Minors ke profiles, photos ya personal details submit na karein.</p>

    <h2>Changes to this policy</h2>
    <p>Service, technology ya legal requirements badalne par yeh policy update ho sakti hai. Latest version isi page par publish ki jayegi. Is page par di gayi date batati hai ke policy aakhri baar kab update hui.</p>
  </div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/contact">Contact</Link></div></section></main>;
}
