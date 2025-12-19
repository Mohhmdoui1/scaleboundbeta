// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;

// Database Functions
const supabaseFunctions = {
    // Add waitlist entry
    async addToWaitlist(data) {
        try {
            const { data: result, error } = await supabase
                .from('waitlist')
                .insert([{
                    first_name: data.firstName,
                    last_name: data.lastName,
                    email: data.email,
                    monthly_revenue: data.monthlyRevenue,
                    created_at: new Date().toISOString(),
                    status: 'pending'
                }])
                .select();

            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error('Error adding to waitlist:', error);
            return { success: false, error: error.message };
        }
    },

    // Get waitlist count
    async getWaitlistCount() {
        try {
            const { count, error } = await supabase
                .from('waitlist')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting waitlist count:', error);
            return 4203; // Fallback number
        }
    },

    // Get dashboard stats
    async getDashboardStats() {
        try {
            // Get waitlist count
            const { count: waitlistCount, error: waitlistError } = await supabase
                .from('waitlist')
                .select('*', { count: 'exact', head: true });

            // Get revenue data (mock for now - you'd have real data from clients)
            const totalRevenue = 4291040;
            const activeAdSpend = 142800;
            const globalROAS = 4.82;

            if (waitlistError) throw waitlistError;

            return {
                waitlistCount: waitlistCount || 4204,
                totalRevenue,
                activeAdSpend,
                globalROAS
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return {
                waitlistCount: 4204,
                totalRevenue: 4291040,
                activeAdSpend: 142800,
                globalROAS: 4.82
            };
        }
    },

    // Get recent waitlist entries
    async getRecentWaitlist(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('waitlist')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting waitlist entries:', error);
            return { success: false, error: error.message };
        }
    },

    // Check if email already exists in waitlist
    async checkEmailExists(email) {
        try {
            const { data, error } = await supabase
                .from('waitlist')
                .select('email')
                .eq('email', email)
                .limit(1);

            if (error) throw error;
            return data && data.length > 0;
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    },

    // Admin authentication (simple key-based for now)
    async authenticateAdmin(accessKey) {
        // In production, use Supabase Auth
        // For demo, we'll use environment variable
        const validKey = process.env.ADMIN_ACCESS_KEY || 'ALPHA-88';
        
        if (accessKey === validKey) {
            // Set session in localStorage
            localStorage.setItem('sb_admin_authenticated', 'true');
            localStorage.setItem('sb_admin_expires', Date.now() + (8 * 60 * 60 * 1000)); // 8 hours
            
            return { success: true };
        } else {
            return { success: false, error: 'Invalid access key' };
        }
    },

    // Check if admin is authenticated
    isAdminAuthenticated() {
        const authenticated = localStorage.getItem('sb_admin_authenticated');
        const expires = localStorage.getItem('sb_admin_expires');
        
        if (authenticated === 'true' && expires && Date.now() < parseInt(expires)) {
            return true;
        }
        
        // Clear invalid session
        this.logoutAdmin();
        return false;
    },

    // Admin logout
    logoutAdmin() {
        localStorage.removeItem('sb_admin_authenticated');
        localStorage.removeItem('sb_admin_expires');
    }
};

// Export functions
window.supabaseFunctions = supabaseFunctions;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Update waitlist count on marquee
    const count = await supabaseFunctions.getWaitlistCount();
    const waitlistElement = document.getElementById('waitlist-count');
    if (waitlistElement) {
        waitlistElement.textContent = `// ${count.toLocaleString()} Users on Waitlist`;
    }
});