import Link from "next/link";

export const metadata={title:"Refund & Cancellation Policy",description:"Zara Nikah Service ki payment, cancellation aur refund request policy"};

export default function RefundPolicy(){
  return <main><section className="cardPage siteState"><div className="siteStateIcon">💳</div><h1>Refund &amp; Cancellation Policy</h1><div className="pageContent">
    <p><strong>Last updated: 25 October 2026</strong></p>
    <p>Yeh page Zara Nikah Service ke website-based paid access ke liye payment concern aur refund request ka process batata hai. Payment se pehle website par dikhayi gayi fee aur service description ko dhyan se padhein.</p>
    <h2>Before you pay</h2><p>Payment karne se pehle confirm karein ke aap kis profile ya access ke liye payment kar rahe hain, amount kya hai aur access approve hone ka process kya hai. UTR/transaction reference aur receipt save karein.</p>
    <h2>Duplicate, failed or incorrect payment</h2><p>Agar amount debit hua lekin request website par nahi dikh rahi, payment duplicate lagti hai, ya galat amount/transaction submit hua hai, to transaction date, amount, profile/request ID aur UTR ke saath <Link href="/contact">Contact page</Link> par available channel se review request bhejein. Sensitive bank credentials, OTP ya PIN kabhi share na karein.</p>
    <h2>Cancellation and refund review</h2><p>Refund ya cancellation request case-by-case review ki jayegi, applicable law aur payment provider ke rules ke mutabiq. Refund automatic ya guaranteed nahi hai. Review ke liye payment proof aur request details maangi ja sakti hain. Agar refund approve hota hai, to processing time payment provider/bank par depend karega.</p>
    <h2>Access issue</h2><p>Agar payment ke baad access nahi mila, pehle account mein login aur request status check karein, phir receipt/UTR ke saath support ko message karein. Access mil jana apne aap kisi rishtay, response, match ya marriage ki guarantee nahi deta.</p>
    <h2>Contact</h2><p>Payment review ke liye <Link href="/contact">Contact page</Link> dekhein aur apna UTR privately bhejein, public comment mein nahi.</p>
  </div><div className="siteStateActions"><Link className="primaryAction" href="/">← Home</Link><Link className="backAction" href="/terms">Terms &amp; Conditions</Link></div></section></main>;
}
