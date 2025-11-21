import React from "react";
import "./Error.css";

const Error = ({ error, onRetry }) => {
  return (
    <div className="App">
      <div className="container">
        <h1>Garmin Data Dashboard</h1>
        <div className="error">
          <p>Error: {error}</p>
          <p>Make sure the backend server is running on http://localhost:3000</p>
          {onRetry && <button onClick={onRetry}>Retry</button>}
        </div>
      </div>
    </div>
  );
};

export default Error;

