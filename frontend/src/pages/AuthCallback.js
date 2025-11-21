import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Google authentication failed. Please try again.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      return;
    }

    if (token) {
      handleGoogleCallback(token)
        .then(() => {
          navigate("/");
        })
        .catch((err) => {
          setError(err.message || "Authentication failed. Please try again.");
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        });
    } else {
      setError("No authentication token received.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  }, [searchParams, navigate, handleGoogleCallback]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🏃 Training Dashboard</h1>
        {error ? (
          <>
            <div className="error-message">{error}</div>
            <p>Redirecting to login...</p>
          </>
        ) : (
          <p>Completing sign in...</p>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
