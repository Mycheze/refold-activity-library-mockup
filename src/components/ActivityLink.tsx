import { useState } from 'react';

interface Activity {
  [key: string]: string;
}

interface ActivityLinkProps {
  activity: Activity;
  children: React.ReactNode;
}

const ActivityLink = ({ activity, children }: ActivityLinkProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Determine if this is a tool or activity based on Library field
    const isTool = activity.Library === 'Tools';
    const url = isTool ? `/tool/${activity.id}` : `/activity/${activity.id}`;
    
    window.open(url, '_blank');
  };

  const phases = activity['Refold Phase(s)'] 
    ? activity['Refold Phase(s)'].split(/;+/).map(p => p.trim()).filter(Boolean)
    : [];

  const isTool = activity.Library === 'Tools';

  return (
    <span className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="underline hover:no-underline transition-all duration-200 cursor-pointer"
        style={{ color: isTool ? '#F97316' : '#8B5CF6' }} // Orange for tools, purple for activities
      >
        {children}
      </button>
      
      {showTooltip && (
        <div 
          className="absolute z-50 p-3 bg-white border rounded-lg shadow-xl w-80 -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full"
          style={{ borderColor: '#D1D5DB' }}
        >
          {/* Tooltip arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white'
            }}
          />
          
          <div className="space-y-2">
            <h4 className="font-bold text-sm" style={{ color: '#230E77' }}>
              {activity['Display Name'] || activity['code name']}
            </h4>
            
            <p className="text-xs text-gray-700 leading-relaxed">
              {activity['Short Description']}
            </p>
            
            <div className="flex flex-wrap gap-1">
              {activity['Type'] && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium" 
                  style={{ 
                    backgroundColor: isTool ? '#FB923C' : '#F3CE5B', 
                    color: isTool ? '#FFFFFE' : '#230E77' 
                  }}
                >
                  {activity['Type']}
                </span>
              )}
              {isTool ? (
                <>
                  {activity['Platform'] && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#F97316', color: '#FFFFFE' }}>
                      {activity['Platform']}
                    </span>
                  )}
                  {activity['Pricing'] && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#FDBA74', color: '#230E77' }}>
                      {activity['Pricing']}
                    </span>
                  )}
                </>
              ) : (
                <>
                  {activity['Pillar'] && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#6544E9', color: '#FFFFFE' }}>
                      {activity['Pillar']}
                    </span>
                  )}
                  {phases.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#BFB2F6', color: '#230E77' }}>
                      Phase {p}
                    </span>
                  ))}
                </>
              )}
            </div>
            
            <p className="text-xs text-gray-500 italic">
              Click to see in detail
            </p>
          </div>
        </div>
      )}
    </span>
  );
};

export default ActivityLink;