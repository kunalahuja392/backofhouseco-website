// Back of House Co — public website: shared header/footer, Supabase client, cart, auth helpers
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://gqusbphanvsqrieyhluo.supabase.co";
export const SUPABASE_KEY = "sb_publishable_j_Y5qB_cpUn8g2axpwW3tw_Ujbrp7lY";
export const PORTAL = "https://ordering.backofhouseco.in/";
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const num = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 3 });

export function toast(msg, err = false) {
  const t = document.createElement("div");
  t.className = "toast" + (err ? " err" : ""); t.textContent = msg;
  document.body.append(t); setTimeout(() => t.remove(), 3800);
}
export async function q(p) {
  const { data, error } = await p;
  if (error) { toast(error.message, true); throw error; }
  return data;
}

// ------------------------------------------------------------- site info (contact details, shop settings)
let infoP = null;
export const siteInfo = () => (infoP ||= sb.rpc("boh_site_info").then((r) => r.data || {}).catch(() => ({})));

// ------------------------------------------------------------- cart (localStorage: {listing_id: qty}) + cached product data
const CK = "boh_shop_cart";
export const cart = {
  get() { try { return JSON.parse(localStorage.getItem(CK) || "{}"); } catch { return {}; } },
  set(c) { try { localStorage.setItem(CK, JSON.stringify(c)); } catch {} cart.badge(); },
  add(id, qty) { const c = cart.get(); c[id] = Math.round(((c[id] || 0) + qty) * 1000) / 1000; cart.set(c); },
  put(id, qty) { const c = cart.get(); if (qty > 0) c[id] = qty; else delete c[id]; cart.set(c); },
  clear() { cart.set({}); },
  count() { return Object.keys(cart.get()).length; },
  badge() { const b = $("#cartCount"); if (b) { const n = cart.count(); b.textContent = n; b.classList.toggle("hidden", !n); } },
};

// ------------------------------------------------------------- layout
const NAV = [["index.html", "Home"], ["services.html", "Services"], ["shop.html", "Shop"], ["vendors.html", "Sell with us"], ["index.html#contact", "Contact"]];
export function layout(active) {
  const here = location.pathname.split("/").pop() || "index.html";
  document.body.insertAdjacentHTML("afterbegin", `
  <header class="top"><div class="wrap">
    <a class="logo" href="index.html"><span class="mark">B</span>Back of House Co</a>
    <nav class="menu" id="menu">
      ${NAV.map(([h, t]) => `<a href="${h}" class="${h === here || t === active ? "on" : ""}">${t}</a>`).join("")}
      <a href="account.html" id="acct">My account</a>
      <a href="${PORTAL}" class="btn sm">Client login</a>
      <a href="shop.html#cart" class="cart-link" id="cartBtn" aria-label="Cart">🛒<span class="cart-count hidden" id="cartCount">0</span></a>
    </nav>
    <button class="burger" id="burger" aria-label="Menu">☰</button>
  </div></header>`);
  document.body.insertAdjacentHTML("beforeend", `
  <footer><div class="wrap">
    <div class="cols">
      <div><a class="logo" href="index.html"><span class="mark">B</span>Back of House Co</a>
        <p style="margin-top:1rem;max-width:22rem">Everything your kitchen runs on — sourced, priced and delivered by one team. Order before 4 PM, delivered tomorrow.</p></div>
      <div><h4>Services</h4><a href="services.html#supplies">Supplies & procurement</a><a href="services.html#equipment">Kitchen equipment & setup</a>
        <a href="services.html#packaging">Packaging & disposables</a><a href="services.html#sourcing">Vendor sourcing & savings</a><a href="services.html#consulting">Consulting</a></div>
      <div><h4>Company</h4><a href="shop.html">Online shop</a><a href="vendors.html">Become a vendor</a><a href="${PORTAL}">Client login</a><a href="account.html">My shop orders</a></div>
      <div><h4>Talk to us</h4><div id="fContact"></div></div>
    </div>
    <div class="base"><span>© ${new Date().getFullYear()} Back of House Co</span><span>Supplies · Equipment · Packaging · Consulting</span></div>
  </div></footer>`);
  $("#burger").onclick = () => $("#menu").classList.toggle("open");
  cart.badge();
  siteInfo().then((s) => {
    $("#fContact").innerHTML = [s.phone && `<a href="tel:${esc(s.phone)}">📞 ${esc(s.phone)}</a>`, s.email && `<a href="mailto:${esc(s.email)}">✉️ ${esc(s.email)}</a>`,
      s.whatsapp && `<a href="https://wa.me/${esc(String(s.whatsapp).replace(/\D/g, ""))}" target="_blank" rel="noopener">💬 WhatsApp us</a>`, s.address && `<span>${esc(s.address)}</span>`]
      .filter(Boolean).join("") || `<a href="index.html#contact">Send us a message</a>`;
    if (s.whatsapp && !$(".wa-float")) document.body.insertAdjacentHTML("beforeend", `<a class="wa-float" href="https://wa.me/${esc(String(s.whatsapp).replace(/\D/g, ""))}" target="_blank" rel="noopener" aria-label="WhatsApp">💬</a>`);
    if (!s.shop_enabled) $$('a[href="shop.html"]').forEach((a) => a.dataset.closed = "1");
  });
  // reveal on scroll
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 }) : null;
  $$(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
}

