import React from 'react';
import { DollarSign, Users, Target, Activity } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import './Dashboard.css';

const Dashboard = () => {
  const stats = [
    { label: 'Current Pot', value: '$12,500', icon: <DollarSign size={24} />, color: 'var(--primary)' },
    { label: 'Total Members', value: '25', icon: <Users size={24} />, color: 'var(--success)' },
    { label: 'Completion', value: '40%', icon: <Target size={24} />, color: 'var(--warning)' },
    { label: 'Next Payout', value: '$2,500', icon: <Activity size={24} />, color: 'var(--secondary)' }
  ];

  const recentTransactions = [
    { id: 1, user: 'John Doe', amount: '$500', date: 'Today, 10:30 AM', status: 'Completed' },
    { id: 2, user: 'Sarah Smith', amount: '$500', date: 'Yesterday, 2:15 PM', status: 'Completed' },
    { id: 3, user: 'Mike Johnson', amount: '$500', date: 'May 12, 9:00 AM', status: 'Pending' },
    { id: 4, user: 'Emma Davis', amount: '$500', date: 'May 11, 4:45 PM', status: 'Completed' }
  ];

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <GlassCard key={index} className="stat-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}33`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-details">
              <span className="stat-label">{stat.label}</span>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="dashboard-content">
        <GlassCard className="main-panel animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="panel-header">
            <h3>Recent Contributions</h3>
            <button className="btn btn-glass btn-sm">View All</button>
          </div>
          
          <div className="transactions-list">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-user">
                  <div className="tx-avatar">{tx.user.charAt(0)}</div>
                  <div className="tx-info">
                    <h4>{tx.user}</h4>
                    <span>{tx.date}</span>
                  </div>
                </div>
                <div className="tx-amount-status">
                  <span className="tx-amount">{tx.amount}</span>
                  <span className={`status-badge ${tx.status.toLowerCase()}`}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="side-panel animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="panel-header">
            <h3>Next Recipient</h3>
          </div>
          
          <div className="recipient-card">
            <div className="recipient-avatar">
              <Users size={32} />
            </div>
            <h4>David Wilson</h4>
            <p className="payout-date">Payout on May 20, 2026</p>
            
            <div className="progress-container">
              <div className="progress-label">
                <span>Pot Collected</span>
                <span>80%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '80%' }}></div>
              </div>
            </div>
            
            <button className="btn btn-primary w-full mt-4">Remind Pending Members</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;
