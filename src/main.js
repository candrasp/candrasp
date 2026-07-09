// Initialize Lucide Icons after full load so rendered SVGs stay stable
window.addEventListener('load', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Mobile Menu Toggle
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuIcon = document.getElementById('menu-icon');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');

    // Toggle menu icon
    if (mobileMenu.classList.contains('hidden')) {
      menuIcon.setAttribute('data-lucide', 'menu');
    } else {
      menuIcon.setAttribute('data-lucide', 'x');
    }

    // Re-create icons to reflect the change
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  // Close menu when a link is clicked
  const mobileLinks = document.querySelectorAll('.mobile-link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuIcon.setAttribute('data-lucide', 'menu');
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });
  });
}

// Sticky Navbar & Active Navigation Highlight on Scroll
const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('nav a');

window.addEventListener('scroll', () => {
  // Sticky Navbar class toggle
  if (window.scrollY > 50) {
    navbar.classList.add('bg-[#0b0d19]/90', 'shadow-2xl', 'backdrop-blur-md');
  } else {
    navbar.classList.remove('bg-[#0b0d19]/90', 'shadow-2xl', 'backdrop-blur-md');
  }

  // Active link highlighting
  let currentSectionId = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
      currentSectionId = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('text-accent-blue', 'font-semibold');
    link.classList.add('text-gray-300');
    if (link.getAttribute('href') === `#${currentSectionId}`) {
      link.classList.add('text-accent-blue', 'font-semibold');
      link.classList.remove('text-gray-300');
    }
  });
});

// Portfolio Grid Filter
const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

if (filterButtons.length && projectCards.length) {
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Set active button state
      filterButtons.forEach(btn => {
        btn.classList.remove('active', 'bg-accent-blue', 'text-white');
        btn.classList.add('text-gray-400', 'hover:text-white');
      });
      button.classList.add('active', 'bg-accent-blue', 'text-white');
      button.classList.remove('text-gray-400', 'hover:text-white');

      const filterValue = button.getAttribute('data-filter');

      // Filter cards
      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'block';
          // Force reflow and apply fade-in animation
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

// Contact Form Submit Handler
const contactForm = document.getElementById('contact-form');
const formFeedback = document.getElementById('form-feedback');
const formError = document.getElementById('form-error');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');

// EmailJS Configuration
// To activate real email sending:
// 1. Sign up at https://www.emailjs.com (Free: 200 emails/month)
// 2. Create an Email Service (Gmail, Outlook, etc.)
// 3. Create an Email Template with variables: {{from_name}}, {{from_email}}, {{subject}}, {{message}}
// 4. Replace these values with your actual IDs:
const EMAILJS_SERVICE_ID = 'service_zjo1drn';   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'template_lsyo11v'; // e.g. 'template_xyz789'
// Public key is initialized in index.html

function setLoading(isLoading) {
  if (!submitBtn || !btnText || !btnSpinner) return;
  submitBtn.disabled = isLoading;
  btnText.textContent = isLoading ? 'Sending...' : 'Send Message';
  btnSpinner.classList.toggle('hidden', !isLoading);
}

function showFeedback(type) {
  [formFeedback, formError].forEach(el => el && el.classList.add('hidden'));
  const target = type === 'success' ? formFeedback : formError;
  if (target) {
    target.classList.remove('hidden');
    setTimeout(() => target.classList.add('hidden'), 6000);
  }
}

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);

    const templateParams = {
      from_name: document.getElementById('name')?.value || '',
      from_email: document.getElementById('email')?.value || '',
      subject: document.getElementById('subject')?.value || '',
      message: document.getElementById('message')?.value || '',
    };

    // Check if EmailJS is properly configured
    const isConfigured =
      EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
      EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID';

    if (isConfigured && window.emailjs) {
      try {
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        contactForm.reset();
        showFeedback('success');
      } catch (err) {
        console.error('EmailJS Error:', err);
        showFeedback('error');
      }
    } else {
      // Development mode: simulate success after 1.5s
      // (Replace YOUR_SERVICE_ID & YOUR_TEMPLATE_ID to enable real sending)
      await new Promise(res => setTimeout(res, 1500));
      contactForm.reset();
      showFeedback('success');
      console.warn('EmailJS not configured. Running in demo mode. Set EMAILJS_SERVICE_ID and EMAILJS_TEMPLATE_ID in src/main.js to enable real email delivery.');
    }

    setLoading(false);
  });
}
