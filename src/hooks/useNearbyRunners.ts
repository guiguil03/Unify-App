import { useState, useEffect } from 'react';
import { RunnersService } from '../services/RunnersService';
import { Runner } from '../types/runner';
import { Location } from '../types/location';

export const useNearbyRunners = (location: Location) => {
  const [runners, setRunners] = useState<Runner[]>([]);

  useEffect(() => {
    const nearbyRunners = RunnersService.getNearbyRunners(location);
    setRunners(nearbyRunners);
  }, [location]);

  return runners;
};