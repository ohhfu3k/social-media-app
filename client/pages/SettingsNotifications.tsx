import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function SettingsNotifications(){ const nav=useNavigate(); useEffect(()=>{ nav("/settings?tab=notifications",{replace:true}); },[nav]); return null; }
