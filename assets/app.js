// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Enhanced waitlist form with rate limiting and spam prevention
class WaitlistManager {
  constructor() {
    this.form = document.getElementById('waitlist-form');
    this.statusEl = document.getElementById('form-status');
    this.submitBtn = document.getElementById('submit-btn');
    this.emailInput = document.getElementById('email');
    this.timestampInput = document.getElementById('timestamp');
    
    this.maxSubmissions = 2;
    this.rateLimitKey = 'kolosium_waitlist_submissions';
    this.rateLimitWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.setupFormHandling();
    this.checkRateLimit();
  }


  setupFormHandling() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time email validation
    this.emailInput.addEventListener('input', () => {
      this.clearStatus();
      this.validateEmail();
    });
  }

  validateEmail() {
    const email = this.emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
      this.showStatus('Please enter a valid email address.', 'err');
      return false;
    }
    
    return true;
  }

  checkRateLimit() {
    const submissions = this.getSubmissions();
    const recentSubmissions = this.getRecentSubmissions(submissions);
    
    if (recentSubmissions.length >= this.maxSubmissions) {
      this.disableForm();
      const timeLeft = this.getTimeUntilReset(recentSubmissions[0].timestamp);
      this.showStatus(`Rate limit reached. You can submit again in ${timeLeft}.`, 'err');
    }
  }

  getSubmissions() {
    try {
      const stored = localStorage.getItem(this.rateLimitKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  getRecentSubmissions(submissions) {
    const now = Date.now();
    return submissions.filter(sub => 
      (now - sub.timestamp) < this.rateLimitWindow
    );
  }

  saveSubmission(email) {
    const submissions = this.getSubmissions();
    const now = Date.now();
    
    submissions.push({
      email: email.toLowerCase(),
      timestamp: now
    });
    
    // Keep only recent submissions to prevent localStorage bloat
    const recentSubmissions = this.getRecentSubmissions(submissions);
    
    try {
      localStorage.setItem(this.rateLimitKey, JSON.stringify(recentSubmissions));
    } catch (e) {
      console.warn('Could not save submission to localStorage:', e);
    }
  }

  getTimeUntilReset(timestamp) {
    const now = Date.now();
    const resetTime = timestamp + this.rateLimitWindow;
    const timeLeft = resetTime - now;
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  disableForm() {
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Rate limited';
    this.emailInput.disabled = true;
  }

  enableForm() {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Notify me';
    this.emailInput.disabled = false;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const email = this.emailInput.value.trim();
    
    // Validate email
    if (!this.validateEmail()) {
      return;
    }
    
    // Check rate limit
    const submissions = this.getSubmissions();
    const recentSubmissions = this.getRecentSubmissions(submissions);
    
    if (recentSubmissions.length >= this.maxSubmissions) {
      this.showStatus('Rate limit reached. Please try again later.', 'err');
      return;
    }
    
    // Check for duplicate email in recent submissions
    const duplicateEmail = recentSubmissions.find(sub => 
      sub.email === email.toLowerCase()
    );
    
    if (duplicateEmail) {
      this.showStatus('This email has already been submitted recently.', 'err');
      return;
    }
    
    // Show loading state
    this.setLoadingState(true);
    this.showStatus('Preparing email...', '');
    
    try {
      // Update timestamp
      this.timestampInput.value = new Date().toISOString();
      
      // Create email content
      const emailBody = this.createEmailBody(email);
      
      // Try to use a web service first, fallback to mailto
      const success = await this.tryWebService(email, emailBody);
      
      if (success) {
        // Save successful submission
        this.saveSubmission(email);
        
        this.showStatus('Thanks! We\'ll be in touch soon.', 'ok');
        this.form.reset();
        
        // Check if we've hit the rate limit after this submission
        setTimeout(() => this.checkRateLimit(), 1000);
      } else {
        // Fallback to mailto
        this.showStatus('Opening your email client...', '');
        this.openMailto(email, emailBody);
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      this.showStatus('Error occurred. Please try again.', 'err');
    } finally {
      this.setLoadingState(false);
    }
  }

  createEmailBody(email) {
    const timestamp = new Date().toLocaleString();
    
    return `New Waitlist Subscription - Kolosium

Email: ${email}
Timestamp: ${timestamp}

Please add this email to the Kolosium waitlist.

Thank you!`;
  }

  async tryWebService(email, emailBody) {
    // Use EmailJS or similar service for reliable email delivery
    // For now, we'll use a simple approach that works reliably
    try {
      // Simulate a successful web service call
      // In production, integrate with EmailJS, Formspree, or similar
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demonstration, we'll always fall back to mailto for now
      // Replace this with your actual email service integration
      return false;
    } catch (error) {
      console.log('Web service failed, falling back to mailto');
      return false;
    }
  }

  openMailto(email, emailBody) {
    const subject = encodeURIComponent('New Waitlist Subscription - Kolosium');
    const body = encodeURIComponent(emailBody);
    const mailtoUrl = `mailto:info@kolosium.com?subject=${subject}&body=${body}`;
    
    // Open mailto link
    window.location.href = mailtoUrl;
    
    // Show success message after a delay
    setTimeout(() => {
      this.showStatus('Email client opened. Please send the email to complete your subscription.', 'ok');
      this.saveSubmission(email);
      this.form.reset();
      setTimeout(() => this.checkRateLimit(), 1000);
    }, 1000);
  }

  setLoadingState(loading) {
    this.submitBtn.disabled = loading;
    this.submitBtn.textContent = loading ? 'Submitting...' : 'Notify me';
    this.emailInput.disabled = loading;
  }

  showStatus(message, type) {
    this.statusEl.textContent = message;
    this.statusEl.className = `status ${type}`;
    
    // Auto-clear success messages after 5 seconds
    if (type === 'ok') {
      setTimeout(() => this.clearStatus(), 5000);
    }
  }

  clearStatus() {
    this.statusEl.textContent = '';
    this.statusEl.className = 'status';
  }
}

// Initialize the waitlist manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new WaitlistManager();
});
