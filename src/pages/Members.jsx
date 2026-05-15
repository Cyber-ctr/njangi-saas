import React from 'react';
import { Search, Filter, ShieldCheck, ShieldAlert, MoreVertical } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import './Members.css';

const Members = () => {
  // Mock ML Risk Factors (1.0 is highest risk, 0.0 is zero risk)
  const members = [
    { id: 1, name: 'John Doe', email: 'john@example.com', joined: 'Jan 2026', status: 'Active', riskScore: 0.05, turn: 4 },
    { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', joined: 'Feb 2026', status: 'Active', riskScore: 0.12, turn: 2 },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', joined: 'Jan 2026', status: 'Active', riskScore: 0.85, turn: 5 },
    { id: 4, name: 'Emma Davis', email: 'emma@example.com', joined: 'Mar 2026', status: 'Active', riskScore: 0.02, turn: 1 },
    { id: 5, name: 'David Wilson', email: 'david@example.com', joined: 'Feb 2026', status: 'Active', riskScore: 0.45, turn: 3 },
  ];

  const getRiskIndicator = (score) => {
    if (score < 0.2) return { color: 'var(--success)', text: 'Low Risk', icon: <ShieldCheck size={16} /> };
    if (score < 0.6) return { color: 'var(--warning)', text: 'Medium Risk', icon: <ShieldAlert size={16} /> };
    return { color: 'var(--danger)', text: 'High Risk', icon: <ShieldAlert size={16} /> };
  };

  return (
    <div className="members-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-gradient">Group Members</h2>
          <p className="subtitle">Manage members and view ML-powered reliability scores</p>
        </div>
        <button className="btn btn-primary">+ Add Member</button>
      </div>

      <GlassCard className="members-table-container">
        <div className="table-controls">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search members..." />
          </div>
          <button className="btn btn-glass btn-sm">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="table-responsive">
          <table className="members-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Joined</th>
                <th>Turn</th>
                <th>Reliability (ML)</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const risk = getRiskIndicator(member.riskScore);
                return (
                  <tr key={member.id}>
                    <td>
                      <div className="member-info-cell">
                        <div className="member-avatar">{member.name.charAt(0)}</div>
                        <div>
                          <div className="member-name">{member.name}</div>
                          <div className="member-email">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{member.joined}</td>
                    <td>Round {member.turn}</td>
                    <td>
                      <div className="risk-indicator" style={{ color: risk.color }}>
                        {risk.icon}
                        <span>{risk.text} ({(1 - member.riskScore).toFixed(2)})</span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge active">{member.status}</span>
                    </td>
                    <td>
                      <button className="btn-icon">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default Members;
