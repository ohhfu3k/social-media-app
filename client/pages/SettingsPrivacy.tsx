import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function SettingsPrivacy(){ const nav=useNavigate(); useEffect(()=>{ nav("/settings?tab=privacy",{replace:true}); },[nav]); return null; }
