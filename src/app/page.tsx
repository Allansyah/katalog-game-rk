"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  LogIn,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Shield,
  Star,
  AlertCircle,
  Loader2,
  LayoutDashboard,
  Sword,
  X,
  Minus,
  Plus,
  Sparkles,
  CheckCircle2,
  Zap,
  Trophy,
  Crown,
  Gem,
  Flame,
  Users,
  Compass,
  Award,
  Gamepad2,
  RefreshCw,
} from "lucide-react"; // Pastikan semua icon yang digunakan ada di sini
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────
interface Game {
  id: string;
  name: string;
  code: string;
  status: boolean;
  icon?: string | null;
  _count?: { accounts: number };
}
interface Character {
  id: string;
  name: string;
  rarity: number;
  element?: string | null;
  imageUrl?: string | null;
}
interface Weapon {
  id: string;
  name: string;
  rarity: number;
  imageUrl?: string | null;
}
interface Server {
  id: string;
  name: string;
  code: string | null;
}
interface FilterItem {
  id: string;
  quantity: number;
}
interface Account {
  id: string;
  publicId: string;
  game: { name: string; code: string };
  level: number | null;
  diamond: number;
  server: { id: string; name: string; code: string | null } | null;
  gender: string | null;
  characters: Array<{
    id: string;
    name: string;
    rarity: number;
    element?: string | null;
    imageUrl?: string | null;
    quantity?: number;
  }>;
  weapons: Array<{
    id: string;
    name: string;
    rarity: number;
    imageUrl?: string | null;
    quantity?: number;
  }>;
  basePrice: number;
  status: string;
  createdAt: string;
}

const DIAMOND_OPTIONS = [
  { label: "Semua Diamond", value: "0" },
  { label: "Min. 1.000", value: "1000" },
  { label: "Min. 5.000", value: "5000" },
  { label: "Min. 10.000", value: "10000" },
  { label: "Min. 20.000", value: "20000" },
  { label: "Min. 50.000", value: "50000" },
  { label: "Min. 100.000", value: "100000" },
];
const LEVEL_OPTIONS = [
  { label: "Semua Level", value: "1" },
  { label: "Min. Lv. 10", value: "10" },
  { label: "Min. Lv. 20", value: "20" },
  { label: "Min. Lv. 30", value: "30" },
  { label: "Min. Lv. 40", value: "40" },
  { label: "Min. Lv. 50", value: "50" },
  { label: "Min. Lv. 60", value: "60" },
  { label: "Min. Lv. 70", value: "70" },
];

// ── Global CSS with Fixed Layout & Enhanced Styling ─────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root{
  --bg:#03050b;
  --bg2:#0a0f1a;
  --bg3:#0f1622;
  --bg-glass:rgba(10,15,26,0.7);
  --pink:#ff4d8c;
  --pink2:#ff1a6b;
  --pink-glow:rgba(255,77,140,0.25);
  --cyan:#2dd4bf;
  --cyan-glow:rgba(45,212,191,0.2);
  --amber:#fbbf24;
  --amber-glow:rgba(251,191,36,0.2);
  --purple:#c084fc;
  --purple-glow:rgba(192,132,252,0.2);
  --emerald:#34d399;
  --t1:#ffffff;
  --t2:#94a3b8;
  --t3:#4b5563;
  --border:rgba(255,255,255,0.08);
  --border-hover:rgba(255,77,140,0.4);
  --glass:rgba(255,255,255,0.02);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  color: var(--t1);
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

/* Main container dengan padding yang benar */
.main-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 640px) {
  .main-container {
    padding: 0 32px;
  }
}

@media (min-width: 1024px) {
  .main-container {
    padding: 0 48px;
  }
}

@media (min-width: 1280px) {
  .main-container {
    padding: 0 64px;
  }
}

.page-bg{
  background:radial-gradient(ellipse at 20% 30%, rgba(255,77,140,0.08) 0%, transparent 60%),
             radial-gradient(ellipse at 80% 70%, rgba(45,212,191,0.05) 0%, transparent 60%),
             linear-gradient(180deg, var(--bg) 0%, #05080f 100%);
  min-height:100vh;
}
.ff-display{font-family:'Space Grotesk',sans-serif;}
.ff-title{font-family:'Plus Jakarta Sans',sans-serif;}
.ff-body{font-family:'Inter',sans-serif;}

/* Animated gradient border */
.gradient-border {
  position: relative;
  background: linear-gradient(135deg, var(--bg3), var(--bg2));
  border-radius: 24px;
}
.gradient-border::before {
  content: '';
  position: absolute;
  inset: -1px;
  background: linear-gradient(135deg, var(--pink), var(--cyan), var(--purple));
  border-radius: 25px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}
.gradient-border:hover::before {
  opacity: 1;
}

/* Glassmorphism */
.glass {
  background: rgba(15,22,34,0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.05);
}

/* Navbar */
.nav{
  position:sticky;
  top:0;
  z-index:100;
  background:rgba(3,5,11,0.85);
  backdrop-filter:blur(20px) saturate(180%);
  border-bottom:1px solid rgba(255,77,140,0.15);
}

.nav-inner{
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (min-width: 640px) {
  .nav-inner {
    padding: 0 32px;
  }
}

@media (min-width: 1024px) {
  .nav-inner {
    padding: 0 48px;
  }
}

/* Orb Effects */
.orb{
  position:fixed;
  border-radius:50%;
  filter:blur(120px);
  pointer-events:none;
  z-index:0;
  animation: float 20s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -20px) scale(1.1); }
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: 80px 0 60px;
}

@media (min-width: 768px) {
  .hero-section {
    padding: 100px 0 80px;
  }
}

.hero-badge{
  display:inline-flex;
  align-items:center;
  gap:8px;
  background:linear-gradient(135deg, rgba(255,77,140,0.15), rgba(45,212,191,0.1));
  border:1px solid rgba(255,77,140,0.25);
  border-radius:100px;
  padding:10px 24px;
  font-family:'Inter',sans-serif;
  font-size:12px;
  font-weight:600;
  letter-spacing:0.05em;
  color:var(--pink);
  text-transform:uppercase;
  backdrop-filter:blur(8px);
  margin-bottom: 28px;
}

