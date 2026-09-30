"use client";

import {useMemo, useState} from "react";

const events=[
 {date:"17 Jan 2026",hijri:"27 Rajab 1447",name:"🌙 Shab-e-Meraj / Isra' Mi'raj"},
 {date:"4 Feb 2026",hijri:"15 Sha'ban 1447",name:"✨ Shab-e-Barat / Nisfu Sha'ban"},
 {date:"19 Feb 2026",hijri:"1 Ramadan 1447",name:"🌙 Ramadan begins"},
 {date:"7 Mar 2026",hijri:"17 Ramadan 1447",name:"📖 Nuzul al-Qur'an"},
 {date:"17 Mar 2026",hijri:"27 Ramadan 1447",name:"🌙 Laylat-ul-Qadr (27th night)"},
 {date:"21 Mar 2026",hijri:"1 Shawwal 1447",name:"🕌 Eid-ul-Fitr"},
 {date:"27 May 2026",hijri:"9 Dhul-Hijjah 1447",name:"🕋 Yaum-e-Arafah"},
 {date:"28 May 2026",hijri:"10 Dhul-Hijjah 1447",name:"🐑 Eid-ul-Adha"},
 {date:"17 Jun 2026",hijri:"1 Muharram 1448",name:"🌙 Islamic New Year"},
 {date:"25 Jun 2026",hijri:"9 Muharram 1448",name:"🌙 Tasu'a"},
 {date:"26 Jun 2026",hijri:"10 Muharram 1448",name:"🕌 Ashura"},
 {date:"25 Aug 2026",hijri:"12 Rabi-ul-Awwal 1448",name:"ﷺ Mawlid-un-Nabi / Eid Milad-un-Nabi"}
];

const parseEventDate=(value)=>{
 const [d,m,y]=value.split(" ");
 const months={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
 return new Date(Number(y),months[m],Number(d),12);
};

const getIndiaToday=()=>{
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const year=Number(parts.find(p=>p.type==="year")?.value);
 const month=Number(parts.find(p=>p.type==="month")?.value)-1;
 const day=Number(parts.find(p=>p.type==="day")?.value);
 return new Date(year,month,day,12);
};

const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();

const formatHijri=(date)=>{
 const parts=new Intl.DateTimeFormat("en-IN-u-ca-islamic-umalqura",{day:"numeric",month:"long",year:"numeric"}).formatToParts(date);
 const day=parts.find(p=>p.type==="day")?.value||"";
 const month=parts.find(p=>p.type==="month")?.value||"";
 const year=parts.find(p=>p.type==="year")?.value||"";
 const normalized=month.replace("Rabi' al-Awwal","Rabi-ul-Awwal").replace("Rabi' ath-Thani","Rabi-us-Sani").replace("Jumada al-Awwal","Jumada-ul-Awwal").replace("Jumada ath-Thani","Jumada-us-Sani").replace("Dhu al-Qidah","Dhul-Qa'dah").replace("Dhu al-Hijjah","Dhul-Hijjah");
 return {day,month:normalized,year,text:day+" "+normalized+" "+year+" AH"};
};

export default function IslamicCalendar(){
 const [showEvents,setShowEvents]=useState(true);
 const today=getIndiaToday();
 const todayHijri=formatHijri(today);
 const todayText=today.toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
 const currentMonth=today.getMonth();

 const months=useMemo(()=>Array.from({length:12},(_,i)=>{
   const first=new Date(2026,i,1,12);
   const last=new Date(2026,i+1,0,12);
   return [first.toLocaleDateString("en-IN",{month:"long"}),formatHijri(first).month+" "+formatHijri(first).year+" / "+formatHijri(last).month+" "+formatHijri(last).year];
 }),[]);

 const upcoming=useMemo(()=>events.filter(e=>parseEventDate(e.date)>=today).slice(0,8),[today]);

 return <main className="calendarPage">
  <header className="calendarHero">
   <a className="calendarBack" href="/">← Zara Nikah Service</a>
   <div className="calendarMoon">🌙</div>
   <div className="calendarEyebrow">ISLAMIC CALENDAR • INDIA</div>
   <h1>Islamic Calendar 2026</h1>
   <p>Hijri dates, important Islamic occasions and festivals</p>
   <div className="todayCalendarCard">
    <div><small>आज की तारीख</small><strong>{todayText}</strong></div>
    <div><small>आज की हिजरी तारीख</small><strong>{todayHijri.text}</strong></div>
   </div>
   <div className="calendarNote">🌙 यह तारीख India Standard Time (IST) के अनुसार हर बार page/app खोलने पर दिखाई जाएगी। भारत में स्थानीय चाँद देखने के कारण Ramadan, Eid और अन्य तारीखों में 1 दिन का अंतर हो सकता है।</div>
  </header>
  <section className="calendarBody">
   <div className="calendarSectionTitle"><span>📅</span><div><h2>2026 के 12 महीने</h2><small>Hijri + Gregorian calendar</small></div></div>
   <div className="monthGrid">{months.map((m,i)=><div className={i===currentMonth?"monthCard activeMonth":"monthCard"} key={m[0]}><b>{m[0]}</b><small>{m[1]}</small>{i===currentMonth&&<em>● वर्तमान महीना</em>}</div>)}</div>
   <div className="calendarSectionTitle eventsTitle"><span>✨</span><div><h2>इस्लामी त्योहार और महत्वपूर्ण दिन</h2><small>2026 की प्रमुख तारीखें</small></div><button onClick={()=>setShowEvents(v=>!v)}>{showEvents?"छुपाएँ":"दिखाएँ"}</button></div>
   {showEvents&&<div className="eventList">{events.map(e=><div className={sameDay(parseEventDate(e.date),today)?"eventCard todayEvent":"eventCard"} key={e.date+e.name}><div className="eventDate">{e.date}</div><div className="eventInfo"><strong>{e.name}</strong><small>{e.hijri}</small></div></div>)}</div>}
   <div className="calendarSectionTitle"><span>🌙</span><div><h2>आने वाले दिन</h2><small>Calendar reference</small></div></div>
   <div className="upcomingList">{upcoming.length?upcoming.map(e=><div className="upcomingItem" key={e.date+e.name}><span>{e.date}</span><b>{e.name}</b><small>{e.hijri}</small></div>):<div className="calendarDisclaimer">इस वर्ष की सूची में आगे की प्रमुख तारीख उपलब्ध नहीं है।</div>}</div>
   <div className="calendarDisclaimer">नोट: इस्लामी महीनों की शुरुआत स्थानीय चाँद देखने के आधार पर 1 दिन आगे या पीछे हो सकती है। अंतिम तारीख स्थानीय मस्जिद/चाँद देखने वाली समिति के ऐलान के अनुसार मानें।</div>
  </section>
  <footer className="calendarFooter"><a href="/">Home</a><a href="/#profiles">💍 Profiles</a><a href="/about">About</a><a href="/contact">Contact</a></footer>
 </main>
}