// Website functionality for Debeshee Das researcher profile
class ResearcherWebsite {
    constructor() {
        this.currentSection = 'home';
        this.publications = [];
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupMobileMenu();
        this.loadPublications();
        this.loadResearchExperience();
        this.loadAwards();
        this.loadScholarStats();
        this.setupIntersectionObserver();
        this.setupViewAllButton();
        this.checkCVFile();
    }

    // Navigation functionality
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('data-section');
                this.navigateToSection(targetSection);
                // Close mobile menu when navigation link is clicked
                this.closeMobileMenu();
            });
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const section = e.state?.section || 'home';
            this.navigateToSection(section, false);
        });

        // Set initial state
        const hash = window.location.hash.slice(1) || 'home';
        this.navigateToSection(hash, false);
    }

    navigateToSection(sectionId, updateHistory = true) {
        const sections = document.querySelectorAll('.section');
        const navLinks = document.querySelectorAll('.nav-link');

        // Hide all sections
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;

            // Update navigation active state
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-section') === sectionId) {
                    link.classList.add('active');
                }
            });

            // Update URL and history
            if (updateHistory) {
                const url = sectionId === 'home' ? '/' : `/#${sectionId}`;
                history.pushState({ section: sectionId }, '', url);
            }

            // Update page title
            this.updatePageTitle(sectionId);

            // Close mobile menu if open
            this.closeMobileMenu();
        }
    }

    updatePageTitle(section) {
        const titles = {
            home: 'Debeshee Das | AI Security & Privacy Researcher',
            publications: 'Publications | Debeshee Das',
            cv: 'CV | Debeshee Das'
        };
        document.title = titles[section] || titles.home;
    }

    // Theme toggle functionality
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle.querySelector('.material-icons-outlined');
        
        // Check for saved theme preference or default to system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.applyTheme(currentTheme);

        themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(currentTheme);
            localStorage.setItem('theme', currentTheme);
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    applyTheme(theme) {
        const themeIcon = document.querySelector('#theme-toggle .material-icons-outlined');
        document.documentElement.setAttribute('data-theme', theme);
        themeIcon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
    }

    // Mobile menu functionality
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
            const isOpen = navLinks.classList.contains('mobile-open');
            mobileMenuToggle.querySelector('.material-icons-outlined').textContent = 
                isOpen ? 'close' : 'menu';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                this.closeMobileMenu();
            }
        });
    }

    closeMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        navLinks.classList.remove('mobile-open');
        mobileMenuToggle.querySelector('.material-icons-outlined').textContent = 'menu';
    }

    // Publications management
    async loadPublications() {
        try {
            // Fetch publications from JSON file
            const response = await fetch('publications.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const publications = await response.json();
            
            this.publications = publications;
            this.renderPublications();
            this.renderSelectedPublications();
        } catch (error) {
            console.error('Error loading publications:', error);
            // Use empty array as fallback to avoid errors
            this.publications = [];
            this.renderPublications();
            this.renderSelectedPublications();
        }
    }

    renderPublications() {
        const publicationsList = document.getElementById('publications-list');
        
        if (this.publications.length === 0) {
            publicationsList.innerHTML = `
                <div class="loading-state">
                    <span class="material-icons-outlined">article</span>
                    <p>No publications found.</p>
                </div>
            `;
            return;
        }

        const publicationsHTML = this.publications.map(pub => this.createPublicationHTML(pub)).join('');
        const authorshipNote = `<p class="authorship-note">* denotes shared first authorship</p>`;
        publicationsList.innerHTML = publicationsHTML + authorshipNote;
    }

    createPublicationHTML(pub) {
        const linksHTML = Object.entries(pub.links || {})
            .filter(([type, url]) => url && url.trim() !== '' && ['paper', 'code', 'poster', 'blog'].includes(type))
            .map(([type, url]) => {
                const icons = {
                    paper: 'article',
                    code: 'code',
                    poster: 'image',
                    blog: 'article'
                };
                
                return `
                    <a href="${url}" target="_blank" class="publication-link">
                        <span class="material-icons-outlined">${icons[type] || 'link'}</span>
                        ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </a>
                `;
            }).join('');

        // Handle custom thumbnail image or fallback to icon
        const thumbnailContent = pub.thumbnail_image ? 
            (pub.thumbnail_padding ? 
                `<div style="padding: ${pub.thumbnail_padding}px; background-color: white; width: 100%; height: 100%; box-sizing: border-box; display: flex; align-items: center; justify-content: center;">
                    <img src="${pub.thumbnail_image}" alt="${pub.title} thumbnail" 
                         style="max-width: 100%; max-height: 100%; object-fit: contain;"
                         onerror="this.parentElement.style.display='none'; this.parentElement.nextElementSibling.style.display='flex';">
                 </div>
                 <span class="material-icons-outlined" style="display: none;">article</span>` :
                `<img src="${pub.thumbnail_image}" alt="${pub.title} thumbnail" 
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <span class="material-icons-outlined" style="display: none;">article</span>`
            ) :
            `<span class="material-icons-outlined">article</span>`;

        return `
            <div class="publication-item">
                <div class="publication-thumbnail">
                    ${thumbnailContent}
                </div>
                <div class="publication-content">
                    ${pub.banner && pub.banner.length > 0 ? 
                        `<div class="publication-banner">
                            ${pub.banner.map(item => `<span class="publication-banner-item">${item}</span>`).join('')}
                        </div>` : ''
                    }
                    <h3 class="publication-title">${pub.title}</h3>
                    <p class="publication-authors">
                        ${pub.authors.map(author => 
                            author.includes('Debeshee Das') ? 
                            `<span class="author-highlight">${author}</span>` : author
                        ).join(', ')}
                    </p>
                    <div class="publication-venue">
                        ${Array.isArray(pub.venue) ? 
                            pub.venue.filter(v => v && v.trim()).map(v => `<p>${v}, ${pub.year}</p>`).join('') :
                            pub.venue && pub.venue.trim() ? `<p>${pub.venue}, ${pub.year}</p>` : `<p>${pub.year}</p>`
                        }
                    </div>
                    <div class="publication-links">
                        ${linksHTML}
                    </div>
                </div>
            </div>
        `;
    }

    renderPublicationsError() {
        const publicationsList = document.getElementById('publications-list');
        publicationsList.innerHTML = `
            <div class="loading-state">
                <span class="material-icons-outlined">error</span>
                <p>Error loading publications. Please try again later.</p>
            </div>
        `;
    }

    // Selected Publications functionality
    renderSelectedPublications() {
        const selectedPublicationsList = document.getElementById('selected-publications-list');
        const selectedPublications = this.publications.filter(pub => pub.selected === true);
        
        if (selectedPublications.length === 0) {
            selectedPublicationsList.innerHTML = `
                <div class="loading-state">
                    <span class="material-icons-outlined">article</span>
                    <p>No selected publications found.</p>
                </div>
            `;
            return;
        }

        const selectedPublicationsHTML = selectedPublications.map(pub => this.createSelectedPublicationHTML(pub)).join('');
        selectedPublicationsList.innerHTML = selectedPublicationsHTML;
    }

    createSelectedPublicationHTML(pub) {
        const linksHTML = Object.entries(pub.links || {})
            .filter(([type, url]) => url && url.trim() !== '' && ['paper', 'code', 'poster', 'blog'].includes(type))
            .slice(0, 3) // Show up to 3 links for compact display
            .map(([type, url]) => {
                const icons = {
                    paper: 'article',
                    code: 'code',
                    poster: 'image',
                    blog: 'article'
                };
                
                return `
                    <a href="${url}" target="_blank" class="publication-link">
                        <span class="material-icons-outlined">${icons[type] || 'link'}</span>
                        ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </a>
                `;
            }).join('');

        // Handle custom thumbnail image or fallback to icon for selected publications
        const thumbnailContent = pub.thumbnail_image ? 
            (pub.thumbnail_padding ? 
                `<div style="padding: ${pub.thumbnail_padding}px; background-color: white; width: 100%; height: 100%; box-sizing: border-box; display: flex; align-items: center; justify-content: center;">
                    <img src="${pub.thumbnail_image}" alt="${pub.title} thumbnail" 
                         style="max-width: 100%; max-height: 100%; object-fit: contain;"
                         onerror="this.parentElement.style.display='none'; this.parentElement.nextElementSibling.style.display='flex';">
                 </div>
                 <span class="material-icons-outlined" style="display: none;">article</span>` :
                `<img src="${pub.thumbnail_image}" alt="${pub.title} thumbnail" 
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <span class="material-icons-outlined" style="display: none;">article</span>`
            ) :
            `<span class="material-icons-outlined">article</span>`;

        return `
            <div class="selected-publication-item">
                <div class="selected-publication-thumbnail">
                    ${thumbnailContent}
                </div>
                <div class="selected-publication-content">
                    ${pub.banner && pub.banner.length > 0 ? 
                        `<div class="selected-publication-banner">
                            ${pub.banner.map(item => `<span class="selected-publication-banner-item">${item}</span>`).join('')}
                        </div>` : ''
                    }
                    <h4 class="selected-publication-title">${pub.title}</h4>
                    <p class="selected-publication-authors">
                        ${pub.authors.map(author => 
                            author.includes('Debeshee Das') ? 
                            `<span class="author-highlight">${author}</span>` : author
                        ).join(', ')}
                    </p>
                    <div class="selected-publication-venue">
                        ${Array.isArray(pub.venue) ? 
                            pub.venue.filter(v => v && v.trim()).map(v => `<p>${v}, ${pub.year}</p>`).join('') :
                            pub.venue && pub.venue.trim() ? `<p>${pub.venue}, ${pub.year}</p>` : `<p>${pub.year}</p>`
                        }
                    </div>
                    <div class="selected-publication-links">
                        ${linksHTML}
                    </div>
                </div>
            </div>
        `;
    }

    // Intersection Observer for scroll animations
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for scroll animations
        const animatedElements = document.querySelectorAll('.publication-item, .research-areas, .profile-card');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // Utility method to add new publications (for future use)
    addPublication(publicationData) {
        this.publications.unshift(publicationData);
        this.renderPublications();
    }

    // Method to format Google Scholar citation (for future integration)
    formatGoogleScholarCitation(citation) {
        // This would parse and format citations from Google Scholar
        // Implementation would depend on the specific format received
        return citation;
    }

    // Setup View All Publications button
    setupViewAllButton() {
        const viewAllBtn = document.querySelector('.view-all-btn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                this.navigateToSection('publications');
            });
        }
    }

    async loadResearchExperience() {
        try {
            const response = await fetch('research-experience.json');
            const experiences = await response.json();
            const timeline = document.getElementById('research-timeline');
            
            if (timeline) {
                timeline.innerHTML = experiences.map(exp => this.createTimelineItem(exp)).join('');
            }
        } catch (error) {
            console.error('Error loading research experience:', error);
        }
    }

    async loadAwards() {
        try {
            const response = await fetch('awards.json');
            const awards = await response.json();
            this.displayAwards(awards);
        } catch (error) {
            console.error('Error loading awards:', error);
            document.getElementById('awards-list').innerHTML = '<p class="error-message">Error loading awards. Please try again later.</p>';
        }
    }

    async loadScholarStats() {
        try {
            const url = "https://raw.githubusercontent.com/debesheedas/scholar-stats/main/data.json";
            const response = await fetch(url, { cache: "no-cache" });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update the stats with fallback values
            document.getElementById("citations").textContent = data.citations ?? data.citations_all ?? "90";
            document.getElementById("hindex").textContent = data.h_index ?? "4";
            document.getElementById("i10index").textContent = data.i10_index ?? "2";
            
        } catch (error) {
            console.error("Failed to load scholar stats:", error);
            // Keep the default "—" values if loading fails
        }
    }

    displayAwards(awards) {
        const awardsList = document.getElementById('awards-list');
        const awardsHTML = awards.map(award => this.createAwardItem(award)).join('');
        awardsList.innerHTML = awardsHTML;
    }

    createAwardItem(award) {
        const { title, institution, description, year } = award;
        
        return `
            <div class="award-item">
                <div class="award-main">
                    <h3 class="award-title">${title}</h3>
                    <p class="award-institution">${institution}</p>
                    <p class="award-description">${description}</p>
                </div>
                <div class="award-year">${year}</div>
            </div>
        `;
    }

    createTimelineItem(experience) {
        const { company, position, duration, logos, description } = experience;
        
        // Build company logos for timeline marker
        let logosContent = '';
        if (logos && logos.length > 0) {
            const logoClass = logos.length === 1 ? 'single' : 'multiple';
            const logoElements = logos.map(logo => 
                `<img src="${logo.image}" alt="${logo.alt}" class="company-logo ${logoClass}">`
            ).join('');
            logosContent = `<div class="company-logos">${logoElements}</div>`;
        }
        
        return `
            <div class="timeline-item">
                <div class="timeline-marker">
                    ${logosContent}
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <div class="timeline-main">
                            <h3>${company}</h3>
                            <p class="position">${position}</p>
                        </div>
                        <div class="timeline-duration">${duration}</div>
                    </div>
                    <p class="description">${description}</p>
                </div>
            </div>
        `;
    }

    async checkCVFile() {
        try {
            const response = await fetch('CV.pdf', { method: 'HEAD' });
            if (response.ok) {
                const cvNavLink = document.getElementById('cv-nav-link');
                const cvSection = document.getElementById('cv');
                if (cvNavLink) {
                    cvNavLink.style.display = 'flex';
                }
                if (cvSection) {
                    cvSection.style.display = 'block';
                }
            } else {
                console.log('CV.pdf not found, CV section will remain hidden');
            }
        } catch (error) {
            console.log('Error checking for CV.pdf:', error);
        }
    }
}

// Enhanced mobile menu styles (added via JavaScript for better UX)
function addMobileMenuStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            .nav-links {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background-color: var(--color-surface);
                border-top: 1px solid var(--color-outline-variant);
                flex-direction: column;
                padding: var(--spacing-md);
                gap: var(--spacing-xs);
                transform: translateY(-100%);
                opacity: 0;
                visibility: hidden;
                transition: all var(--transition-normal);
                box-shadow: var(--shadow-2);
            }
            
            .nav-links.mobile-open {
                transform: translateY(0);
                opacity: 1;
                visibility: visible;
            }
            
            .nav-link {
                justify-content: center;
                padding: var(--spacing-md);
                border-radius: var(--radius-md);
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize the website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    addMobileMenuStyles();
    new ResearcherWebsite();
});

// Add smooth scrolling behavior for anchor links
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').slice(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Performance optimization: Lazy load images when they come into view
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Call lazy loading setup
document.addEventListener('DOMContentLoaded', setupLazyLoading);

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks.classList.contains('mobile-open')) {
            const website = window.researcherWebsite;
            if (website) {
                website.closeMobileMenu();
            }
        }
    }
});

// Export for potential external use
window.ResearcherWebsite = ResearcherWebsite;
