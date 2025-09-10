import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function DirectThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    if (id) navigate(`/messages?to=${encodeURIComponent(id)}`, { replace: true });
  }, [id, navigate]);
  return null;
}