.hero-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 20px;
  color: var(--t1);
}

.hero-subtitle {
  color: var(--t2);
  font-size: clamp(1rem, 2vw, 1.25rem);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}

/* Game Card - Enhanced with proper sizing */
.gc{
  position:relative;
  border-radius:24px;
  overflow:hidden;
  cursor:pointer;
  border:1px solid var(--border);
  transition:all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  height:180px;
  background:linear-gradient(135deg, var(--bg3), var(--bg2));
  isolation:isolate;
}
.gc:hover{
  border-color:rgba(255,77,140,0.5);
  transform:translateY(-8px) scale(1.02);
  box-shadow:0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,77,140,0.2), 0 0 40px rgba(255,77,140,0.2);
}
.gc-art{
  position:absolute;
  inset:0;
  object-fit:cover;
  width:100%;
  height:100%;
  transition:transform 0.6s ease;
  filter:brightness(0.65);
}
.gc:hover .gc-art{
  transform:scale(1.1);
  filter:brightness(0.8);
}
.gc-ov{
  position:absolute;
  inset:0;
  background:linear-gradient(105deg, rgba(3,5,11,0.95) 0%, rgba(3,5,11,0.7) 50%, rgba(3,5,11,0.2) 100%);
}
.gc-body{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  gap:24px;
  padding:0 28px;
}
.gc-icon{
  width:100px;
  height:100px;
  flex-shrink:0;
  border-radius:22px;
  overflow:hidden;
  border:2px solid rgba(255,77,140,0.4);
  box-shadow:0 0 40px rgba(255,77,140,0.3), inset 0 0 20px rgba(0,0,0,0.5);
  position:relative;
  background:var(--bg2);
  transition: all 0.3s ease;
}
.gc:hover .gc-icon {
  border-color: rgba(255,77,140,0.6);
  box-shadow: 0 0 50px rgba(255,77,140,0.4), inset 0 0 20px rgba(0,0,0,0.5);
  transform: scale(1.05);
}
.gc-meta{flex:1;min-width:0;}
.gc-code{
  font-family:'Inter',sans-serif;
  font-size:11px;
  font-weight:700;
  letter-spacing:0.15em;
  text-transform:uppercase;
  color:rgba(255,77,140,0.7);
  margin-bottom:8px;
}
.gc-name{
  font-family:'Space Grotesk',sans-serif;
  font-weight:800;
  font-size:26px;
  color:var(--t1);
  line-height:1.15;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  letter-spacing:-0.02em;
  transition: color 0.3s;
}
.gc:hover .gc-name {
  color: var(--pink);
}
.gc-cnt{
  margin-top:12px;
  display:inline-flex;
  align-items:center;
  gap:8px;
  background:rgba(255,77,140,0.12);
  border:1px solid rgba(255,77,140,0.25);
  border-radius:30px;
  padding:6px 16px;
  font-family:'Inter',sans-serif;
  font-size:12px;
  font-weight:600;
  color:rgba(255,77,140,0.9);
  transition: all 0.3s;
}
.gc:hover .gc-cnt {
  background: rgba(255,77,140,0.18);
  border-color: rgba(255,77,140,0.35);
}
.gc-shimmer{
  position:absolute;
  inset:0;
  background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.08) 50%,transparent 70%);
  transform:translateX(-100%);
  transition:transform 0.6s ease;
}
.gc:hover .gc-shimmer{transform:translateX(100%);}
.gc::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--pink), var(--cyan), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.gc:hover::after{opacity:1;}

/* Account Card - Premium Design */
.ac{
  background:linear-gradient(135deg, rgba(15,22,34,0.9), rgba(10,15,26,0.95));
  border:1px solid rgba(255,255,255,0.08);
  border-radius:24px;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  transition:all 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  position:relative;
  backdrop-filter:blur(4px);
}
.ac::before{
  content:'';
  position:absolute;
  top:0;
  left:0;
  right:0;
  height:2px;
  background:linear-gradient(90deg, var(--pink), var(--cyan), var(--purple));
  opacity:0;
  transition:opacity 0.3s;
}
.ac:hover::before{opacity:1;}
.ac:hover{
  border-color:rgba(255,77,140,0.3);
  transform:translateY(-6px);
  box-shadow:0 25px 50px rgba(0,0,0,0.4), 0 0 40px rgba(255,77,140,0.1);
}

/* Enhanced Stats Pills */
.sp{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:8px 14px;
  border-radius:40px;
  font-family:'Inter',sans-serif;
  font-weight:600;
  font-size:13px;
  transition:all 0.2s;
}
.sp-lv{
  background:linear-gradient(135deg, rgba(255,77,140,0.12), rgba(255,77,140,0.05));
  border:1px solid rgba(255,77,140,0.2);
  color:var(--pink);
}
.sp-gm{
  background:linear-gradient(135deg, rgba(45,212,191,0.1), rgba(45,212,191,0.05));
  border:1px solid rgba(45,212,191,0.2);
  color:var(--cyan);
}
.sp-sv{
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.1);
  color:var(--t2);
}

/* Rarity Chips - Larger for Better Visibility */
.rc{
  display:inline-flex;
  align-items:center;
  gap:8px;
  border-radius:30px;
  padding:6px 14px;
  font-size:12px;
  font-weight:600;
  transition:all 0.2s;
}
.r5{
  background:linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.05));
  border:1px solid rgba(251,191,36,0.25);
  color:var(--amber);
}
.r4{
  background:linear-gradient(135deg, rgba(192,132,252,0.12), rgba(192,132,252,0.05));
  border:1px solid rgba(192,132,252,0.2);
  color:var(--purple);
}
.rc img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.1);
}

