import Link from "next/link";

export const metadata={
  title:"Nikah Guide: Safe Rishta Search",
  description:"Nikah ke liye rishta profile dekhne, privacy bachane, family expectations aur online safety par practical rehnumai.",
  alternates:{canonical:"https://zarashadiservice.vercel.app/nikah-guide"}
};

export default function NikahGuide(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">📖</div><h1>Nikah ke liye Rishta Search Guide</h1><div className="pageContent">
    <p>Online rishta search se families ko profiles samajhne ka ek tareeqa mil sakta hai, lekin behtar faisle ke liye khuli baat-cheet, privacy aur independent verification zaroori hain. Yeh guide general information ke liye hai; yeh kisi match ya nikah ki guarantee nahi deti.</p>
    <h2>1. Apni expectations pehle samjhein</h2><p>Profile dekhne se pehle apni priorities likh lein: family responsibilities, location, education, work, lifestyle, religious expectations aur future plans. Har cheez par ek jaisi raaye hona zaroori nahi, lekin important expectations par sachchi baat-cheet honi chahiye.</p>
    <h2>2. Profile ko sawal poochne ka starting point samjhein</h2><p>Online profile mukammal background check nahi hoti. Zaroori maloomat ko respectfully verify karein, marital status aur family situation ko samjhein, aur decision se pehle relevant references ya documents ko munasib tareeqe se check karein.</p>
    <h2>3. Personal information ki hifazat karein</h2><p>Apna OTP, password, bank PIN, full payment credentials ya identity documents social media posts mein share na karein. Kisi doosre user ki photo, biodata ya phone number ko unki permission ke baghair forward ya publish na karein. Agar kisi ko information share karne se mana kiya gaya hai, us boundary ka ehtiram karein.</p>
    <h2>4. Payment se pehle kya check karein?</h2><p>Paid access lene se pehle total amount, service ka exact purpose, approval ka tareeqa aur refund/cancellation terms padhein. Payment receipt aur UTR reference save karein. Kisi ke pressure par jaldi payment na karein; agar payment details unclear hon to pehle official contact channel par poochhein.</p>
    <h2>5. Widow aur widower ke liye dobara nikah</h2><p>Dobara nikah ek personal aur family decision hai. Dono taraf ko apni comfort, children ya dependents ki responsibilities, living arrangements, finances aur future expectations par respectful discussion ka mauqa milna chahiye. Kisi ko past ke liye shame ya pressure nahi kiya jana chahiye.</p>
    <h2>6. Pehli mulaqat aur safety</h2><p>Jab families mulaqat ka faisla karein, to public ya mutually agreed safe jagah, trusted family member ko inform karna, aur apni transport/communication ka intezam jaise basic precautions par ghour karein. Financial demands, threats, secrecy ka pressure ya inconsistent information warning signs ho sakte hain.</p>
    <h2>7. “Verified” label ka matlab samjhein</h2><p>Website ka label apne aap kisi shakhs ki tamam details, intentions, compatibility ya future marriage ki guarantee nahi hota. Apne liye relevant checks khud karein aur final decision bina pressure ke lein.</p>
    <h2>Frequently asked questions</h2><p><strong>Kya online profile dekh kar final decision lena chahiye?</strong><br/>Nahi. Profile initial information deti hai. Direct respectful conversation aur independent verification bhi zaroori hain.</p><p><strong>Kya kisi ko payment karne se rishta milna guaranteed hai?</strong><br/>Nahi. Access fee, agar applicable ho, sirf website par stated access/service ke liye hoti hai; match ya marriage ki guarantee nahi.</p><p><strong>Privacy concern ho to kya karein?</strong><br/>Website ke <Link href="/contact">Contact page</Link> par available channel ke zariye request bhejein.</p>
    <p>Website use karne se pehle <Link href="/terms">Terms &amp; Conditions</Link>, <Link href="/privacy">Privacy Policy</Link> aur <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link> padhein.</p>
  </div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/contact">Contact</Link></div></section></main>;
}
