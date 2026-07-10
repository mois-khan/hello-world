import React, { useState } from 'react';

// Define icons
export const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export const ClearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

interface AreaFilterRange {
  label: string;
  minValue: number | null;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  minAreaFilter: number | '';
  onMinAreaFilterChange: (value: number | '') => void;
  ownerNameFilter: string;
  onOwnerNameFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  minAreaFilter,
  onMinAreaFilterChange,
  ownerNameFilter,
  onOwnerNameFilterChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  const areaRanges: AreaFilterRange[] = [
    { label: 'Any Size', minValue: null },
    { label: 'Small (< 1000 sq ft)', minValue: 0 },
    { label: 'Medium (1000+ sq ft)', minValue: 1000 },
    { label: 'Large (5000+ sq ft)', minValue: 5000 },
  ];
  
  const statusRanges = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'Active' },
    { label: 'In Transfer', value: 'InTransfer' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '10px',
        position: 'relative',
        zIndex: 1500,
      }}>
        {/* Property Size Filter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(17, 32, 24, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '0 12px',
          height: 40,
          position: 'relative',
        }}>
          <label style={{ fontSize: '13px', marginRight: '4px', fontWeight: 500, color: 'hsl(43, 80%, 88%)', fontFamily: '"Playfair Display", serif' }}>Size:</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div 
              onClick={() => {
                setShowAreaDropdown(!showAreaDropdown);
                setShowStatusDropdown(false);
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '140px',
                color: '#3ecf8e',
                fontSize: 13,
                fontFamily: '"Playfair Display", serif',
              }}
            >
              <span>
                {minAreaFilter === '' 
                  ? 'Any Size' 
                  : areaRanges.find(range => range.minValue === minAreaFilter)?.label || `${minAreaFilter}+ sq ft`}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {showAreaDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                background: 'rgba(17, 32, 24, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 2000,
                width: '180px',
                overflow: 'hidden',
              }}>
                {areaRanges.map((range, index) => (
                  <div 
                    key={index}
                    onClick={() => {
                      onMinAreaFilterChange(range.minValue === null ? '' : range.minValue);
                      setShowAreaDropdown(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: (range.minValue === null && minAreaFilter === '') || range.minValue === minAreaFilter 
                        ? '#3ecf8e' 
                        : 'rgba(255, 255, 255, 0.8)',
                      background: (range.minValue === null && minAreaFilter === '') || range.minValue === minAreaFilter 
                        ? 'rgba(62, 207, 142, 0.1)' 
                        : 'transparent',
                      borderLeft: (range.minValue === null && minAreaFilter === '') || range.minValue === minAreaFilter 
                        ? '2px solid #3ecf8e' 
                        : '2px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(62, 207, 142, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      if ((range.minValue === null && minAreaFilter === '') || range.minValue === minAreaFilter) {
                        e.currentTarget.style.background = 'rgba(62, 207, 142, 0.1)';
                      } else {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {range.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(17, 32, 24, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '0 12px',
          height: 40,
          position: 'relative',
        }}>
          <label style={{ fontSize: '13px', marginRight: '4px', fontWeight: 500, color: 'hsl(43, 80%, 88%)', fontFamily: '"Playfair Display", serif' }}>Status:</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div 
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowAreaDropdown(false);
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '120px',
                color: '#3ecf8e',
                fontSize: 13,
                fontFamily: '"Playfair Display", serif',
              }}
            >
              <span>
                {statusFilter === '' 
                  ? 'All Statuses' 
                  : statusRanges.find(range => range.value === statusFilter)?.label || statusFilter}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {showStatusDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                background: 'rgba(17, 32, 24, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 2000,
                width: '180px',
                overflow: 'hidden',
              }}>
                {statusRanges.map((range, index) => (
                  <div 
                    key={index}
                    onClick={() => {
                      onStatusFilterChange(range.value);
                      setShowStatusDropdown(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: range.value === statusFilter 
                        ? '#3ecf8e' 
                        : 'rgba(255, 255, 255, 0.8)',
                      background: range.value === statusFilter 
                        ? 'rgba(62, 207, 142, 0.1)' 
                        : 'transparent',
                      borderLeft: range.value === statusFilter 
                        ? '2px solid #3ecf8e' 
                        : '2px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(62, 207, 142, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      if (range.value === statusFilter) {
                        e.currentTarget.style.background = 'rgba(62, 207, 142, 0.1)';
                      } else {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {range.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Owner Name Filter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(17, 32, 24, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '0 12px',
          height: 40,
          position: 'relative',
          zIndex: 1500
        }}>
          <label htmlFor="owner-filter" style={{ fontSize: '13px', marginRight: '4px', fontWeight: 500, color: 'hsl(43, 80%, 88%)', fontFamily: '"Playfair Display", serif' }}>Owner:</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="owner-filter"
              type="text"
              value={ownerNameFilter}
              onChange={(e) => onOwnerNameFilterChange(e.target.value)}
              style={{
                width: '120px',
                padding: '4px',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: '#3ecf8e',
                fontSize: 13,
                fontFamily: '"Playfair Display", serif',
              }}
              placeholder="Enter name"
            />
            {ownerNameFilter && (
              <button
                type="button"
                onClick={() => onOwnerNameFilterChange('')}
                style={{
                  position: 'absolute',
                  right: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.2s ease',
                  padding: '4px',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#3ecf8e';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Clear owner name"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(17, 32, 24, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '0 16px',
        height: 56,
        position: 'relative',
      }}>
        <div style={{ position: 'relative', flexGrow: 1 }}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search for a district or survey number..."
            style={{
              width: '100%',
              padding: '8px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'hsl(43, 80%, 88%)',
              fontSize: 16,
              fontFamily: '"Playfair Display", serif',
            }}
          />
        </div>
        <div style={{ color: '#3ecf8e', marginLeft: 8 }}>
          <SearchIcon />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