/* Price Styling */
.sl{
  font-family:'Inter',sans-serif;
  font-size:11px;
  font-weight:700;
  letter-spacing:0.12em;
  text-transform:uppercase;
  color:var(--t3);
}
.pn{
  font-family:'Space Grotesk',sans-serif;
  font-weight:800;
  font-size:28px;
  background:linear-gradient(135deg, #fff, var(--pink));
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}
.pc{
  font-family:'Inter',sans-serif;
  font-size:14px;
  font-weight:600;
  color:var(--t3);
  margin-right:4px;
}

/* Buttons */
.btn-pk{
  background:linear-gradient(135deg, var(--pink) 0%, var(--pink2) 100%);
  box-shadow:0 6px 25px rgba(255,77,140,0.4);
  color:#fff;
  border:none;
  border-radius:14px;
  padding:12px 26px;
  cursor:pointer;
  font-family:'Inter',sans-serif;
  font-weight:700;
  font-size:14px;
  transition:all 0.25s;
  display:inline-flex;
  align-items:center;
  gap:8px;
  position:relative;
  overflow:hidden;
}
.btn-pk:hover{
  transform:translateY(-3px);
  box-shadow:0 10px 35px rgba(255,77,140,0.6);
}
.btn-pk:active{transform:translateY(-1px);}

.btn-gh{
  background:rgba(15,22,34,0.8);
  border:1px solid rgba(255,255,255,0.1);
  color:var(--t2);
  border-radius:12px;
  padding:10px 20px;
  cursor:pointer;
  font-family:'Inter',sans-serif;
  font-weight:600;
  font-size:13px;
  transition:all 0.25s;
  display:inline-flex;
  align-items:center;
  gap:8px;
}
.btn-gh:hover{
  background:rgba(255,77,140,0.1);
  border-color:rgba(255,77,140,0.35);
  color:var(--pink);
}
.btn-gh.on{
  background:rgba(255,77,140,0.12);
  border-color:rgba(255,77,140,0.4);
  color:var(--pink);
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(15,22,34,0.6);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--t2);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.25s;
}
.btn-back:hover {
  background: rgba(255,77,140,0.1);
  border-color: rgba(255,77,140,0.3);
  color: var(--pink);
}

/* Filter Panel */
.fp{
  background:linear-gradient(135deg, rgba(10,15,26,0.95), rgba(3,5,11,0.98));
  border:1px solid rgba(255,77,140,0.15);
  border-radius:28px;
  box-shadow:0 30px 60px rgba(0,0,0,0.5);
  padding:32px;
  backdrop-filter:blur(16px);
}

/* Active Filter Area */
.active-area{
  background:linear-gradient(135deg, rgba(255,77,140,0.05), rgba(45,212,191,0.03));
  border:1px solid rgba(255,77,140,0.2);
  border-radius:20px;
  padding:24px;
  margin-bottom:32px;
}

/* Active Filter Tag - Larger with Better Images */
.atag{
  display:inline-flex;
  align-items:center;
  gap:0;
  border-radius:60px;
  font-size:13px;
  font-weight:600;
  overflow:hidden;
  transition:all 0.25s;
  flex-shrink:0;
  background:rgba(15,22,34,0.8);
  border:1px solid rgba(255,77,140,0.25);
}
.atag:hover{
  transform:translateY(-2px);
  box-shadow:0 8px 25px rgba(255,77,140,0.2);
}
.atag-img{
  width:52px;
  height:52px;
  flex-shrink:0;
  position:relative;
  overflow:hidden;
  background:linear-gradient(135deg, rgba(255,77,140,0.2), rgba(45,212,191,0.1));
}
.atag-img img{width:100%;height:100%;object-fit:cover;}
.atag-info{
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:0 14px;
  gap:4px;
}
.atag-name{
  font-family:'Inter',sans-serif;
  font-size:14px;
  font-weight:700;
  color:var(--t1);
  max-width:100px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.atag-rarity{font-size:10px;line-height:1;}
.atag-qty{
  display:flex;
  align-items:center;
  background:rgba(0,0,0,0.3);
  border-left:1px solid rgba(255,255,255,0.1);
  padding:0 10px;
  height:100%;
}
.qrow{display:flex;align-items:center;gap:8px;}
.qbtn{
  width:28px;
  height:28px;
  border-radius:30px;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  transition:all 0.15s;
  background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.1);
}
.qbtn:hover{background:rgba(255,255,255,0.18);}
.qnum{
  font-family:'Space Grotesk',sans-serif;
  font-weight:700;
  font-size:16px;
  min-width:28px;
  text-align:center;
  color:white;
}
.atag-rm{
  width:40px;
  height:100%;
  align-self:stretch;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  transition:all 0.15s;
  background:rgba(255,255,255,0.03);
  border-left:1px solid rgba(255,255,255,0.08);
}
.atag-rm:hover{background:rgba(255,100,100,0.2);}

/* Portrait Cards - Larger for Better Visibility */
.pcard{
  position:relative;
  border-radius:16px;
  overflow:hidden;
  cursor:pointer;
  border:2px solid rgba(255,255,255,0.08);
  transition:all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  background:linear-gradient(135deg, var(--bg3), var(--bg2));
  aspect-ratio:2/3;
  display:flex;
  flex-direction:column;
}
.pcard:hover{
  border-color:rgba(255,77,140,0.5);
  transform:translateY(-8px) scale(1.02);
  box-shadow:0 20px 40px rgba(0,0,0,0.4);
}
.pcard.sel{
  border-color:var(--pink);
  box-shadow:0 0 0 3px rgba(255,77,140,0.3);
}
.pcard.sel-w{
  border-color:var(--cyan);
  box-shadow:0 0 0 3px rgba(45,212,191,0.3);
}
.pcard-art{flex:1;position:relative;overflow:hidden;}
.pcard-art img{width:100%;height:100%;object-fit:cover;object-position:center;transition:transform 0.35s ease;}
.pcard:hover .pcard-art img{transform:scale(1.1);}
.pcard-ph{
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  background:linear-gradient(135deg, rgba(255,77,140,0.1), rgba(45,212,191,0.05));
}
.pcard-foot{
  padding:12px 10px 14px;
  background:linear-gradient(135deg, rgba(3,5,11,0.9), rgba(3,5,11,0.8));
  border-top:1px solid rgba(255,255,255,0.05);
}
.pcard-nm{
  font-family:'Inter',sans-serif;
  font-size:12px;
  font-weight:700;
  color:var(--t1);
  text-align:center;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.pcard-star{text-align:center;font-size:10px;margin-top:4px;}
.ptick{
  position:absolute;
  top:10px;
  right:10px;
  z-index:10;
  border-radius:50%;
  width:28px;
  height:28px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:var(--pink);
  box-shadow:0 0 20px rgba(255,77,140,0.6);
}

/* Portrait Scroll */
.pscroll{
  background:rgba(3,5,11,0.5);
  border:1px solid rgba(255,255,255,0.05);
  border-radius:20px;
  padding:16px;
  overflow-y:auto;
  max-height:360px;
}
.pgrid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(95px,1fr));
  gap:14px;
}

