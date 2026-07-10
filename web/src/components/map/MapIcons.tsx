import React from 'react';

// Define common properties for consistent styling with website theme
const iconSize = 24;
const primaryColor = '#3ecf8e'; // Main brand green
// const goldColor = 'hsl(43, 80%, 88%)'; // Gold/cream color from website
const strokeWidth = 2;
const iconStyle = { display: 'block' };

export const LocationIcon = () => (
  <svg 
    width={iconSize} 
    height={iconSize} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={primaryColor} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={iconStyle}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

export const LayersIcon = () => (
  <svg 
    width={iconSize} 
    height={iconSize} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={primaryColor} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={iconStyle}
  >
    <polygon points="1 6 12 12 23 6 12 0 1 6"></polygon>
    <polyline points="1 16 12 22 23 16"></polyline>
    <polyline points="1 11 12 17 23 11"></polyline>
  </svg>
);
