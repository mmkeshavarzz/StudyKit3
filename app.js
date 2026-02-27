/**
 * ═══════════════════════════════════════════════════════════════
 * StudyKit — داشبورد مرکزی ابزارهای کنکوری
 * اسکریپت اصلی برنامه
 * 
 * توسعه‌دهنده: محمدمهدی کشاورز
 * نسخه: 1.0.0
 * آخرین بروزرسانی: 1404/12/08
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    /* ──────────────────────────────────────────
       ۱. مدیریت تم شب/روز
       ────────────────────────────────────────── */

    const ThemeManager = {
        STORAGE_KEY: 'studykit-theme',

        /**
         * مقداردهی اولیه تم
         * اول localStorage چک میشه، بعد ترجیح سیستم
         */
        init() {
            const savedTheme = localStorage.getItem(this.STORAGE_KEY);
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = savedTheme || (prefersDark ? 'dark' : 'light');

            this.applyTheme(theme);
            this.bindEvents();
        },

        /**
         * اعمال تم به document
         * @param {string} theme - 'light' | 'dark'
         */
        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem(this.STORAGE_KEY, theme);

            // آپدیت meta theme-color برای نوار بالای مرورگر موبایل
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.setAttribute('content', theme === 'dark' ? '#1A1A2E' : '#F5F0EB');
            }
        },

        /**
         * تاگل بین شب و روز
         */
        toggle() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
        },

        /**
         * اتصال رویدادها
         */
        bindEvents() {
            const toggleBtn = document.getElementById('themeToggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => this.toggle());
            }

            // گوش دادن به تغییر تم سیستم
            window.matchMedia('(prefers-color-scheme: dark)')
                .addEventListener('change', (e) => {
                    if (!localStorage.getItem(this.STORAGE_KEY)) {
                        this.applyTheme(e.matches ? 'dark' : 'light');
                    }
                });
        }
    };

    /* ──────────────────────────────────────────
       ۲. شمارش معکوس تا کنکور
       ────────────────────────────────────────── */

    const CountdownManager = {
        // تاریخ کنکور تجربی ۱۴۰۴ — 12 تیر ۱۴۰۴
        // اگه تاریخ دقیق رو نداریم، فرضی میذاریم
        // کنکور تجربی ۱۴۰۵ حدوداً تیر ۱۴۰۵
        KONKUR_DATE: new Date('2026-07-03T08:00:00+03:30'),

        /**
         * محاسبه روزهای باقی‌مانده تا کنکور
         * @returns {number} تعداد روز
         */
        getDaysRemaining() {
            const now = new Date();
            const diff = this.KONKUR_DATE - now;
            return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        },

        /**
         * نمایش روزهای باقی‌مانده در کارت خوش‌آمدگویی
         */
        updateDisplay() {
            const el = document.getElementById('currentDate');
            if (el) {
                const days = this.getDaysRemaining();
                el.textContent = days;
            }
        }
    };

    /* ──────────────────────────────────────────
       ۳. Toast Notification
       ────────────────────────────────────────── */

    const ToastManager = {
        hideTimeout: null,

        /**
         * نمایش اعلان toast
         */
        show() {
            const toast = document.getElementById('toast');
            if (!toast) return;

            // اگه قبلاً تایمر بود، پاکش کن
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
            }

            toast.classList.add('show');

            // بعد از ۴ ثانیه خودکار مخفی بشه
            this.hideTimeout = setTimeout(() => {
                this.hide();
            }, 4000);
        },

        /**
         * مخفی کردن اعلان
         */
        hide() {
            const toast = document.getElementById('toast');
            if (toast) {
                toast.classList.remove('show');
            }
        }
    };

    // دسترسی گلوبال برای onclick توی HTML
    window.showComingSoon = function () {
        ToastManager.show();
    };

    window.hideToast = function () {
        ToastManager.hide();
    };

    /* ──────────────────────────────────────────
       ۴. مدیریت PWA — نصب روی موبایل
       ────────────────────────────────────────── */

    const PWAManager = {
        deferredPrompt: null,
        DISMISSED_KEY: 'studykit-pwa-dismissed',

        /**
         * مقداردهی اولیه
         */
        init() {
            // اگه قبلاً کاربر رد کرده، نشون نده
            const dismissed = localStorage.getItem(this.DISMISSED_KEY);
            if (dismissed) return;

            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                this.showBanner();
            });

            this.bindEvents();
        },

        /**
         * نمایش بنر نصب
         */
        showBanner() {
            const banner = document.getElementById('pwaInstallBanner');
            if (banner) {
                setTimeout(() => {
                    banner.classList.add('show');
                }, 3000); // ۳ ثانیه بعد از لود نشون بده
            }
        },

        /**
         * مخفی کردن بنر
         */
        hideBanner() {
            const banner = document.getElementById('pwaInstallBanner');
            if (banner) {
                banner.classList.remove('show');
            }
        },

        /**
         * نصب PWA
         */
        async install() {
            if (!this.deferredPrompt) return;

            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('[StudyKit] PWA نصب شد ✅');
            }

            this.deferredPrompt = null;
            this.hideBanner();
        },

        /**
         * رد کردن بنر
         */
        dismiss() {
            localStorage.setItem(this.DISMISSED_KEY, 'true');
            this.hideBanner();
        },

        /**
         * اتصال رویدادها
         */
        bindEvents() {
            const installBtn = document.getElementById('pwaInstallBtn');
            const dismissBtn = document.getElementById('pwaDismissBtn');

            if (installBtn) {
                installBtn.addEventListener('click', () => this.install());
            }

            if (dismissBtn) {
                dismissBtn.addEventListener('click', () => this.dismiss());
            }
        }
    };

    /* ──────────────────────────────────────────
       ۵. ثبت Service Worker
       ────────────────────────────────────────── */

    const ServiceWorkerManager = {
        async register() {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('sw.js');
                    console.log('[StudyKit] Service Worker ثبت شد ✅', registration.scope);
                } catch (error) {
                    console.warn('[StudyKit] خطا در ثبت Service Worker:', error);
                }
            }
        }
    };

    /* ──────────────────────────────────────────
       ۶. خروجی PNG از صفحه
       ────────────────────────────────────────── */

    const ScreenshotManager = {
        /**
         * گرفتن اسکرین‌شات از کل صفحه و دانلود
         */
        async capture() {
            // مخفی کردن عناصری که نباید تو عکس باشن
            const toast = document.getElementById('toastContainer');
            const pwaBanner = document.getElementById('pwaInstallBanner');
            const themeToggle = document.getElementById('themeToggle');

            if (toast) toast.style.display = 'none';
            if (pwaBanner) pwaBanner.style.display = 'none';
            if (themeToggle) themeToggle.style.opacity = '0';

            try {
                const canvas = await html2canvas(document.body, {
                    backgroundColor: null,
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    scrollX: 0,
                    scrollY: -window.scrollY,
                    windowWidth: document.documentElement.offsetWidth,
                    windowHeight: document.documentElement.scrollHeight
                });

                // ساخت لینک دانلود
                const link = document.createElement('a');
                link.download = `StudyKit-Dashboard-${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

            } catch (error) {
                console.error('[StudyKit] خطا در گرفتن اسکرین‌شات:', error);
            } finally {
                // برگردوندن عناصر
                if (toast) toast.style.display = '';
                if (pwaBanner) pwaBanner.style.display = '';
                if (themeToggle) themeToggle.style.opacity = '';
            }
        }
    };

    // دسترسی گلوبال
    window.captureScreen = function () {
        ScreenshotManager.capture();
    };

    /* ──────────────────────────────────────────
       ۷. افکت‌های تعاملی — Hover Glow
       ────────────────────────────────────────── */

    const InteractionEffects = {
        init() {
            // افکت درخشش بر اساس موقعیت ماوس روی کارت‌های فعال
            const activeCards = document.querySelectorAll('.active-tool');

            activeCards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;

                    const glow = card.querySelector('.card-glow');
                    if (glow) {
                        glow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(168, 216, 234, 0.15), transparent 60%)`;
                    }
                });

                card.addEventListener('mouseleave', () => {
                    const glow = card.querySelector('.card-glow');
                    if (glow) {
                        glow.style.background = '';
                    }
                });
            });
        }
    };

    /* ──────────────────────────────────────────
       ۸. سلام بر اساس ساعت روز
       ────────────────────────────────────────── */

    const GreetingManager = {
        update() {
            const hour = new Date().getHours();
            const welcomeText = document.querySelector('.welcome-text h2');
            if (!welcomeText) return;

            let greeting = '';

            if (hour >= 5 && hour < 12) {
                greeting = 'صبح بخیر رفیق کنکوری! ☀️';
            } else if (hour >= 12 && hour < 17) {
                greeting = 'ظهر بخیر رفیق کنکوری! 🌤️';
            } else if (hour >= 17 && hour < 21) {
                greeting = 'عصر بخیر رفیق کنکوری! 🌅';
            } else {
                greeting = 'شب بخیر رفیق کنکوری! 🌙';
            }

            welcomeText.textContent = greeting;
        }
    };

    /* ──────────────────────────────────────────
       ۹. مقداردهی اولیه — اجرای همه ماژول‌ها
       ────────────────────────────────────────── */

    function initApp() {
        // تم
        ThemeManager.init();

        // شمارش معکوس
        CountdownManager.updateDisplay();

        // سلام بر اساس ساعت
        GreetingManager.update();

        // افکت‌های تعاملی
        InteractionEffects.init();

        // PWA
        PWAManager.init();

        // Service Worker
        ServiceWorkerManager.register();

        console.log(
            '%c[StudyKit] داشبورد با موفقیت بارگذاری شد 🎓',
            'color: #A8D8EA; font-size: 14px; font-weight: bold;'
        );
    }

    // صبر کن تا DOM کامل بارگذاری بشه
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

})();
