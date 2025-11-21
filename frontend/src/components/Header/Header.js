import React from "react";
import "./Header.css";

const Header = ({ syncStatus, onSettingsClick, onRefresh, syncing, loading, user, onLogout }) => {
  return (
    <header className="header">
      <div>
        <h1>🏃 Training Dashboard</h1>
        {syncStatus && (
          <p className="sync-info">
            Last sync:{" "}
            {syncStatus.lastSyncTime
              ? new Date(syncStatus.lastSyncTime).toLocaleString()
              : "Never"}
            {syncStatus.mostRecentDataDate && (
              <span>
                {" "}
                • Most recent data: {syncStatus.mostRecentDataDate}
              </span>
            )}
          </p>
        )}
      </div>
      <div className="header-actions">
        {user && (
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            {user.subscription_tier && user.subscription_tier !== 'free' && (
              <span className="subscription-badge">{user.subscription_tier}</span>
            )}
          </div>
        )}
        <button
          onClick={onSettingsClick}
          className="settings-btn"
          title="Settings"
        >
          ⚙️
        </button>
        <button
          onClick={onRefresh}
          className="refresh-btn"
          disabled={syncing || loading}
        >
          {syncing
            ? "Syncing..."
            : loading
            ? "Loading..."
            : "Sync & Refresh"}
        </button>
        {user && onLogout && (
          <button
            onClick={onLogout}
            className="logout-btn"
            title="Logout"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

