import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function SettingsAccountDelete(){ const nav=useNavigate(); useEffect(()=>{ nav("/settings?tab=account",{replace:true}); },[nav]); return null; }
