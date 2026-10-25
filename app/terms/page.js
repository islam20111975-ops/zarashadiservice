import Link from "next/link";

export const metadata={title:"Terms & Conditions",description:"Zara Nikah Service use karne ki sharaait"};

export default function Terms(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📋</div><h1>Terms &amp; Conditions</h1><div className="pageContent">
    <p><strong>Last updated: 25 October 2026</strong></p>
    <p>Zara Nikah Service use karke aap in terms ko padhne aur follow karne par razamand hote hain. Agar aap razamand nahi, to website ya paid services ka use na karein.</p>
    <h2>Eligibility and accurate information</h2><p>Yeh service sirf 18 saal ya usse zyada umar ke users ke liye hai. Registration ya profile submit karte waqt sahi aur lawful information dein. Kisi doosre shakhs ki photo ya details uski permission ke baghair submit na karein.</p>
    <h2>Profile access and privacy</h2><p>Profiles aur private details ka access website par dikhaye gaye login, approval aur payment rules ke mutabiq hota hai. Kisi profile ki information ko copy, sell, publish, harass karne ya kisi aur unauthorized purpose ke liye use na karein.</p>
    <h2>Payments and access</h2><p>Agar biodata ya mobile-number access paid hai, to payment se pehle displayed amount, access scope aur refund/cancellation policy padhein. Payment proof aur UTR ko save karein. Access approval verification ke baad ho sakta hai; payment karna rishta milne ya kisi profile se response ki guarantee nahi.</p>
    <h2>No marriage or identity guarantee</h2><p>Website par profile, photo ya “verified” label ko marriage, compatibility, character, identity ya har submitted detail ki absolute guarantee na samjhein. Users/families ko munasib independent verification, safe meeting practices aur informed decision-making karni chahiye.</p>
    <h2>Misuse and service changes</h2><p>Fraud, harassment, misleading information, unauthorized data sharing ya website ko harm karne wali activity par access restrict kiya ja sakta hai. Website features, fees ya terms badal sakte hain; material changes is page par update kiye jayenge.</p>
    <h2>Contact</h2><p>Terms, payment ya profile access ke sawal ke liye <Link href="/contact">Contact page</Link> dekhein. Payment se pehle <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link> aur <Link href="/privacy">Privacy Policy</Link> bhi padhein.</p>
  </div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/privacy">Privacy Policy</Link></div></section></main>;
}
