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

export default function MobileCRM() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');

  const [leads, setLeads] = useState([]);
  const [originalLeads, setOriginalLeads] = useState({}); // To track exactly what changed

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Initial fetch of files
  useEffect(() => {
    fetch(`/api/files?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data.files && data.files.length > 0) {
          setFiles(data.files);
          setSelectedFile(''); // Force user to pick
        }
      });
  }, []);

  // Fetch leads when file is selected
  useEffect(() => {
    if (selectedFile) {
      setLoading(true);
      fetch(`/api/leads?file=${encodeURIComponent(selectedFile)}&t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setLeads(data.data);

            // Store a deep copy snapshot of the original data keyed by ID
            const originalMap = {};
            data.data.forEach(lead => {
              originalMap[lead.id] = { Status: lead.Status, Notes: lead.Notes };
            });
            setOriginalLeads(originalMap);
          }
          setLoading(false);
        });
    }
  }, [selectedFile]);

  // Handle Input Changes
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

  // Optimized Save Function
  const handleSave = async () => {
    // 1. Identify only the leads that actually changed
    const modifiedLeads = leads.filter(lead => {
      const orig = originalLeads[lead.id];
      if (!orig) return true; // somehow new?
      return orig.Status !== lead.Status || orig.Notes !== lead.Notes;
    });

    if (modifiedLeads.length === 0) {
      showToast("No changes to save!");
      return;
    }

    setSaving(true);
    try {
      // 2. Send ONLY the modified rows, so Vercel does not timeout
      const res = await fetch(`/api/leads?file=${encodeURIComponent(selectedFile)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: modifiedLeads })
      });

      const result = await res.json();
      if (result.success) {
        showToast(`Saved ${modifiedLeads.length} updates!`);

        // Update our original tracker so it resets the "changed" state
        const newOriginals = { ...originalLeads };
        modifiedLeads.forEach(lead => {
          newOriginals[lead.id] = { Status: lead.Status, Notes: lead.Notes };
        });
        setOriginalLeads(newOriginals);

      } else {
        alert("Error saving: " + result.error);
      }
    } catch (error) {
      alert("Network error while saving.");
    }
    setSaving(false);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Format Helpers
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

  // Check if a specific card has unsaved changes to show a visual indicator
  const hasChanged = (lead) => {
    const orig = originalLeads[lead.id];
    if (!orig) return false;
    return orig.Status !== lead.Status || orig.Notes !== lead.Notes;
  };

  const contacted = leads.filter(l => l.Status && l.Status !== "Not Called").length;
  const accepted = leads.filter(l => l.Status === "Offer Accepted / Closed").length;

  return (
    <div className="mobile-layout">
      {toast && <div className="toast">{toast}</div>}

      {/* Sticky Header */}
      <header className="mobile-header">
        <h1 className="brand-title">CRM Outreach</h1>
        <select
          className="file-select"
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
        >
          <option value="" disabled>📁 Select a playbook...</option>
          {files.map(f => (
            <option key={f} value={f}>{f.replace('.csv', '')}</option>
          ))}
        </select>
      </header>

      {/* Main Content Area */}
      <main className="mobile-content">
        {!selectedFile ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>
            <p>Please select a lead list from the dropdown above to begin calling.</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--accent)' }}>
            <h2>Loading Leads...</h2>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="stats-container">
              <div className="stat-box">
                <div className="stat-label">Total</div>
                <div className="stat-value">{leads.length}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Contacted</div>
                <div className="stat-value">{contacted}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Success</div>
                <div className="stat-value">{accepted}</div>
              </div>
            </div>

            {/* List of Mobile Cards */}
            {leads.map((lead, index) => {
              const changed = hasChanged(lead);

              return (
                <div key={lead.id} className="lead-card" style={{ position: 'relative' }}>
                  {changed && <div className="changed-indicator" title="Unsaved changes"></div>}

                  <div className="card-header">
                    <h3 className="card-title">
                      {lead['Firm/Professional Name'] || lead['Hospital/Clinic Name'] || lead.Name || 'Unknown'}
                    </h3>
                    <span className="card-srno">#{index + 1}</span>
                  </div>

                  <div className="card-contact">
                    {lead['Mobile Number'] && lead['Mobile Number'] !== 'N/A' ? (
                      <a href={getTelLink(lead['Mobile Number'])} className="phone-link">
                        📞 {formatDisplayPhone(lead['Mobile Number'])}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                    )}

                    {lead['Mobile Number'] && lead['Mobile Number'] !== 'N/A' && (
                      <a
                        href={getWhatsAppLink(lead['Mobile Number'])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Outreach Status</label>
                    <select
                      className="status-select"
                      value={lead.Status}
                      onChange={(e) => handleStatusChange(index, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Call Notes</label>
                    <input
                      type="text"
                      className="notes-input"
                      placeholder="Add conversation notes..."
                      value={lead.Notes}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>

      {/* Floating Save Button */}
      {leads.length > 0 && !loading && (
        <footer className="mobile-footer">
          <button className="save-fab" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving Updates...' : '💾 Save Changes'}
          </button>
        </footer>
      )}
    </div>
  );
}
