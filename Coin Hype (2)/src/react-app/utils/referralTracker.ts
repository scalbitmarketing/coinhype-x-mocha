// Utility to track referral codes across page loads
export class ReferralTracker {
  private static readonly REFERRAL_KEY = 'referralCode';
  
  // Store referral code when user visits with ?ref= parameter
  static trackReferral(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      localStorage.setItem(this.REFERRAL_KEY, referralCode);
      
      // Clean URL without removing the referral tracking
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }
  }
  
  // Get stored referral code
  static getReferralCode(): string | null {
    return localStorage.getItem(this.REFERRAL_KEY);
  }
  
  // Clear referral code after successful signup
  static clearReferralCode(): void {
    localStorage.removeItem(this.REFERRAL_KEY);
  }
  
  // Initialize tracking on app load
  static initialize(): void {
    this.trackReferral();
  }
}