/* Search Box */
.sbox{
  background:rgba(15,22,34,0.9);
  border:1px solid rgba(255,255,255,0.08);
  border-radius:14px;
  color:var(--t1);
  transition:all 0.25s;
  padding:12px 18px 12px 44px;
  font-size:14px;
  font-family:'Inter',sans-serif;
}
.sbox:focus{
  border-color:rgba(255,77,140,0.4);
  box-shadow:0 0 0 3px rgba(255,77,140,0.1);
  outline:none;
  background:rgba(15,22,34,1);
}
.sbox::placeholder{color:var(--t3);}

/* Empty State */
.ebox{
  border:2px dashed rgba(255,77,140,0.2);
  border-radius:32px;
  background:radial-gradient(ellipse at center, rgba(255,77,140,0.05), transparent 70%);
  text-align:center;
  padding:100px 40px;
}

/* Pagination */
.pg-b{
  width:48px;
  height:48px;
  border-radius:14px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  background:rgba(15,22,34,0.9);
  border:1px solid rgba(255,255,255,0.08);
  color:var(--t2);
  transition:all 0.2s;
}
.pg-b:hover:not(:disabled){
  border-color:rgba(255,77,140,0.4);
  color:var(--pink);
}
.pg-b:disabled{opacity:0.3;cursor:not-allowed;}

/* Section Header */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

/* Responsive Game Cards */
@media (max-width: 768px) {
  .nav-inner{
    padding:0 20px;
    height:60px;
  }
  .gc{
    height:150px;
  }
  .gc-icon{
    width:70px;
    height:70px;
    border-radius:18px;
  }
  .gc-name{
    font-size:20px;
  }
  .gc-body{
    gap:16px;
    padding:0 20px;
  }
  .pgrid{
    grid-template-columns:repeat(auto-fill,minmax(80px,1fr));
    gap:10px;
  }
  .pcard-foot{
    padding:8px 6px 10px;
  }
  .pcard-nm{
    font-size:10px;
  }
  .fp{
    padding:20px;
  }
  .atag-img{
    width:44px;
    height:44px;
  }
  .atag-name{
    font-size:12px;
    max-width:80px;
  }
  .main-container {
    padding: 0 20px;
  }
}

@media (max-width: 480px) {
  .gc-body{
    gap:12px;
    padding:0 16px;
  }
  .gc-icon{
    width:56px;
    height:56px;
    border-radius:14px;
  }
  .gc-name{
    font-size:17px;
  }
  .pn{
    font-size:22px;
  }
  .ac:hover{
    transform:translateY(-3px);
  }
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255,77,140,0.3);
  border-radius: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
