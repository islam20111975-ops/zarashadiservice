import Link from "next/link";

export const metadata={title:"Privacy Policy",description:"Zara Nikah Service par profile data, account information, payment references, cookies aur privacy requests kaise handle kiye jaate hain.",alternates:{canonical:"https://zarashadiservice.vercel.app/privacy"}};

export default function Privacy(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">🔒</div><h1>Privacy Policy</h1><div className="pageContent">
    <p><strong>Last updated: 25 October 2026</strong></p>
    <p>Zara Nikah Service users ki privacy ko ahmiyat deta hai. Yeh policy batati hai ke website use karte waqt kaunsi information submit ya process ho sakti hai aur uska istemal kis liye hota hai.</p>
    <h2>Information we may collect</h2><p>Google sign-in se account ki basic information, user dwara submit ki gayi biodata/profile details, website par bheje gaye messages, aur payment request ke waqt diya gaya UTR/transaction reference process ho sakta hai. Sirf service ke liye zaroori information submit karein.</p>
    <h2>How information is used</h2><p>Information account management, profile display, payment verification, paid-access requests, customer support, fraud prevention aur website ko chalane ke liye use ho sakti hai. Private biodata ya mobile number sirf website ke access rules ke mutabik dikhaya jana chahiye. Hum users se kehte hain ke doosron ki information ko copy, publish ya misuse na karein.</p>
    <h2>Sharing and security</h2><p>Website ke operation ke liye Firebase/Google sign-in jaise technology providers data process kar sakte hain. Internet transmission ya storage ke kisi bhi tareeqe ko 100% secure guarantee nahi kiya ja sakta. Apna password, OTP, bank PIN ya unnecessary identity documents share na karein.</p>
    <h2>Cookies and Google advertising</h2><p>Agar Google AdSense ya doosri advertising service website par enable ki jati hai, to Google aur third-party vendors cookies, IP address, browser identifiers ya similar technologies use kar sakte hain taaki ads serve, measure, fraud prevent ya personalize kiye ja saken, settings aur applicable rules ke mutabik. Personalized advertising settings ke liye <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer">Google Ads Settings</a> dekhein. Google ki information practices ke liye <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">How Google uses information from sites or apps that use its services</a> padhein.</p>
    <h2>Your choices and requests</h2><p>Aap apni submitted information ke baare mein sawal, correction ya privacy concern ke liye Contact page par diye gaye channel se request bhej sakte hain. Account ya profile delete karne ki request par identity verify karne ki zaroorat ho sakti hai.</p>
    <h2>Children</h2><p>Yeh nikah/matrimony service sirf 18 saal ya usse zyada umar ke users ke liye hai. Minors ke profiles submit na karein.</p>
    <h2>Policy changes</h2><p>Service ya legal requirements badalne par policy update ho sakti hai. Latest version isi page par publish ki jayegi.</p>
  </div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/contact">Contact</Link></div></section></main>;
}
