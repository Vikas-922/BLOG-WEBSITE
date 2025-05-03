// Get elements
const navProfile = document.querySelector(".nav_profile");
const navItems = document.querySelector(".nav_items");
const avatarEmailSpan = navProfile.querySelector("span");
const avatarContainer = navProfile.querySelector(".avatar_container");
const avatarImgTag = avatarContainer.querySelector("img");

const loginNavItem = navItems.querySelector('a[href="signin.html"]');

const openNavBtn = document.querySelector('#open_nav-btn');
const closeNavBtn = document.querySelector('#close_nav-btn');
const dashboardEle = navItems.querySelector('a[href="dashboard.html"]');

// Function to check login status and update UI
// navprofile have to show or not
function updateNavbar() {
    const userData = JSON.parse(localStorage.getItem("user"));

    if (userData && userData.username) {
        // Show logged-in user's email
        avatarEmailSpan.textContent = userData.username;
        avatarImgTag.src=userData.userAvatarUrl;
        navProfile.style.display = "flex"; // Show profile section
        if (loginNavItem) loginNavItem.parentElement.style.display = "none"; // Hide "Sign In" link
        dashboardEle.href = userData.dashboardPage;
    } else {
        // Hide profile section if not logged in
        navProfile.style.display = "none";
        if (loginNavItem) loginNavItem.parentElement.style.display = "flex"; // Show "Sign In" link
    }
}

// Function to handle logout
function handleLogout() {
    localStorage.removeItem("user"); // Remove user data
    updateNavbar(); // Update navigation bar
    window.location.href = "./index.html"; // Redirect to Sign In
}

// Update the navigation bar on page load
document.addEventListener("DOMContentLoaded", () => {
    updateNavbar(); //if user logged in, navprofile is displayed containing logout link

    // Attach logout functionality
    const logoutLink = document.querySelector('a[href="logout.html"]');
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
});


const openNav = () => {
    // navItems.style.display = 'flex';
    navItems.style.transform = 'translateX(10%)'; // Slide in from the right
    openNavBtn.style.display = 'none';
    closeNavBtn.style.display = 'inline-block';
}

const closeNav = () => {
    // navItems.style.display = 'none';
    navItems.style.transform = 'translateX(120%)'; // Slide out to the right
    openNavBtn.style.display = 'inline-block';
    closeNavBtn.style.display = 'none';
}

openNavBtn.addEventListener('click', openNav);
closeNavBtn.addEventListener('click', closeNav);
