import Link from "next/link";

export const metadata={
  title:"Website Kaise Use Karein? Profile, Rishta aur Payment Guide",
  description:"Zara Nikah Service par rishta kaise dekhein, apna profile kaise banayein aur UPI ya wallet se payment kaise karein.",
  alternates:{canonical:"https://zarashadiservice.vercel.app/instructions"}
};

const panel={background:"#fff",border:"1px solid #eadff3",borderRadius:18,padding:20,margin:"14px 0",boxShadow:"0 8px 24px #35105b0b"};
const step={display:"flex",gap:12,alignItems:"flex-start",margin:"13px 0",lineHeight:1.7};
const number={flex:"0 0 30px",height:30,borderRadius:10,background:"linear-gradient(135deg,#6d28d9,#db2777)",color:"#fff",display:"grid",placeItems:"center",fontWeight:900};

export default function Instructions(){
 return <main style={{maxWidth:900,margin:"24px auto 50px",padding:"0 14px",color:"#241b35"}}>
  <section style={{background:"linear-gradient(135deg,#fff,#f7edff)",border:"1px solid #eadff3",borderRadius:24,padding:"25px 20px",textAlign:"center"}}>
   <div style={{fontSize:38}}>📘💍</div><span style={{fontSize:11,fontWeight:900,letterSpacing:1.5,color:"#7c3aed"}}>ZARA NIKAH SERVICE</span>
   <h1 style={{fontSize:30,margin:"9px 0"}}>वेबसाइट इस्तेमाल करने की पूरी जानकारी</h1>
   <p style={{lineHeight:1.7,color:"#665b70",margin:"0 auto",maxWidth:700}}>इस पेज पर जानें कि लड़के/लड़की के रिश्ते कैसे देखें, अपना बायोडाटा कैसे जोड़ें और भुगतान कैसे करें।</p>
   <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap",marginTop:18}}>
    <Link href="/" style={{padding:"12px 18px",borderRadius:12,background:"#6d28d9",color:"#fff",fontWeight:800,textDecoration:"none"}}>🏠 वेबसाइट खोलें</Link>
    <Link href="/add-profile" style={{padding:"12px 18px",borderRadius:12,background:"#087443",color:"#fff",fontWeight:800,textDecoration:"none"}}>➕ अपना रिश्ता जोड़ें</Link>
   </div>
  </section>

  <section style={panel}>
   <h2>👀 1. रिश्ते कैसे देखें?</h2>
   <div style={step}><b style={number}>1</b><div>वेबसाइट के होम पेज पर जाएँ: <Link href="/">Zara Nikah Service</Link>।</div></div>
   <div style={step}><b style={number}>2</b><div>लड़कों के रिश्ते देखने के लिए <b>👨 Male Rishte</b> और लड़कियों के रिश्ते देखने के लिए <b>👩 Female Rishte</b> बटन दबाएँ।</div></div>
   <div style={step}><b style={number}>3</b><div>प्रोफाइल की फोटो और ID दिखाई देगी। जिस प्रोफाइल को देखना हो, उसकी फोटो/कार्ड पर क्लिक करें।</div></div>
   <div style={step}><b style={number}>4</b><div>पूरी बायोडाटा जानकारी देखने के लिए Google Login करके उस प्रोफाइल का <b>₹99 Biodata Access</b> लें।</div></div>
   <div style={step}><b style={number}>5</b><div>मोबाइल नंबर देखने के लिए अलग से <b>₹299 Mobile Number Access</b> लेना होगा। भुगतान Admin द्वारा approve होने के बाद उसी प्रोफाइल की जानकारी खुलेगी।</div></div>
  </section>

  <section style={panel}>
   <h2>📝 2. अपना रिश्ता / प्रोफाइल कैसे बनाएँ?</h2>
   <div style={step}><b style={number}>1</b><div><Link href="/add-profile">➕ अपना रिश्ता जोड़ें</Link> बटन दबाएँ।</div></div>
   <div style={step}><b style={number}>2</b><div>Google Login / Register करें।</div></div>
   <div style={step}><b style={number}>3</b><div>चुनें कि प्रोफाइल Male है या Female। अपना नाम, उम्र (18 वर्ष या अधिक), शहर और उपलब्ध बायोडाटा जानकारी सही-सही भरें।</div></div>
   <div style={step}><b style={number}>4</b><div>अपनी साफ प्रोफाइल फोटो अपलोड करें।</div></div>
   <div style={step}><b style={number}>5</b><div><b>Privacy का विकल्प चुनें:</b> “Website par sabhi users ko dikhayein” चुनने पर approval के बाद प्रोफाइल सार्वजनिक Male/Female सूची में आएगी। “Sirf Zara Nikah Service Admin ko dikhayein” चुनने पर प्रोफाइल सार्वजनिक सूची में नहीं दिखाई जाएगी।</div></div>
   <div style={step}><b style={number}>6</b><div>प्रोफाइल लिस्टिंग फीस <b>₹299 (3 महीने)</b> का भुगतान करें। फिर UTR / Transaction ID फॉर्म में भरकर <b>Submit Profile + UTR</b> दबाएँ।</div></div>
   <div style={step}><b style={number}>7</b><div>आपकी रिक्वेस्ट Admin के पास जाएगी। भुगतान verify और प्रोफाइल approve होने के बाद चुने गए privacy option के अनुसार प्रोफाइल उपलब्ध होगी।</div></div>
  </section>

  <section style={panel}>
   <h2>💳 3. UPI QR से भुगतान कैसे करें?</h2>
   <div style={step}><b style={number}>1</b><div>जिस सेवा के लिए भुगतान करना है, उसी पेज पर दिखाई गई फीस और payment QR / UPI ID ध्यान से देखें।</div></div>
   <div style={step}><b style={number}>2</b><div>अपने UPI ऐप (जैसे PhonePe, Google Pay या BHIM) से QR scan करें या दिखाई गई UPI ID पर भुगतान करें।</div></div>
   <div style={step}><b style={number}>3</b><div>सही राशि भेजें और भुगतान सफल होने के बाद UTR / Transaction ID नोट करें।</div></div>
   <div style={step}><b style={number}>4</b><div>जहाँ UTR माँगा जाए, वहाँ वही नंबर भरकर request submit करें। Payment receipt अपने पास रखें।</div></div>
   <div style={step}><b style={number}>5</b><div>Admin भुगतान verify करेगा। Approval होने तक उसी सेवा के लिए बार-बार payment request न भेजें।</div></div>
   <p style={{background:"#fff7ed",padding:13,borderRadius:12,lineHeight:1.7,color:"#854d0e"}}><b>जरूरी:</b> भुगतान करने से पहले राशि, प्रोफाइल ID और UPI details जाँच लें। OTP, UPI PIN या बैंक पासवर्ड किसी को न बताएं। UPI PIN केवल अपने भुगतान ऐप में डालें।</p>
  </section>

  <section style={panel}>
   <h2>💰 4. Wallet से भुगतान कैसे करें?</h2>
   <p style={{lineHeight:1.7}}>अगर आपके Wallet में पर्याप्त balance है, तो payment page पर <b>Wallet से भुगतान</b> विकल्प चुनें। यदि balance कम है, तो पहले <Link href="/wallet-recharge">Wallet / Recharge</Link> पेज से recharge request करें। Recharge या access request Admin द्वारा approve होने के बाद ही लागू होगी।</p>
  </section>

  <section style={panel}>
   <h2>💵 5. फीस की जानकारी</h2>
   <ul style={{lineHeight:2,paddingLeft:22}}>
    <li><b>अपना नया प्रोफाइल जोड़ना:</b> ₹299 / 3 महीने।</li>
    <li><b>किसी प्रोफाइल का पूरा बायोडाटा देखना:</b> ₹99 प्रति प्रोफाइल।</li>
    <li><b>किसी प्रोफाइल का मोबाइल नंबर देखना:</b> ₹299 प्रति प्रोफाइल।</li>
   </ul>
   <p style={{lineHeight:1.7,color:"#665b70"}}>भुगतान की अंतिम राशि हमेशा संबंधित payment page पर देखकर ही भेजें। फीस सेवा/access के लिए है; रिश्ता तय होने या निकाह होने की गारंटी नहीं है।</p>
  </section>

  <section style={panel}>
   <h2>🔐 6. सुरक्षा और Privacy</h2>
   <ul style={{lineHeight:1.9,paddingLeft:22}}>
    <li>प्रोफाइल में सही जानकारी दें और दूसरे व्यक्ति की फोटो/बायोडाटा बिना अनुमति शेयर न करें।</li>
    <li>किसी भी रिश्ते पर आगे बढ़ने से पहले परिवार के साथ जानकारी और पहचान की स्वतंत्र जाँच करें।</li>
    <li>किसी को OTP, UPI PIN, पासवर्ड या बैंक की गोपनीय जानकारी न दें।</li>
    <li>Payment receipt और UTR अपने पास सुरक्षित रखें।</li>
    <li>“Verified” label शादी, compatibility या हर जानकारी की पूरी गारंटी नहीं है।</li>
   </ul>
  </section>

  <section style={{...panel,textAlign:"center"}}>
   <h2>❓ मदद चाहिए?</h2><p style={{lineHeight:1.7}}>वेबसाइट इस्तेमाल करने या payment status में समस्या हो तो Contact पेज देखें।</p>
   <Link href="/contact" style={{display:"inline-block",padding:"12px 20px",borderRadius:12,background:"#6d28d9",color:"#fff",fontWeight:800,textDecoration:"none"}}>📩 Contact / सहायता</Link>
   <div style={{marginTop:16,fontSize:12,color:"#75687f"}}><Link href="/terms">Terms</Link>　•　<Link href="/privacy">Privacy</Link>　•　<Link href="/refund-policy">Refund Policy</Link></div>
  </section>
  <div style={{textAlign:"center",marginTop:20}}><Link href="/" style={{color:"#6d28d9",fontWeight:800}}>← वापस Home पर जाएँ</Link></div>
 </main>;
}
