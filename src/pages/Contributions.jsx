import React from 'react';
import { DollarSign, Check, Clock, Plus } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import './Contributions.css';

const Contributions = () => {
  const contributions = [
    { id: 1, member: 'John Doe', amount: 500, date: '2026-05-15', status: 'paid' },
    { id: 2, member: 'Sarah Smith', amount: 500, date: '2026-05-14', status: 'paid' },
    { id: 3, member: 'David Wilson', amount: 500, date: '2026-05-15', status: 'pending' },
    { id: 4, member: 'Emma Davis', amount: 500, date: '2026-05-12', status: 'paid' },
    { id: 5, member: 'Mike Johnson', amount: 500, date: '2026-05-16', status: 'upcoming' },
  ];

  return (
    <div className="contributions-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-gradient">Contributions</h2>
          <p className="subtitle">Track and manage group payments for Round 5</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Record Payment
        </button>
      </div>

      <div className="contributions-overview">
        <GlassCard className="overview-card">
          <div className="overview-icon bg-primary-light">
            <DollarSign size={24} className="text-primary" />
          </div>
          <div className="overview-info">
            <span className="overview-label">Total Expected</span>
            <h3 className="overview-value">$12,500</h3>
          </div>
        </GlassCard>
        
        <GlassCard className="overview-card">
          <div className="overview-icon bg-success-light">
            <Check size={24} className="text-success" />
          </div>
          <div className="overview-info">
            <span className="overview-label">Collected</span>
            <h3 className="overview-value">$10,000</h3>
          </div>
        </GlassCard>

        <GlassCard className="overview-card">
          <div className="overview-icon bg-warning-light">
            <Clock size={24} className="text-warning" />
          </div>
          <div className="overview-info">
            <span className="overview-label">Pending</span>
            <h3 className="overview-value">$2,500</h3>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="contributions-list">
        <div className="list-header">
          <h3>Recent Payments</h3>
        </div>
        
        <div className="list-container">
          {contributions.map((item) => (
            <div key={item.id} className="contribution-item">
              <div className="item-main">
                <div className="item-avatar">{item.member.charAt(0)}</div>
                <div>
                  <h4 className="item-name">{item.member}</h4>
                  <span className="item-date">{item.date}</span>
                </div>
              </div>
              <div className="item-details">
                <span className="item-amount">${item.amount}</span>
                <span className={`status-badge ${item.status}`}>
                  {item.status}
                </span>
                <button className="btn btn-glass btn-sm">Receipt</button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default Contributions;
