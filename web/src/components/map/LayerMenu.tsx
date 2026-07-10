import React from 'react';
import { BASEMAPS, MAP_PREVIEWS } from './constants';
import { LayersIcon } from './MapIcons';

interface LayerMenuProps {
  currentBaseMap: string;
  onBaseMapChange: (key: string) => void;
  showLayerMenu: boolean;
  onToggleLayerMenu: () => void;
  layerMenuRef: React.RefObject<HTMLDivElement>;
}

const LayerMenu: React.FC<LayerMenuProps> = ({
  currentBaseMap,
  onBaseMapChange,
  showLayerMenu,
  onToggleLayerMenu,
  layerMenuRef
}) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 10,
      zIndex: 1100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start'
    }}>
      <button
        onClick={onToggleLayerMenu}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'rgba(17, 32, 24, 0.8)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          border: '1px solid rgba(62, 207, 142, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginBottom: 6,
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
          e.currentTarget.style.borderColor = 'hsl(43, 80%, 88%)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)';
          e.currentTarget.style.borderColor = 'rgba(62, 207, 142, 0.5)';
        }}
        aria-label="Layers"
      >
        <LayersIcon />
      </button>
      {showLayerMenu && (
        <div
          ref={layerMenuRef}
          style={{
            background: 'rgba(17, 32, 24, 0.9)',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            border: '1px solid rgba(62, 207, 142, 0.5)',
            padding: '10px',
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
            width: 'auto'
          }}
        >
          {BASEMAPS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                onBaseMapChange(key);
                onToggleLayerMenu();
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'transparent',
                border: currentBaseMap === key ? '2px solid rgba(62, 207, 142, 0.8)' : '2px solid transparent',
                borderRadius: 8,
                padding: 0,
                cursor: 'pointer',
                width: 70,
                overflow: 'hidden'
              }}
            >
              <div style={{
                width: '100%',
                height: 50,
                backgroundImage: `url(${MAP_PREVIEWS[key as keyof typeof MAP_PREVIEWS]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                border: currentBaseMap === key ? '1px solid rgba(62, 207, 142, 0.8)' : '1px solid rgba(255,255,255,0.1)',
                boxSizing: 'border-box'
              }} />
              <span style={{ 
                fontSize: 11, 
                padding: '4px 0',
                color: 'hsl(43, 80%, 88%)',
                width: '100%',
                textAlign: 'center',
                backgroundColor: currentBaseMap === key ? 'rgba(62, 207, 142, 0.2)' : 'transparent'
              }}>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LayerMenu;
