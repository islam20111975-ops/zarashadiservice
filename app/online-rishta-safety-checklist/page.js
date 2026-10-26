import Link from "next/link";

export const metadata = {
  title: "Online Rishta Safety Checklist India",
  description: "Online Muslim rishta search ke liye profile verification, privacy, UPI payment safety, red flags aur family meeting ki practical checklist.",
  alternates: { canonical: "https://zarashadiservice.vercel.app/online-rishta-safety-checklist" },
};

export default function OnlineRishtaSafetyChecklist() {
  return (
    <main>
      <section className="cardPage siteState">
        <div className="siteStateIcon">🛡️</div>
        <h1>Online Rishta Safety Checklist</h1>
        <div className="pageContent">
          <p>Online rishta profile ek pehli maloomat hoti hai, poori jaanch nahi. Is checklist ko family ke saath use karein, aur har faisla bina jaldi ya pressure ke karein. Yeh general safety information hai; kisi profile ya service ki guarantee nahi.</p>

          <h2>1. Baat aage badhane se pehle</h2>
          <ul>
            <li>Profile mein naam, umar, shehar, kaam aur current marital status jaise zaroori points par respectfully sawal karein.</li>
            <li>Samjhein ke profile kisne banayi hai—khud, parent, sibling ya kisi aur ne.</li>
            <li>Important details ko alag conversation mein dobara confirm karein. Sirf photo, social-media account ya “verified” badge ko proof na samjhein.</li>
            <li>Identity documents ki copy public group ya post mein na mangwayein. Zaroorat ho to consent ke saath trusted family member ke zariye relevant details check karein.</li>
          </ul>

          <h2>2. Apni privacy aur photos bachayein</h2>
          <ul>
            <li>OTP, password, UPI PIN, bank login ya card PIN kabhi share na karein.</li>
            <li>Apna full address, workplace location, daily routine aur children ki personal details shuru mein public na karein.</li>
            <li>Apni ya family ki photo/biodata forward karne se pehle permission lein. Kisi profile ka screenshot social media par post na karein.</li>
            <li>Agar koi private photo, document ya intimate content ke liye pressure dale, to ruk jaayein aur trusted person se mashwara karein.</li>
          </ul>

          <h2>3. Payment se pehle checklist</h2>
          <p>Kisi matchmaking website ya individual ko paisa bhejne se pehle likhit ya visible terms mein yeh baatein samjhein:</p>
          <ul>
            <li>Exact fee kitni hai aur payment ke badle kya access/service milegi?</li>
            <li>Kya payment ke baad admin approval ya manual verification zaroori hai?</li>
            <li>Refund, duplicate payment aur access na milne ka process kya hai?</li>
            <li>Kya receipt ya transaction reference milega aur support se kaise rabta karna hai?</li>
          </ul>
          <p>UPI PIN sirf apni payment app mein payment authorize karne ke liye use karein—paise receive karne ke liye PIN batane ki zaroorat nahi hoti. Kisi anjaan shakhs ke kehne par screen-sharing app install na karein aur remote access na dein. Pehle service ke official contact channel par details confirm karein.</p>

          <h2>4. Scam ke warning signs</h2>
          <ul>
            <li>Bahut jaldi shaadi ka wada karke emergency, ticket, medical bill, gift/customs fee ya family problem ke naam par paisa maangna.</li>
            <li>Video call ya normal verification se baar-baar bachna, aur har baar nayi kahani batana.</li>
            <li>Family se baat na karne, rishta secret rakhne, ya turant decision lene ka pressure.</li>
            <li>OTP, UPI PIN, bank details, ID documents ya remote phone access maangna.</li>
            <li>Profile ki age, marital status, location ya family details mein baar-baar contradiction.</li>
          </ul>
          <p>Ek warning sign apne aap mein final proof nahi, lekin multiple warning signs hon to payment aur personal information share karna rok dein.</p>

          <h2>5. Pehli mulaqat aur family discussion</h2>
          <ul>
            <li>Dono taraf ki razamandi se safe, mutually agreed jagah chunein.</li>
            <li>Trusted family member ko meeting ka time aur place batayein; apne phone aur transport ka intezam rakhein.</li>
            <li>Rehne ka arrangement, work, finances, children/dependents, family responsibilities aur future expectations par khul kar baat karein.</li>
            <li>Kisi bhi shakhs ko documents sign karne, qarz lene ya financial commitment karne ke liye pressure mein na aane dein.</li>
          </ul>

          <h2>6. Agar payment ya fraud ka shak ho</h2>
          <p>Transaction receipt, date, amount, chat aur profile details ko private taur par save karein. Apne bank/UPI app ke official support ko turant contact karein. India mein financial cyber fraud report karne ke liye official National Cyber Crime Reporting Portal <a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer">cybercrime.gov.in</a> dekhein; jaldi action lena madadgar ho sakta hai. Kisi public post mein UTR, account details ya personal documents publish na karein.</p>

          <h2>Zara Nikah Service par profile dekhte waqt</h2>
          <p>Website par “verified” label har detail, identity, character, compatibility ya future marriage ki absolute guarantee nahi hai. Paid access, agar applicable ho, sirf website par clearly stated access ke liye hai; match, reply ya nikah guaranteed nahi. Payment se pehle <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link>, <Link href="/terms">Terms</Link> aur <Link href="/privacy">Privacy Policy</Link> padhein. Sawal ya privacy concern ke liye <Link href="/contact">Contact page</Link> use karein.</p>

          <h2>Related guides</h2>
          <p>General rishta search ke liye <Link href="/nikah-guide">Nikah ke liye Rishta Search Guide</Link> padhein. Widow ya widower ke dobara nikah ke liye <Link href="/widow-widower-nikah-guide">Widow aur Widower Nikah Guide</Link> bhi available hai.</p>
          <p><small>Last reviewed: 26 October 2026. Yeh educational checklist hai, legal advice ya personal background-check service nahi. Official processes aur rules badal sakte hain; zaroori faislon se pehle relevant official source se tasdeeq karein.</small></p>
        </div>
        <div className="siteStateActions">
          <Link className="primaryAction" href="/">← Home</Link>
          <Link className="backAction" href="/contact">Contact</Link>
        </div>
      </section>
    </main>
  );
}
