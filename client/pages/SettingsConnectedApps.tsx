import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function SettingsConnectedApps(){ const nav=useNavigate(); useEffect(()=>{ nav("/settings?tab=manage",{replace:true}); },[nav]); return null; }
