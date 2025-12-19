// 1. Mobile Menu Logic
const mobileMenu = document.getElementById('mobile-menu');
function toggleMobileMenu() {
    mobileMenu.classList.toggle('hidden');
}

// 2. Modal Logic
function toggleModal() {
    const modal = document.getElementById('auth-modal');
    const form = document.getElementById('access-form');
    const error = document.getElementById('error-msg');
    const input = document.getElementById('access-key');
    
    modal.classList.toggle('open');
    
    // Reset state when opening/closing
    if(!modal.classList.contains('open')) {
        form.reset();
        error.classList.add('hidden');
        input.classList.remove('border-red-500');
    }
}

// 3. Login Logic
async function handleLogin(e) {
    e.preventDefault();
    const input = document.getElementById('access-key');
    const error = document.getElementById('error-msg');
    const modal = document.getElementById('auth-modal');

    const result = await window.supabaseFunctions.authenticateAdmin(input.value);
    
    if (result.success) {
        modal.classList.remove('open');
        showDashboard();
    } else {
        error.classList.remove('hidden');
        input.classList.add('border-red-500');
        input.classList.remove('border-white/10');
    }
}

// 4. Show Dashboard
async function showDashboard() {
    const publicView = document.getElementById('public-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    publicView.classList.add('hidden');
    
    // Load dashboard HTML
    const response = await fetch('/dashboard.html');
    const html = await response.text();
    
    // Create temporary container to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get just the dashboard content
    const dashboardContent = tempDiv.querySelector('#dashboard-view');
    
    if (dashboardContent) {
        dashboardView.innerHTML = dashboardContent.innerHTML;
        dashboardView.classList.remove('hidden');
        document.title = "ScaleBound | COMMAND CENTER";
        
        // Initialize dashboard functionality
        initDashboard();
    }
}

// 5. Logout
function handleLogout() {
    window.supabaseFunctions.logoutAdmin();
    
    const publicView = document.getElementById('public-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    dashboardView.classList.add('hidden');
    publicView.classList.remove('hidden');
    document.title = "ScaleBound | Stealth Mode";
    
    // Re-trigger scroll logic
    checkScroll();
}

// 6. Waitlist Form Submission
async function handleWaitlistSubmit(e) {
    e.preventDefault();
    
    const form = document.getElementById('waitlist-form');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const messageEl = document.getElementById('form-message');
    
    // Get form data
    const formData = {
        firstName: document.getElementById('first-name').value.trim(),
        lastName: document.getElementById('last-name').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        monthlyRevenue: document.getElementById('monthly-revenue').value
    };
    
    // Validate
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.monthlyRevenue) {
        showMessage(messageEl, 'Please fill in all required fields', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showMessage(messageEl, 'Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading
    submitBtn.disabled = true;
    submitText.textContent = 'Processing...';
    loadingSpinner.classList.remove('hidden');
    messageEl.classList.add('hidden');
    
    try {
        // Check if email already exists
        const emailExists = await window.supabaseFunctions.checkEmailExists(formData.email);
        
        if (emailExists) {
            showMessage(messageEl, 'This email is already on our waitlist!', 'error');
            return;
        }
        
        // Add to waitlist
        const result = await window.supabaseFunctions.addToWaitlist(formData);
        
        if (result.success) {
            // Success
            showMessage(messageEl, '✅ Success! You\'ve been added to the waitlist. Position will be confirmed via email.', 'success');
            form.reset();
            
            // Update waitlist count in marquee
            const count = await window.supabaseFunctions.getWaitlistCount();
            const waitlistElement = document.getElementById('waitlist-count');
            if (waitlistElement) {
                waitlistElement.textContent = `// ${count.toLocaleString()} Users on Waitlist`;
            }
        } else {
            showMessage(messageEl, `❌ Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Waitlist submission error:', error);
        showMessage(messageEl, '❌ An error occurred. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitText.textContent = 'Join Waitlist';
        loadingSpinner.classList.add('hidden');
    }
}

// 7. Show message function
function showMessage(element, message, type = 'success') {
    if (!element) return;
    
    element.textContent = message;
    element.className = `p-3 rounded-lg text-sm ${type === 'success' ? 'success-message' : 'error-message'}`;
    element.classList.remove('hidden');
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
}

// 8. Scroll Animation (Reveal & Floating Nav)
const revealElements = document.querySelectorAll('.reveal');
const navbar = document.getElementById('navbar');

function checkScroll() {
    // Reveal Logic
    const triggerBottom = window.innerHeight / 5 * 4;
    revealElements.forEach(box => {
        const boxTop = box.getBoundingClientRect().top;
        if (boxTop < triggerBottom) {
            box.classList.add('active');
        }
    });

    // Floating Navbar Logic
    if (window.scrollY > 100) {
        navbar.classList.add('nav-scrolled');
    } else {
        navbar.classList.remove('nav-scrolled');
    }
}
window.addEventListener('scroll', checkScroll);
checkScroll(); // Trigger once on load

// 9. Three.js Animated Background (Particle Network)
const initThreeJS = () => {
    const canvas = document.querySelector('#bg-canvas');
    const scene = new THREE.Scene();
    
    // Fog to create depth and hide edges
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Transparent background
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Particles
    const geometry = new THREE.BufferGeometry();
    const particlesCount = 800; // Increased count for dense look

    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 25; 
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Material for particles
    const material = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x6366f1, // Indigo color
        transparent: true,
        opacity: 0.6,
    });

    const particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    camera.position.z = 4;

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    // Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        const elapsedTime = clock.getElapsedTime();

        // Slower, more mysterious rotation
        particlesMesh.rotation.y = .05 * elapsedTime;
        particlesMesh.rotation.x += .02 * (targetY - particlesMesh.rotation.x);
        particlesMesh.rotation.y += .02 * (targetX - particlesMesh.rotation.y);
        
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };

    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// 10. Dashboard Functions
async function initDashboard() {
    // Check authentication
    if (!window.supabaseFunctions.isAdminAuthenticated()) {
        handleLogout();
        return;
    }
    
    // Load dashboard stats
    await loadDashboardStats();
    
    // Load recent waitlist entries
    await loadRecentWaitlist();
    
    // Set up logout button
    const logoutBtn = document.querySelector('button[onclick="handleLogout()"]');
    if (logoutBtn) {
        logoutBtn.onclick = handleLogout;
    }
    
    // Set up sidebar navigation
    setupSidebarNavigation();
}

async function loadDashboardStats() {
    const stats = await window.supabaseFunctions.getDashboardStats();
    
    // Update stats in DOM
    document.querySelector('[data-stat="waitlist"]').textContent = stats.waitlistCount.toLocaleString();
    document.querySelector('[data-stat="revenue"]').textContent = `$${stats.totalRevenue.toLocaleString()}`;
    document.querySelector('[data-stat="ad-spend"]').textContent = `$${stats.activeAdSpend.toLocaleString()}`;
    document.querySelector('[data-stat="roas"]').textContent = `${stats.globalROAS.toFixed(2)}x`;
}

async function loadRecentWaitlist() {
    const result = await window.supabaseFunctions.getRecentWaitlist(10);
    
    if (result.success && result.data) {
        const tableBody = document.querySelector('#waitlist-table tbody');
        if (tableBody && result.data.length > 0) {
            tableBody.innerHTML = '';
            
            result.data.forEach(entry => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-white/5 transition-colors';
                row.innerHTML = `
                    <td class="px-6 py-4 font-bold text-white">${entry.first_name} ${entry.last_name}</td>
                    <td class="px-6 py-4 text-gray-300">${entry.email}</td>
                    <td class="px-6 py-4 text-gray-300">${entry.monthly_revenue}</td>
                    <td class="px-6 py-4 text-gray-400">${new Date(entry.created_at).toLocaleDateString()}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs border border-indigo-500/20">
                            ${entry.status || 'pending'}
                        </span>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
}

function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Handle navigation (simplified)
            const linkText = link.querySelector('span').textContent.toLowerCase();
            console.log(`Navigating to: ${linkText}`);
            // Add your navigation logic here
        });
    });
}

// 11. Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Three.js
    initThreeJS();
    
    // Waitlist form submission
    const waitlistForm = document.getElementById('waitlist-form');
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', handleWaitlistSubmit);
    }
    
    // Access form submission
    const accessForm = document.getElementById('access-form');
    if (accessForm) {
        accessForm.addEventListener('submit', handleLogin);
    }
    
    // Check if user is already authenticated (dashboard view)
    if (window.supabaseFunctions.isAdminAuthenticated()) {
        showDashboard();
    }
});