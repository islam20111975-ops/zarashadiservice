import Link from "next/link";

export const metadata = {
  title: "Refund & Cancellation Policy",
  description: "Zara Nikah Service ki paid profile access, cancellation aur no-refund policy",
};

export default function RefundPolicy() {
  return (
    <main>
      <section className="cardPage siteState">
        <div className="siteStateIcon">💳</div>
        <h1>Refund &amp; Cancellation Policy</h1>
        <div className="pageContent">
          <p><strong>Last updated: 25 October 2026</strong></p>
          <p>
            Zara Nikah Service par payment karne se pehle profile access, fee aur service ki
            conditions dhyan se padh lein. Payment karna in conditions ko samajh kar kiya gaya
            faisla maana jayega.
          </p>

          <h2>No refund after successful payment</h2>
          <p>
            Zara Nikah Service ki profile ya mobile-number access fee payment successfully
            process hone ke baad aam taur par non-refundable hai. Sirf mann badalne, profile
            pasand na aane, doosre user se jawab na milne, match na banne ya nikah na hone par
            refund nahi diya jata. Paid access kisi rishtay, response, compatibility ya shaadi
            ki guarantee nahi hai.
          </p>

          <h2>Cancellation</h2>
          <p>
            Successful payment aur access request process hone ke baad order ko cancel karke
            fee wapas nahi li ja sakti. Payment se pehle sahi profile/request, amount aur access
            ki conditions zaroor check karein.
          </p>

          <h2>Duplicate, failed or incorrect payment</h2>
          <p>
            Agar aapko lagta hai ki payment duplicate hui, amount debit hua lekin request
            create nahi hui, ya transaction galat submit hui, to ise refund promise na samjhein:
            hum transaction details ki jaanch karenge. Transaction date, amount, profile/request
            ID aur UTR ke saath <Link href="/contact">Contact page</Link> par diye gaye channel
            se privately message karein. OTP, UPI PIN, password ya bank login details kabhi share
            na karein. Kisi bhi correction ya return ko applicable law aur payment provider ke
            rules ke mutabiq handle kiya jayega.
          </p>

          <h2>Access issue</h2>
          <p>
            Payment ke baad access na dikhe to pehle account mein login karke request status
            check karein, phir payment receipt aur UTR ke saath support ko message karein.
            Access issue ki jaanch ka matlab automatic refund approval nahi hai.
          </p>

          <h2>Contact</h2>
          <p>
            Payment ya access concern ke liye <Link href="/contact">Contact page</Link> dekhein.
            Apna UTR sirf private support channel par bhejein, public comment mein nahi.
          </p>
          <p>
            Yeh policy applicable consumer law aur payment provider ke mandatory rules ke adheen
            hai. Jahan kanoon ke mutabiq refund ya correction zaroori ho, wahan kanooni niyam
            lagu honge.
          </p>
        </div>
        <div className="siteStateActions">
          <Link className="primaryAction" href="/">← Home</Link>
          <Link className="backAction" href="/terms">Terms &amp; Conditions</Link>
        </div>
      </section>
    </main>
  );
}
