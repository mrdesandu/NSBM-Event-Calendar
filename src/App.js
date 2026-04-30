import { useState, useMemo, useEffect } from "react";

const MOCK_USERS = [
  { id: 1, name: "Kavinda Perera",      email: "student@nsbm.lk",   password: "123", role: "student",   avatar: "KP" },
  { id: 2, name: "Dilini Silva",       email: "president@nsbm.lk", password: "123", role: "president", club: "NSBM Computing Society", avatar: "DS" },
  { id: 3, name: "Dr. Rohan Fernando", email: "lecturer@nsbm.lk",  password: "123", role: "lecturer",  avatar: "RF" },
  { id: 4, name: "Kasun Kalhara",      email: "kasun@nsbm.lk",     password: "123", role: "student",    club: "NSBM Music Club", avatar: "KK" },
];

const CAT = {
  Technology: { bg: "#022c22", accent: "#10b981", text: "#6ee7b7" },
  Academic:   { bg: "#0c1e3a", accent: "#3b82f6", text: "#93c5fd" },
  Cultural:   { bg: "#2c1000", accent: "#f59e0b", text: "#fcd34d" },
  Workshop:   { bg: "#1e0a3a", accent: "#a855f7", text: "#d8b4fe" },
  Sports:     { bg: "#2c0505", accent: "#ef4444", text: "#fca5a5" },
  Career:     { bg: "#052030", accent: "#0ea5e9", text: "#7dd3fc" },
  Other:      { bg: "#1a1f2e", accent: "#9ca3af", text: "#d1d5db" },
};
const CATS = Object.keys(CAT);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WDAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const fmt12 = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
};
const fmtDate = (s) => {
  if (!s) return "";
  const [y, mo, d] = s.split("-").map(Number);
  return `${MONTHS[mo - 1]} ${d}, ${y}`;
};

const INITIAL_EVENTS = [
  {
    id:1, title:"Tech Innovators Hackathon", date:"2026-04-05",
    startTime:"08:00", endTime:"20:00", location:"FOT Main Hall, Block D",
    description:"24-hour hackathon open to all NSBM students. Form teams of 3–5 and build innovative solutions for real-world challenges. Cash prizes worth Rs. 150,000! Meals and refreshments provided throughout.",
    type:"paid", ticketPrice:500, totalSeats:80,
    bookedBy:[{userId:99,name:"Test Student",bookedAt:"2026-03-20"}],
    goingUsers:[99], organizer:"NSBM Computing Society", organizerUserId:2, coAdmins: [3], pendingInvites: [], category:"Technology",
  },
  {
    id:2, title:"Faculty Orientation Day", date:"2026-04-10",
    startTime:"09:00", endTime:"13:00", location:"NSBM Main Auditorium",
    description:"Welcome orientation for all new students joining NSBM Green University. Meet your faculty heads, tour campus facilities, and connect with senior students and mentors.",
    type:"free", totalSeats:null, bookedBy:[], goingUsers:[],
    organizer:"Dr. Rohan Fernando", organizerUserId:3, coAdmins: [], pendingInvites: [], category:"Academic",
  }
];

const inp = { width:"100%", background:"#1f2937", border:"1px solid #374151", borderRadius:8, padding:"10px 14px", color:"#f1f5f9", fontSize:14, boxSizing:"border-box", outline:"none" };
const lbl = { display:"block", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 };

