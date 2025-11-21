import React, { useState, useEffect } from "react";
import "./SettingsModal.css";
import {
  getGarminStatus,
  connectGarmin,
  updateGarminCredentials,
  disconnectGarmin,
} from "../../services/garminService";

const SettingsModal = ({ settings, onSettingsChange, onClose }) => {
  const [garminStatus, setGarminStatus] = useState(null);
  const [garminLoading, setGarminLoading] = useState(true);
  const [garminEmail, setGarminEmail] = useState("");
  const [garminPassword, setGarminPassword] = useState("");
  const [garminConnecting, setGarminConnecting] = useState(false);
  const [garminError, setGarminError] = useState("");
  const [garminSuccess, setGarminSuccess] = useState("");

  useEffect(() => {
    fetchGarminStatus();
  }, []);

  const fetchGarminStatus = async () => {
    try {
      setGarminLoading(true);
      const status = await getGarminStatus();
      setGarminStatus(status);
    } catch (error) {
      console.error("Error fetching Garmin status:", error);
      setGarminStatus({ connected: false });
    } finally {
      setGarminLoading(false);
    }
  };

  const handleConnectGarmin = async (e) => {
    e.preventDefault();
    setGarminError("");
    setGarminSuccess("");
    setGarminConnecting(true);

    try {
      let result;
      if (garminStatus?.connected) {
        result = await updateGarminCredentials(garminEmail, garminPassword);
      } else {
        result = await connectGarmin(garminEmail, garminPassword, true);
      }

      if (result.success) {
        setGarminSuccess(result.message || "Garmin account connected successfully!");
        setGarminEmail("");
        setGarminPassword("");
        await fetchGarminStatus();
      } else {
        setGarminError(result.error || "Failed to connect Garmin account");
      }
    } catch (error) {
      setGarminError(error.message || "Failed to connect Garmin account");
    } finally {
      setGarminConnecting(false);
    }
  };

  const handleDisconnectGarmin = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Garmin account?")) {
      return;
    }

    setGarminError("");
    setGarminSuccess("");

    try {
      const result = await disconnectGarmin();
      if (result.success) {
        setGarminSuccess("Garmin account disconnected");
        await fetchGarminStatus();
      } else {
        setGarminError(result.error || "Failed to disconnect");
      }
    } catch (error) {
      setGarminError(error.message || "Failed to disconnect");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {/* Garmin Connection Section */}
          <div className="setting-group">
            <label className="setting-label">Garmin Connect</label>
            {garminLoading ? (
              <div className="garmin-status">Loading...</div>
            ) : garminStatus?.connected ? (
              <div className="garmin-connected">
                <div className="garmin-status-success">
                  ✅ Connected
                  {garminStatus.last_sync && (
                    <span className="last-sync">
                      Last sync: {new Date(garminStatus.last_sync).toLocaleString()}
                    </span>
                  )}
                </div>
                <form onSubmit={handleConnectGarmin} className="garmin-form">
                  <div className="form-group">
                    <label>Update Garmin Email</label>
                    <input
                      type="email"
                      value={garminEmail}
                      onChange={(e) => setGarminEmail(e.target.value)}
                      placeholder="Garmin email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Update Garmin Password</label>
                    <input
                      type="password"
                      value={garminPassword}
                      onChange={(e) => setGarminPassword(e.target.value)}
                      placeholder="Garmin password"
                    />
                  </div>
                  {(garminEmail || garminPassword) && (
                    <button
                      type="submit"
                      disabled={garminConnecting}
                      className="garmin-button"
                    >
                      {garminConnecting ? "Updating..." : "Update Credentials"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDisconnectGarmin}
                    className="garmin-disconnect-button"
                  >
                    Disconnect
                  </button>
                </form>
              </div>
            ) : (
              <div className="garmin-not-connected">
                <p>Connect your Garmin account to sync your activity data.</p>
                <form onSubmit={handleConnectGarmin} className="garmin-form">
                  <div className="form-group">
                    <label>Garmin Email</label>
                    <input
                      type="email"
                      value={garminEmail}
                      onChange={(e) => setGarminEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Garmin Password</label>
                    <input
                      type="password"
                      value={garminPassword}
                      onChange={(e) => setGarminPassword(e.target.value)}
                      placeholder="Your Garmin password"
                      required
                    />
                  </div>
                  {garminError && (
                    <div className="garmin-error">{garminError}</div>
                  )}
                  {garminSuccess && (
                    <div className="garmin-success">{garminSuccess}</div>
                  )}
                  <button
                    type="submit"
                    disabled={garminConnecting || !garminEmail || !garminPassword}
                    className="garmin-button"
                  >
                    {garminConnecting ? "Connecting..." : "Connect Garmin Account"}
                  </button>
                </form>
              </div>
            )}
          </div>

          <hr className="settings-divider" />

          <div className="setting-group">
            <label className="setting-label">Distance Unit</label>
            <div className="setting-control">
              <button
                className={`unit-toggle ${settings.unit === "km" ? "active" : ""}`}
                onClick={() => onSettingsChange({ ...settings, unit: "km" })}
              >
                Kilometers (km)
              </button>
              <button
                className={`unit-toggle ${settings.unit === "miles" ? "active" : ""}`}
                onClick={() => onSettingsChange({ ...settings, unit: "miles" })}
              >
                Miles (mi)
              </button>
            </div>
          </div>
          <div className="setting-group">
            <label className="setting-label">Week Starts On</label>
            <div className="setting-control">
              <select
                value={settings.weekStartDay || 0}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    weekStartDay: parseInt(e.target.value),
                  })
                }
                className="week-start-select"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

