interface FeedbackButtonProps {
  type: 'general' | 'activity';
  activityId?: string;
  activityName?: string;
  className?: string;
  size?: 'small' | 'medium';
}

const FeedbackButton = ({ 
  type, 
  activityId, 
  activityName, 
  className = '',
  size = 'small'
}: FeedbackButtonProps) => {
  const handleFeedbackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    let url: string;
    if (type === 'general') {
      url = 'https://form.typeform.com/to/JvsO9bHi';
    } else {
      const encodedActivityId = encodeURIComponent(activityId || '');
      const encodedActivityName = encodeURIComponent(activityName || '');
      url = `https://form.typeform.com/to/xIsKhKiZ#activity_id=${encodedActivityId}&activity_name=${encodedActivityName}`;
    }
    
    window.open(url, '_blank');
  };

  const iconSize = size === 'small' ? '14' : '16';
  const buttonSize = size === 'small' ? 'p-1.5' : 'p-2';

  return (
    <button
      onClick={handleFeedbackClick}
      className={`${buttonSize} rounded-lg transition-colors duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 ${className}`}
      style={{ color: '#6B7280' }}
      title={type === 'general' ? 'General feedback' : 'Activity feedback'}
    >
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </button>
  );
};

export default FeedbackButton;