// Convert minutes to hours
export const minutesToHours = (minutes) => {
  return minutes ? (minutes / 60).toFixed(1) : 0;
};

// Convert hours to minutes
export const hoursToMinutes = (hours) => {
  return Math.round(hours * 60);
};

// Convert time string "HH:MM" to minutes
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Calculate hours between two times
export const calculateHours = (startTime, endTime) => {
  const startMin = timeToMinutes(startTime);
  let endMin = timeToMinutes(endTime);
  
  if (endMin < startMin) {
    endMin += 24 * 60; // Handle overnight shifts
  }
  
  const diffMin = endMin - startMin;
  return minutesToHours(diffMin);
};

// Format date to "YYYY-MM-DD"
export const formatDateToString = (date) => {
  return date.toISOString().split('T')[0];
};

// Check if date is Sunday (non-working day)
export const isWeekend = (date) => {
  return date.getDay() === 0; // Sunday only
};

// Get day name
export const getDayName = (date) => {
  return date.toLocaleDateString('en-IN', { weekday: 'long' });
};

// Get month and year
export const getMonthYear = (date) => {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1
  };
};

// Format API response to frontend format
export const formatTimesheetEntry = (entry) => {
  return {
    ...entry,
    date: new Date(entry.date),
    day: new Date(entry.date).getDate(),
    hoursLogged: minutesToHours(entry.hours_logged),
    activities: entry.activities || []
  };
};
