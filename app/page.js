"use client";
import React, { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
  "Not Called",
  "Called - No Answer",
  "Called - Not Interested",
  "Called - Call Back Later",
  "Called - Meeting Booked",
  "Follow Up",
  "Hold",
  "Offer Accepted / Closed"
];

export default function CRMDashboard() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        if (data.files) {
          setFiles(data.files);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedFile) {
      setLoading(true);
      fetch(`/api/leads?file=${encodeURIComponent(selectedFile)}`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setLeads(data.data);
          }
          setLoading(false);
        });
    }
  }, [selectedFile]);

  const handleStatusChange = (index, value) => {
    const newLeads = [...leads];
    newLeads[index].Status = value;
    setLeads(newLeads);
  };

  const handleNotesChange = (index, value) => {
    const newLeads = [...leads];
    newLeads[index].Notes = value;
    setLeads(newLeads);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads?file=${encodeURIComponent(selectedFile)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: leads })
      });
      const result = await res.json();
      if (result.success) {
        showToast("Changes saved successfully!");
      } else {
        alert("Error saving file: " + result.error);
      }
    } catch (error) {
      alert("Error saving file.");
    }
    setSaving(false);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const getWhatsAppLink = (phone) => {
    if (!phone || phone === "N/A") return "#";
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

  const formatDisplayPhone = (phone) => {
    if (!phone || phone === "N/A") return "N/A";
    return phone.replace(/^'/, '');
  };

  const getTelLink = (phone) => {
    if (!phone || phone === "N/A") return "#";
    const cleanNumber = phone.replace(/[^\d+]/g, '');
    return `tel:${cleanNumber}`;
  };

  const totalLeads = leads.length;
  const contacted = leads.filter(l => l.Status && l.Status !== "Not Called").length;
  const accepted = leads.filter(l => l.Status === "Offer Accepted / Closed").length;

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--accent)' }}>📂 Playbooks</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Select a targeted lead list to begin outreach.
          </p>
        </div>

        {files.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--danger)' }}>No CSV files found in 'client checklist' folder.</div>
        ) : (
          files.map(f => (
            <button
              key={f}
              className={`file-btn ${selectedFile === f ? 'active' : ''}`}
              onClick={() => setSelectedFile(f)}
            >
              📄 {f}
            </button>
          ))
        )}
      </aside>

      {/* Main Content */}
      <main className="content">
        {!selectedFile ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '64px' }}>
            <h1>Ultimate Web CRM</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
              Select a lead list from the sidebar to start tracking your calls and WhatsApp outreach.
            </p>
          </div>
        ) : (
          <div>
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1>Database: {selectedFile.replace('.csv', '')}</h1>
                  <p style={{ color: 'var(--text-secondary)' }}>Track connection status and send automated WhatsApp messages.</p>
                </div>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ Saving...' : '💾 Save Changes to CSV'}
                </button>
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-label">TOTAL LEADS</div>
                  <div className="stat-value">{totalLeads}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">CONTACTED</div>
                  <div className="stat-value">{contacted}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">OFFERS ACCEPTED</div>
                  <div className="stat-value">{accepted}</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ marginTop: '32px', textAlign: 'center', color: 'var(--accent)' }}>Leads loading...</div>
            ) : (
              <div className="table-container glass-panel" style={{ marginTop: '24px', padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Sr. No.</th>
                      <th>Firm Name</th>
                      <th>Mobile</th>
                      <th>WhatsApp</th>
                      <th>Outreach Status</th>
                      <th>Notes / Next Steps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, index) => (
                      <tr key={lead.id}>
                        <td style={{ color: 'var(--text-secondary)' }}>{index + 1}</td>
                        <td style={{ fontWeight: 500 }}>{lead['Firm/Professional Name'] || lead['Hospital/Clinic Name'] || lead.Name || 'Unknown'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {lead['Mobile Number'] && lead['Mobile Number'] !== 'N/A' ? (
                            <a
                              href={getTelLink(lead['Mobile Number'])}
                              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
                            >
                              📞 {formatDisplayPhone(lead['Mobile Number'])}
                            </a>
                          ) : (
                            lead['Mobile Number'] || lead.Phone || 'N/A'
                          )}
                        </td>
                        <td>
                          {lead['Mobile Number'] && lead['Mobile Number'] !== 'N/A' && (
                            <a
                              href={getWhatsAppLink(lead['Mobile Number'])}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-whatsapp"
                            >
                              💬 Message
                            </a>
                          )}
                        </td>
                        <td>
                          <select
                            className="select-status"
                            value={lead.Status}
                            onChange={(e) => handleStatusChange(index, e.target.value)}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-notes"
                            placeholder="Add call notes..."
                            value={lead.Notes}
                            onChange={(e) => handleNotesChange(index, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Save Button for long lists */}
            {!loading && leads.length > 5 && (
              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ Saving...' : '💾 Save Changes to CSV'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  );
}
