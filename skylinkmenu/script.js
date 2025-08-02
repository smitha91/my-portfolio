// ===== SKYLINK MENU - PREMIUM DINING EXPERIENCE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
    // Get all meal order buttons
    const orderButtons = document.querySelectorAll('.order-btn');
    const mealCards = document.querySelectorAll('.meal-card');
    const orderSection = document.getElementById('orderSection');
    const successSection = document.getElementById('successSection');
    const menuSection = document.querySelector('.menu-section');
    
    // Order confirmation elements
    const selectedMealTitle = document.getElementById('selectedMealTitle');
    const selectedMealDescription = document.getElementById('selectedMealDescription');
    const confirmOrderBtn = document.getElementById('confirmOrder');
    const cancelOrderBtn = document.getElementById('cancelOrder');
    const newOrderBtn = document.getElementById('newOrderBtn');
    
    // Meal data
    const mealData = {
        'prime-beef': {
            title: 'Prime Beef Tenderloin - The Executive Choice',
            description: 'Premium grass-fed beef tenderloin, pan-seared to perfection with truffle butter, accompanied by roasted seasonal vegetables and garlic mashed potatoes. Preparation time: 25 minutes.'
        },
        'atlantic-salmon': {
            title: 'Atlantic Salmon - The Coastal Experience',
            description: 'Wild-caught Atlantic salmon glazed with honey-soy reduction, served with jasmine rice pilaf and crisp asparagus spears with hollandaise sauce. Preparation time: 20 minutes.'
        },
        'vegetarian-delight': {
            title: 'Garden Symphony - The Botanical Choice',
            description: 'Artisanal stuffed portobello mushroom with quinoa, sun-dried tomatoes, and goat cheese, accompanied by grilled vegetables and herb-infused couscous. Preparation time: 18 minutes.'
        }
    };
    
    let selectedMeal = null;
    
    // Add click event listeners to order buttons
    orderButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mealType = this.getAttribute('data-meal');
            selectMeal(mealType);
        });
    });
    
    // Function to select a meal
    function selectMeal(mealType) {
        selectedMeal = mealType;
        
        // Update visual selection
        mealCards.forEach(card => {
            card.classList.remove('selected');
            if (card.getAttribute('data-meal') === mealType) {
                card.classList.add('selected');
            }
        });
        
        // Update order confirmation section
        const meal = mealData[mealType];
        selectedMealTitle.textContent = meal.title;
        selectedMealDescription.textContent = meal.description;
        
        // Show order section with smooth scroll
        orderSection.style.display = 'block';
        orderSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Hide menu section
        menuSection.style.display = 'none';
        
        // Add entrance animation
        setTimeout(() => {
            orderSection.style.opacity = '0';
            orderSection.style.transform = 'translateY(20px)';
            orderSection.style.transition = 'all 0.6s ease';
            
            requestAnimationFrame(() => {
                orderSection.style.opacity = '1';
                orderSection.style.transform = 'translateY(0)';
            });
        }, 100);
    }
    
    // Confirm order button
    confirmOrderBtn.addEventListener('click', function() {
        if (selectedMeal) {
            // Hide order section
            orderSection.style.display = 'none';
            
            // Show success section
            successSection.style.display = 'block';
            successSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add entrance animation to success section
            setTimeout(() => {
                successSection.style.opacity = '0';
                successSection.style.transform = 'translateY(20px)';
                successSection.style.transition = 'all 0.6s ease';
                
                requestAnimationFrame(() => {
                    successSection.style.opacity = '1';
                    successSection.style.transform = 'translateY(0)';
                });
            }, 100);
            
            // Play success sound effect (if audio is available)
            playSuccessSound();
        }
    });
    
    // Cancel order button
    cancelOrderBtn.addEventListener('click', function() {
        resetToMenu();
    });
    
    // New order button
    newOrderBtn.addEventListener('click', function() {
        resetToMenu();
    });
    
    // Function to reset to menu
    function resetToMenu() {
        // Hide order and success sections
        orderSection.style.display = 'none';
        successSection.style.display = 'none';
        
        // Show menu section
        menuSection.style.display = 'block';
        menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Remove selection from all cards
        mealCards.forEach(card => {
            card.classList.remove('selected');
        });
        
        selectedMeal = null;
        
        // Add entrance animation to menu
        setTimeout(() => {
            menuSection.style.opacity = '0';
            menuSection.style.transform = 'translateY(20px)';
            menuSection.style.transition = 'all 0.6s ease';
            
            requestAnimationFrame(() => {
                menuSection.style.opacity = '1';
                menuSection.style.transform = 'translateY(0)';
            });
        }, 100);
    }
    
    // Function to play success sound (placeholder)
    function playSuccessSound() {
        // Create a simple audio context for a pleasant chime
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a pleasant chime sequence
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
            let startTime = audioContext.currentTime;
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, startTime + index * 0.2);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, startTime + index * 0.2);
                gainNode.gain.linearRampToValueAtTime(0.1, startTime + index * 0.2 + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.2 + 0.5);
                
                oscillator.start(startTime + index * 0.2);
                oscillator.stop(startTime + index * 0.2 + 0.5);
            });
        } catch (error) {
            // Fallback: console log if audio isn't supported
            console.log('🎉 Order confirmed! Your meal is being prepared.');
        }
    }
    
    // Add hover effects to meal cards
    mealCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Add subtle scale animation
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'translateY(0) scale(1)';
            }
        });
    });
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (orderSection.style.display === 'block' || successSection.style.display === 'block') {
                resetToMenu();
            }
        }
        
        // Number keys 1-3 for quick meal selection
        if (e.key >= '1' && e.key <= '3' && menuSection.style.display !== 'none') {
            const mealIndex = parseInt(e.key) - 1;
            const mealTypes = ['prime-beef', 'atlantic-salmon', 'vegetarian-delight'];
            if (mealTypes[mealIndex]) {
                selectMeal(mealTypes[mealIndex]);
            }
        }
    });
    
    // Add smooth scrolling to portfolio navigation
    const portfolioLink = document.querySelector('.portfolio-link');
    if (portfolioLink) {
        portfolioLink.addEventListener('click', function(e) {
            // Add a subtle exit animation
            document.body.style.transition = 'opacity 0.3s ease';
            document.body.style.opacity = '0.8';
            
            // Allow normal navigation after brief delay
            setTimeout(() => {
                window.location.href = this.href;
            }, 200);
        });
    }
    
    // Initialize page with entrance animations
    function initializePageAnimations() {
        const header = document.querySelector('.header');
        const welcomeSection = document.querySelector('.welcome-section');
        
        // Header entrance
        header.style.opacity = '0';
        header.style.transform = 'translateY(-30px)';
        header.style.transition = 'all 0.8s ease';
        
        setTimeout(() => {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }, 200);
        
        // Welcome section entrance
        setTimeout(() => {
            welcomeSection.style.opacity = '0';
            welcomeSection.style.transform = 'translateY(20px)';
            welcomeSection.style.transition = 'all 0.8s ease';
            
            requestAnimationFrame(() => {
                welcomeSection.style.opacity = '1';
                welcomeSection.style.transform = 'translateY(0)';
            });
        }, 400);
    }
    
    // Initialize animations
    initializePageAnimations();
    
    // Add loading state management
    window.addEventListener('load', function() {
        // Ensure all animations are properly initialized
        document.body.classList.add('loaded');
        
        // Add subtle breathing animation to main elements
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.animation = 'luxuryAmbientGlow 8s ease-in-out infinite alternate';
        }
    });
});

// ===== UTILITY FUNCTIONS =====

// Smooth scroll utility
function smoothScrollTo(element, offset = 0) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
    });
}

// Add premium loading effect
document.addEventListener('DOMContentLoaded', function() {
    // Create a subtle loading overlay that fades out
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0A1628 0%, #1B365D 50%, #2C5282 100%);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.8s ease;
    `;
    
    const loadingIcon = document.createElement('div');
    loadingIcon.innerHTML = '<i class="fas fa-utensils" style="font-size: 3rem; color: #FF8C00; animation: spin 2s linear infinite;"></i>';
    loadingOverlay.appendChild(loadingIcon);
    
    document.body.appendChild(loadingOverlay);
    
    // Remove loading overlay after page loads
    window.addEventListener('load', function() {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(loadingOverlay);
            }, 800);
        }, 500);
    });
});

// Add custom CSS for loading animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .loaded .meal-card {
        animation-play-state: running;
    }
`;
document.head.appendChild(style);
