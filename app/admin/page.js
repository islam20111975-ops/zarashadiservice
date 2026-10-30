"use client";

import {useEffect,useState,useRef} from "react";
import {useRouter} from "next/navigation";
import {GoogleAuthProvider,signInWithPopup,signInWithRedirect,onAuthStateChanged,signOut} from "firebase/auth";
import {collection,doc,getDoc,onSnapshot,setDoc,serverTimestamp,updateDoc,runTransaction,addDoc,deleteDoc} from "firebase/firestore";
import {auth,db} from "../../lib/firebase";

const ADMINS=["ngogrant454@gmail.com","islam20111975@gmail.com"];

export default function Admin(){
  const router=useRouter();
  const [user,setUser]=useState(undefined),[tab,setTab]=useState("dashboard"),[error,setError]=useState("");
  const [profiles,setProfiles]=useState([]),[users,setUsers]=useState([]),[presence,setPresence]=useState([]);
  const [chats,setChats]=useState([]),[selectedChatId,setSelectedChatId]=useState(""),[chatMessages,setChatMessages]=useState([]),[chatReply,setChatReply]=useState(""),[chatSending,setChatSending]=useState(false);
  const [posts,setPosts]=useState([]),[postText,setPostText]=useState("");
  const [faqs,setFaqs]=useState([]),[faqQuestion,setFaqQuestion]=useState(""),[faqAnswer,setFaqAnswer]=useState(""),[editingFaqId,setEditingFaqId]=useState("");
  const [postImageFile,setPostImageFile]=useState(null),[postImagePreview,setPostImagePreview]=useState("");
  const [recharges,setRecharges]=useState([]),[requests,setRequests]=useState([]),[transactions,setTransactions]=useState([]),[profileSubmissions,setProfileSubmissions]=useState([]);
  const [social,setSocial]=useState({whatsapp:"",facebook:"",instagram:""}),[upi,setUpi]=useState(""),[qrFile,setQrFile]=useState(null),[qrPreview,setQrPreview]=useState("");
  const [wallFile,setWallFile]=useState(null),[wallPreview,setWallPreview]=useState("");
  const [logoFile,setLogoFile]=useState(null),[logoPreview,setLogoPreview]=useState("");
  const [appLogoFile,setAppLogoFile]=useState(null),[appLogoPreview,setAppLogoPreview]=useState("");
  const [splashFile,setSplashFile]=useState(null),[splashPreview,setSplashPreview]=useState("");
  const sliderSyncDone=useRef(false);
  const [saving,setSaving]=useState(false),[requestFilter,setRequestFilter]=useState("all"),[requestSearch,setRequestSearch]=useState(""),[processingAccessId,setProcessingAccessId]=useState("");
  const [pages,setPages]=useState({about:"Zara Nikah Service ek online Nikah aur rishta profile service hai. Hamara maqsad serious rishta search karne wale users ko registered profiles ek simple aur organised platform par available karana hai.\n\nWebsite par profiles ko manage kiya jata hai aur users ko available service ke rules ke mutabik profile information ka access diya jata hai.\n\nZara Nikah Service ka focus simple process, privacy aur Nikah ke liye serious rishta search par hai.\n\nKisi bhi service, profile ya registration se related sawal ke liye Contact page par diye gaye madhyam se message karein.",contact:"Zara Nikah Service se contact karne ke liye website par diye gaye WhatsApp/social contact option ka use karein.\n\nMessage mein apna naam aur apni query ya zaroori details likhein, taaki aapki request ko samajhna aur jawab dena aasaan ho.\n\nProfile, registration, payment, biodata access ya mobile-number access se related sawal bhi message ke zariye bheje ja sakte hain.\n\nPlease bina zaroorat personal ya sensitive information share na karein.",privacy:"Zara Nikah Service users ki information ko service provide karne aur account/profile management ke liye use karta hai.\n\nGoogle login se milne wali basic account information aur user dwara submit ki gayi profile information ko service ke purpose ke liye process kiya ja sakta hai.\n\nPrivate biodata, contact/mobile number aur payment-related information ko public profile par bina authorised access ke display nahi kiya jata.\n\nPayment ke waqt diya gaya UTR/Transaction ID payment verification aur request processing ke liye use kiya ja sakta hai.\n\nUsers ko apni personal information sirf utni hi submit karni chahiye jitni service ke liye zaroori ho. Kisi privacy concern ke liye Contact page ke madhyam se message karein.",terms:"Zara Nikah Service par users registered rishta profiles dekhne aur website par available services ka use kar sakte hain.\n\nRegistration, profile information, payment aur access request ke waqt sahi information dena user ki responsibility hai.\n\nBiodata ya mobile-number access paid service ke roop mein available ho sakta hai. Payment request verification aur approval ke baad access diya jata hai.\n\nWebsite par kisi profile ki personal information ka misuse, unauthorised copying, sharing ya harassment ke liye use nahi kiya jana chahiye.\n\nZara Nikah Service par dikhayi gayi profile information ko users ko respect aur privacy ke saath use karna chahiye.\n\nService ke rules, fees aur available features ko zaroorat ke mutabik update kiya ja sakta hai. Website ka use karte rehne ka matlab updated terms ko follow karna hai."});

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  useEffect(()=>{
    if(!ADMINS.includes(user?.email?.toLowerCase())||!selectedChatId){setChatMessages([]);return;}
    return onSnapshot(collection(db,"supportChats",selectedChatId,"messages"),s=>{
      const rows=s.docs.map(d=>({id:d.id,...d.data()}));rows.sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0));setChatMessages(rows);
    },e=>setError("Chat messages load error: "+e.message));
  },[user,selectedChatId]);

  async function syncSliderImages(rows){
    if(sliderSyncDone.current)return;
    sliderSyncDone.current=true;
    try{
      for(const p of rows.filter(x=>x.status!=="deleted"&&((Array.isArray(x.photos)&&x.photos[0])||x.photo))){
        const ref=doc(db,"homeSliderImages",p.id);
        const existing=await getDoc(ref);
        if(existing.exists()&&existing.data().image)continue;
        const source=(Array.isArray(p.photos)&&p.photos[0])||p.photo;
        const img=new Image();img.src=source;
        await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
        const scale=Math.min(1,320/Math.max(img.naturalWidth,img.naturalHeight));
        const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
        canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        let q=.7,data=canvas.toDataURL("image/jpeg",q);
        while(data.length>45000&&q>.25){q-=.06;data=canvas.toDataURL("image/jpeg",q)}
        if(data.length<=45000)await setDoc(ref,{profileId:p.id,image:data,status:"active",updatedAt:serverTimestamp()},{merge:true});
      }
    }catch(e){setError("Slider image sync error: "+e.message)}
  }

  useEffect(()=>{
    if(!ADMINS.includes(user?.email?.toLowerCase()))return;
    const unsubs=[];
    const watch=(path,setter,ordered=false)=>{
      const q=collection(db,path);
      unsubs.push(onSnapshot(q,s=>{const rows=s.docs.map(d=>({id:d.id,...d.data()})); if(ordered) rows.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)); setter(rows)},e=>setError(path+" load error: "+e.message)));
    };
    watch("homePosts",setPosts,true);watch("faqItems",setFaqs,true);watch("profiles",rows=>{
      setProfiles(rows);
      syncSliderImages(rows);
      const profileIds=rows.filter(p=>p.status!=="deleted"&&((Array.isArray(p.photos)&&p.photos[0])||p.photo)).sort((x,y)=>x.id.localeCompare(y.id)).map(p=>p.id);
      setDoc(doc(db,"settings","homeSlider"),{profileIds,updatedAt:serverTimestamp()},{merge:true}).catch(()=>{});
    });watch("users",setUsers);
    watch("walletRechargeRequests",setRecharges,true);watch("paidAccessRequests",setRequests,true);watch("profileSubmissions",setProfileSubmissions,true);watch("walletTransactions",setTransactions,true);watch("userPresence",setPresence);watch("supportChats",rows=>{rows.sort((a,b)=>(b.updatedAt?.toMillis?.()||0)-(a.updatedAt?.toMillis?.()||0));setChats(rows);setSelectedChatId(old=>old&&rows.some(x=>x.id===old)?old:(rows[0]?.id||""));});
    getDoc(doc(db,"settings","social")).then(s=>s.exists()&&setSocial({...{whatsapp:"",facebook:"",instagram:""},...s.data()})).catch(()=>{});
    getDoc(doc(db,"settings","payment")).then(s=>{if(s.exists()){setUpi(s.data().upiId||"");setQrPreview(s.data().qrUrl||"")}}).catch(e=>setError("Payment settings load error: "+e.message));
    getDoc(doc(db,"settings","appearance")).then(s=>{if(s.exists())setWallPreview(s.data().wallpaper||"")}).catch(e=>setError("Appearance settings load error: "+e.message));
    getDoc(doc(db,"settings","branding")).then(s=>{if(s.exists()){setLogoPreview(s.data().logo||"");setAppLogoPreview(s.data().appIcon||"");setSplashPreview(s.data().splash||"")}}).catch(e=>setError("Branding settings load error: "+e.message));
    getDoc(doc(db,"settings","legalPages")).then(s=>{if(s.exists())setPages(p=>({...p,about:s.data().about||"",contact:s.data().contact||"",privacy:s.data().privacy||"",terms:s.data().terms||""}))}).catch(e=>setError("Website pages load error: "+e.message));
    return()=>unsubs.forEach(x=>x());
  },[user]);

  async function sendPushToUsers(uids,title,message){
    const unique=[...new Set((uids||[]).filter(Boolean))];
    if(!unique.length)return {ok:false,sent:0,failureCount:0,error:"Kisi user ka UID nahi mila."};
    if(!user)return {ok:false,sent:0,failureCount:unique.length,error:"Admin login session nahi mila."};
    try{
      const idToken=await user.getIdToken();
      const response=await fetch("/api/push/send",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+idToken},body:JSON.stringify({uids:unique,title,message})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok){
        const reason=data.error||("HTTP "+response.status);
        return {ok:false,sent:Number(data.sent||0),failureCount:Number(data.failureCount??unique.length),error:reason};
      }
      return {ok:Number(data.failureCount||0)===0&&Number(data.sent||0)>0,sent:Number(data.sent||0),failureCount:Number(data.failureCount||0),registeredDevices:Number(data.registeredDevices||0),errors:Array.isArray(data.errors)?data.errors:[]};
    }catch(e){
      return {ok:false,sent:0,failureCount:unique.length,error:e.message||"Network error"};
    }
  }
  async function notifyCustomer(uid,title,message,type="service"){
    if(!uid)return;
    try{
      await addDoc(collection(db,"notifications"),{uid,title,message,type,read:false,createdAt:serverTimestamp()});
      await sendPushToUsers([uid],title,message);
    }catch(e){setError("Notification save nahi hui: "+e.message)}
  }
  async function notifyNewProfile(profileId,ownerUid){
    const recipients=users.filter(x=>(x.uid||x.id)&&((x.uid||x.id)!==ownerUid));
    const recipientUids=[];
    for(const x of recipients){
      try{
        const uid=x.uid||x.id;
        await addDoc(collection(db,"notifications"),{uid,title:"नया रिश्ता आया है",message:"Zara Nikah Service par naya profile "+profileId+" add hua hai. Website par Male/Female Rishte dekhein.",type:"new_profile",profileId,read:false,createdAt:serverTimestamp()});
        recipientUids.push(uid);
      }catch(e){setError("New profile notification nahi bheji gayi: "+e.message);break;}
    }
    if(recipientUids.length)await sendPushToUsers(recipientUids,"नया रिश्ता आया है","Zara Nikah Service par naya profile "+profileId+" add hua hai. Website par Male/Female Rishte dekhein.");
  }
  async function sendAdminReply(e){
    e.preventDefault();const message=chatReply.trim();if(!message||!selectedChatId||chatSending)return;
    setChatSending(true);setError("");
    try{
      const x=chats.find(v=>v.id===selectedChatId);if(!x)throw new Error("Customer chat nahi mili.");
      await addDoc(collection(db,"supportChats",selectedChatId,"messages"),{text:message,senderUid:user.uid,senderEmail:user.email||"",senderRole:"admin",createdAt:serverTimestamp()});
      await updateDoc(doc(db,"supportChats",selectedChatId),{lastMessage:message,lastSender:"admin",updatedAt:serverTimestamp(),unreadForAdmin:false,unreadForUser:true});
      await notifyCustomer(selectedChatId,"एडमिन का जवाब",message.slice(0,180),"chat_reply");
      setChatReply("");
    }catch(e){setError("Reply send nahi hua: "+e.message)}
    finally{setChatSending(false)}
  }
  async function setUserAccessStatus(x,status){
    try{
      if(!x?.id||!["approved","pending","rejected"].includes(status))return;
      await updateDoc(doc(db,"users",x.id),{status,accessReviewedAt:serverTimestamp(),accessReviewedBy:user.email});
      setError((x.email||x.id)+" access status: "+status);
    }catch(e){setError("User access status update nahi hua: "+e.message)}
  }

  async function saveFaq(e){
    e.preventDefault();const question=faqQuestion.trim(),answer=faqAnswer.trim();
    if(!question||!answer){setError("FAQ ka sawal aur jawab dono likhein.");return}
    if(question.length>300||answer.length>2000){setError("Sawal 300 aur jawab 2000 characters tak rakhein.");return}
    setSaving(true);setError("");
    try{const data={question,answer,updatedAt:serverTimestamp(),updatedBy:user.email};if(editingFaqId)await updateDoc(doc(db,"faqItems",editingFaqId),data);else await addDoc(collection(db,"faqItems"),{...data,createdAt:serverTimestamp()});setFaqQuestion("");setFaqAnswer("");setEditingFaqId("");setError(editingFaqId?"FAQ update ho gaya.":"Naya FAQ add ho gaya.");}
    catch(e){setError("FAQ save nahi hua: "+e.message)}finally{setSaving(false)}
  }
  function editFaq(item){setEditingFaqId(item.id);setFaqQuestion(item.question||"");setFaqAnswer(item.answer||"");window.scrollTo({top:0,behavior:"smooth"});}
  async function removeFaq(item){if(!confirm("Is FAQ ko delete karein?"))return;try{await deleteDoc(doc(db,"faqItems",item.id));if(editingFaqId===item.id){setEditingFaqId("");setFaqQuestion("");setFaqAnswer("")}setError("FAQ delete kar diya gaya.")}catch(e){setError("FAQ delete nahi hua: "+e.message)}}

  async function publishPost(e){
    e.preventDefault();
    const text=postText.trim();
    if(!text&&!postImageFile){setError("Post ka text ya image zaroor add karein.");return}
    if(text.length>5000){setError("Post 5000 characters se chhoti rakhein.");return}
    setSaving(true);setError("");
    try{
      let image="";
      if(postImageFile){
        if(!postImageFile.type.startsWith("image/"))throw new Error("Sirf image file upload karein.");
        const source=URL.createObjectURL(postImageFile);
        try{
          const img=new Image();img.src=source;
          await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
          const scale=Math.min(1,1200/Math.max(img.naturalWidth,img.naturalHeight));
          const canvas=document.createElement("canvas");
          canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
          canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
          canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
          let quality=.78;image=canvas.toDataURL("image/jpeg",quality);
          while(image.length>350000&&quality>.3){quality-=.08;image=canvas.toDataURL("image/jpeg",quality)}
          if(image.length>350000)throw new Error("Image bahut badi hai. Chhoti image select karein.");
        }finally{URL.revokeObjectURL(source)}
      }
      await addDoc(collection(db,"homePosts"),{text,image,createdBy:user.email,createdAt:serverTimestamp(),status:"active"});
      // Notify every registered user about the new admin post.
      const recipientUids=[...new Set(users.map(x=>x.uid||x.id).filter(uid=>uid&&uid!==user.uid))];
      const notificationTitle="📢 Zara Nikah Service par nayi post";
      const notificationMessage=text?text.slice(0,180):"Zara Nikah Service par admin ne nayi photo post ki hai. App kholkar dekhein.";
      for(let i=0;i<recipientUids.length;i+=400){
        const batch=recipientUids.slice(i,i+400);
        await Promise.all(batch.map(uid=>addDoc(collection(db,"notifications"),{
          uid,title:notificationTitle,message:notificationMessage,type:"admin_post",read:false,createdAt:serverTimestamp()
        })));
      }
      const pushResult=recipientUids.length
        ?await sendPushToUsers(recipientUids,notificationTitle,notificationMessage)
        :{ok:false,sent:0,failureCount:0,error:"Koi registered user UID nahi mila."};
      setPostText("");setPostImageFile(null);setPostImagePreview("");
      if(pushResult.ok){
        setError("Post publish ho gayi. In-app notification "+recipientUids.length+" users ko save hui. Mobile push: "+pushResult.sent+" devices par bheji gayi.");
      }else{
        const reason=pushResult.error||((pushResult.failureCount||0)+" devices par push fail hua.");
        setError("Post publish ho gayi, lekin mobile push poori tarah successful nahi hui. In-app notification "+recipientUids.length+" users ko save hui. Mobile push sent: "+pushResult.sent+", failed: "+pushResult.failureCount+". Reason: "+reason);
      }
    }catch(e){setError("Post publish nahi hui: "+e.message)}
    finally{setSaving(false)}
  }
  async function removePost(post){
    if(!confirm("Is post ko website se delete karein?"))return;
    try{await deleteDoc(doc(db,"homePosts",post.id));setError("Post delete kar di gayi.")}
    catch(e){setError("Post delete nahi hui: "+e.message)}
  }

  async function login(){
    setError("");const p=new GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});
    try{await signInWithPopup(auth,p)}catch(e){if(["auth/popup-blocked","auth/popup-closed-by-user"].includes(e.code)){try{await signInWithRedirect(auth,p)}catch(x){setError(x.message)}}else setError(e.message)}
  }
  const logout=()=>signOut(auth);

  async function approveRecharge(x){
    try{
      if(x.status!=="pending")return;
      const amount=Number(x.amount);
      if(![100,500,1000].includes(amount))throw new Error("Recharge amount valid nahi hai.");
      if(x.paymentMethod!=="upi"&&x.paymentMethod!=="qr")throw new Error("Recharge payment method valid nahi hai.");
      if(!x.utr)throw new Error("Recharge UTR missing hai.");
      const reqRef=doc(db,"walletRechargeRequests",x.id);
      const userRef=doc(db,"users",x.uid);
      const txRef=doc(db,"walletTransactions",x.id+"_recharge");

      await runTransaction(db,async t=>{
        const reqSnap=await t.get(reqRef);
        if(!reqSnap.exists())throw new Error("Recharge request nahi mili.");
        const req=reqSnap.data();
        if(req.status!=="pending")throw new Error("Ye recharge already process ho chuka hai.");
        if(Number(req.amount)!==amount)throw new Error("Recharge request amount mismatch hai.");
        if(!["upi","qr"].includes(req.paymentMethod))throw new Error("Recharge payment method invalid hai.");
        if(!req.utr || !req.utrClaimId)throw new Error("Recharge UTR claim missing hai.");
        const claimRef=doc(db,"paymentUtrClaims",req.utrClaimId);
        const claimSnap=await t.get(claimRef);
        if(!claimSnap.exists())throw new Error("UTR claim nahi mila.");
        const claim=claimSnap.data();
        if(claim.uid!==req.uid || claim.kind!=="recharge" || Number(claim.amount)!==amount || claim.requestId!==x.id || claim.utr!==req.utr)throw new Error("Recharge UTR claim mismatch hai.");

        const userSnap=await t.get(userRef);
        const oldBalance=Number(userSnap.exists()?userSnap.data().walletBalance||0:0);
        const newBalance=oldBalance+amount;

        t.update(reqRef,{
          status:"approved",
          approvedAt:serverTimestamp(),
          approvedAmount:amount
        });
        if(reqSnap.data().lockId)t.delete(doc(db,"pendingPaymentLocks",reqSnap.data().lockId));
        t.set(txRef,{
          uid:x.uid,
          type:"recharge",
          direction:"credit",
          amount,
          signedAmount:amount,
          balanceAfter:newBalance,
          utr:x.utr||"",
          requestId:x.id,
          status:"approved",
          createdAt:serverTimestamp()
        },{merge:true});
        t.set(userRef,{
          walletBalance:newBalance,
          lastRecharge:amount
        },{merge:true});
      });
      await notifyCustomer(x.uid,"पेमेंट अप्रूव हो गया","₹"+amount+" Wallet Recharge approve ho gaya hai. Aapka wallet update kar diya gaya hai.","payment_approved");
    }catch(e){setError("Recharge approve nahi hua: "+e.message)}
  }
  async function rejectRecharge(x){if(!confirm("Recharge reject karein?"))return;try{await runTransaction(db,async t=>{const ref=doc(db,"walletRechargeRequests",x.id);const s=await t.get(ref);if(!s.exists()||s.data().status!=="pending")throw new Error("Request already process ho chuki hai.");t.update(ref,{status:"rejected",rejectedAt:serverTimestamp()});if(s.data().lockId)t.delete(doc(db,"pendingPaymentLocks",s.data().lockId));});}catch(e){setError("Recharge reject nahi hua: "+e.message)}}

  async function approveProfileSubmission(x){
    if(x.status!=="pending")return;
    setProcessingAccessId(x.id);
    try{
      if(!x.utr||Number(x.amount)!==299)throw new Error("₹299 payment UTR missing hai.");
      const subRef=doc(db,"profileSubmissions",x.id);
      const subSnap=await getDoc(subRef);
      if(!subSnap.exists()||subSnap.data().status!=="pending")throw new Error("Request already process ho chuki hai.");
      const now=Date.now();
      if(x.visibility==="admin"){
        await updateDoc(subRef,{status:"approved",visibility:"admin",approvedAt:serverTimestamp(),expiresAt:new Date(now+90*24*60*60*1000),approvedBy:user.email,publicProfile:false});
        setError("✓ Profile approve ho gayi. Yeh sirf Admin ko dikhegi, public website par nahi.");
        await notifyCustomer(x.uid,"आपका रिश्ता अप्रूव हो गया","Aapka profile Admin-only mode mein approve ho gaya hai.","profile_approved");
      }else{
        const nextNum=profiles.reduce((m,p)=>Math.max(m,Number(String(p.id).replace(/\\D/g,""))||0),0)+1;
        const profileId=String(nextNum).padStart(3,"0");
        const liveProfile={id:profileId,name:x.name||"",age:Number(x.age)||"",height:x.height||"",city:x.city||"",state:x.state||"",language:x.language||"",religion:x.religion||"Muslim",community:x.community||"",education:x.education||"",occupation:x.occupation||"",maritalStatus:x.maritalStatus||"",about:x.about||"",gender:x.gender||"female",photo:x.photo||"",photos:x.photo?[x.photo]:[],image:x.photo||"",status:"active",verified:true,ownerUid:x.uid||"",ownerEmail:x.email||"",registrationFee:299,createdAt:serverTimestamp(),approvedAt:serverTimestamp(),expiresAt:new Date(now+90*24*60*60*1000)};
        await setDoc(doc(db,"profiles",profileId),liveProfile);
        await updateDoc(subRef,{status:"approved",visibility:"public",profileId,approvedAt:serverTimestamp(),expiresAt:new Date(now+90*24*60*60*1000),approvedBy:user.email,publicProfile:true});
        await notifyCustomer(x.uid,"आपका रिश्ता अप्रूव हो गया","Aapka profile "+profileId+" public website par approve ho gaya hai.","profile_approved");
        await notifyNewProfile(profileId,x.uid);
        setError("✓ Profile "+profileId+" live kar di gayi aur registered users ko notification bhej di gayi.");
      }
    }catch(e){setError("Profile approve nahi hui: "+e.message)}
    finally{setProcessingAccessId("")}
  }
  async function rejectProfileSubmission(x){
    try{await updateDoc(doc(db,"profileSubmissions",x.id),{status:"rejected",reviewedAt:serverTimestamp(),reviewedBy:user.email});setError("Profile submission reject kar di gayi.");}
    catch(e){setError("Reject nahi hua: "+e.message)}
  }

  async function approveAccess(x){
    if(processingAccessId)return;
    if(x.status!=="pending"){setError("Ye request pehle hi process ho chuki hai. Status refresh karke check karein.");return;}
    setProcessingAccessId(x.id);
    setError("✓ Approve button click hua — request process ho rahi hai. Thoda intezar karein...");
    try{
      const amount=Number(x.amount);
      const allowedAmounts=x.type==="biodata"?[99,100]:[299,500];
      if(!allowedAmounts.includes(amount))throw new Error("Access amount valid nahi hai.");
      const reqRef=doc(db,"paidAccessRequests",x.id);
      const unlockRef=doc(db,x.type==="biodata"?"biodataUnlocks":"mobileAccess",x.uid+"_"+x.profileId);
      const txRef=doc(db,"walletTransactions",x.id+"_payment");
      const userRef=doc(db,"users",x.uid);

      await runTransaction(db,async t=>{
        const reqSnap=await t.get(reqRef);
        if(!reqSnap.exists())throw new Error("Access request nahi mili.");
        const req=reqSnap.data();
        if(req.status!=="pending")throw new Error("Ye request already process ho chuki hai.");
        if(req.type!=="biodata" && req.type!=="mobile")throw new Error("Access type invalid hai.");
        const allowedReqAmounts=req.type==="biodata"?[99,100]:[299,500];
        if(!allowedReqAmounts.includes(Number(req.amount)))throw new Error("Access request amount mismatch hai.");
        if(req.profileId!==x.profileId || req.type!==x.type)throw new Error("Access request data mismatch hai.");
        if(!["wallet","upi","qr","upi_id_or_qr"].includes(req.paymentMethod))throw new Error("Payment method valid nahi hai.");
        if(req.paymentMethod==="wallet" && req.utr!=="")throw new Error("Wallet request me UTR nahi hona chahiye.");
        if(req.paymentMethod==="wallet" && req.utrClaimId)throw new Error("Wallet request me UTR claim nahi hona chahiye.");
        if(req.paymentMethod!=="wallet" && (!req.utr || !["upi","qr","upi_id_or_qr"].includes(req.paymentMethod) || !req.utrClaimId))throw new Error("UPI/QR request incomplete hai.");
        if(req.paymentMethod!=="wallet"){
          // Never approve a UPI/QR access request without its unique UTR claim.
          // Admin must still verify the payment in the bank/UPI app before approving.
          if(!req.utrClaimId || req.utrClaimId!==String(req.utr||"").toLowerCase())throw new Error("Access UTR claim missing ya invalid hai.");
          const claimSnap=await t.get(doc(db,"paymentUtrClaims",req.utrClaimId));
          if(!claimSnap.exists())throw new Error("Access UTR claim nahi mila. Is request ko approve na karein.");
          const claim=claimSnap.data();
          if(claim.uid!==req.uid || claim.kind!=="access" || claim.profileId!==req.profileId || claim.type!==req.type || Number(claim.amount)!==Number(req.amount) || claim.requestId!==x.id || claim.utr!==req.utr)throw new Error("Access UTR claim mismatch hai.");
        }

        const profileSnap=await t.get(doc(db,"profiles",req.profileId));
        if(!profileSnap.exists() || profileSnap.data().status==="deleted"){
          throw new Error("Ye profile ab active nahi hai.");
        }

        const unlockSnap=await t.get(unlockRef);
        if(unlockSnap.exists() && unlockSnap.data().status==="approved"){
          // A legacy/stale pending request can remain after an earlier request was approved.
          // Never grant the same access twice. Close this duplicate request cleanly instead
          // of showing an approval error forever.
          t.update(reqRef,{
            status:"rejected",
            rejectedAt:serverTimestamp(),
            rejectionReason:"access_already_approved"
          });
          if(req.lockId)t.delete(doc(db,"pendingPaymentLocks",req.lockId));
          return;
        }

        let balanceAfter=null;
        if(req.paymentMethod==="wallet"){
          const userSnap=await t.get(userRef);
          if(!userSnap.exists())throw new Error("User wallet nahi mila.");
          const balance=Number(userSnap.data().walletBalance||0);
          if(balance<amount)throw new Error("User Wallet Balance ₹"+balance+" hai. ₹"+amount+" available nahi hai.");
          balanceAfter=balance-amount;
          t.set(userRef,{walletBalance:balanceAfter,lastPayment:amount},{merge:true});
        }

        t.set(unlockRef,{
          uid:x.uid,profileId:x.profileId,amount,status:"approved",
          type:x.type,approvedAt:serverTimestamp(),paymentMethod:req.paymentMethod||"upi"
        },{merge:true});
        t.update(reqRef,{status:"approved",approvedAt:serverTimestamp(),approvedPaymentMethod:req.paymentMethod||"upi"});
        if(req.lockId)t.delete(doc(db,"pendingPaymentLocks",req.lockId));
        t.set(txRef,{
          uid:x.uid,
          type:x.type==="biodata"?"biodata_unlock":"mobile_access",
          amount,
          profileId:x.profileId,
          utr:x.utr||"",
          requestId:x.id,
          paymentMethod:req.paymentMethod||"upi",
          direction:req.paymentMethod==="wallet"?"debit":"none",
          signedAmount:req.paymentMethod==="wallet"?-amount:0,
          balanceAfter,
          status:"approved",
          createdAt:serverTimestamp()
        },{merge:true});
      });
      const finalReq=await getDoc(reqRef);
      if(finalReq.exists()&&finalReq.data().status==="approved")await notifyCustomer(x.uid,"पेमेंट अप्रूव हो गया","Profile "+x.profileId+" ka "+(x.type==="biodata"?"₹99 Biodata":"₹299 Mobile Number")+" access approve ho gaya hai.","payment_approved");
      setError("✓ Request process ho gayi. Status update check karein; agar Pending rahe to page refresh karke dekhein.");
    }catch(e){setError("✕ Approve button click hua, lekin approval fail hua: "+e.message)}
    finally{setProcessingAccessId("");}
  }
  async function rejectAccess(x){if(!confirm("Request reject karein?"))return;try{await runTransaction(db,async t=>{const ref=doc(db,"paidAccessRequests",x.id);const s=await t.get(ref);if(!s.exists()||s.data().status!=="pending")throw new Error("Request already process ho chuki hai.");t.update(ref,{status:"rejected",rejectedAt:serverTimestamp()});if(s.data().lockId)t.delete(doc(db,"pendingPaymentLocks",s.data().lockId));});}catch(e){setError("Access reject nahi hua: "+e.message)}}
  async function revokeApprovedAccess(x){
    if(!confirm("Approved payment ka private biodata/mobile access band karein? Payment record safe rahega. Wallet refund nahi hoga."))return;
    try{
      const reqRef=doc(db,"paidAccessRequests",x.id);
      const unlockRef=doc(db,x.type==="biodata"?"biodataUnlocks":"mobileAccess",(x.uid||"")+"_"+(x.profileId||""));
      const txRef=doc(db,"walletTransactions",x.id+"_payment");
      await runTransaction(db,async t=>{
        const rs=await t.get(reqRef);
        const us=await t.get(unlockRef);
        const ts=await t.get(txRef);
        if(!rs.exists())throw new Error("Payment request nahi mili.");
        const req=rs.data();
        if(req.status!=="approved")throw new Error("Request approved nahi hai. Refresh karke check karein.");
        if(req.uid!==x.uid||req.profileId!==x.profileId||req.type!==x.type)throw new Error("Request details match nahi karti.");
        t.update(reqRef,{status:"rejected",rejectedAt:serverTimestamp(),rejectionReason:"admin_revoked_approved_access"});
        if(us.exists())t.update(unlockRef,{status:"revoked",revokedAt:serverTimestamp(),revokedBy:user.email});
        if(ts.exists())t.update(txRef,{status:"rejected",rejectedAt:serverTimestamp()});
        if(req.lockId)t.delete(doc(db,"pendingPaymentLocks",req.lockId));
      });
      setError("Access band kar diya. Payment history safe rakhi gayi; wallet refund nahi hua.");
    }catch(e){setError("Access band nahi hua: "+e.message)}
  }
  async function deleteAccessRequest(x){
    if(!confirm("Is payment request ko delete karein? Agar approved hai to uska biodata/mobile access bhi band hoga aur linked payment transaction delete hogi. UTR claim duplicate payment rokne ke liye safe rakha jayega. Wallet refund nahi hoga."))return;
    try{
      const reqRef=doc(db,"paidAccessRequests",x.id);
      const unlockPath=x.type==="biodata"?"biodataUnlocks":"mobileAccess";
      const unlockRef=doc(db,unlockPath,(x.uid||"")+"_"+(x.profileId||""));
      const txRef=doc(db,"walletTransactions",x.id+"_payment");
      await runTransaction(db,async t=>{
        const rs=await t.get(reqRef);
        const us=await t.get(unlockRef);
        const ts=await t.get(txRef);
        if(!rs.exists())throw new Error("Payment request nahi mili. Page refresh karke dobara check karein.");
        const req=rs.data();
        if(req.uid!==x.uid||req.profileId!==x.profileId||req.type!==x.type)throw new Error("Request details match nahi karti; safety ke liye delete roka gaya.");
        if(us.exists())t.delete(unlockRef);
        if(ts.exists())t.delete(txRef);
        if(req.lockId)t.delete(doc(db,"pendingPaymentLocks",req.lockId));
        t.delete(reqRef);
      });
      setError("Payment request delete ho gayi aur related access band kar diya. UTR claim duplicate payment safety ke liye rakha gaya hai; wallet refund nahi hua.");
    }catch(e){setError("Request delete nahi hui: "+e.message)}
  }
  async function rejectTransaction(x){
    if(!confirm("Is payment ko REJECT karke user ka biodata/mobile access band karein? Wallet refund apne-aap nahi hoga."))return;
    try{
      const reqId=x.requestId;
      if(!reqId)throw new Error("Request ID nahi hai; is transaction se access request identify nahi ho rahi.");
      const reqRef=doc(db,"paidAccessRequests",reqId);
      const unlockPath=x.type==="biodata_unlock"?"biodataUnlocks":x.type==="mobile_access"?"mobileAccess":null;
      if(!unlockPath)throw new Error("Reject sirf biodata/mobile access payment par available hai.");
      const unlockRef=doc(db,unlockPath,(x.uid||"")+"_"+(x.profileId||""));
      await runTransaction(db,async t=>{
        const rs=await t.get(reqRef);
        const us=await t.get(unlockRef);
        if(!rs.exists())throw new Error("Related payment request nahi mili. Access ko safely verify nahi kar sakte.");
        if(rs.data().uid!==x.uid||rs.data().profileId!==x.profileId)throw new Error("Transaction aur request details match nahi karte.");
        t.update(reqRef,{status:"rejected",rejectedAt:serverTimestamp(),rejectionReason:"admin_rejected_from_transactions"});
        if(us.exists())t.update(unlockRef,{status:"revoked",revokedAt:serverTimestamp(),revokedBy:user.email});
        t.update(doc(db,"walletTransactions",x.id),{status:"rejected",rejectedAt:serverTimestamp()});
        if(rs.data().lockId)t.delete(doc(db,"pendingPaymentLocks",rs.data().lockId));
      });
      setError("Payment rejected. Related biodata/mobile access band kar diya gaya. Wallet refund nahi hua.");
    }catch(e){setError("Payment reject nahi hua: "+e.message)}
  }
  async function deleteTransaction(x){
    if(!confirm("Is transaction ko delete karne se transaction record, related payment request aur uska biodata/mobile access delete/revoke ho jayega. UTR claim duplicate-payment protection ke liye rahega. Wallet refund nahi hoga. Kya aap sure hain?"))return;
    try{
      const reqId=x.requestId;
      const reqRef=reqId?doc(db,"paidAccessRequests",reqId):null;
      const unlockPath=x.type==="biodata_unlock"?"biodataUnlocks":x.type==="mobile_access"?"mobileAccess":null;
      const unlockRef=unlockPath&&x.uid&&x.profileId?doc(db,unlockPath,x.uid+"_"+x.profileId):null;
      await runTransaction(db,async t=>{
        const ts=await t.get(doc(db,"walletTransactions",x.id));
        if(!ts.exists())return;
        const rs=reqRef?await t.get(reqRef):null;
        const us=unlockRef?await t.get(unlockRef):null;
        if(rs?.exists()&&rs.data().lockId)t.delete(doc(db,"pendingPaymentLocks",rs.data().lockId));
        if(rs?.exists())t.delete(reqRef);
        if(us?.exists())t.delete(unlockRef);
        t.delete(doc(db,"walletTransactions",x.id));
      });
      setError("Transaction, related request aur access record delete/revoke kar diya. UTR safety claim rakha gaya; wallet refund nahi hua.");
    }catch(e){setError("Transaction delete nahi hua: "+e.message)}
  }

  async function savePayment(e){
    e.preventDefault();try{
      const upiValue=upi.trim();
      if(upiValue && !/^[A-Za-z0-9._-]{2,100}@[A-Za-z0-9.-]{2,100}$/.test(upiValue)){
        throw new Error("UPI ID format sahi nahi hai. Example: name@bank");
      }
      let qr="";const old=await getDoc(doc(db,"settings","payment"));if(old.exists())qr=old.data().qrUrl||"";
      if(qrFile){if(!qrFile.type.startsWith("image/")||qrFile.size>5*1024*1024)throw new Error("QR image 5 MB se chhoti honi chahiye.");const url=URL.createObjectURL(qrFile);try{const img=new Image();img.src=url;await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});const c=document.createElement("canvas");const s=Math.min(1,600/Math.max(img.naturalWidth,img.naturalHeight));c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);qr=c.toDataURL("image/png");
      if(qr.length>300000)throw new Error("QR image bahut badi hai. Chhoti/clear QR image upload karein.");}finally{URL.revokeObjectURL(url)}}
      await setDoc(doc(db,"settings","payment"),{upiId:upi.trim(),qrUrl:qr,updatedAt:serverTimestamp()},{merge:true});setQrFile(null);setQrPreview(qr);alert("Payment settings save ho gayi.")
    }catch(e){setError(e.message)}
  }

  async function saveSocial(e){e.preventDefault();try{await setDoc(doc(db,"settings","social"),{...social,updatedAt:serverTimestamp()},{merge:true});alert("Social links save ho gaye.")}catch(e){setError(e.message)}}

  async function deleteAppearance(){
    if(!confirm("Website wallpaper permanently delete karein?"))return;
    setError("");
    try{
      await setDoc(doc(db,"settings","appearance"),{wallpaper:"",updatedAt:serverTimestamp()},{merge:true});
      setWallFile(null);setWallPreview("");
      alert("Website wallpaper delete ho gaya.");
    }catch(e){setError("Wallpaper delete nahi hua: "+e.message)}
  }

  async function savePages(e){
    e.preventDefault();setError("");
    try{await setDoc(doc(db,"settings","legalPages"),{...pages,updatedAt:serverTimestamp()},{merge:true});alert("Website pages save ho gaye.");}
    catch(e){setError(e.message)}
  }

  async function saveBranding(e){
    e.preventDefault();setError("");
    try{
      let logo="",appIcon="",appIcon192="",appIcon512="",splash="";
      const old=await getDoc(doc(db,"settings","branding"));
      if(old.exists()){
        logo=old.data().logo||"";
        appIcon=old.data().appIcon||old.data().appIcon512||"";
        appIcon192=old.data().appIcon192||"";
        appIcon512=old.data().appIcon512||appIcon;
        splash=old.data().splash||"";
      }
      async function compressImage(file,label,maxSize=100000){
        if(!file)return "";
        if(!file.type.startsWith("image/")||file.size>5*1024*1024)throw new Error(label+" image 5 MB se chhoti honi chahiye.");
        const url=URL.createObjectURL(file);
        try{
          const img=new Image();img.src=url;
          await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
          const canvas=document.createElement("canvas");
          const scale=Math.min(1,1000/Math.max(img.naturalWidth,img.naturalHeight));
          canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
          canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
          const ctx=canvas.getContext("2d");
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          let q=.86,data=canvas.toDataURL("image/webp",q);
          while(data.length>maxSize&&q>.35){q-=.06;data=canvas.toDataURL("image/webp",q)}
          if(data.length>maxSize)throw new Error(label+" image bahut badi hai. Chhoti image upload karein.");
          return data;
        }finally{URL.revokeObjectURL(url)}
      }
      async function makePwaIcon(file,label,size,maxSize=80000){
        if(!file)return "";
        if(!file.type.startsWith("image/")||file.size>5*1024*1024)throw new Error(label+" image 5 MB se chhoti honi chahiye.");
        const url=URL.createObjectURL(file);
        try{
          const img=new Image();img.src=url;
          await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
          const canvas=document.createElement("canvas");
          canvas.width=size;canvas.height=size;
          const ctx=canvas.getContext("2d");
          ctx.clearRect(0,0,size,size);
          const pad=Math.round(size*.08);
          const box=size-pad*2;
          const scale=Math.min(box/img.naturalWidth,box/img.naturalHeight,1);
          const w=Math.max(1,Math.round(img.naturalWidth*scale));
          const h=Math.max(1,Math.round(img.naturalHeight*scale));
          const x=Math.round((size-w)/2);
          const y=Math.round((size-h)/2);
          ctx.drawImage(img,x,y,w,h);
          let q=.9,data=canvas.toDataURL("image/webp",q);
          while(data.length>maxSize&&q>.35){q-=.07;data=canvas.toDataURL("image/webp",q)}
          if(data.length>maxSize)throw new Error(label+" icon bahut badi hai. Simple/square logo upload karein.");
          return data;
        }finally{URL.revokeObjectURL(url)}
      }
      async function compressSplash(file){
        if(!file)return "";
        if(!file.type.startsWith("image/"))throw new Error("Sirf image upload karein.");
        if(file.size>25*1024*1024)throw new Error("Image file 25 MB se chhoti honi chahiye.");
        const url=URL.createObjectURL(file);
        try{
          const img=new Image();img.src=url;
          await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
          // Kisi bhi width/height/ratio ki image ko standard full-screen
          // portrait canvas me automatically set karein.
          const targetW=1080,targetH=1920;
          const canvas=document.createElement("canvas");
          canvas.width=targetW;canvas.height=targetH;
          const ctx=canvas.getContext("2d");
          if(!ctx)throw new Error("Image processor available nahi hai.");
          // Cover resize: image ko stretch nahi karna, proportion same rakhein.
          const scale=Math.max(targetW/img.naturalWidth,targetH/img.naturalHeight);
          const drawW=Math.max(1,Math.round(img.naturalWidth*scale));
          const drawH=Math.max(1,Math.round(img.naturalHeight*scale));
          const x=Math.round((targetW-drawW)/2);
          const y=Math.round((targetH-drawH)/2);
          // Har ratio ki image ko screen-fill banane ke liye centre crop.
          ctx.fillStyle="#0b0714";
          ctx.fillRect(0,0,targetW,targetH);
          ctx.drawImage(img,x,y,drawW,drawH);
          // File size bhi automatically compress hota rahe.
          let q=.82,data=canvas.toDataURL("image/jpeg",q);
          while(data.length>500000&&q>.30){
            q-=.06;
            data=canvas.toDataURL("image/jpeg",q);
          }
          if(data.length>500000){
            q=.24;
            data=canvas.toDataURL("image/jpeg",q);
          }
          if(data.length>500000)throw new Error("Image process nahi ho paayi. Thodi chhoti file try karein.");
          return data;
        }finally{URL.revokeObjectURL(url)}
      }
      if(logoFile)logo=await compressImage(logoFile,"Website Logo");
      if(splashFile)splash=await compressSplash(splashFile);
      if(appLogoFile){
        appIcon512=await makePwaIcon(appLogoFile,"App Icon",512);
        appIcon192=await makePwaIcon(appLogoFile,"App Icon",192);
        appIcon=appIcon512;
      }
      await setDoc(doc(db,"settings","branding"),{
        logo,
        appIcon,
        appIcon192,
        appIcon512,
        splash,
        updatedAt:serverTimestamp()
      },{merge:true});
      setLogoFile(null);setAppLogoFile(null);setSplashFile(null);
      setLogoPreview(logo);setAppLogoPreview(appIcon512||appIcon);setSplashPreview(splash);
      try{window.localStorage.setItem("zaraBrandingCache",JSON.stringify({logo,appIcon:appIcon512||appIcon,splash}));window.dispatchEvent(new Event("zara-branding-updated"))}catch(e){}
      alert("Logo aur App Opening Image save ho gayi.");
    }catch(e){setError(e.message)}
  }

  async function saveAppearance(e){
    e.preventDefault();setError("");
    try{
      let wallpaper="";
      const old=await getDoc(doc(db,"settings","appearance"));
      if(old.exists())wallpaper=old.data().wallpaper||"";
      if(wallFile){
        if(!wallFile.type.startsWith("image/")||wallFile.size>5*1024*1024)throw new Error("Wallpaper image 5 MB se chhoti honi chahiye.");
        const url=URL.createObjectURL(wallFile);
        try{
          const img=new Image();img.src=url;
          await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
          const canvas=document.createElement("canvas");
          const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
          canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
          canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
          canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
          wallpaper=canvas.toDataURL("image/jpeg",0.78);
          if(wallpaper.length>500000)throw new Error("Wallpaper bahut badi hai. Chhoti image upload karein.");
        }finally{URL.revokeObjectURL(url)}
      }
      await setDoc(doc(db,"settings","appearance"),{wallpaper,updatedAt:serverTimestamp()},{merge:true});
      setWallFile(null);setWallPreview(wallpaper);alert("Appearance settings save ho gayi.");
    }catch(e){setError(e.message)}
  }

  if(user===undefined)return <main><section className="admin cardPage"><h1>Loading...</h1></section></main>;
  if(!user)return <main><section className="admin cardPage"><div className="adminIcon">🔐</div><h1>Admin Login</h1><button className="primaryAction" onClick={login}>Google Login →</button>{error&&<div className="errorBox">{error}</div>}</section></main>;
  if(!ADMINS.includes(user.email?.toLowerCase()))return <main><section className="admin cardPage"><div className="adminIcon">🚫</div><h1>Access Denied</h1><button className="backAction" onClick={logout}>Logout</button></section></main>;

  const pendingBiodataCount=requests.filter(x=>x.type==="biodata"&&x.status==="pending"&&Number(x.amount)===100).length;
  const pendingMobileCount=requests.filter(x=>x.type==="mobile"&&x.status==="pending"&&Number(x.amount)===500).length;
  const pendingRechargeCount=recharges.filter(x=>x.status==="pending").length;
  const nav=[["dashboard","🏠 Dashboard"],["users","👥 All Users"],["chats",`💬 Customer Chats${chats.filter(x=>x.unreadForAdmin).length?` • ${chats.filter(x=>x.unreadForAdmin).length} NEW`:""}`],["profileSubmissions",`➕ New Profiles${profileSubmissions.filter(x=>x.status==="pending").length?` • ${profileSubmissions.filter(x=>x.status==="pending").length} PENDING`:""}`],["biodata","📋 Biodata"],["access100",`₹99 Biodata Payments${pendingBiodataCount?` • ${pendingBiodataCount} PENDING`:""}`],["access500",`₹299 Mobile Payments${pendingMobileCount?` • ${pendingMobileCount} PENDING`:""}`],["wallet",`💰 Wallet / Recharge${pendingRechargeCount?` • ${pendingRechargeCount} PENDING`:""}`],["transactions","🧾 Transactions"],["posts","📢 Admin Posts"],["faqs",`❓ FAQ Management (${faqs.length})`],["settings","⚙️ Settings"]];

  return <main><section className="admin dashboardPage">
    <div className="dashTop"><div><span className="eyebrow">ZARA NIKAH SERVICE</span><h1>Central Admin Board</h1><p>Users, biodata, payments, wallet aur access sab ek jagah.</p></div><button className="logout" onClick={logout}>🚪 Logout</button></div>
    <div className="adminUser">👤 <span>Admin</span> <b>{user.email}</b></div>
    <div className="adminNav">{nav.map(n=><button key={n[0]} className={tab===n[0]?"active":""} onClick={()=>n[0]==="biodata"?router.push("/admin/biodata"):setTab(n[0])}>{n[1]}</button>)}</div>
    {error&&<div className="errorBox">{error}</div>}

    {tab==="dashboard"&&<div className="dashboardGrid">
      <div className="statCard" role="button" tabIndex={0} onClick={()=>setTab("users")} onKeyDown={e=>e.key==="Enter"&&setTab("users")}><span className="statIcon">👥</span><small>Total Login Accounts</small><strong>{users.length}</strong><small>All Users खोलें →</small></div><div className="statCard" role="button" tabIndex={0} onClick={()=>setTab("users")} onKeyDown={e=>e.key==="Enter"&&setTab("users")}><span className="statIcon">🟢</span><small>Abhi Online</small><strong>{presence.filter(p=>p.isOnline&&p.lastSeen?.toMillis&&Date.now()-p.lastSeen.toMillis()<120000).length}</strong><small>Last 2 minutes में active</small></div>
      <div className="statCard"><span className="statIcon">📋</span><small>Biodata</small><strong>{profiles.length}</strong></div>
      <div className="statCard" role="button" tabIndex={0} onClick={()=>setTab("access100")} onKeyDown={e=>e.key==="Enter"&&setTab("access100")}><span className="statIcon">₹99</span><small>Pending Biodata</small><strong>{requests.filter(x=>x.status==="pending"&&x.type==="biodata").length}</strong><small>Click करके पूरी list देखें →</small></div>
      <div className="statCard" role="button" tabIndex={0} onClick={()=>setTab("access500")} onKeyDown={e=>e.key==="Enter"&&setTab("access500")}><span className="statIcon">₹299</span><small>Pending Mobile</small><strong>{requests.filter(x=>x.status==="pending"&&x.type==="mobile").length}</strong><small>Click करके पूरी list देखें →</small></div>
      <div className="statCard" role="button" tabIndex={0} onClick={()=>setTab("wallet")} onKeyDown={e=>e.key==="Enter"&&setTab("wallet")}><span className="statIcon">💰</span><small>Pending Recharge</small><strong>{recharges.filter(x=>x.status==="pending").length}</strong><small>Click करके पूरी list देखें →</small></div>
    </div>}

    {tab==="chats"&&<div className="adminList"><div className="listHead"><h3>💬 Private Customer Chats</h3><span>{chats.length} conversations</span></div><div style={{display:"grid",gridTemplateColumns:"minmax(190px,.8fr) minmax(0,1.5fr)",gap:14}}><div style={{display:"grid",gap:8,alignContent:"start"}}>{chats.map(x=><button type="button" key={x.id} onClick={()=>{setSelectedChatId(x.id);updateDoc(doc(db,"supportChats",x.id),{unreadForAdmin:false}).catch(()=>{});}} style={{textAlign:"left",padding:12,borderRadius:12,border:selectedChatId===x.id?"2px solid #7c3aed":"1px solid #e5d9ed",background:"#fff",overflowWrap:"anywhere"}}><b>{x.name||"Customer"}</b><small style={{display:"block"}}>{x.email||x.id}</small><small style={{display:"block",color:x.unreadForAdmin?"#b91c1c":"#76687e"}}>{x.unreadForAdmin?"● नया संदेश":x.lastMessage||"No messages"}</small></button>)}{!chats.length&&<p>Abhi koi customer chat nahi aayi.</p>}</div><div>{selectedChatId?<><div style={{background:"#f8f5fb",borderRadius:14,padding:12,height:360,overflowY:"auto",display:"flex",flexDirection:"column",gap:9}}>{chatMessages.map(m=><div key={m.id} style={{alignSelf:m.senderRole==="admin"?"flex-end":"flex-start",maxWidth:"88%",background:m.senderRole==="admin"?"#ede9fe":"#fff",border:"1px solid #e8dff0",borderRadius:12,padding:10}}><small>{m.senderRole==="admin"?"Admin":"Customer"} • {m.createdAt?.toDate?.()?.toLocaleString?.("en-IN")||""}</small><div style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{m.text}</div></div>)}{!chatMessages.length&&<p>Is customer ka pehla message abhi nahi aaya.</p>}</div><form className="adminBox" onSubmit={sendAdminReply}><textarea className="adminInput" rows="3" maxLength={3000} value={chatReply} onChange={e=>setChatReply(e.target.value)} placeholder="Customer ko jawab likhein..."/><button className="primaryAction" disabled={chatSending||!chatReply.trim()}>{chatSending?"Sending...":"📨 Reply Send karein"}</button></form></>:<p>Chat dekhne ke liye customer select karein.</p>}</div></div></div>}

    {tab==="users"&&<div className="adminList"><div className="listHead"><h3>👥 All Google Login Users</h3><span>{users.length} accounts • {presence.filter(p=>p.isOnline&&p.lastSeen?.toMillis&&Date.now()-p.lastSeen.toMillis()<120000).length} online</span></div>{users.map(x=>{const live=presence.find(p=>p.id===(x.uid||x.id));const online=!!(live?.isOnline&&live.lastSeen?.toMillis&&Date.now()-live.lastSeen.toMillis()<120000);return <div className="userAdminCard" key={x.id}><div className="rowProfile">{x.photoURL?<img src={x.photoURL} alt=""/>:<div className="rowPlaceholder">👤</div>}<div><b>{x.name||"Name not set"}</b><small>{x.email||""}</small><small>UID: {x.uid||x.id}</small><small style={{fontWeight:700,color:online?"#16803d":"#777"}}>{online?"🟢 ONLINE NOW":"⚪ Offline"}{live?.lastSeen?.toDate?` • Last seen: ${live.lastSeen.toDate().toLocaleString("en-IN")}`:""}</small></div></div><div className="userDetails"><span>📍 {x.address||"-"}</span><span>📱 {x.phone||"-"}</span><span>🎂 {x.age||"-"}</span><span>💼 {x.income||"-"}</span><span>💰 Wallet: ₹{x.walletBalance||0}</span><span>🔐 Access: {x.status||"pending (not approved)"}</span></div><div className="cardButtons"></div></div>})}</div>}

    {(tab==="access100"||tab==="access500")&&<div className="adminList"><div className="filterBar" style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10,marginBottom:12}}><select className="adminInput" value={requestFilter} onChange={e=>setRequestFilter(e.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All Status</option></select><input className="adminInput" placeholder="🔎 Profile ID / User / UTR search..." value={requestSearch} onChange={e=>setRequestSearch(e.target.value)}/></div><div className="listHead"><h3>{tab==="access100"?"₹99 Paid Biodata":"₹299 Paid Mobile / Contact"} Requests</h3><span>{requests.filter(x=>x.type===(tab==="access100"?"biodata":"mobile")).length}</span></div>{requests.filter(x=>x.type===(tab==="access100"?"biodata":"mobile")&&(requestFilter==="all"||x.status===requestFilter)).filter(x=>{const p=profiles.find(p=>p.id===x.profileId);const u=users.find(u=>u.id===x.uid||u.uid===x.uid);const q=requestSearch.trim().toLowerCase();return !q||(x.profileId+" "+(u?.name||"")+" "+(u?.email||"")+" "+(x.utr||"")).toLowerCase().includes(q)}).map(x=>{const p=profiles.find(p=>p.id===x.profileId);const u=users.find(u=>u.id===x.uid||u.uid===x.uid);return <div className="userAdminCard" key={x.id}><div className="rowProfile">{p?.photos?.[0]?<img src={p.photos[0]} alt=""/>:<div className="rowPlaceholder">📷</div>}<div><b>Profile {x.profileId}</b><small>{p?.name||p?.title||"Profile"} • {x.type==="biodata"?"Biodata":"Mobile Number"}</small><small>👤 Name: {u?.name||x.name||"User"}</small><small>📧 Email: {u?.email||x.email||"-"}</small><small>🆔 UID: {x.uid||u?.uid||u?.id||"-"}</small><small>📱 Phone: {x.phone||u?.phone||"-"}</small><small>💰 Amount: ₹{x.amount} • 📌 Status: {(x.status||"-").toUpperCase()}</small><div style={{marginTop:6,padding:"8px 10px",borderRadius:8,border:"1px solid rgba(0,0,0,.12)",fontWeight:700,overflowWrap:"anywhere"}}>🧾 UTR / Transaction ID: {x.utr||x.transactionId||"-"}</div><small>💳 Payment Method: {(x.paymentMethod||"-").toUpperCase()}</small><small>🗂️ Request ID: {x.id}</small><small>🔒 Lock ID: {x.lockId||"-"}</small><small>🕒 Submitted: {x.createdAt?.toDate?.()?.toLocaleString?.("en-IN")||"-"}</small></div></div><div className="cardButtons">{x.status==="pending"&&<button className="approve" disabled={!!processingAccessId} onClick={()=>approveAccess(x)} style={{opacity:processingAccessId===x.id?0.7:processingAccessId?0.65:1,cursor:processingAccessId?"wait":"pointer",minWidth:115}}>{processingAccessId===x.id?"⏳ Approving...":"✓ Approve"}</button>}{x.status==="pending"&&<button onClick={()=>rejectAccess(x)}>✕ Reject</button>}{x.status==="approved"&&<button onClick={()=>revokeApprovedAccess(x)} style={{color:"#b42318"}}>🚫 Revoke / Block Access</button>}<button onClick={()=>deleteAccessRequest(x)} style={{color:"#b42318"}}>🗑️ Delete</button></div></div>})}</div>}

    {tab==="wallet"&&<div className="adminList"><div className="listHead"><h3>💰 Wallet Recharge Requests</h3><span>{recharges.length}</span></div>{recharges.map(x=><div className="userAdminCard" key={x.id}><div><b>{x.name||"Name not set"}</b><small>📧 {x.email||"-"}</small><small>📱 {x.phone||"-"}</small><small>👤 UID: {x.uid}</small><small>💰 Recharge: ₹{x.amount}</small><small>🧾 UTR: {x.utr||"-"}</small><small>💳 Method: {(x.paymentMethod||"upi").toUpperCase()}</small><small>📌 Status: {x.status}</small><small>🔒 Lock: {x.lockId||"legacy request"}</small><small>🕒 {x.createdAt?.toDate?.()?.toLocaleString?.()||""}</small></div><div className="cardButtons">{x.status==="pending"&&<><button className="approve" onClick={()=>approveRecharge(x)}>✓ Approve & Credit ₹{x.amount}</button><button onClick={()=>rejectRecharge(x)}>✕ Reject</button></>}</div></div>)}</div>}

    {tab==="transactions"&&<div className="adminList"><div className="listHead"><h3>🧾 All Wallet / Payment Transactions</h3><span>{transactions.length}</span></div>{transactions.map(x=><div className="adminRow" key={x.id}><span><b>{x.type} • ₹{x.amount}</b><small>👤 UID: {x.uid||"-"}</small><small>📋 Profile ID: {x.profileId||"-"}</small><small>🧾 UTR / Transaction ID: {x.utr||"-"}</small><small>💳 Method: {(x.paymentMethod||"-").toUpperCase()} • Status: {(x.status||"-").toUpperCase()}</small><small>↔️ Direction: {x.direction||"-"} • Balance After: {x.balanceAfter==null?"-":"₹"+x.balanceAfter}</small><small>🗂️ Request ID: {x.requestId||"-"}</small><small>🕒 Date/Time: {x.createdAt?.toDate?.()?.toLocaleString?.("en-IN")||"-"}</small><div className="cardButtons" style={{marginTop:8}}>{["biodata_unlock","mobile_access"].includes(x.type)&&x.status!=="rejected"&&<button onClick={()=>rejectTransaction(x)}>✕ Reject / Block Access</button>}<button onClick={()=>deleteTransaction(x)} style={{color:"#b42318"}}>🗑️ Delete Full Record</button></div></span></div>)}</div>}

    {tab==="profileSubmissions"&&<div className="adminList"><div className="listHead"><h3>➕ User Profile Submissions — ₹299 / 3 months</h3><span>{profileSubmissions.filter(x=>x.status==="pending").length} Pending</span></div>{profileSubmissions.slice().sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)).map(x=><div className="userAdminCard" key={x.id} style={{marginBottom:12}}><div className="rowProfile">{x.photo?<img src={x.photo} alt="Profile photo"/>:<div className="rowPlaceholder">📷</div>}<div><b>{x.name||"New profile"} • {x.gender==="male"?"Male":"Female"}</b><small>Age: {x.age||"-"} • {x.city||"-"}, {x.state||""}</small><small>Education: {x.education||"-"} • Work: {x.occupation||"-"}</small><small>Email: {x.email||"-"} • UID: {x.uid||"-"}</small><small>UTR: {x.utr||"-"} • Fee: ₹{x.amount||299}</small><small>Visibility: {x.visibility==="admin"?"Sirf Admin ko":"Website par sabko"}</small><small>Status: {(x.status||"pending").toUpperCase()} • Submitted: {x.createdAt?.toDate?.()?.toLocaleString?.("en-IN")||"-"}</small><small>About: {x.about||"-"}</small></div></div><div className="cardButtons">{x.status==="pending"&&<><button className="approve" disabled={!!processingAccessId} onClick={()=>approveProfileSubmission(x)}>✓ Payment Verify & Approve</button><button onClick={()=>rejectProfileSubmission(x)}>✕ Reject</button></>}{x.status==="approved"&&<b>{x.visibility==="admin"?"✓ Sirf Admin ke liye approved":"Live Profile ID: "+x.profileId}</b>}</div></div>)}{!profileSubmissions.length&&<p>Abhi koi profile submission nahi aayi.</p>}</div>}

    {tab==="posts"&&<div className="adminList"><form className="adminBox" onSubmit={publishPost}><h3>📢 Website par nayi post likhein</h3><p>Text aur photo dono add kar sakte hain. Post Male/Female buttons ke neeche sabhi visitors ko dikhegi.</p><textarea className="adminInput pageEditor" rows="5" maxLength={5000} placeholder="Apni announcement ya update yahan likhein..." value={postText} onChange={e=>setPostText(e.target.value)}/><small>{postText.length}/5000 characters</small><label className="uploadBox" style={{display:"block",marginTop:12}}>🖼️ Post ki Photo / Image<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setPostImageFile(f);setPostImagePreview(URL.createObjectURL(f))}}}/><small>JPG, PNG ya WebP. Image automatically compress hogi.</small></label>{postImagePreview&&<div className="uploadPreview"><img src={postImagePreview} alt="Post preview"/><button type="button" className="backAction" onClick={()=>{setPostImageFile(null);setPostImagePreview("")}}>❌ Image hataayein</button></div>}<button className="primaryAction" disabled={saving}>{saving?"Publishing...":"📢 Publish Post →"}</button></form><div className="listHead"><h3>Published Posts</h3><span>{posts.length}</span></div>{posts.map(p=><article className="userAdminCard" key={p.id}><div><b>📢 {p.createdAt?.toDate?.()?.toLocaleString?.("en-IN")||"Recent post"}</b>{p.image&&<img src={p.image} alt="Post image" style={{display:"block",width:"100%",maxWidth:520,maxHeight:360,objectFit:"contain",marginTop:10,borderRadius:12}}/>}<p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{p.text}</p><small>By: {p.createdBy||"Admin"}</small></div><div className="cardButtons"><button onClick={()=>removePost(p)}>🗑️ Delete</button></div></article>)}</div>}


    {tab==="faqs"&&<div className="adminList"><form className="adminBox" onSubmit={saveFaq}><h3>❓ FAQ {editingFaqId?"Edit karein":"Naya sawal-jawab jodein"}</h3><p>Customer Chat mein ye sawal dikhai denge. Customer sawal par click karega to jawab khul jayega.</p><label>सवाल / Question<input className="adminInput" maxLength={300} value={faqQuestion} onChange={e=>setFaqQuestion(e.target.value)} placeholder="Jaise: Registration kaise karein?" required/></label><label>जवाब / Answer<textarea className="adminInput" rows="4" maxLength={2000} value={faqAnswer} onChange={e=>setFaqAnswer(e.target.value)} placeholder="Is sawal ka jawab likhein..." required/></label><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button className="primaryAction" disabled={saving}>{saving?"Saving...":editingFaqId?"💾 FAQ Update karein":"➕ FAQ Add karein"}</button>{editingFaqId&&<button type="button" className="backAction" style={{marginTop:0}} onClick={()=>{setEditingFaqId("");setFaqQuestion("");setFaqAnswer("")}}>Cancel</button>}</div></form><div className="listHead"><h3>Sabhi FAQ ({faqs.length})</h3><span>Admin control</span></div>{faqs.map((f,i)=><article className="userAdminCard" key={f.id}><b>{i+1}. {f.question}</b><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{f.answer}</p><div className="cardButtons"><button type="button" onClick={()=>editFaq(f)}>✏️ Edit</button><button type="button" onClick={()=>removeFaq(f)}>🗑️ Delete</button></div></article>)}{!faqs.length&&<p>Abhi FAQ add nahi kiye gaye hain.</p>}</div>}
    {tab==="settings"&&<><form className="adminBox" onSubmit={savePages}><h3>📄 Website Pages</h3><p>About, Contact, Privacy Policy aur Terms & Conditions ka text yahin se likhein/update karein.</p><label>About<textarea className="adminInput pageEditor" rows="7" value={pages.about} onChange={e=>setPages({...pages,about:e.target.value})}/></label><label>Contact<textarea className="adminInput pageEditor" rows="7" value={pages.contact} onChange={e=>setPages({...pages,contact:e.target.value})}/></label><label>Privacy Policy<textarea className="adminInput pageEditor" rows="9" value={pages.privacy} onChange={e=>setPages({...pages,privacy:e.target.value})}/></label><label>Terms & Conditions<textarea className="adminInput pageEditor" rows="9" value={pages.terms} onChange={e=>setPages({...pages,terms:e.target.value})}/></label><button className="primaryAction">💾 Website Pages Save →</button></form><form className="adminBox" onSubmit={savePayment}><h3>💳 UPI Payment Settings</h3><input className="adminInput" placeholder="UPI ID" value={upi} onChange={e=>setUpi(e.target.value)}/><label className="uploadBox">QR Image<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setQrFile(f);setQrPreview(URL.createObjectURL(f))}}}/></label>{qrPreview&&<div className="uploadPreview"><img src={qrPreview} alt="QR"/></div>}<button className="primaryAction">💾 Payment Save →</button></form><form className="adminBox" onSubmit={saveBranding}><h3>💍 Logo / App Icon</h3><p>Admin yahin se website logo aur App icon dono upload/change kar sakta hai.</p><label className="uploadBox">🌐 Website Logo<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setLogoFile(f);setLogoPreview(URL.createObjectURL(f))}}}/><small>Header mein dikhne wala logo. Image automatically compress hogi.</small></label>{logoPreview&&<div className="uploadPreview"><img src={logoPreview} alt="Website logo"/></div>}<label className="uploadBox">📲 App Logo / Icon<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setAppLogoFile(f);setAppLogoPreview(URL.createObjectURL(f))}}}/><small>Install screen aur app branding ke liye icon. Square image best rahegi.</small></label>{appLogoPreview&&<div className="uploadPreview"><img src={appLogoPreview} alt="App logo"/></div>}<label className="uploadBox">🖥️ App Opening Image / Splash<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setSplashFile(f);setSplashPreview(URL.createObjectURL(f))}}}/><small>Kisi bhi size ya ratio ki image upload karein. System use automatically full-screen 1080×1920 format me resize aur compress karega.</small></label>{splashPreview&&<div className="uploadPreview"><img src={splashPreview} alt="App opening image"/></div>}<button className="primaryAction">💾 Logo & Opening Image Save →</button></form><form className="adminBox" onSubmit={saveAppearance}><h3>🖼️ Website Appearance</h3><label className="uploadBox">Wallpaper / Background<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setWallFile(f);setWallPreview(URL.createObjectURL(f))}}}/><small>Image automatically compress hogi.</small></label>{wallPreview&&<div className="uploadPreview"><img src={wallPreview} alt="Website wallpaper"/></div>}<div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
  <button className="primaryAction" style={{flex:"1 1 220px"}}>💾 Appearance Save →</button>
  {wallPreview&&<button type="button" className="backAction" style={{flex:"1 1 180px",marginTop:0,color:"#b42318",background:"#fff1f2"}} onClick={deleteAppearance}>❌ Delete Wallpaper</button>}
</div></form><form className="adminBox" onSubmit={saveSocial}><h3>📲 Social Links</h3><input className="adminInput" placeholder="WhatsApp" value={social.whatsapp} onChange={e=>setSocial({...social,whatsapp:e.target.value})}/><input className="adminInput" placeholder="Facebook" value={social.facebook} onChange={e=>setSocial({...social,facebook:e.target.value})}/><input className="adminInput" placeholder="Instagram" value={social.instagram} onChange={e=>setSocial({...social,instagram:e.target.value})}/><button className="primaryAction">💾 Social Save →</button></form></>}
  </section></main>;
}
