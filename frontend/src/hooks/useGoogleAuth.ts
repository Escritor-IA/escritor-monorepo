import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { CredentialResponse } from "@react-oauth/google";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";

type GoogleAuthSuccess = { access: string; refresh: string; user: User; is_new_user: boolean };

export function useGoogleAuth() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useTranslation();

  const [linkEmail, setLinkEmail] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const pendingCredential = useRef<string | null>(null);

  const finishLogin = (data: GoogleAuthSuccess) => {
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    setUser(data.user);
    navigate(data.is_new_user ? "/select-plan" : "/dashboard");
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setError("");
    try {
      const { data } = await authApi.googleAuth({ credential: credentialResponse.credential });
      if ("link_required" in data) {
        pendingCredential.current = credentialResponse.credential;
        setLinkEmail(data.email);
        return;
      }
      finishLogin(data);
    } catch {
      setError(t("auth.google.error"));
    }
  };

  const handleGoogleError = () => {
    setError(t("auth.google.error"));
  };

  const confirmLink = async () => {
    if (!pendingCredential.current) return;
    setLinking(true);
    try {
      const { data } = await authApi.googleAuth({
        credential: pendingCredential.current,
        confirm_link: true,
      });
      if (!("link_required" in data)) finishLogin(data);
    } catch {
      setError(t("auth.google.error"));
    } finally {
      setLinking(false);
      setLinkEmail(null);
      pendingCredential.current = null;
    }
  };

  const cancelLink = () => {
    setLinkEmail(null);
    pendingCredential.current = null;
    navigate("/login");
  };

  return { handleGoogleSuccess, handleGoogleError, linkEmail, linking, confirmLink, cancelLink, error };
}
