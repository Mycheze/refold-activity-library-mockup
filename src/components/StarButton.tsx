import { useStarredActivities } from '../contexts/StarredContext';

interface StarButtonProps {
  activityId: string;
  size?: 'small' | 'medium';
  className?: string;
}

const StarButton = ({ activityId, size = 'small', className = '' }: StarButtonProps) => {
  const { isStarred, toggleStar } = useStarredActivities();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStar(activityId);
  };

  const starred = isStarred(activityId);
  const iconSize = size === 'small' ? '16' : '20';
  const buttonSize = size === 'small' ? 'p-1.5' : 'p-2';

  return (
    <button
      onClick={handleClick}
      className={`${buttonSize} rounded-lg transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-300 ${className}`}
      style={{ 
        color: starred ? '#F59E0B' : '#9CA3AF'
      }}
      title={starred ? 'Remove from starred' : 'Add to starred'}
    >
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 24 24" 
        fill={starred ? 'currentColor' : 'none'}
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
      </svg>
    </button>
  );
};

export default StarButton;