import { storage } from "./storage";

// Manual day control - only create initial session if none exists
export async function ensureInitialSession() {
  try {
    const sessions = await storage.getBusinessSessions();
    
    // Only create initial session if no sessions exist at all
    if (sessions.length === 0) {
      const now = new Date();
      const turkishTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
      const currentDate = turkishTime.toISOString().split('T')[0];
      const dayName = turkishTime.toLocaleDateString('tr-TR', { weekday: 'long' });
      const sessionName = `${dayName} - ${currentDate}`;
      
      console.log(`Creating initial session: ${sessionName}`);
      
      await storage.createBusinessSession({
        date: currentDate,
        name: sessionName,
        isActive: true
      });
      
      console.log('Initial session created successfully');
    } else {
      console.log(`${sessions.length} sessions already exist - no auto-creation needed`);
    }
  } catch (error) {
    console.error('Error creating initial session:', error);
  }
}
