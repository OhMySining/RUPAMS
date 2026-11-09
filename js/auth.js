/**
 * RUPAMS - Landing & Authentication Controller
 * Handles role-based Sign In, Registration, Quick Demo logins, and Portal Redirection.
 * College of Industrial Technology (CIT) - URS Morong Campus
 */

const AuthManager = {
  activePortal: 'admin', // 'admin' | 'mobile'
  activeAction: 'signin', // 'signin' | 'signup'
  selectedRole: 'admin',  // 'admin' | 'faculty' | 'student'

  init() {
    this.checkExistingSession();
    this.setupEventListeners();
    this.updateUI();
  },

  checkExistingSession() {
    const user = window.appState.getCurrentUser();
    const sessionBanner = document.getElementById('activeSessionBanner');
    if (!sessionBanner) return;

    if (user) {
      sessionBanner.classList.remove('hidden');
      const nameEl = document.getElementById('sessionUserName');
      const roleEl = document.getElementById('sessionUserRole');
      const targetPortalBtn = document.getElementById('sessionContinueBtn');

      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = user.role.toUpperCase();
      if (targetPortalBtn) {
        if (user.role === 'admin') {
          targetPortalBtn.textContent = 'Continue to Admin Portal (PC) →';
          targetPortalBtn.onclick = () => window.location.href = 'admin.html';
        } else {
          targetPortalBtn.textContent = `Continue to Mobile Web App (${user.role.toUpperCase()}) →`;
          targetPortalBtn.onclick = () => window.location.href = 'mobile.html';
        }
      }
    } else {
      sessionBanner.classList.add('hidden');
    }
  },

  setupEventListeners() {
    // Portal Switcher: Admin Portal (PC) vs Mobile Web App
    const btnPortalAdmin = document.getElementById('btnPortalTargetAdmin');
    const btnPortalMobile = document.getElementById('btnPortalTargetMobile');

    if (btnPortalAdmin) {
      btnPortalAdmin.addEventListener('click', () => {
        this.activePortal = 'admin';
        this.selectedRole = 'admin';
        this.updateUI();
      });
    }

    if (btnPortalMobile) {
      btnPortalMobile.addEventListener('click', () => {
        this.activePortal = 'mobile';
        if (this.selectedRole === 'admin') {
          this.selectedRole = 'student';
        }
        this.updateUI();
      });
    }

    // Action Switcher: Sign In vs Sign Up
    const tabSignIn = document.getElementById('tabAuthSignIn');
    const tabSignUp = document.getElementById('tabAuthSignUp');

    if (tabSignIn) {
      tabSignIn.addEventListener('click', () => {
        this.activeAction = 'signin';
        this.updateUI();
      });
    }

    if (tabSignUp) {
      tabSignUp.addEventListener('click', () => {
        this.activeAction = 'signup';
        this.updateUI();
      });
    }

    // Role pills inside forms
    document.querySelectorAll('.role-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.getAttribute('data-role');
        if (role) {
          this.selectedRole = role;
          if (role === 'admin') {
            this.activePortal = 'admin';
          } else {
            this.activePortal = 'mobile';
          }
          this.updateUI();
        }
      });
    });

    // Sign In Form submission
    const signInForm = document.getElementById('formSignIn');
    if (signInForm) {
      signInForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSignIn();
      });
    }

    // Sign Up Form submission
    const signUpForm = document.getElementById('formSignUp');
    if (signUpForm) {
      signUpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSignUp();
      });
    }

    // Session Banner Signout
    const btnSessionLogout = document.getElementById('btnSessionLogout');
    if (btnSessionLogout) {
      btnSessionLogout.addEventListener('click', () => {
        window.appState.setCurrentUser(null);
        this.checkExistingSession();
        this.showAlert('signinAlert', 'You have been signed out.', 'info');
      });
    }
  },

  updateUI() {
    // 1. Update Portal Switcher buttons
    const btnAdmin = document.getElementById('btnPortalTargetAdmin');
    const btnMobile = document.getElementById('btnPortalTargetMobile');
    if (btnAdmin) btnAdmin.classList.toggle('active', this.activePortal === 'admin');
    if (btnMobile) btnMobile.classList.toggle('active', this.activePortal === 'mobile');

    // 2. Update Action Tabs
    const tabSignIn = document.getElementById('tabAuthSignIn');
    const tabSignUp = document.getElementById('tabAuthSignUp');
    if (tabSignIn) tabSignIn.classList.toggle('active', this.activeAction === 'signin');
    if (tabSignUp) tabSignUp.classList.toggle('active', this.activeAction === 'signup');

    // 3. Show/Hide Forms
    const signInBox = document.getElementById('boxSignIn');
    const signUpBox = document.getElementById('boxSignUp');
    if (signInBox) signInBox.classList.toggle('hidden', this.activeAction !== 'signin');
    if (signUpBox) signUpBox.classList.toggle('hidden', this.activeAction !== 'signup');

    // 4. Update Role Pills
    document.querySelectorAll('.role-pill-btn').forEach(btn => {
      const r = btn.getAttribute('data-role');
      btn.classList.toggle('active', r === this.selectedRole);
    });

    // 5. Dynamic field display for signup
    const adminFields = document.getElementById('signupAdminFields');
    const facultyFields = document.getElementById('signupFacultyFields');
    const studentFields = document.getElementById('signupStudentFields');

    if (adminFields) adminFields.classList.toggle('hidden', this.selectedRole !== 'admin');
    if (facultyFields) facultyFields.classList.toggle('hidden', this.selectedRole !== 'faculty');
    if (studentFields) studentFields.classList.toggle('hidden', this.selectedRole !== 'student');

    // 6. Submit button text
    const btnSubmit = document.getElementById('btnSignInSubmit');
    if (btnSubmit) {
      if (this.selectedRole === 'admin') {
        btnSubmit.innerHTML = 'Sign In to Admin Portal (PC) &rarr;';
      } else {
        btnSubmit.innerHTML = `Sign In to Mobile Portal (${this.selectedRole.toUpperCase()}) &rarr;`;
      }
    }
  },

  handleSignIn() {
    const identifierInput = document.getElementById('signinIdentifier');
    const passwordInput = document.getElementById('signinPassword');
    const identifier = identifierInput ? identifierInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!identifier) {
      this.showAlert('signinAlert', 'Please enter your Employee ID, Student ID, or Username.', 'danger');
      return;
    }

    const expectedRole = this.selectedRole;
    const res = window.appState.login(identifier, password, expectedRole);

    if (res.success) {
      this.showAlert('signinAlert', `Welcome back, ${res.user.name}! Redirecting...`, 'success');
      setTimeout(() => {
        if (res.user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'mobile.html';
        }
      }, 700);
    } else {
      this.showAlert('signinAlert', res.message, 'danger');
    }
  },

  handleSignUp() {
    const role = this.selectedRole;
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const confirmInput = document.getElementById('signupConfirmPassword');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirm = confirmInput ? confirmInput.value : '';

    if (!name) {
      this.showAlert('signupAlert', 'Please enter your Full Name.', 'danger');
      return;
    }
    if (password && confirm && password !== confirm) {
      this.showAlert('signupAlert', 'Passwords do not match.', 'danger');
      return;
    }

    const payload = {
      name: name,
      email: email,
      password: password || 'password123',
      role: role
    };

    if (role === 'admin') {
      const officeInput = document.getElementById('signupAdminOffice');
      const passcodeInput = document.getElementById('signupAdminPasscode');
      const idInput = document.getElementById('signupAdminId');
      payload.office = officeInput ? officeInput.value.trim() : "Dean's Office";
      payload.authPasscode = passcodeInput ? passcodeInput.value.trim() : '';
      payload.id = idInput ? idInput.value.trim() : `ADM-${Date.now().toString().slice(-4)}`;
    } else if (role === 'faculty') {
      const deptInput = document.getElementById('signupFacultyDept');
      const idInput = document.getElementById('signupFacultyId');
      payload.department = deptInput ? deptInput.value : 'Electronics Technology';
      payload.id = idInput ? idInput.value.trim() : `FAC-${Date.now().toString().slice(-4)}`;
    } else if (role === 'student') {
      const idInput = document.getElementById('signupStudentId');
      const progInput = document.getElementById('signupStudentProg');
      const yrInput = document.getElementById('signupStudentYear');
      const secInput = document.getElementById('signupStudentSec');

      payload.studentId = idInput ? idInput.value.trim() : `2026-${Date.now().toString().slice(-4)}-MR`;
      payload.id = payload.studentId;
      payload.program = progInput ? progInput.value : 'BSIT - Electronics Technology';
      payload.year = yrInput ? yrInput.value : '1st Year';
      payload.section = secInput ? secInput.value : 'Section A';
    }

    const res = window.appState.signup(payload);
    if (res.success) {
      this.showAlert('signupAlert', `Account created successfully! Welcome, ${res.user.name}. Redirecting...`, 'success');
      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'mobile.html';
        }
      }, 800);
    } else {
      this.showAlert('signupAlert', res.message, 'danger');
    }
  },

  /**
   * One-Click Instant Demo Login
   */
  quickLogin(roleKey) {
    const demo = window.appState.data.demoUsers;
    if (demo && demo[roleKey]) {
      window.appState.setCurrentUser(demo[roleKey]);
      if (roleKey === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'mobile.html';
      }
    }
  },

  showAlert(containerId, message, type = 'info') {
    const el = document.getElementById(containerId);
    if (!el) return;
    const bgMap = {
      danger: '#fef2f2; color: #dc2626; border: 1px solid #fecaca;',
      success: '#f0fdf4; color: #16a34a; border: 1px solid #bbf7d0;',
      info: '#eff6ff; color: #1e40af; border: 1px solid #bfdbfe;'
    };
    el.style.cssText = `display: block; padding: 10px 14px; border-radius: 6px; font-size: 0.8rem; margin-bottom: 14px; background: ${bgMap[type] || bgMap.info}`;
    el.innerHTML = message;
  }
};

window.authManager = AuthManager;

document.addEventListener('DOMContentLoaded', () => {
  AuthManager.init();
});