`;

// ── Navbar ──────────────────────────────────────────────────────────
function Navbar({ session }: { session: unknown }) {
  const us = session as { user?: { name?: string } } | null;
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            style={{
              position: "relative",
              width: 40,
              height: 40,
              transition: "all 0.3s",
            }}
            className="group-hover:scale-105"
          >
            <Image
              src="/rikkastore.png"
              alt="Rikkastore"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <div
              className="ff-display"
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #fff, var(--pink))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              RIKKA<span style={{ color: "var(--pink)" }}>STORE</span>
            </div>
            <div
              className="ff-body"
              style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--t3)",
                marginTop: -2,
              }}
            >
              Premium Game Accounts
            </div>
          </div>
        </Link>
        <div>
          {us ? (
            <Link href="/dashboard/overview">
              <button className="btn-pk">
                <LayoutDashboard size={16} /> Dashboard
              </button>
            </Link>
          ) : (
            <Link href="/login">
              <button className="btn-gh">
                <LogIn size={14} /> Login
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer
      style={{
        background: "rgba(3,5,11,0.95)",
        borderTop: "1px solid rgba(255,77,140,0.1)",
        padding: "32px 0",
        marginTop: "auto",
      }}
    >
      <div className="main-container text-center">
        <p
          className="ff-body"
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--t3)",
          }}
        >
          © {new Date().getFullYear()}{" "}
          <span style={{ color: "rgba(255,77,140,0.7)" }}>Rikkastore.id</span> —
          Premium Game Account Marketplace
        </p>
      </div>
    </footer>
  );
}

// ── Portrait Card (filter) ──────────────────────────────────────────
function PortraitCard({
  name,
  imageUrl,
  rarity,
  isSelected,
  isWeapon,
  onClick,
}: {
  name: string;
  imageUrl?: string | null;
  rarity: number;
  isSelected: boolean;
  isWeapon?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "pcard",
        rarity === 5 ? "r5c" : "r4c",
        isSelected && (isWeapon ? "sel-w" : "sel"),
      )}
    >
      {isSelected && (
        <div className="ptick">
          <CheckCircle2 size={14} style={{ color: "#fff" }} />
        </div>
      )}
      <div className="pcard-art">
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy" />
        ) : (
          <div className="pcard-ph">
            {isWeapon ? (
              <Sword
                size={32}
                color={isSelected ? "var(--cyan)" : "var(--t3)"}
              />
            ) : (
              <Star
                size={32}
                color={isSelected ? "var(--pink)" : "var(--t3)"}
              />
            )}
          </div>
        )}
      </div>
      <div className="pcard-foot">
        <div className="pcard-nm">{name}</div>
        <div
          className="pcard-star"
          style={{ color: rarity === 5 ? "var(--amber)" : "var(--purple)" }}
        >
          {"★".repeat(rarity)}
        </div>
      </div>
    </motion.div>
  );
}

// ── Active Filter Tag ───────────────────────────────────────────
function ActiveFilterTag({
  name,
  imageUrl,
  rarity,
  quantity,
  isWeapon,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  name: string;
  imageUrl?: string | null;
  rarity: number;
  quantity: number;
  isWeapon?: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 5 }}
      transition={{ duration: 0.2 }}
      className="atag"
      style={{ height: 56 }}
    >
      <div className="atag-img">
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy" />
        ) : (
          <div
            className="flex items-center justify-center h-full"
            style={{
              background: isWeapon
                ? "rgba(45,212,191,0.1)"
                : "rgba(255,77,140,0.1)",
            }}
          >
            {isWeapon ? (
              <Sword size={22} color="var(--cyan)" />
            ) : (
              <Star size={22} color="var(--pink)" />
            )}
          </div>
        )}
      </div>
      <div className="atag-info">
        <span className="atag-name">{name}</span>
        <span
          className="atag-rarity"
          style={{ color: rarity === 5 ? "var(--amber)" : "var(--purple)" }}
        >
          {"★".repeat(rarity)}
        </span>
      </div>
      <div className="atag-qty">
        <div className="qrow">
          <div
            className="qbtn"
            onClick={(e) => {
              e.stopPropagation();
              onDecrease();
            }}
          >
            <Minus size={12} />
          </div>
          <span className="qnum">{quantity}</span>
          <div
            className="qbtn"
            onClick={(e) => {
              e.stopPropagation();
              onIncrease();
            }}
          >
            <Plus size={12} />
          </div>
        </div>
      </div>
      <button
        className="atag-rm"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ── Account Card - Enhanced with Larger Images ────────────────────────────────────
// PERBAIKAN: Menggunakan icon Crown, Gem, Trophy, Compass yang sudah di-import
function AccountCard({
  account,
  onCopy,
}: {
  account: Account;
  onCopy: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="ac"
    >
      {/* Header with ID */}
      <div
        style={{
          padding: "18px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background:
            "linear-gradient(135deg, rgba(255,77,140,0.05), transparent)",
        }}
      >
        <div className="flex items-center gap-3">
          <Crown size={16} style={{ color: "var(--pink)" }} />
          <span
            className="ff-body font-bold text-sm tracking-wide"
            style={{ color: "var(--pink)" }}
          >
            {account.publicId}
          </span>
        </div>
        <button
          onClick={() => {
            onCopy(account.publicId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="transition-all duration-200 hover:scale-110"
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: copied
              ? "rgba(255,77,140,0.15)"
              : "rgba(255,255,255,0.05)",
            border: `1px solid ${
              copied ? "rgba(255,77,140,0.3)" : "rgba(255,255,255,0.08)"
            }`,
          }}
        >
          {copied ? (
            <Check size={14} style={{ color: "var(--pink)" }} />
          ) : (
            <Copy size={14} style={{ color: "var(--t3)" }} />
          )}
        </button>
      </div>

      {/* Body with Stats */}
      <div
        style={{
          padding: "22px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Stats Row */}
        <div className="flex flex-wrap gap-3">
          <div className="sp sp-lv">
            <Shield size={14} /> LV {account.level || 1}
          </div>
          <div className="sp sp-gm">
            <Gem size={14} /> {account.diamond.toLocaleString()}
          </div>
          {account.server && (
            <div className="sp sp-sv">
              <Compass size={12} /> {account.server.name}
            </div>
          )}
        </div>

        {/* Characters - Enhanced with Larger Images */}
        {account.characters && account.characters.length > 0 && (
          <div>
            <div className="sl flex items-center gap-2 mb-4">
              <Users size={12} /> Characters (
              {account.characters.reduce((s, c) => s + (c.quantity || 1), 0)})
            </div>
            <div className="flex flex-wrap gap-3">
              {account.characters.slice(0, 6).map((c, i) => (
                <div
                  key={i}
                  className={cn(
                    "rc",
                    c.rarity === 5 ? "r5" : "r4",
                    "group relative",
                  )}
                >
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="w-7 h-7 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <Star size={16} />
                  )}
                  <span className="max-w-[70px] overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                    {c.name}
                  </span>
                  {c.quantity && c.quantity > 1 && (
                    <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                      ×{c.quantity}
                    </span>
                  )}
                </div>
              ))}
              {account.characters.length > 6 && (
                <div className="rc bg-white/5 border-white/10 text-gray-400">
                  +{account.characters.length - 6}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weapons - Enhanced with Larger Images */}
        {account.weapons && account.weapons.length > 0 && (
          <div>
            <div className="sl flex items-center gap-2 mb-4">
              <Trophy size={12} /> Weapons (
              {account.weapons.reduce((s, w) => s + (w.quantity || 1), 0)})
            </div>
            <div className="flex flex-wrap gap-3">
              {account.weapons.slice(0, 5).map((w, i) => (
                <div key={i} className={cn("rc", w.rarity === 5 ? "r5" : "r4")}>
                  {w.imageUrl ? (
                    <img
                      src={w.imageUrl}
                      alt={w.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <Sword size={16} />
                  )}
                  <span className="max-w-[70px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {w.name}
                  </span>
                  {w.quantity && w.quantity > 1 && (
                    <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                      ×{w.quantity}
                    </span>
                  )}
                </div>
              ))}
              {account.weapons.length > 5 && (
                <div className="rc bg-white/5 border-white/10 text-gray-400">
                  +{account.weapons.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price + Detail */}
        <div className="pt-5 border-t border-white/5 flex items-center justify-between mt-auto">
          <div>
            <div className="sl mb-2">Harga</div>
            <div>
              <span className="pc">Rp</span>
              <span className="pn">{account.basePrice.toLocaleString()}</span>
            </div>
          </div>
          {/* <Link href={`/catalog/${account.publicId}`}>
            <button className="btn-pk">
              <Zap size={15} /> Detail
            </button>
          </Link> */}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: session } = useSession();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    characters: [] as FilterItem[],
    weapons: [] as FilterItem[],
    minDiamond: 0,
    maxDiamond: 9999999,
    minLevel: 1,
    maxLevel: 999,
    serverId: "",
    gender: "",
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: gamesData, isLoading: isLoadingGames } = useQuery({
    queryKey: ["games-public"],
    queryFn: async () => {
      const r = await fetch("/api/games");
      const j = await r.json();
      return Array.isArray(j) ? { games: j } : j;
    },
  });
  const { data: serversData } = useQuery({
    queryKey: ["servers", selectedGame?.id],
    queryFn: async () => {
      if (!selectedGame) return { servers: [] };
      return (await fetch(`/api/servers?gameId=${selectedGame.id}`)).json();
    },
    enabled: !!selectedGame,
  });
  const { data: charactersData } = useQuery({
    queryKey: ["characters", selectedGame?.id],
    queryFn: async () => {
      if (!selectedGame) return { characters: [] };
      return (await fetch(`/api/characters?gameId=${selectedGame.id}`)).json();
    },
    enabled: !!selectedGame,
  });
  const { data: weaponsData } = useQuery({
    queryKey: ["weapons", selectedGame?.id],
    queryFn: async () => {
      if (!selectedGame) return { weapons: [] };
      return (await fetch(`/api/weapons?gameId=${selectedGame.id}`)).json();
    },
    enabled: !!selectedGame,
  });
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts-public", selectedGame?.id, page, searchQuery, filters],
    queryFn: async () => {
      if (!selectedGame) return { accounts: [], pagination: { totalPages: 0 } };
      const p = new URLSearchParams({
        gameId: selectedGame.id,
        page: page.toString(),
        limit: "20",
      });
      if (searchQuery) p.set("search", searchQuery);
      if (filters.serverId) p.set("serverId", filters.serverId);
      if (filters.gender) p.set("gender", filters.gender);
      if (filters.minDiamond > 0)
        p.set("minDiamond", filters.minDiamond.toString());
      if (filters.maxDiamond < 999999)
        p.set("maxDiamond", filters.maxDiamond.toString());
      if (filters.minLevel > 1) p.set("minLevel", filters.minLevel.toString());
      if (filters.maxLevel < 999)
        p.set("maxLevel", filters.maxLevel.toString());
      if (filters.characters.length > 0)
        p.set(
          "characters",
          filters.characters.map((c) => `${c.id}:${c.quantity}`).join(","),
        );
      if (filters.weapons.length > 0)
        p.set(
          "weapons",
          filters.weapons.map((w) => `${w.id}:${w.quantity}`).join(","),
        );
      return (await fetch(`/api/accounts?${p}`)).json();
    },
    enabled: !!selectedGame,
  });

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    toast.success("ID Akun Disalin!", { description: `Account ID: ${id}` });
  };
  const addFilter = (type: "characters" | "weapons", id: string) => {
    setFilters((prev) => {
      if (prev[type].find((i) => i.id === id)) return prev;
      return { ...prev, [type]: [...prev[type], { id, quantity: 1 }] };
    });
    setPage(1);
  };
  const removeFilter = (type: "characters" | "weapons", id: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].filter((i) => i.id !== id),
    }));
    setPage(1);
  };
  const updateQuantity = (
    type: "characters" | "weapons",
    id: string,
    newQty: number,
  ) => {
    if (newQty < 1) {
      removeFilter(type, id);
      return;
    }
    if (newQty > 99) return;
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].map((i) =>
        i.id === id ? { ...i, quantity: newQty } : i,
      ),
    }));
    setPage(1);
  };

  const hasChars = !!charactersData?.characters?.length;
  const hasWeps = !!weaponsData?.weapons?.length;
  const activeCount = filters.characters.length + filters.weapons.length;

  // ── VIEW 1: GAME SELECTION ──────────────────────────────────────
  if (!selectedGame)
    return (
      <div
        className="page-bg"
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <style>{G}</style>
        <div
          className="orb"
          style={{
            width: 600,
            height: 600,
            background: "rgba(255,77,140,0.1)",
            top: -200,
            right: -150,
          }}
        />
        <div
          className="orb"
          style={{
            width: 500,
            height: 500,
            background: "rgba(45,212,191,0.08)",
            bottom: -100,
            left: -100,
          }}
        />
        <Navbar session={session} />

        <main
          className="main-container"
          style={{ flex: 1, position: "relative", zIndex: 1 }}
        >
          <div className="hero-section">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="hero-badge">
                <Sparkles size={14} /> Premium Gaming Marketplace
              </div>
            </motion.div>

            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              Temukan Akun Game{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--pink), var(--cyan))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Impianmu
              </span>
            </motion.h1>

            {/* <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Jelajahi ribuan akun premium dengan karakter dan senjata langka
              dari berbagai game populer
            </motion.p> */}
          </div>

          <div className="section-header">
            <Gamepad2 size={22} style={{ color: "var(--pink)" }} />
            <h2
              className="ff-display"
              style={{ fontSize: 22, fontWeight: 700, color: "var(--t1)" }}
            >
              Pilih Game
            </h2>
          </div>

          {isLoadingGames ? (
            <div
              className="flex flex-col items-center justify-center"
              style={{ padding: "80px 0" }}
            >
              <Loader2
                className="animate-spin"
                style={{ width: 48, height: 48, color: "var(--pink)" }}
              />
              <p style={{ color: "var(--t3)", marginTop: 20, fontSize: 15 }}>
                Memuat daftar game...
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: 24,
                paddingBottom: 60,
              }}
            >
              {gamesData?.games
                ?.filter((g: Game) => g.status)
                .map((game: Game, index: number) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className="gc"
                      onClick={() => {
                        setSelectedGame(game);
                        setFilters({
                          characters: [],
                          weapons: [],
                          minDiamond: 0,
                          maxDiamond: 9999999,
                          minLevel: 1,
                          maxLevel: 999,
                          serverId: "",
                          gender: "",
                        });
                        setSearchQuery("");
                        setPage(1);
                      }}
                    >
                      {game.icon && (
                        <img src={game.icon} alt="" className="gc-art" />
                      )}
                      <div className="gc-ov" />
                      <div className="gc-shimmer" />
                      <div className="gc-body">
                        <div className="gc-icon">
                          {game.icon ? (
                            <Image
                              src={game.icon}
                              alt={game.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ background: "rgba(255,77,140,0.1)" }}
                            >
                              <Gamepad2
                                size={36}
                                style={{ color: "var(--pink)" }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="gc-meta">
                          <div className="gc-code">{game.code}</div>
                          <div className="gc-name">{game.name}</div>
                          <div className="gc-cnt">
                            <Users size={12} /> {game._count?.accounts || 0}{" "}
                            Akun Tersedia
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </main>
        <Footer />
      </div>
    );

  // ── VIEW 2: CATALOG ─────────────────────────────────────────────
  return (
    <div
      className="page-bg"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <style>{G}</style>
      <div
        className="orb"
        style={{
          width: 500,
          height: 500,
          background: "rgba(255,77,140,0.08)",
          top: -150,
          right: -100,
        }}
      />
      <Navbar session={session} />

      <main
        className="main-container"
        style={{
          flex: 1,
          position: "relative",
          zIndex: 1,
          paddingTop: 32,
          paddingBottom: 32,
        }}
      >
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <motion.button
                whileHover={{ x: -4 }}
                onClick={() => setSelectedGame(null)}
                className="btn-back"
              >
                <ChevronLeft size={18} /> <span>Kembali</span>
              </motion.button>
              <div className="flex items-center gap-4">
                {selectedGame.icon && (
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      overflow: "hidden",
                      border: "2px solid rgba(255,77,140,0.3)",
                      boxShadow: "0 0 30px rgba(255,77,140,0.2)",
                    }}
                  >
                    <Image
                      src={selectedGame.icon}
                      alt={selectedGame.name}
                      width={52}
                      height={52}
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h2
                    className="ff-display"
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {selectedGame.name}
                  </h2>
                  <p style={{ color: "var(--t3)", fontSize: 13, marginTop: 2 }}>
                    Marketplace Akun Premium
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div style={{ position: "relative" }}>
                <Search
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--t3)",
                  }}
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Cari ID Akun..."
                  className="sbox"
                  style={{ width: 280 }}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <button
                className={cn("btn-gh", showFilters && "on")}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={15} /> Filter
                {activeCount > 0 && (
                  <span
                    style={{
                      background: "var(--pink)",
                      color: "white",
                      borderRadius: "50%",
                      width: 22,
                      height: 22,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: "hidden" }}
              >
                <div className="fp">
                  {/* Active Filters */}
                  {(filters.characters.length > 0 ||
                    filters.weapons.length > 0) && (
                    <div className="active-area">
                      <div className="flex justify-between items-center mb-5">
                        <span
                          className="ff-title text-sm font-bold flex items-center gap-2"
                          style={{ color: "var(--pink)" }}
                        >
                          <Sparkles size={14} /> Filter Aktif ({activeCount})
                        </span>
                        <button
                          onClick={() =>
                            setFilters((p) => ({
                              ...p,
                              characters: [],
                              weapons: [],
                            }))
                          }
                          className="text-xs font-semibold transition-colors"
                          style={{ color: "rgba(248,113,113,0.7)" }}
                        >
                          Reset Semua
                        </button>
                      </div>

                      {filters.characters.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div
                            className="text-xs font-semibold mb-4 flex items-center gap-2"
                            style={{ color: "var(--t3)" }}
                          >
                            <Star size={12} /> Karakter
                          </div>
                          <div className="flex flex-wrap gap-4">
                            <AnimatePresence>
                              {filters.characters.map((fi) => {
                                const c = charactersData?.characters?.find(
                                  (x: Character) => x.id === fi.id,
                                );
                                if (!c) return null;
                                return (
                                  <ActiveFilterTag
                                    key={fi.id}
                                    name={c.name}
                                    imageUrl={c.imageUrl}
                                    rarity={c.rarity}
                                    quantity={fi.quantity}
                                    onIncrease={() =>
                                      updateQuantity(
                                        "characters",
                                        fi.id,
                                        fi.quantity + 1,
                                      )
                                    }
                                    onDecrease={() =>
                                      updateQuantity(
                                        "characters",
                                        fi.id,
                                        fi.quantity - 1,
                                      )
                                    }
                                    onRemove={() =>
                                      removeFilter("characters", fi.id)
                                    }
                                  />
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {filters.weapons.length > 0 && (
                        <div>
                          {filters.characters.length > 0 && (
                            <div
                              style={{
                                height: 1,
                                background:
                                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                                margin: "20px 0",
                              }}
                            />
                          )}
                          <div
                            className="text-xs font-semibold mb-4 flex items-center gap-2"
                            style={{ color: "var(--t3)" }}
                          >
                            <Sword size={12} /> Senjata
                          </div>
                          <div className="flex flex-wrap gap-4">
                            <AnimatePresence>
                              {filters.weapons.map((fi) => {
                                const w = weaponsData?.weapons?.find(
                                  (x: Weapon) => x.id === fi.id,
                                );
                                if (!w) return null;
                                return (
                                  <ActiveFilterTag
                                    key={fi.id}
                                    name={w.name}
                                    imageUrl={w.imageUrl}
                                    rarity={w.rarity}
                                    quantity={fi.quantity}
                                    isWeapon
                                    onIncrease={() =>
                                      updateQuantity(
                                        "weapons",
                                        fi.id,
                                        fi.quantity + 1,
                                      )
                                    }
                                    onDecrease={() =>
                                      updateQuantity(
                                        "weapons",
                                        fi.id,
                                        fi.quantity - 1,
                                      )
                                    }
                                    onRemove={() =>
                                      removeFilter("weapons", fi.id)
                                    }
                                  />
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Character & Weapon Grids */}
                  {(hasChars || hasWeps) && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          hasChars && hasWeps ? "1fr 1fr" : "1fr",
                        gap: 28,
                        marginBottom: 28,
                      }}
                    >
                      {hasChars && (
                        <div>
                          <div
                            className="flex items-center gap-2 mb-4 text-sm font-bold"
                            style={{ color: "var(--t2)" }}
                          >
                            <Star size={16} style={{ color: "var(--amber)" }} />{" "}
                            Karakter ({charactersData.characters.length})
                          </div>
                          <div className="pscroll">
                            <div className="pgrid">
                              {charactersData.characters.map(
                                (char: Character) => (
                                  <PortraitCard
                                    key={char.id}
                                    name={char.name}
                                    imageUrl={char.imageUrl}
                                    rarity={char.rarity}
                                    isSelected={filters.characters.some(
                                      (f) => f.id === char.id,
                                    )}
                                    onClick={() =>
                                      filters.characters.some(
                                        (f) => f.id === char.id,
                                      )
                                        ? removeFilter("characters", char.id)
                                        : addFilter("characters", char.id)
                                    }
                                  />
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {hasWeps && (
                        <div>
                          <div
                            className="flex items-center gap-2 mb-4 text-sm font-bold"
                            style={{ color: "var(--t2)" }}
                          >
                            <Sword size={16} style={{ color: "var(--cyan)" }} />{" "}
                            Senjata ({weaponsData.weapons.length})
                          </div>
                          <div className="pscroll">
                            <div className="pgrid">
                              {weaponsData.weapons.map((wep: Weapon) => (
                                <PortraitCard
                                  key={wep.id}
                                  name={wep.name}
                                  imageUrl={wep.imageUrl}
                                  rarity={wep.rarity}
                                  isWeapon
                                  isSelected={filters.weapons.some(
                                    (f) => f.id === wep.id,
                                  )}
                                  onClick={() =>
                                    filters.weapons.some((f) => f.id === wep.id)
                                      ? removeFilter("weapons", wep.id)
                                      : addFilter("weapons", wep.id)
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional Filters */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 18,
                    }}
                  >
                    <div>
                      <div
                        className="flex items-center gap-2 mb-3 text-sm font-bold"
                        style={{ color: "var(--t2)" }}
                      >
                        <Gem size={14} style={{ color: "var(--cyan)" }} />{" "}
                        Diamond
                      </div>
                      <Select
                        value={filters.minDiamond.toString()}
                        onValueChange={(v) => {
                          setFilters((p) => ({
                            ...p,
                            minDiamond: parseInt(v),
                          }));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="bg-black/40 border-white/10 rounded-xl h-12">
                          <SelectValue placeholder="Pilih Diamond" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-pink-500/20">
                          {DIAMOND_OPTIONS.map((o) => (
                            <SelectItem
                              key={o.value}
                              value={o.value}
                              className="text-white focus:bg-pink-500/20"
                            >
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div
                        className="flex items-center gap-2 mb-3 text-sm font-bold"
                        style={{ color: "var(--t2)" }}
                      >
                        <Shield size={14} style={{ color: "var(--pink)" }} />{" "}
                        Level
                      </div>
                      <Select
                        value={filters.minLevel.toString()}
                        onValueChange={(v) => {
                          setFilters((p) => ({
                            ...p,
                            minLevel: parseInt(v),
                          }));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="bg-black/40 border-white/10 rounded-xl h-12">
                          <SelectValue placeholder="Pilih Level" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-pink-500/20">
                          {LEVEL_OPTIONS.map((o) => (
                            <SelectItem
                              key={o.value}
                              value={o.value}
                              className="text-white focus:bg-pink-500/20"
                            >
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div
                        className="flex items-center gap-2 mb-3 text-sm font-bold"
                        style={{ color: "var(--t2)" }}
                      >
                        <Compass size={14} /> Server
                      </div>
                      <Select
                        value={filters.serverId || "all"}
                        onValueChange={(v) => {
                          setFilters((p) => ({
                            ...p,
                            serverId: v === "all" ? "" : v,
                          }));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="bg-black/40 border-white/10 rounded-xl h-12">
                          <SelectValue placeholder="Semua Server" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-pink-500/20">
                          <SelectItem
                            value="all"
                            className="text-white focus:bg-pink-500/20"
                          >
                            Semua Server
                          </SelectItem>
                          {serversData?.servers?.map((s: Server) => (
                            <SelectItem
                              key={s.id}
                              value={s.id}
                              className="text-white focus:bg-pink-500/20"
                            >
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div
                        className="flex items-center gap-2 mb-3 text-sm font-bold"
                        style={{ color: "var(--t2)" }}
                      >
                        <Users size={14} /> Gender
                      </div>
                      <Select
                        value={filters.gender || "all"}
                        onValueChange={(v) => {
                          setFilters((p) => ({
                            ...p,
                            gender: v === "all" ? "" : v,
                          }));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="bg-black/40 border-white/10 rounded-xl h-12">
                          <SelectValue placeholder="Semua Gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-pink-500/20">
                          <SelectItem
                            value="all"
                            className="text-white focus:bg-pink-500/20"
                          >
                            Semua Gender
                          </SelectItem>
                          <SelectItem
                            value="MALE"
                            className="text-white focus:bg-pink-500/20"
                          >
                            Male
                          </SelectItem>
                          <SelectItem
                            value="FEMALE"
                            className="text-white focus:bg-pink-500/20"
                          >
                            Female
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Account Grid */}
          {isLoadingAccounts ? (
            <div
              className="flex flex-col items-center justify-center"
              style={{ padding: "80px 0" }}
            >
              <Loader2
                className="animate-spin"
                style={{ width: 48, height: 48, color: "var(--pink)" }}
              />
              <p style={{ color: "var(--t3)", marginTop: 20, fontSize: 15 }}>
                Memuat akun-akun premium...
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                  gap: 24,
                }}
              >
                {accountsData?.accounts?.map((acc: Account) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    onCopy={handleCopyId}
                  />
                ))}
              </div>
              {accountsData?.accounts?.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ebox"
                >
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 24,
                      background: "rgba(255,77,140,0.08)",
                      border: "1px solid rgba(255,77,140,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 28px",
                    }}
                  >
                    <AlertCircle
                      size={36}
                      style={{ color: "rgba(255,77,140,0.4)" }}
                    />
                  </div>
                  <h3
                    className="ff-display"
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    Tidak Ada Akun Ditemukan
                  </h3>
                  <p style={{ color: "var(--t3)", fontSize: 15 }}>
                    Coba ubah filter atau cari kata kunci yang berbeda
                  </p>
                </motion.div>
              )}
              {accountsData?.pagination?.totalPages > 1 && (
                <div
                  className="flex items-center justify-center gap-5"
                  style={{ paddingTop: 32 }}
                >
                  <button
                    className="pg-b"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span
                    className="ff-body text-sm"
                    style={{ color: "var(--t2)" }}
                  >
                    Halaman{" "}
                    <span style={{ color: "var(--pink)", fontWeight: 700 }}>
                      {page}
                    </span>{" "}
                    dari {accountsData.pagination.totalPages}
                  </span>
                  <button
                    className="pg-b"
                    disabled={page >= accountsData.pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
