import { storage } from "./storage";

let schedulerInterval: NodeJS.Timeout | null = null;
let lastCheckedDate: string | null = null;

export function startAutoSessionScheduler() {
  // Check every minute
  schedulerInterval = setInterval(async () => {
    try {
      // Get current time in Turkish timezone
      const now = new Date();
      const turkishTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
      
      // Get current date in YYYY-MM-DD format
      const currentDate = turkishTime.toISOString().split('T')[0];
      
      // Check if it's a new day (we haven't created a session for this date yet)
      if (lastCheckedDate !== currentDate) {
        console.log(`New day detected in Turkish time: ${currentDate}`);
        
        // Check if there's already an active session for today
        const activeSession = await storage.getActiveSession();
        const activeSessions = await storage.getBusinessSessions();
        const todaySession = activeSessions.find(s => s.date === currentDate);
        
        if (!todaySession) {
          // Create new session for today
          const dayName = turkishTime.toLocaleDateString('tr-TR', { weekday: 'long' });
          const sessionName = `${dayName} - ${currentDate}`;
          
          console.log(`Creating automatic session: ${sessionName}`);
          
          await storage.createBusinessSession({
            date: currentDate,
            name: sessionName,
            isActive: true
          });
          
          console.log(`Automatic session created successfully: ${sessionName}`);
        } else if (!activeSession || activeSession.date !== currentDate) {
          // If today's session exists but is not active, activate it
          console.log(`Activating existing session for today: ${currentDate}`);
          await storage.setActiveSession(todaySession.id);
        }
        
        lastCheckedDate = currentDate;
      }
    } catch (error) {
      console.error('Error in auto-session scheduler:', error);
    }
  }, 60000); // Check every minute
  
  // Also run immediately on startup
  const initCheck = async () => {
    const now = new Date();
    const turkishTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const currentDate = turkishTime.toISOString().split('T')[0];
    lastCheckedDate = currentDate;
    
    // Check if we need to create/activate today's session on startup
    const activeSessions = await storage.getBusinessSessions();
    const todaySession = activeSessions.find(s => s.date === currentDate);
    const activeSession = await storage.getActiveSession();
    
    if (!todaySession) {
      const dayName = turkishTime.toLocaleDateString('tr-TR', { weekday: 'long' });
      const sessionName = `${dayName} - ${currentDate}`;
      
      console.log(`Creating automatic session on startup: ${sessionName}`);
      
      await storage.createBusinessSession({
        date: currentDate,
        name: sessionName,
        isActive: true
      });
    } else if (!activeSession || activeSession.date !== currentDate) {
      console.log(`Activating today's session on startup: ${currentDate}`);
      await storage.setActiveSession(todaySession.id);
    }
  };
  
  initCheck().catch(console.error);
  
  console.log('Auto-session scheduler started (checking every minute for Turkish timezone)');
}

export function stopAutoSessionScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Auto-session scheduler stopped');
  }
}
