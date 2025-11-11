import React, { useState } from 'react';
import axios from 'axios';

export default function AutoMarkAbsent() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleAutoMarkAbsent = async () => {
    if (!window.confirm(
      '⚠️ AUTO-MARK ABSENT\n\n' +
      'This will automatically mark the OLDEST locked entry as ABSENT for every 3 locked entries.\n\n' +
      'Rules:\n' +
      '- Only counts truly locked entries (not approved unlocks)\n' +
      '- Already absent entries are never re-processed\n' +
      '- For every 3 locked entries, 1st entry becomes absent\n\n' +
      'Are you sure you want to proceed?'
    )) {
      return;
    }

    try {
      setLoading(true);
      setMessage('⏳ Processing...');
      setResults([]);
      setShowResults(false);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/timesheets/auto-mark-absent',
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { marked_count, details } = response.data;

      if (marked_count === 0) {
        setMessage('✅ No entries needed to be marked absent. All users have less than 3 locked entries.');
      } else {
        setMessage(`✅ Success! Marked ${marked_count} entries as absent.`);
        setResults(details || []);
        setShowResults(true);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessage(`❌ Error: ${error.response?.data?.detail || 'Failed to mark entries as absent'}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626, #991b1b)',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        color: '#fff'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
          ❌ Auto-Mark Absent (3 Locked = 1 Absent)
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.9 }}>
          Automatically mark the oldest locked entry as absent for every 3 locked entries
        </p>
      </div>

      {/* Info Box */}
      <div style={{
        backgroundColor: '#FEF3C7',
        border: '2px solid #FCD34D',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#92400E' }}>
          📋 How It Works
        </h3>
        <ul style={{ fontSize: '14px', color: '#92400E', marginBottom: '0', lineHeight: '1.8' }}>
          <li>For every <strong>3 locked entries</strong> (without approved unlock), the <strong>oldest entry</strong> is marked as absent</li>
          <li>Already absent entries are <strong>never re-evaluated</strong></li>
          <li>Entries with <strong>approved unlock requests</strong> are excluded from the count</li>
          <li>This process runs <strong>automatically every night at 11:59 PM</strong></li>
          <li>You can also <strong>trigger manually</strong> using the button below</li>
        </ul>
      </div>

      {/* Example Box */}
      <div style={{
        backgroundColor: '#EFF6FF',
        border: '2px solid #3B82F6',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1E40AF' }}>
          💡 Example
        </h3>
        <div style={{ fontSize: '14px', color: '#1E40AF', lineHeight: '1.8' }}>
          <p style={{ margin: '8px 0' }}>
            <strong>User has locked entries on:</strong> Nov 1, Nov 5, Nov 9
          </p>
          <p style={{ margin: '8px 0' }}>
            ➡️ <strong>Result:</strong> Nov 1 is marked as absent
          </p>
          <p style={{ margin: '8px 0', paddingTop: '12px', borderTop: '1px solid #BFDBFE' }}>
            <strong>If 3 more get locked:</strong> Nov 11, Nov 14, Nov 17
          </p>
          <p style={{ margin: '8px 0' }}>
            ➡️ <strong>Result:</strong> Nov 5 is marked as absent (next oldest from previous batch)
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <button
          onClick={handleAutoMarkAbsent}
          disabled={loading}
          style={{
            padding: '14px 28px',
            backgroundColor: loading ? '#9CA3AF' : '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.backgroundColor = '#991B1B';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.backgroundColor = '#DC2626';
          }}
        >
          {loading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>🔴</span>
              <span>Run Auto-Mark Absent</span>
            </>
          )}
        </button>
        
        {message && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: message.includes('❌') ? '#FEE2E2' : '#D1FAE5',
            border: `2px solid ${message.includes('❌') ? '#FECACA' : '#6EE7B7'}`,
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '500',
            color: message.includes('❌') ? '#991B1B' : '#065F46',
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Results Table */}
      {showResults && results.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>
            📊 Marked Absent - Details
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>#</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Employee</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #E5E7EB',
                    transition: 'background-color 0.2s',
                  }}>
                    <td style={{ padding: '12px' }}>{index + 1}</td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{result.user_name}</td>
                    <td style={{ padding: '12px', color: '#64748B' }}>{result.user_email}</td>
                    <td style={{ padding: '12px' }}>{new Date(result.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: '#FEE2E2',
                        color: '#991B1B',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}>
                        ❌ Marked Absent
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Info */}
      <div style={{
        backgroundColor: '#F3F4F6',
        border: '1px solid #D1D5DB',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '24px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
          🕐 Scheduled Execution
        </h3>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: '0' }}>
          This process runs <strong>automatically every night at 11:59 PM</strong>. 
          The manual trigger above allows you to run it on-demand for immediate results.
        </p>
      </div>
    </div>
  );
}
