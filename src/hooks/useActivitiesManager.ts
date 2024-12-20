import { useState } from 'react';
import { Activity } from '../types/activity';
import { MOCK_ACTIVITIES } from '../data/mockActivities';

export function useActivitiesManager() {
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);

  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
  };

  const deleteActivity = (activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId));
  };

  return {
    activities,
    addActivity,
    deleteActivity
  };
}