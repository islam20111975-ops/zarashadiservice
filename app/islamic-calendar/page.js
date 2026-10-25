"use client";

import {useMemo, useState} from "react";

const eventDefinitions=[
 {month:7,day:27,name:"🌙 Shab-e-Meraj / Isra' Mi'raj"},
 {month:8,day:15,name:"✨ Shab-e-Barat / Nisfu Sha'ban"},
 {month:9,day:1,name:"🌙 Ramadan begins"},
 {month:9,day:17,name:"📖 Nuzul al-Qur'an (commonly observed)"},
 {month:9,day:27,name:"🌙 Laylat-ul-Qadr (27th night; date may vary)"},
 {month:10,day:1,name:"🕌 Eid-ul-Fitr"},
 {month:12,day:9,name:"🕋 Yaum-e-Arafah"},
 {month:12,day:10,name:"🐑 Eid-ul-Adha"},
 {month:1,day:1,name:"🌙 Islamic New Year"},
 {month:1,day:9,name:"🌙 Tasu'a"},
 {month:1,day:10,name:"🕌 Ashura"},
 {month:3,day:12,name:"ﷺ Mawlid-un-Nabi (observance varies)"}
];

const getIndiaToday=()=>{
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const year=Number(parts.find(p=>p.type==="year")?.value);
 const month=Number(parts.find(p=>p.type==="month")?.value)-1;
 const day=Number(parts.find(p=>p.type==="day")?.value);
 return new Date(year,month,day,12);
};

const hijriParts=(date)=>{
 const parts=new Intl.DateTimeFormat("en-IN-u-ca-islamic-umalqura",{day:"numeric",month:"numeric",year:"numeric"}).formatToParts(date);
 return {
  day:Number(parts.find(p=>p.type==="day")?.value),
  month:Number(parts.find(p=>p.type==="month")?.value),
  year:Number(parts.find(p=>p.type==="year")?.value)
 };
};

const formatHijri=(date)=>{
 const parts=new Intl.DateTimeFormat("en-IN-u-ca-islamic-umalqura",{day:"numeric",month:"long",year:"numeric"}).formatToParts(date);
 const day=parts.find(p=>p.type==="day")?.value||"";
 const month=parts.find(p=>p.type==="month")?.value||"";
 const year=parts.find(p=>p.type==="year")?.value||"";
 const normalized=month.replace("Rabi' al-Awwal","Rabi-ul-Awwal").replace("Rabi' ath-Thani","Rabi-us-Sani").replace("Jumada al-Awwal","Jumada-ul-Awwal").replace("Jumada ath-Thani","Jumada-us-Sani").replace("Dhu al-Qidah","Dhul-Qa'dah").replace("Dhu al-Hijjah","Dhul-Hijjah");
 return {day,month:normalized,year,text:day+" "+normalized+" "+year+" AH"};
};

const formatGregorian=(date)=>date.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();

export default function IslamicCalendar(){
 const [showEvents,setShowEvents]=useState(true);
 const today=getIndiaToday();
 const todayHijri=formatHijri(today);
 const todayText=today.toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
 const currentMonth=today.getMonth();
 const currentYear=today.getFullYear();

 const months=useMemo(()=>Array.from({length:12},(_,i)=>{
   const first=new Date(currentYear,i,1,12);
   const last=new Date(currentYear,i+1,0,12);
   const firstHijri=formatHijri(first);
   const lastHijri=formatHijri(last);
   return [first.toLocaleDateString("en-IN",{month:"long"}),firstHijri.month+" "+firstHijri.year+" / "+lastHijri.month+" "+lastHijri.year];
 }),[currentYear]);

 const events=useMemo(()=>{
   const found=[];
   for(let offset=0;offset<=370;offset++){
     const date=new Date(today);
     date.setDate(today.getDate()+offset);
     const hijri=hijriParts(date);
     for(const def of eventDefinitions){
       if(hijri.month===def.month&&hijri.day===def.day){
         found.push({dateObj:date,date:formatGregorian(date),hijri:formatHijri(date).text,name:def.name});
       }
     }
   }
   return found;
 },[todayText]);

 const upcoming=events.filter(e=>e.dateObj>=today).slice(0,8);

 return <main className="calendarPage">
  <header className="calendarHero">
   <a className="calendarBack" href="/">← Zara Nikah Service</a>
   <div className="calendarMoon">🌙</div>
   <div className="calendarEyebrow">ISLAMIC CALENDAR • INDIA</div>
   <h1>Islamic Calendar {currentYear}</h1>
   <p>Hijri dates, important Islamic occasions and festivals</p>
   <div className="todayCalendarCard">
    <div><small>आज की तारीख</small><strong>{todayText}</strong></div>
    <div><small>आज की हिजरी तारीख</small><strong>{todayHijri.text}</strong></div>
   </div>
   <div className="calendarNote">🌙 यह कैलेंडर India Standard Time (IST) के अनुसार आज की तारीख और हिजरी तारीख दिखाता है। Ramadan, Eid और अन्य अवसरों की तारीखें स्थानीय चाँद देखने के कारण एक दिन आगे या पीछे हो सकती हैं।</div>
  </header>
  <section className="calendarBody">
   <div className="calendarSectionTitle"><span>📅</span><div><h2>{currentYear} के 12 महीने</h2><small>Hijri + Gregorian calendar</small></div></div>
   <div className="monthGrid">{months.map((m,i)=><div className={i===currentMonth?"monthCard activeMonth":"monthCard"} key={m[0]}><b>{m[0]}</b><small>{m[1]}</small>{i===currentMonth&&<em>● वर्तमान महीना</em>}</div>)}</div>
   <div className="calendarSectionTitle eventsTitle"><span>✨</span><div><h2>इस्लामी त्योहार और महत्वपूर्ण दिन</h2><small>आज से अगले 12 महीनों की अनुमानित तारीखें</small></div><button onClick={()=>setShowEvents(v=>!v)}>{showEvents?"छुपाएँ":"दिखाएँ"}</button></div>
   {showEvents&&<div className="eventList">{events.map(e=><div className={sameDay(e.dateObj,today)?"eventCard todayEvent":"eventCard"} key={e.date+e.name}><div className="eventDate">{e.date}</div><div className="eventInfo"><strong>{e.name}</strong><small>{e.hijri}</small></div></div>)}</div>}
   <div className="calendarSectionTitle"><span>🌙</span><div><h2>आने वाले दिन</h2><small>अगले 12 महीनों के कैलेंडर संदर्भ</small></div></div>
   <div className="upcomingList">{upcoming.length?upcoming.map(e=><div className="upcomingItem" key={e.date+e.name}><span>{e.date}</span><b>{e.name}</b><small>{e.hijri}</small></div>):<div className="calendarDisclaimer">आने वाले दिनों की तारीखें उपलब्ध नहीं हैं।</div>}</div>
   <div className="calendarDisclaimer">महत्वपूर्ण: यह तारीखें Umm al-Qura हिजरी कैलेंडर के आधार पर अनुमानित हैं। भारत में स्थानीय चाँद देखने के आधार पर एक दिन का अंतर हो सकता है। धार्मिक अवसरों की अंतिम तारीख स्थानीय मस्जिद या चाँद देखने वाली समिति के ऐलान से पुष्टि करें।</div>
  </section>
  <footer className="calendarFooter"><a href="/">Home</a><a href="/#profiles">💍 Profiles</a><a href="/about">About</a><a href="/contact">Contact</a></footer>
 </main>
}