export default function NSBMEvents() {
  const [user, setUser] = useState(null);
  
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("nsbm_events_db_v6");
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });
  useEffect(() => {
    localStorage.setItem("nsbm_events_db_v6", JSON.stringify(events));
  }, [events]);

  const [calDate,  setCalDate]  = useState(new Date(2026, 3, 1));
  const [selEv,    setSelEv]    = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [showNotif, setShowNotif] = useState(false); // For Notification Modal
  const [tab,      setTab]      = useState("calendar");
  const [loginErr, setLoginErr] = useState("");
  const [lEmail,   setLEmail]   = useState("student@nsbm.lk");
  const [lPass,    setLPass]    = useState("123");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  const defaultForm = {
    title:"", date:"", startTime:"09:00", endTime:"17:00",
    location:"", description:"", category:"Technology",
    type:"free", ticketPrice:"", totalSeats:"", coAdmins: [], pendingInvites: []
  };
  const [addForm, setAddForm] = useState(defaultForm);
  const [formErr, setFormErr] = useState("");
  const [invEmail, setInvEmail] = useState(""); // Input for invite email

  const yr  = calDate.getFullYear();
  const mo  = calDate.getMonth();
  const dim = new Date(yr, mo + 1, 0).getDate();
  const fd  = new Date(yr, mo, 1).getDay();

  const calCells = useMemo(() => {
    const cells = Array(fd).fill(null);
    for (let d = 1; d <= dim; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [yr, mo, dim, fd]);

  const ds = (d) => `${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCat === "All" || e.category === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [events, searchQuery, selectedCat]);

  const evDay   = (d) => d ? filteredEvents.filter(e => e.date === ds(d)) : [];
  const booked  = (ev) => ev.bookedBy.some(b => b.userId === user?.id);
  const going   = (ev) => ev.goingUsers.includes(user?.id);
  const sold    = (ev) => ev.type === "paid" && ev.totalSeats && ev.bookedBy.length >= ev.totalSeats;
  const seats   = (ev) => ev.totalSeats ? ev.totalSeats - ev.bookedBy.length : null;
  const canAdd  = user && (user.role === "president" || user.role === "lecturer");
  const isToday = (d) => d && ds(d) === "2026-04-30";

  // Identify notifications (events where the logged-in user's email is in pendingInvites)
  const myInvites = events.filter(e => e.pendingInvites?.includes(user?.email));

  const login = () => {
    const u = MOCK_USERS.find(u => u.email === lEmail && u.password === lPass);
    if (u) { setUser(u); setLoginErr(""); }
    else setLoginErr("Invalid credentials. Check the demo hints below.");
  };

  const updEv = (id, fn) => {
    setEvents(p => p.map(e => e.id === id ? fn(e) : e));
    setSelEv(p => p && p.id === id ? fn(p) : p);
  };

  // Notification Actions
  const handleAcceptInvite = (evId) => {
    updEv(evId, e => ({
        ...e,
        pendingInvites: e.pendingInvites.filter(email => email !== user.email),
        coAdmins: [...(e.coAdmins || []), user.id]
    }));
  };

  const handleDeclineInvite = (evId) => {
    updEv(evId, e => ({
        ...e,
        pendingInvites: e.pendingInvites.filter(email => email !== user.email)
    }));
  };

  const toggleGoing = (evId) => updEv(evId, e => ({
    ...e,
    goingUsers: e.goingUsers.includes(user.id) ? e.goingUsers.filter(i => i !== user.id) : [...e.goingUsers, user.id],
  }));

  const bookTicket = (evId) => {
    const ev = events.find(e => e.id === evId);
    if (!ev || booked(ev) || sold(ev)) return;
    const entry = { userId: user.id, name: user.name, bookedAt: "2026-04-30" };
    updEv(evId, e => ({ ...e, bookedBy: [...e.bookedBy, entry], goingUsers: [...new Set([...e.goingUsers, user.id])] }));
    window.open("https://nsbm.ac.lk", "_blank");
  };

  const openAddModal = () => {
    setFormErr("");
    setInvEmail("");
    setEditId(null);
    setAddForm(defaultForm);
    setShowAdd(true);
  };

  const openEditModal = (ev) => {
    setFormErr("");
    setInvEmail("");
    setEditId(ev.id);
    setAddForm({
      title: ev.title, date: ev.date, startTime: ev.startTime, endTime: ev.endTime,
      location: ev.location, description: ev.description, category: ev.category,
      type: ev.type, ticketPrice: ev.ticketPrice || "", totalSeats: ev.totalSeats || "",
      coAdmins: ev.coAdmins || [], pendingInvites: ev.pendingInvites || []
    });
    setShowAdd(true);
  };

  const handleAddInvite = () => {
    setFormErr("");
    const emailToInvite = invEmail.trim().toLowerCase();
    if(!emailToInvite) return;
    
    const targetUser = MOCK_USERS.find(u => u.email.toLowerCase() === emailToInvite);
    if(!targetUser) return setFormErr("User email not found in the system.");
    if(targetUser.id === user.id) return setFormErr("You cannot invite yourself.");
    if(addForm.coAdmins.includes(targetUser.id)) return setFormErr("User is already an active co-admin.");
    if(addForm.pendingInvites.includes(targetUser.email)) return setFormErr("Invitation already sent to this email.");

    setAddForm(p => ({ ...p, pendingInvites: [...p.pendingInvites, targetUser.email] }));
    setInvEmail(""); // Clear input
  };

  const submitAdd = () => {
    setFormErr("");
    if (!addForm.title.trim()) return setFormErr("Event Title is required.");
    if (!addForm.date) return setFormErr("Event Date is required.");
    if (addForm.startTime >= addForm.endTime) return setFormErr("End time must be after start time.");
    if (addForm.type === "paid" && (!addForm.ticketPrice || addForm.ticketPrice <= 0)) return setFormErr("Please enter a valid ticket price.");

    if (editId) {
        setEvents(p => p.map(e => e.id === editId ? {
            ...e, ...addForm,
            ticketPrice: addForm.type === "paid" ? Number(addForm.ticketPrice) : null,
            totalSeats:  addForm.type === "paid" ? Number(addForm.totalSeats)  : null,
        } : e));
    } else {
        const newEv = {
            id: Date.now(), ...addForm,
            ticketPrice: addForm.type === "paid" ? Number(addForm.ticketPrice) : null,
            totalSeats:  addForm.type === "paid" ? Number(addForm.totalSeats)  : null,
            bookedBy: [], goingUsers: [],
            organizer: user.club || user.name,
            organizerUserId: user.id,
        };
        setEvents(p => [...p, newEv]);
    }
    setShowAdd(false);
    setAddForm(defaultForm);
  };

  const af = (f) => (e) => setAddForm(p => ({ ...p, [f]: e.target.value }));

  const myEvs  = events.filter(e => booked(e) || going(e));
  const orgEvs = events.filter(e => e.organizerUserId === user?.id || (e.coAdmins && e.coAdmins.includes(user?.id)));
  
  const roleLabel = { student:"Student", president:"Club President", lecturer:"Lecturer" };
  const roleColor = { student:"#10b981", president:"#a855f7", lecturer:"#0ea5e9" };

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  if (!user) return (
    <div style={{ fontFamily:"system-ui,-apple-system,sans-serif", background:"#0b1120", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#10b981,#059669)", margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>🎓</div>
          <div style={{ fontSize:24, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.02em" }}>NSBM Events</div>
          <div style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>Green University Event Portal</div>
        </div>
        <div style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:16, padding:"2rem" }}>
          <div style={{ marginBottom:"1rem" }}>
            <label style={lbl}>Email Address</label>
            <input value={lEmail} onChange={e=>setLEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} style={inp} placeholder="you@nsbm.lk" />
          </div>
          <div style={{ marginBottom:"1.25rem" }}>
            <label style={lbl}>Password</label>
            <input type="password" value={lPass} onChange={e=>setLPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} style={inp} />
          </div>
          {loginErr && <div style={{ background:"#2c0a0a", border:"1px solid #7f1d1d", borderRadius:8, padding:"8px 12px", color:"#f87171", fontSize:13, marginBottom:"1rem" }}>{loginErr}</div>}
          <button onClick={login} style={{ width:"100%", background:"#10b981", border:"none", borderRadius:8, padding:"13px", color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer" }}>Sign In →</button>
          <div style={{ background:"#0d1526", borderRadius:10, padding:"12px 14px", marginTop:"1.25rem", fontSize:12, lineHeight:1.9 }}>
            <div style={{ fontWeight:700, color:"#9ca3af", marginBottom:4 }}>Demo Accounts (password: 123)</div>
            <div style={{ color:"#6b7280" }}>🎓 <span style={{color:"#a3b4c6",fontWeight:600}}>student@nsbm.lk</span> — View & join events</div>
            <div style={{ color:"#6b7280" }}>🏆 <span style={{color:"#a3b4c6",fontWeight:600}}>president@nsbm.lk</span> — President</div>
            <div style={{ color:"#6b7280" }}>📚 <span style={{color:"#a3b4c6",fontWeight:600}}>lecturer@nsbm.lk</span> — Lecturer</div>
            <div style={{ color:"#6b7280" }}>🎓 <span style={{color:"#a3b4c6",fontWeight:600}}>kasun@nsbm.lk</span> — Student to invite</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── MAIN APP ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"system-ui,-apple-system,sans-serif", background:"#0b1120", minHeight:"100vh", color:"#f1f5f9" }}>

      {/* HEADER */}
      <div style={{ background:"#0d1526", borderBottom:"1px solid #1f2937", padding:"0 1.5rem", display:"flex", alignItems:"center", gap:"0.75rem", height:60, position:"sticky", top:0, zIndex:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:"#10b981", letterSpacing:"-0.02em", marginRight:4, whiteSpace:"nowrap" }}>NSBM Events</div>
        <div style={{ display:"flex", gap:4, flex:1, overflowX:"auto" }}>
          {[["calendar","📅 Calendar"],["myEvents","🎫 My Events"],...(canAdd?[["orgDash","📊 My Organised"]]:[])]
            .map(([v,lbl]) => (
              <button key={v} onClick={()=>setTab(v)} style={{ padding:"6px 14px", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer", background:tab===v?"#10b981":"transparent", color:tab===v?"#fff":"#9ca3af", border:"none", whiteSpace:"nowrap", flexShrink:0 }}>{lbl}</button>
            ))}
        </div>
        {canAdd && (
          <button onClick={openAddModal} style={{ background:"#10b981", border:"none", borderRadius:8, padding:"8px 16px", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>+ Add Event</button>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:15, flexShrink:0, paddingLeft: 10 }}>
          {/* NOTIFICATION BELL */}
          <button onClick={()=>setShowNotif(true)} style={{ position:"relative", background:"transparent", border:"none", fontSize:20, cursor:"pointer", padding:0, display:"flex" }}>
            🔔
            {myInvites.length > 0 && (
                <span style={{ position:"absolute", top:-6, right:-6, background:"#ef4444", color:"#fff", fontSize:10, fontWeight:800, width:18, height:18, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {myInvites.length}
                </span>
            )}
          </button>
          <div style={{width:"1px", height:"24px", background:"#374151"}}></div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:roleColor[user.role], display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>{user.avatar}</div>
            <div style={{ fontSize:13 }}>
                <div style={{ fontWeight:600, color:"#e2e8f0", lineHeight:1.2 }}>{user.name.split(" ")[0]}</div>
                <div style={{ fontSize:11, color:roleColor[user.role] }}>{roleLabel[user.role]}</div>
            </div>
          </div>
          <button onClick={()=>{setUser(null);setTab("calendar");}} style={{ background:"transparent", border:"1px solid #374151", borderRadius:8, padding:"5px 12px", color:"#9ca3af", fontSize:12, cursor:"pointer", marginLeft:2 }}>Out</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding:"1.5rem", maxWidth:1100, margin:"0 auto" }}>
        {tab === "calendar" && (
          <div>
            <div style={{ display:"flex", gap:10, marginBottom:"1.5rem" }}>
                <input placeholder="Search events..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{ ...inp, flex:2 }} />
                <select value={selectedCat} onChange={e=>setSelectedCat(e.target.value)} style={{ ...inp, flex:1 }}>
                    <option value="All">All Categories</option>
                    {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.5rem" }}>
              <button onClick={()=>setCalDate(new Date(yr,mo-1,1))} style={{ background:"#1f2937", border:"1px solid #374151", borderRadius:8, width:36, height:36, cursor:"pointer", color:"#9ca3af", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>‹</button>
              <div style={{ fontSize:24, fontWeight:800, letterSpacing:"-0.02em", flex:1 }}>{MONTHS[mo]} {yr}</div>
              <button onClick={()=>setCalDate(new Date(yr,mo+1,1))} style={{ background:"#1f2937", border:"1px solid #374151", borderRadius:8, width:36, height:36, cursor:"pointer", color:"#9ca3af", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>›</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:2 }}>
              {WDAYS.map(d=>(
                <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.08em", padding:"6px 0" }}>{d}</div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
              {calCells.map((day,i) => {
                const dayEvs = evDay(day);
                const today  = isToday(day);
                return (
                  <div key={i} style={{ background:!day?"transparent":today?"#0d2a1e":"#111827", minHeight:100, borderRadius:8, padding:"6px 7px", border:today?"1.5px solid #10b981":"1px solid #1f2937" }}>
                    {day && (
                      <>
                        <div style={{ fontSize:12, fontWeight:today?700:400, color:today?"#10b981":"#6b7280", marginBottom:3 }}>{day}</div>
                        {dayEvs.slice(0,3).map(ev => (
                          <div key={ev.id} onClick={()=>setSelEv(ev)}
                            style={{ background:CAT[ev.category]?.bg||"#1f2937", color:CAT[ev.category]?.text||"#d1d5db", borderRadius:4, padding:"2px 6px", fontSize:11, fontWeight:500, marginBottom:2, cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvs.length > 3 && <div style={{ fontSize:10, color:"#6b7280" }}>+{dayEvs.length-3} more</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "myEvents" && (
          <div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em", marginBottom:"1.25rem" }}>My Events</div>
            {myEvs.length === 0 ? (
              <div style={{ textAlign:"center", padding:"4rem 2rem", color:"#6b7280" }}>
                <div style={{ fontSize:48, marginBottom:14 }}>📅</div>
                <div style={{ fontSize:16, fontWeight:600, color:"#9ca3af" }}>No events yet</div>
              </div>
            ) : myEvs.map(ev => (
              <div key={ev.id} onClick={()=>setSelEv(ev)} style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:12, padding:"1rem 1.25rem", marginBottom:"0.75rem", display:"flex", alignItems:"flex-start", gap:"1rem", cursor:"pointer" }}>
                <div style={{ width:4, borderRadius:4, alignSelf:"stretch", background:CAT[ev.category]?.accent||"#9ca3af", flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                    <div style={{ fontWeight:600, fontSize:15 }}>{ev.title}</div>
                    {booked(ev) && <span style={{ background:"#0ea5e922",color:"#7dd3fc",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,border:"1px solid #0ea5e944",whiteSpace:"nowrap" }}>TICKET BOOKED</span>}
                  </div>
                  <div style={{ fontSize:13, color:"#6b7280" }}>{fmtDate(ev.date)} · {fmt12(ev.startTime)} · {ev.location}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "orgDash" && canAdd && (
          <div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em", marginBottom:"1.25rem" }}>My Organised Events</div>
            {orgEvs.length === 0 ? (
              <div style={{ textAlign:"center", padding:"4rem 2rem", color:"#6b7280" }}>
                <div style={{ fontSize:48, marginBottom:14 }}>🗂</div>
                <div style={{ fontSize:16, fontWeight:600, color:"#9ca3af" }}>No events created yet</div>
              </div>
            ) : orgEvs.map(ev => (
              <div key={ev.id} style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:12, padding:"1.25rem", marginBottom:"1rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                  <div style={{ fontWeight:700, fontSize:16, flex:1 }}>{ev.title}</div>
                  <span style={{ background:CAT[ev.category]?.bg||"#1f2937", color:CAT[ev.category]?.text||"#d1d5db", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:6, border:`1px solid ${CAT[ev.category]?.accent||"#9ca3af"}33`, whiteSpace:"nowrap" }}>{ev.category}</span>
                  <span style={{ background:ev.type==="paid"?"#1e0a3a":"#022c22", color:ev.type==="paid"?"#d8b4fe":"#6ee7b7", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:6, whiteSpace:"nowrap" }}>{ev.type==="paid"?"Paid Event":"Free Event"}</span>
                  <button onClick={() => openEditModal(ev)} style={{ background:"transparent", border:"1px solid #374151", color:"#9ca3af", padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer" }}>✏️ Edit</button>
                </div>
                <div style={{ fontSize:13, color:"#6b7280", marginBottom:"1rem" }}>{fmtDate(ev.date)} · {fmt12(ev.startTime)} – {fmt12(ev.endTime)} · {ev.location}</div>
                {ev.type === "paid" && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8, marginBottom:"1rem" }}>
                    {[
                      ["Ticket Price", `Rs. ${ev.ticketPrice}`, "#10b981"],
                      ["Total Seats", ev.totalSeats, "#9ca3af"],
                      ["Booked", `${ev.bookedBy.length} / ${ev.totalSeats}`, ev.bookedBy.length>=ev.totalSeats?"#ef4444":"#10b981"],
                    ].map(([l,v,c])=>(
                      <div key={l} style={{ background:"#0b1120", borderRadius:8, padding:"10px 12px" }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>{l}</div>
                        <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
                {ev.bookedBy.length > 0 && (
                  <>
                    <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
                      Ticket Holders ({ev.bookedBy.length})
                    </div>
                    <div style={{ maxHeight:180, overflowY:"auto", display:"flex", flexDirection:"column", gap:3 }}>
                      {ev.bookedBy.slice(0,30).map((b,i)=>(
                        <div key={i} style={{ background:"#0b1120", borderRadius:6, padding:"6px 10px", fontSize:12, color:"#9ca3af", display:"flex", justifyContent:"space-between" }}>
                          <span>{b.name}</span><span style={{color:"#6b7280"}}>{b.bookedAt}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── NOTIFICATION MODAL ── */}
      {showNotif && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowNotif(false);}} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:60, padding:"1rem" }}>
          <div style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:16, width:"100%", maxWidth:450, padding:"1.5rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
                <h3 style={{ margin:0, fontSize:18, fontWeight:800 }}>Notifications</h3>
                <button onClick={()=>setShowNotif(false)} style={{ background:"transparent", border:"none", color:"#9ca3af", fontSize:18, cursor:"pointer" }}>✕</button>
            </div>
            
            {myInvites.length === 0 ? (
                <div style={{ textAlign:"center", padding:"2rem 0", color:"#6b7280", fontSize:14 }}>No new notifications.</div>
            ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {myInvites.map(ev => (
                        <div key={ev.id} style={{ background:"#1f2937", padding:"1rem", borderRadius:12 }}>
                            <div style={{ fontSize:14, color:"#e2e8f0", lineHeight:1.5, marginBottom:"1rem" }}>
                                <b>{ev.organizer}</b> invited you to be a Co-Organizer for the event <span style={{ color:"#10b981", fontWeight:600 }}>"{ev.title}"</span>.
                            </div>
                            <div style={{ display:"flex", gap:10 }}>
                                <button onClick={()=>handleAcceptInvite(ev.id)} style={{ flex:1, background:"#10b981", color:"#fff", border:"none", padding:"8px", borderRadius:8, fontWeight:700, cursor:"pointer" }}>Accept</button>
                                <button onClick={()=>handleDeclineInvite(ev.id)} style={{ flex:1, background:"transparent", color:"#fca5a5", border:"1px solid #7f1d1d", padding:"8px", borderRadius:8, fontWeight:700, cursor:"pointer" }}>Decline</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      )}

      {/* ── EVENT DETAIL MODAL ── */}
      {selEv && (
        <div onClick={e=>{if(e.target===e.currentTarget)setSelEv(null);}} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:"1rem" }}>
          <div style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:16, width:"100%", maxWidth:580, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ background:CAT[selEv.category]?.bg||"#1f2937", padding:"1.5rem", borderRadius:"16px 16px 0 0", borderBottom:`2px solid ${CAT[selEv.category]?.accent||"#9ca3af"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <span style={{ background:`${CAT[selEv.category]?.accent||"#9ca3af"}22`, color:CAT[selEv.category]?.text, border:`1px solid ${CAT[selEv.category]?.accent||"#9ca3af"}44`, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, textTransform:"uppercase" }}>{selEv.category}</span>
                <button onClick={()=>setSelEv(null)} style={{ background:"rgba(0,0,0,0.3)", border:"none", color:"#9ca3af", fontSize:18, cursor:"pointer", borderRadius:6, width:30, height:30 }}>✕</button>
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:"#f1f5f9", marginBottom:6 }}>{selEv.title}</div>
              <div style={{ fontSize:13, color:CAT[selEv.category]?.text||"#d1d5db" }}>Organised by {selEv.organizer}</div>
            </div>

            <div style={{ padding:"1.25rem" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:"1rem" }}>
                {[
                  ["📅 Date", fmtDate(selEv.date)],
                  ["⏰ Time", `${fmt12(selEv.startTime)} – ${fmt12(selEv.endTime)}`],
                  ["📍 Venue", selEv.location],
                  ["👤 Organiser", selEv.organizer],
                ].map(([l,v])=>(
                  <div key={l} style={{ background:"#1a2035", borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:500 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:14, color:"#9ca3af", lineHeight:1.75, marginBottom:"1.25rem" }}>{selEv.description}</div>

              {selEv.type === "paid" && (
                <div style={{ background:"#1a2035", borderRadius:10, padding:"1rem", marginBottom:"1rem" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", marginBottom:10 }}>Ticket Information</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:26, fontWeight:800, color:sold(selEv)?"#ef4444":"#f1f5f9" }}>Rs. {selEv.ticketPrice}</div>
                      {!sold(selEv) && <div style={{ fontSize:13, color:"#9ca3af", marginTop:2 }}><span style={{ color:"#10b981", fontWeight:700 }}>{seats(selEv)} seats</span> left of {selEv.totalSeats}</div>}
                    </div>
                    {sold(selEv) && !booked(selEv) && <div style={{ background:"#1c0f0f", border:"1px solid #7f1d1d", borderRadius:8, padding:"7px 16px", color:"#ef4444", fontWeight:800, fontSize:13 }}>🚫 SOLD OUT</div>}
                    {booked(selEv) && <div style={{ background:"#022c22", border:"1px solid #10b981", borderRadius:8, padding:"7px 16px", color:"#10b981", fontWeight:800, fontSize:13 }}>✓ BOOKED</div>}
                  </div>
                </div>
              )}

              <div style={{ display:"flex", gap:"0.75rem" }}>
                {selEv.type === "paid" && !booked(selEv) && !sold(selEv) && (
                  <button onClick={()=>bookTicket(selEv.id)} style={{ flex:1, background:"#0ea5e9", border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer" }}>Book Now · Rs. {selEv.ticketPrice} ↗</button>
                )}
                {selEv.type === "paid" && booked(selEv) && (
                  <div style={{ flex:1, background:"#022c22", border:"2px solid #10b981", borderRadius:10, padding:"13px", fontSize:14, fontWeight:700, color:"#10b981", textAlign:"center" }}>✓ Your Ticket is Confirmed</div>
                )}
                {selEv.type === "free" && (
                  <button onClick={()=>toggleGoing(selEv.id)} style={{ flex:1, background:going(selEv)?"#10b981":"#1f2937", border:`1.5px solid ${going(selEv)?"#10b981":"#374151"}`, borderRadius:10, padding:"13px", fontSize:14, fontWeight:700, color:going(selEv)?"#fff":"#9ca3af", cursor:"pointer" }}>{going(selEv) ? "✓ Going — Click to Cancel" : "Mark as Going"}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT EVENT MODAL ── */}
      {showAdd && canAdd && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false);}} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:"1rem" }}>
          <div style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:16, width:"100%", maxWidth:560, maxHeight:"92vh", overflowY:"auto" }}>
            <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #1f2937", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:18, fontWeight:800 }}>{editId ? "Edit Event" : "Create New Event"}</div>
              <button onClick={()=>setShowAdd(false)} style={{ background:"transparent", border:"none", color:"#6b7280", fontSize:20, cursor:"pointer" }}>✕</button>
            </div>
            
            <div style={{ padding:"1.25rem 1.5rem" }}>
              {formErr && <div style={{ background:"#450a0a", border:"1px solid #7f1d1d", color:"#fca5a5", padding:"10px 12px", borderRadius:8, marginBottom:"1rem", fontSize:13 }}>⚠️ {formErr}</div>}

              <div style={{ marginBottom:"1rem" }}>
                <label style={lbl}>Event Title *</label>
                <input value={addForm.title} onChange={af("title")} style={inp} placeholder="e.g. Annual Hackathon 2026" />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:"1rem" }}>
                {[["Date *","date","date"],["Start Time","startTime","time"],["End Time","endTime","time"]].map(([lb,field,type])=>(
                  <div key={field}>
                    <label style={lbl}>{lb}</label>
                    <input type={type} value={addForm[field]} onChange={af(field)} style={inp} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:"1rem" }}>
                <label style={lbl}>Location</label>
                <input value={addForm.location} onChange={af("location")} style={inp} placeholder="e.g. NSBM Auditorium" />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:"1rem" }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={addForm.category} onChange={af("category")} style={{ ...inp }}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label style={lbl}>Event Type</label>
                  <select value={addForm.type} onChange={af("type")} style={{ ...inp }}>
                    <option value="free">Free Event</option><option value="paid">Paid (Tickets)</option>
                  </select>
                </div>
              </div>
              {addForm.type === "paid" && (
                <div style={{ background:"#1a2035", borderRadius:10, padding:"1rem", marginBottom:"1rem" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#6b7280", textTransform:"uppercase", marginBottom:10 }}>Ticket Settings</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {[["Ticket Price (Rs.)","ticketPrice"],["Total Seats","totalSeats"]].map(([lb,field])=>(
                      <div key={field}><label style={lbl}>{lb}</label><input type="number" value={addForm[field]} onChange={af(field)} style={inp} placeholder="0" /></div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom:"1.25rem" }}>
                <label style={lbl}>Description</label>
                <textarea value={addForm.description} onChange={af("description")} rows={3} style={{ ...inp, resize:"vertical", minHeight:80 }} placeholder="Details..." />
              </div>

              {/* EMAIL INVITE CO-ADMINS SECTION */}
              <div style={{ background:"#0b1120", border:"1px solid #1f2937", borderRadius:10, padding:"1rem", marginBottom:"1.5rem" }}>
                  <label style={lbl}>Invite Co-Organizers</label>
                  <div style={{ display:"flex", gap:10, marginBottom: 12 }}>
                      <input value={invEmail} onChange={e=>setInvEmail(e.target.value)} style={{...inp, flex:1}} placeholder="Enter user email (e.g. kasun@nsbm.lk)" />
                      <button type="button" onClick={handleAddInvite} style={{ background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, padding:"0 15px", fontWeight:700, cursor:"pointer" }}>Invite</button>
                  </div>
                  
                  {/* PENDING AND ACCEPTED LIST */}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {addForm.coAdmins.map(id => {
                          const u = MOCK_USERS.find(u=>u.id===id);
                          return <span key={id} style={{ background:"#022c22", border:"1px solid #10b981", color:"#10b981", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600 }}>✓ {u?.name} (Admin)</span>
                      })}
                      {addForm.pendingInvites.map(email => (
                          <span key={email} style={{ background:"#1f2937", border:"1px solid #374151", color:"#d1d5db", padding:"4px 10px", borderRadius:20, fontSize:11, display:"flex", alignItems:"center", gap:6 }}>
                              ⏳ {email}
                              <button type="button" onClick={()=>setAddForm(p=>({...p, pendingInvites: p.pendingInvites.filter(e=>e!==email)}))} style={{ background:"transparent", border:"none", color:"#fca5a5", cursor:"pointer", padding:0, fontSize:12 }}>✕</button>
                          </span>
                      ))}
                      {addForm.coAdmins.length === 0 && addForm.pendingInvites.length === 0 && <span style={{fontSize:12, color:"#6b7280", fontStyle:"italic"}}>No co-organizers added yet.</span>}
                  </div>
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setShowAdd(false)} style={{ flex:1, background:"transparent", border:"1px solid #374151", borderRadius:10, padding:"12px", color:"#9ca3af", fontSize:14, fontWeight:600, cursor:"pointer" }}>Cancel</button>
                <button onClick={submitAdd} style={{ flex:2, background:"#10b981", border:"none", borderRadius:10, padding:"12px", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>{editId ? "Save Changes →" : "Create Event →"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}