// ------------------------------------------------------------- modal
export function modal(html, cls = "") {
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.innerHTML = `<div class="modal ${cls}"><button class="x" aria-label="Close">×</button>${html}</div>`;
  const close = () => bg.remove();
  bg.querySelector(".x").onclick = close;
  bg.addEventListener("mousedown", (e) => { if (e.target === bg) close(); });
  document.body.append(bg);
  return { el: bg, close };
}

// ------------------------------------------------------------- website lead (contact / service enquiry)
export function bindLeadForm(form, service = "") {
  if (!form) return;
  if (service && form.service) form.service.value = service;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    if (f.website) return; // bot trap
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
    const { error } = await sb.rpc("boh_submit_lead", { p_name: f.name, p_phone: f.phone, p_email: f.email || null, p_company: f.company || null,
      p_city: f.city || null, p_service: f.service || null, p_message: f.message || null });
    btn.disabled = false;
    if (error) return toast(error.message, true);
    form.innerHTML = `<div class="note full" style="grid-column:1/-1"><b>Thank you, ${esc(f.name)}!</b> Our team will call you on ${esc(f.phone)} shortly.</div>`;
  };
}

export const SERVICES = ["Supplies & procurement", "Kitchen equipment & setup", "Packaging & disposables", "Vendor sourcing & cost saving", "Consulting", "Online shop order", "Other"];
export const leadFormHTML = (title = "Tell us what you need") => `
  <form class="form" id="lead" autocomplete="on">
    <div class="full"><h3>${title}</h3><p class="muted small">We usually call back within a few working hours.</p></div>
    <div><label>Your name *</label><input name="name" required maxlength="120"></div>
    <div><label>Phone / WhatsApp *</label><input name="phone" type="tel" required></div>
    <div><label>Restaurant / company</label><input name="company"></div>
    <div><label>City</label><input name="city"></div>
    <div><label>Email</label><input name="email" type="email"></div>
    <div><label>I'm interested in</label><select name="service">${SERVICES.map((s) => `<option>${s}</option>`).join("")}</select></div>
    <div class="full"><label>Message</label><textarea name="message" rows="3" maxlength="2000" placeholder="Outlet type, how many outlets, what you buy today…"></textarea></div>
    <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-5000px" aria-hidden="true">
    <div class="full"><button class="btn primary" type="submit">Send enquiry →</button></div>
  </form>`;

// ------------------------------------------------------------- auth
export async function session() { return (await sb.auth.getSession()).data.session; }
export async function me() {
  const s = await session(); if (!s) return null;
  const { data } = await sb.from("boh_users").select("id, full_name, email, phone, role, active").eq("id", s.user.id).maybeSingle();
  return data;
}

export function authBox(box, { onDone, type = "shopper", title = "Sign in to continue" } = {}) {
  let mode = "in";
  const draw = () => {
    box.innerHTML = `<div class="card" style="max-width:480px">
      <h3>${mode === "in" ? title : type === "vendor" ? "Register as a vendor" : "Create your account"}</h3>
      <form class="form" id="af" style="grid-template-columns:1fr">
        ${mode === "up" ? `<div><label>Your name *</label><input name="full_name" required></div>
          <div><label>Phone / WhatsApp *</label><input name="phone" type="tel" required></div>
          <div><label>Business name ${type === "vendor" ? "*" : "(optional)"}</label><input name="business_name" ${type === "vendor" ? "required" : ""}></div>` : ""}
        <div><label>Email *</label><input name="email" type="email" required autocomplete="email"></div>
        <div><label>Password *</label><input name="password" type="password" required minlength="8" autocomplete="${mode === "in" ? "current-password" : "new-password"}"></div>
        <button class="btn primary" type="submit">${mode === "in" ? "Sign in" : "Create account"}</button>
        <p class="small muted">${mode === "in" ? `New here? <a href="#" id="sw">Create an account</a> · <a href="#" id="fp">Forgot password?</a>` : `Already have an account? <a href="#" id="sw">Sign in</a>`}</p>
      </form></div>`;
    $("#sw", box).onclick = (e) => { e.preventDefault(); mode = mode === "in" ? "up" : "in"; draw(); };
    $("#fp", box)?.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = $("[name=email]", box).value.trim(); if (!email) return toast("Type your email first", true);
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: PORTAL });
      error ? toast(error.message, true) : toast("Password reset link sent — check your email");
    });
    $("#af", box).onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const btn = e.target.querySelector("button"); btn.disabled = true;
      try {
        if (mode === "in") {
          const { error } = await sb.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
          if (error) throw error;
        } else {
          const { data, error } = await sb.auth.signUp({ email: f.email.trim(), password: f.password,
            options: { emailRedirectTo: location.origin + location.pathname, data: { signup_type: type, full_name: f.full_name, phone: f.phone, business_name: f.business_name || "" } } });
          if (error) throw error;
          if (!data.session) {
            box.innerHTML = `<div class="card note" style="max-width:480px"><b>Check your email.</b> We've sent a confirmation link to ${esc(f.email)}. Open it, then come back and sign in.</div>`;
            return;
          }
        }
        onDone?.();
      } catch (err) { toast(err.message, true); btn.disabled = false; }
    };
  };
  draw();
}
